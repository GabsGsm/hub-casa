<?php

namespace App\Http\Controllers;

use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use App\Models\Task;
use App\Models\AgendaEvent;
use App\Models\PantryItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $house = $user->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $cycles = PaymentCycle::query()
            ->where('house_id', $house->id)
            ->orderByRaw('day_of_month is null')
            ->orderBy('day_of_month')
            ->get();

        $cycleTransactions = FinancialTransaction::query()
            ->where('house_id', $house->id)
            ->get()
            ->groupBy('payment_cycle_id');

        $cyclesPayload = $cycles->map(function (PaymentCycle $cycle) use ($cycleTransactions) {
            $transactions = $cycleTransactions->get($cycle->id, collect());

            $paid = $transactions->where('status', FinancialTransaction::STATUS_PAID)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            $pending = $transactions->where('status', '!=', FinancialTransaction::STATUS_PAID)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            return [
                'id' => $cycle->id,
                'name' => $cycle->name,
                'day_of_month' => $cycle->day_of_month,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid' => (float) $paid,
                'pending' => (float) $pending,
            ];
        });

        $activeCycle = $this->resolveActiveCycle($cyclesPayload);

        $today = Carbon::today();
        $todayIndex = $today->dayOfWeekIso - 1;

        $tasksToday = Task::query()
            ->with(['assignees:id,name'])
            ->where('house_id', $house->id)
            ->where('day_of_week', $todayIndex)
            ->orderBy('sort_order')
            ->get()
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'completed' => $task->completed,
                    'color' => $task->color,
                    'assignees' => $task->assignees->map(fn ($user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                    ]),
                ];
            });

        $tasksTotal = Task::query()->where('house_id', $house->id)->count();
        $tasksDone = Task::query()->where('house_id', $house->id)->where('completed', true)->count();

        $dueToday = FinancialTransaction::query()
            ->where('house_id', $house->id)
            ->whereDate('due_date', $today)
            ->where('status', '!=', FinancialTransaction::STATUS_PAID)
            ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
            ->get();

        $recentTransactions = FinancialTransaction::query()
            ->with('category:id,name,color')
            ->where('house_id', $house->id)
            ->orderByDesc('due_date')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function (FinancialTransaction $transaction) {
                return [
                    'id' => $transaction->id,
                    'title' => $transaction->title,
                    'amount' => (float) $transaction->amount,
                    'type' => $transaction->type,
                    'due_date' => optional($transaction->due_date)->format('d/m'),
                    'category' => $transaction->category ? [
                        'name' => $transaction->category->name,
                        'color' => $transaction->category->color,
                    ] : null,
                ];
            });

        $dispensaAlerts = PantryItem::query()
            ->where('house_id', $house->id)
            ->whereColumn('quantity_current', '<=', 'quantity_min')
            ->count();

        $upcomingEvents = AgendaEvent::query()
            ->where('house_id', $house->id)
            ->whereDate('date', '>=', $today)
            ->orderBy('date')
            ->orderBy('time')
            ->limit(4)
            ->get()
            ->map(function (AgendaEvent $event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->date->format('d/m'),
                    'time' => substr((string) $event->time, 0, 5),
                ];
            });

        return Inertia::render('dashboard', [
            'house' => [
                'id' => $house->id,
                'name' => $house->name,
            ],
            'stats' => [
                'activeCycle' => $activeCycle,
                'payable' => [
                    'amount' => (float) $dueToday->sum('amount'),
                    'count' => $dueToday->count(),
                ],
                'tasks' => [
                    'done' => $tasksDone,
                    'total' => $tasksTotal,
                ],
                'dispensa' => [
                    'alerts' => $dispensaAlerts,
                ],
            ],
            'cycles' => $cyclesPayload,
            'transactions' => $recentTransactions,
            'tasksToday' => $tasksToday,
            'todayLabel' => $today->locale('pt_BR')->translatedFormat('l, d'),
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    private function resolveActiveCycle($cyclesPayload): ?array
    {
        if ($cyclesPayload->isEmpty()) {
            return null;
        }

        $today = now()->day;
        $sorted = $cyclesPayload->values();

        $next = $sorted->first(function ($cycle) use ($today) {
            return $cycle['day_of_month'] !== null && $cycle['day_of_month'] >= $today;
        });

        $fallback = $sorted->first(function ($cycle) {
            return $cycle['day_of_month'] !== null;
        });

        return $next ?? $fallback ?? $sorted->first();
    }
}
