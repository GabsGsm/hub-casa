<?php

namespace App\Http\Controllers;

use App\Concerns\AuthorizesHouseResource;
use App\Http\Requests\Estoque\RegistrarCompraRequest;
use App\Http\Requests\Estoque\StoreItemCompraRequest;
use App\Models\ItemCompra;
use App\Models\Produto;
use App\Services\EstoqueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComprasController extends Controller
{
    use AuthorizesHouseResource;

    public function __construct(
        private readonly EstoqueService $service,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        return Inertia::render('compras/index', $this->service->getComprasData($house));
    }

    /**
     * Adiciona item à lista de compras.
     * Se produto_id é informado, usa o produto existente.
     * Se não, cria um produto novo e adiciona.
     */
    public function store(StoreItemCompraRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if (! empty($data['produto_id'])) {
            $produto = Produto::findOrFail($data['produto_id']);
            $this->service->adicionarNaLista($user, $produto, $data);
        } else {
            $this->service->criarProdutoEAdicionarNaLista($user->house, $user, $data);
        }

        return redirect()->route('compras.index')->with('success', 'Item adicionado à lista.');
    }

    /**
     * Registra compra parcial ou completa.
     */
    public function registrarCompra(RegistrarCompraRequest $request, ItemCompra $item): RedirectResponse
    {
        $this->service->registrarCompra(
            $request->user(),
            $item,
            (float) $request->validated('quantidade'),
        );

        return redirect()->route('compras.index')->with('success', 'Compra registrada.');
    }

    /**
     * Cancela um item da lista.
     */
    public function cancelar(Request $request, ItemCompra $item): RedirectResponse
    {
        $this->service->cancelarItemCompra($request->user(), $item);

        return redirect()->route('compras.index')->with('success', 'Item cancelado.');
    }

    public function destroy(Request $request, ItemCompra $item): RedirectResponse
    {
        $this->service->deleteItemCompra($request->user(), $item);

        return redirect()->route('compras.index')->with('success', 'Item removido.');
    }
}
