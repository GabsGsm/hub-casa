<?php

namespace App\Http\Controllers;

use App\Concerns\AuthorizesHouseResource;
use App\Http\Requests\Financeiro\StoreCycleRequest;
use App\Http\Requests\Financeiro\StoreTransactionRequest;
use App\Http\Requests\Financeiro\UpdateCycleRequest;
use App\Http\Requests\Financeiro\UpdateTransactionRequest;
use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use App\Models\TransactionPayment;
use App\Repositories\FinancialTransactionRepository;
use App\Services\FinanceiroService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceiroController extends Controller
{
    use AuthorizesHouseResource;

    public function __construct(
        private readonly FinanceiroService $service,
        private readonly FinancialTransactionRepository $transactionRepo,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $now   = Carbon::now();
        $year  = (int) $request->query('year', $now->year);
        $month = (int) $request->query('month', $now->month); // 1-indexed

        return Inertia::render('financeiro/index', $this->service->getPageData($house, $year, $month));
    }

    public function allTransactions(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $filters   = $request->only(['type', 'status', 'cycle_id', 'category_id', 'search']);
        $paginated = $this->transactionRepo->getFilteredPaginated($house->id, $filters);

        // Formata os itens paginados no mesmo shape do getResolvedForMonth
        $paginated->through(function (FinancialTransaction $t) {
            return [
                'id'                 => $t->id,
                'title'              => $t->title,
                'amount'             => (float) $t->amount,
                'type'               => $t->type,
                'status'             => $t->status,
                'created_at'         => $t->created_at->format('Y-m-d'),
                'due_date'           => optional($t->due_date)->format('Y-m-d'),
                'is_recurring'       => (bool) $t->is_recurring,
                'recurrence_day'     => $t->recurrence_day,
                'installments_total' => $t->installments_total,
                'installment_amount' => $t->installment_amount ? (float) $t->installment_amount : null,
                'notes'              => $t->notes,
                'resolved_date'      => optional($t->due_date)->format('Y-m-d') ?? $t->created_at->format('Y-m-d'),
                'installment_num'    => null,
                'cycle'              => $t->cycle ? ['id' => $t->cycle->id, 'name' => $t->cycle->name] : null,
                'category'           => $t->category ? ['id' => $t->category->id, 'name' => $t->category->name, 'color' => $t->category->color] : null,
                'assignees'          => $t->assignees->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])->values(),
            ];
        });

        $now  = Carbon::now();
        $data = $this->service->getPageData($house, $now->year, $now->month);
        $data['allTransactions'] = $paginated;
        $data['filters']         = $filters;

        return Inertia::render('financeiro/index', $data);
    }

    public function storeCycle(StoreCycleRequest $request): RedirectResponse
    {
        $this->service->createCycle(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Ciclo criado.');
    }

    public function updateCycle(UpdateCycleRequest $request, PaymentCycle $cycle): RedirectResponse
    {
        $this->service->updateCycle($request->user()->house, $cycle, $request->validated());

        return redirect()->route('financeiro.index')->with('success', 'Ciclo atualizado.');
    }

    public function destroyCycle(Request $request, PaymentCycle $cycle): RedirectResponse
    {
        $this->service->deleteCycle($request->user()->house, $cycle);

        return redirect()->route('financeiro.index')->with('success', 'Ciclo removido.');
    }

    public function storeTransaction(StoreTransactionRequest $request): RedirectResponse
    {
        $this->service->createTransaction(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Lançamento criado.');
    }

    public function updateTransaction(
        UpdateTransactionRequest $request,
        FinancialTransaction $transaction,
    ): RedirectResponse {
        $this->service->updateTransaction(
            $request->user()->house,
            $request->user(),
            $transaction,
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Lançamento atualizado.');
    }

    public function destroyTransaction(Request $request, FinancialTransaction $transaction): RedirectResponse
    {
        $this->service->deleteTransaction($request->user(), $transaction);

        return redirect()->route('financeiro.index')->with('success', 'Lançamento removido.');
    }

    public function storePayment(Request $request, FinancialTransaction $transaction): RedirectResponse
    {
        $this->ensureCanEdit($request->user(), $transaction);

        $validated = $request->validate([
            'amount'             => ['required', 'numeric', 'min:0.01'],
            'paid_at'            => ['required', 'date'],
            'installment_number' => ['nullable', 'integer', 'min:1'],
            'notes'              => ['nullable', 'string', 'max:255'],
        ]);

        TransactionPayment::create([
            'transaction_id'     => $transaction->id,
            'paid_by'            => $request->user()->id,
            'amount'             => $validated['amount'],
            'paid_at'            => $validated['paid_at'],
            'installment_number' => $validated['installment_number'] ?? null,
            'notes'              => $validated['notes'] ?? null,
        ]);

        return redirect()->route('financeiro.index')->with('success', 'Pagamento registrado.');
    }
}
