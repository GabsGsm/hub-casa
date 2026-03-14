<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\House;
use Illuminate\Http\Request;

class HouseController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->house_id) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:120'],
        ]);

        $house = House::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => 'active',
        ]);

        $user->house_id = $house->id;
        $user->role = 'admin';
        $user->save();

        $this->seedDefaultCategories($house->id, $user->id);

        return redirect()->route('dashboard');
    }

    private function seedDefaultCategories(int $houseId, int $userId): void
    {
        $defaults = [
            ['name' => 'Moradia', 'color' => '#2563EB'],
            ['name' => 'Serviços', 'color' => '#D97706'],
            ['name' => 'Renda', 'color' => '#059669'],
            ['name' => 'Lazer', 'color' => '#7C3AED'],
            ['name' => 'Outros', 'color' => '#9B9A96'],
        ];

        foreach ($defaults as $category) {
            Category::create([
                'house_id' => $houseId,
                'created_by' => $userId,
                'name' => $category['name'],
                'color' => $category['color'],
            ]);
        }
    }
}
