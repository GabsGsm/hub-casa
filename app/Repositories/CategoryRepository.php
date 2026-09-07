<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Support\Collection;

class CategoryRepository
{
    public function getByHouse(int $houseId): Collection
    {
        return Category::query()
            ->where('house_id', $houseId)
            ->orderBy('name')
            ->get(['id', 'name', 'color', 'created_by']);
    }

    public function create(int $houseId, int $userId, array $data): Category
    {
        return Category::create([
            'house_id'   => $houseId,
            'created_by' => $userId,
            'name'       => $data['name'],
            'color'      => $data['color'] ?? null,
        ]);
    }

    public function update(Category $category, array $data): Category
    {
        $category->fill([
            'name'  => $data['name'],
            'color' => $data['color'] ?? null,
        ]);
        $category->save();

        return $category;
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}
