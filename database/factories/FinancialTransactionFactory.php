<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\FinancialTransaction;
use App\Models\House;
use App\Models\PaymentCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinancialTransaction>
 */
class FinancialTransactionFactory extends Factory
{
    protected $model = FinancialTransaction::class;

    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'payment_cycle_id' => PaymentCycle::factory(),
            'category_id' => Category::factory(),
            'created_by' => User::factory(),
            'title' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 10, 500),
            'type' => FinancialTransaction::TYPE_EXPENSE,
            'status' => FinancialTransaction::STATUS_OPEN,
            'due_date' => fake()->dateTimeBetween('-5 days', '+10 days'),
        ];
    }
}
