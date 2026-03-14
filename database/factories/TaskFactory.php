<?php

namespace Database\Factories;

use App\Models\House;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'created_by' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(6),
            'color' => '#7C3AED',
            'day_of_week' => fake()->numberBetween(0, 6),
            'sort_order' => fake()->numberBetween(1, 5),
            'completed' => fake()->boolean(30),
        ];
    }
}
