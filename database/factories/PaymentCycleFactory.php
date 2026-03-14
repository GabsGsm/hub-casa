<?php

namespace Database\Factories;

use App\Models\House;
use App\Models\PaymentCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentCycle>
 */
class PaymentCycleFactory extends Factory
{
    protected $model = PaymentCycle::class;

    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'user_id' => User::factory(),
            'name' => 'Dia '.fake()->numberBetween(1, 28),
            'day_of_month' => fake()->numberBetween(1, 28),
            'expected_amount' => fake()->randomFloat(2, 500, 5000),
            'recurring' => true,
            'active' => true,
        ];
    }
}
