<?php

namespace App\Http\Controllers;

use App\Concerns\AuthorizesHouseResource;
use App\Http\Requests\Estoque\StoreProdutoRequest;
use App\Http\Requests\Estoque\UpdateProdutoRequest;
use App\Models\Produto;
use App\Services\EstoqueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DispensaController extends Controller
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

        return Inertia::render('dispensa/index', $this->service->getDispensaData($house));
    }

    public function store(StoreProdutoRequest $request): RedirectResponse
    {
        $this->service->createProduto(
            $request->user()->house,
            $request->user(),
            $request->validated(),
        );

        return redirect()->route('dispensa.index')->with('success', 'Produto criado.');
    }

    public function update(UpdateProdutoRequest $request, Produto $produto): RedirectResponse
    {
        $this->service->updateProduto($request->user(), $produto, $request->validated());

        return redirect()->route('dispensa.index')->with('success', 'Produto atualizado.');
    }

    public function adjustEstoque(Request $request, Produto $produto): RedirectResponse
    {
        $request->validate(['delta' => ['required', 'numeric']]);
        $this->service->adjustEstoque($request->user(), $produto, (float) $request->input('delta'));

        return redirect()->route('dispensa.index')->with('success', 'Estoque ajustado.');
    }

    public function destroy(Request $request, Produto $produto): RedirectResponse
    {
        $this->service->deleteProduto($request->user(), $produto);

        return redirect()->route('dispensa.index')->with('success', 'Produto removido.');
    }
}
