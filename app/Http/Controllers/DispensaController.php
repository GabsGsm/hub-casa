<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dispensa\StorePantryItemRequest;
use App\Http\Requests\Dispensa\UpdatePantryItemRequest;
use App\Models\PantryItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DispensaController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $items = PantryItem::query()
            ->where('house_id', $house->id)
            ->orderBy('name')
            ->get()
            ->map(function (PantryItem $item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity_current' => (float) $item->quantity_current,
                    'quantity_min' => (float) $item->quantity_min,
                    'unit' => $item->unit,
                    'category' => $item->category,
                    'updated_at' => $item->updated_at?->format('d/m'),
                ];
            });

        return Inertia::render('dispensa/index', [
            'items' => $items,
        ]);
    }

    public function store(StorePantryItemRequest $request): RedirectResponse
    {
        $house = $request->user()->house;
        $data = $request->validated();

        PantryItem::create([
            'house_id' => $house->id,
            'created_by' => $request->user()->id,
            'name' => $data['name'],
            'quantity_current' => $data['quantity_current'],
            'quantity_min' => $data['quantity_min'],
            'unit' => $data['unit'],
            'category' => $data['category'] ?? null,
        ]);

        return redirect()->route('dispensa.index')->with('success', 'Item criado.');
    }

    public function update(UpdatePantryItemRequest $request, PantryItem $item): RedirectResponse
    {
        $this->ensureCanEdit($request, $item);

        $item->fill(array_filter($request->validated(), fn ($value) => $value !== null));
        $item->save();

        return redirect()->route('dispensa.index')->with('success', 'Item atualizado.');
    }

    public function destroy(Request $request, PantryItem $item): RedirectResponse
    {
        $this->ensureCanEdit($request, $item);
        $item->delete();

        return redirect()->route('dispensa.index')->with('success', 'Item removido.');
    }

    private function ensureCanEdit(Request $request, PantryItem $item): void
    {
        if ($item->house_id !== $request->user()->house_id) {
            abort(403);
        }
    }
}
