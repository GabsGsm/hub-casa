<?php

namespace App\Http\Controllers;

use App\Concerns\AuthorizesHouseResource;
use App\Http\Requests\Financeiro\StoreCycleRequest;
use App\Http\Requests\Financeiro\StoreGanhoRequest;
use App\Http\Requests\Financeiro\StoreGastoRequest;
use App\Http\Requests\Financeiro\StoreParcelamentoRequest;
use App\Http\Requests\Financeiro\StoreParcelaSimpleRequest;
use App\Http\Requests\Financeiro\UpdateCycleRequest;
use App\Http\Requests\Financeiro\UpdateGanhoRequest;
use App\Http\Requests\Financeiro\UpdateGastoRequest;
use App\Http\Requests\Financeiro\UpdateParcelaRequest;
use App\Http\Requests\Financeiro\UpdateParcelamentoRequest;
use App\Models\Ganho;
use App\Models\Gasto;
use App\Models\Parcela;
use App\Models\Parcelamento;
use App\Models\PaymentCycle;
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
    ) {}

    // ── Página principal ──────────────────────────────────────────────────────

    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $now   = Carbon::now();
        $year  = (int) $request->query('year', $now->year);
        $month = (int) $request->query('month', $now->month);
        $visao = in_array($request->query('visao'), ['individual', 'casa']) ? $request->query('visao') : 'casa';

        return Inertia::render(
            'financeiro/index',
            $this->service->getPageData($house, $year, $month, $visao, $request->user()->id),
        );
    }

    // ── Ciclos ────────────────────────────────────────────────────────────────

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

    // ── Gastos ────────────────────────────────────────────────────────────────

    public function storeGasto(StoreGastoRequest $request): RedirectResponse
    {
        $this->service->createGasto(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Gasto registrado.');
    }

    public function updateGasto(UpdateGastoRequest $request, Gasto $gasto): RedirectResponse
    {
        $this->service->updateGasto(
            $request->user()->house,
            $request->user(),
            $gasto,
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Gasto atualizado.');
    }

    public function destroyGasto(Request $request, Gasto $gasto): RedirectResponse
    {
        $this->service->deleteGasto($request->user(), $gasto);

        return redirect()->route('financeiro.index')->with('success', 'Gasto removido.');
    }

    // ── Ganhos ────────────────────────────────────────────────────────────────

    public function storeGanho(StoreGanhoRequest $request): RedirectResponse
    {
        $this->service->createGanho(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Ganho registrado.');
    }

    public function updateGanho(UpdateGanhoRequest $request, Ganho $ganho): RedirectResponse
    {
        $this->service->updateGanho(
            $request->user()->house,
            $request->user(),
            $ganho,
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Ganho atualizado.');
    }

    public function destroyGanho(Request $request, Ganho $ganho): RedirectResponse
    {
        $this->service->deleteGanho($request->user(), $ganho);

        return redirect()->route('financeiro.index')->with('success', 'Ganho removido.');
    }

    // ── Parcelamentos (grupo) ─────────────────────────────────────────────────

    public function storeParcelamento(StoreParcelamentoRequest $request): RedirectResponse
    {
        $this->service->createParcelamento(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Parcelamento criado.');
    }

    public function updateParcelamento(UpdateParcelamentoRequest $request, Parcelamento $parcelamento): RedirectResponse
    {
        $this->service->updateParcelamento(
            $request->user()->house,
            $request->user(),
            $parcelamento,
            $request->validated(),
        );

        return redirect()->route('financeiro.index')->with('success', 'Parcelamento atualizado.');
    }

    public function destroyParcelamento(Request $request, Parcelamento $parcelamento): RedirectResponse
    {
        $this->service->deleteParcelamento($request->user(), $parcelamento);

        return redirect()->route('financeiro.index')->with('success', 'Parcelamento removido.');
    }

    // ── Parcelamento: tela de parcelas ────────────────────────────────────────

    public function showParcelas(Request $request, Parcelamento $parcelamento): Response
    {
        if ($parcelamento->casa_id !== $request->user()->house_id) {
            abort(403);
        }

        $parcelamento->load([
            'parcelas.membrosValor.user:id,name,color',
            'categoria:id,name,color',
            'ciclo:id,name',
        ]);

        return Inertia::render('financeiro/parcelamento-parcelas', [
            'parcelamento' => [
                'id'             => $parcelamento->id,
                'titulo'         => $parcelamento->titulo,
                'valor_total'    => (float) $parcelamento->valor_total,
                'total_parcelas' => $parcelamento->total_parcelas,
                'categoria'      => $parcelamento->categoria
                    ? ['id' => $parcelamento->categoria->id, 'name' => $parcelamento->categoria->name, 'color' => $parcelamento->categoria->color]
                    : null,
                'ciclo' => $parcelamento->ciclo
                    ? ['id' => $parcelamento->ciclo->id, 'name' => $parcelamento->ciclo->name]
                    : null,
            ],
            'parcelas' => $parcelamento->parcelas->map(fn (Parcela $p) => [
                'id'             => $p->id,
                'numero_parcela' => $p->numero_parcela,
                'valor_parcela'  => (float) $p->valor_parcela,
                'status'         => $p->status,
                'vencimento'     => $p->vencimento->format('Y-m-d'),
                'membros_valor'  => $p->membrosValor->map(fn ($mv) => [
                    'user_id'    => $mv->user_id,
                    'user_name'  => $mv->user?->name,
                    'user_color' => $mv->user?->color,
                    'valor'      => (float) $mv->valor,
                    'status'     => $mv->status,
                ])->values(),
            ])->values(),
            'members' => $parcelamento->casa->users()->get(['id', 'name', 'color'])->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'color' => $u->color,
            ]),
        ]);
    }

    public function storeParcela(StoreParcelaSimpleRequest $request, Parcelamento $parcelamento): RedirectResponse
    {
        $this->service->addParcela($request->user(), $parcelamento, $request->validated());

        return back()->with('success', 'Parcela adicionada.');
    }

    // ── Parcelas (individual) ─────────────────────────────────────────────────

    public function updateParcela(UpdateParcelaRequest $request, Parcela $parcela): RedirectResponse
    {
        $this->service->updateParcela(
            $request->user(),
            $parcela,
            $request->validated(),
        );

        return back()->with('success', 'Parcela atualizada.');
    }

    public function destroyParcela(Request $request, Parcela $parcela): RedirectResponse
    {
        $this->service->deleteParcela($request->user(), $parcela);

        return back()->with('success', 'Parcela removida.');
    }
}
