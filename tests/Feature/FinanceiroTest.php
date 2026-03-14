<?php

use App\Models\House;
use App\Models\PaymentCycle;
use App\Models\User;

test('authenticated users can visit financeiro page', function () {
    $house = House::factory()->create();
    $user = User::factory()->create([
        'house_id' => $house->id,
        'role' => 'admin',
    ]);

    $this->actingAs($user);

    $response = $this->get('/financeiro');
    $response->assertOk();
});

test('authenticated users can create a financial transaction', function () {
    $house = House::factory()->create();
    $user = User::factory()->create([
        'house_id' => $house->id,
        'role' => 'admin',
    ]);

    $cycle = PaymentCycle::factory()->create([
        'house_id' => $house->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user);

    $response = $this->post('/financeiro/lancamentos', [
        'title' => 'Conta de luz',
        'amount' => 120.50,
        'type' => 'gasto',
        'status' => 'aberto',
        'due_date' => now()->addDay()->format('Y-m-d'),
        'payment_cycle_id' => $cycle->id,
    ]);

    $response->assertRedirect('/financeiro');

    $this->assertDatabaseHas('financial_transactions', [
        'house_id' => $house->id,
        'title' => 'Conta de luz',
        'status' => 'aberto',
    ]);
});
