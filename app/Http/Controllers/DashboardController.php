<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use App\Models\PantryItem;
use App\Models\Task;
use App\Repositories\FinancialTransactionRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly FinancialTransactionRepository $transactionRepo,
    ) {}

    public function index(Request $request)
    {
        $user  = $request->user();
        $house = $user->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $cycles = PaymentCycle::query()
            ->where('house_id', $house->id)
            ->orderBy('name')
            ->get();

        $now        = Carbon::now();
        $resolvedTx = collect($this->transactionRepo->getResolvedForMonth($house->id, $now->year, $now->month));

        // Group by cycle id (nested array field)
        $txByCycle = $resolvedTx->groupBy(fn ($t) => $t['cycle']['id'] ?? 0);

        $cyclesPayload = $cycles->map(function (PaymentCycle $cycle) use ($txByCycle) {
            $txs     = $txByCycle->get($cycle->id, collect());
            $expense = $txs->filter(fn ($t) => $t['type'] !== 'ganho' && $t['status'] !== 'impossibilitado');

            $paid    = (float) $expense->filter(fn ($t) => $t['status'] === 'pago')->sum(fn ($t) => $t['amount']);
            $pending = (float) $expense->filter(fn ($t) => $t['status'] !== 'pago')->sum(fn ($t) => $t['amount']);

            return [
                'id'              => $cycle->id,
                'name'            => $cycle->name,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid'            => $paid,
                'pending'         => $pending,
                'committed'       => $paid + $pending,
            ];
        });

        // "Sem ciclo" group
        $noCycleTxs = $txByCycle->get(0, collect())
            ->filter(fn ($t) => $t['type'] !== 'ganho' && $t['status'] !== 'impossibilitado');

        $noCyclePaid    = (float) $noCycleTxs->filter(fn ($t) => $t['status'] === 'pago')->sum(fn ($t) => $t['amount']);
        $noCyclePending = (float) $noCycleTxs->filter(fn ($t) => $t['status'] !== 'pago')->sum(fn ($t) => $t['amount']);

        if ($noCyclePaid > 0 || $noCyclePending > 0) {
            $cyclesPayload->push([
                'id'              => 0,
                'name'            => 'Sem ciclo',
                'expected_amount' => 0.0,
                'paid'            => $noCyclePaid,
                'pending'         => $noCyclePending,
                'committed'       => $noCyclePaid + $noCyclePending,
            ]);
        }

        $activeCycle = $cyclesPayload->first();

        // "A Pagar": despesas do mês não pagas e não impossibilitadas
        $dueToday = $resolvedTx->filter(
            fn ($t) =>
                $t['status'] !== 'pago' &&
                $t['status'] !== 'impossibilitado' &&
                $t['type']   !== 'ganho'
        );

        $today        = Carbon::today();
        $todayIndex   = $today->dayOfWeekIso - 1;

        $tasksToday = Task::query()
            ->with(['assignees:id,name'])
            ->where('house_id', $house->id)
            ->where('day_of_week', $todayIndex)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Task $task) => [
                'id'        => $task->id,
                'title'     => $task->title,
                'completed' => $task->completed,
                'color'     => $task->color,
                'assignees' => $task->assignees->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            ]);

        $tasksTotal = Task::query()->where('house_id', $house->id)->count();
        $tasksDone  = Task::query()->where('house_id', $house->id)->where('completed', true)->count();

        $recentTransactions = FinancialTransaction::query()
            ->with('category:id,name,color')
            ->where('house_id', $house->id)
            ->orderByDesc('due_date')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (FinancialTransaction $t) => [
                'id'             => $t->id,
                'title'          => $t->title,
                'amount'         => (float) $t->amount,
                'type'           => $t->type,
                'effective_date' => Carbon::parse($t->due_date ?? $t->created_at)->format('d/m'),
                'category'       => $t->category ? ['name' => $t->category->name, 'color' => $t->category->color] : null,
            ]);

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
            ->map(fn (AgendaEvent $event) => [
                'id'    => $event->id,
                'title' => $event->title,
                'date'  => $event->date->format('d/m'),
                'time'  => substr((string) $event->time, 0, 5),
            ]);

        return Inertia::render('dashboard/index', [
            'house' => ['id' => $house->id, 'name' => $house->name],
            'stats' => [
                'activeCycle' => $activeCycle,
                'payable'     => [
                    'amount' => (float) $dueToday->sum(fn ($t) => $t['amount']),
                    'count'  => $dueToday->count(),
                ],
                'tasks'   => ['done' => $tasksDone, 'total' => $tasksTotal],
                'dispensa' => ['alerts' => $dispensaAlerts],
            ],
            'cycles'         => $cyclesPayload,
            'transactions'   => $recentTransactions,
            'tasksToday'     => $tasksToday,
            'todayLabel'     => $today->locale('pt_BR')->translatedFormat('l, d'),
            'upcomingEvents' => $upcomingEvents,
        ]);
    }
}
