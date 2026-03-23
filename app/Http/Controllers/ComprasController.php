<?php

namespace App\Http\Controllers;

use App\Concerns\AuthorizesHouseResource;
use App\Http\Requests\Compras\StoreShoppingItemRequest;
use App\Http\Requests\Compras\UpdateShoppingItemRequest;
use App\Models\ShoppingList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComprasController extends Controller
{
    use AuthorizesHouseResource;
    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $items = ShoppingList::query()
            ->where('house_id', $house->id)
            ->orderByRaw("CASE WHEN status = 'pendente' THEN 0 WHEN status = 'impossibilitado' THEN 1 ELSE 2 END")
            ->orderBy('created_at')
            ->get()
            ->map(function (ShoppingList $item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'status' => $item->status,
                    'recurrence' => $item->recurrence,
                    'category' => $item->category,
                    'priority' => $item->priority,
                ];
            });

        return Inertia::render('compras/index', [
            'items' => $items,
        ]);
    }

    public function store(StoreShoppingItemRequest $request): RedirectResponse
    {
        $house = $request->user()->house;
        $data = $request->validated();

        ShoppingList::create([
            'house_id' => $house->id,
            'created_by' => $request->user()->id,
            'name' => $data['name'],
            'quantity' => $data['quantity'] ?? '1',
            'unit' => $data['unit'] ?? 'un',
            'status' => $data['status'] ?? 'pendente',
            'recurrence' => $data['recurrence'] ?? null,
            'category' => $data['category'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
        ]);

        return redirect()->route('compras.index')->with('success', 'Item adicionado.');
    }

    public function update(UpdateShoppingItemRequest $request, ShoppingList $item): RedirectResponse
    {
        $this->ensureCanEdit($request->user(), $item);

        $item->fill(array_filter($request->validated(), fn ($value) => $value !== null));
        $item->save();

        return redirect()->route('compras.index')->with('success', 'Item atualizado.');
    }

    public function destroy(Request $request, ShoppingList $item): RedirectResponse
    {
        $this->ensureCanEdit($request->user(), $item);
        $item->delete();

        return redirect()->route('compras.index')->with('success', 'Item removido.');
    }

}
