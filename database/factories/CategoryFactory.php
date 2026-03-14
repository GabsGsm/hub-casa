<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\House;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'created_by' => User::factory(),
            'name' => fake()->word(),
            'color' => '#2563EB',
        ];
    }
}
