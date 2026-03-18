<?php

namespace App\Http\Controllers;

use App\Http\Requests\Financeiro\StoreCycleRequest;
use App\Http\Requests\Financeiro\StoreTransactionRequest;
use App\Http\Requests\Financeiro\UpdateCycleRequest;
use App\Http\Requests\Financeiro\UpdateTransactionRequest;
use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use App\Services\FinanceiroService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceiroController extends Controller
{
    public function __construct(private readonly FinanceiroService $service) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        return Inertia::render('financeiro/index', $this->service->getPageData($house));
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
}
