<?php

use App\Models\House;
use App\Models\User;

test('users can create a house during onboarding', function () {
    $user = User::factory()->create([
        'house_id' => null,
        'role' => 'user',
    ]);

    $this->actingAs($user);

    $response = $this->post('/casas', [
        'name' => 'Casa dos Jardins',
        'description' => 'Apartamento 302',
    ]);

    $response->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->house_id)->not->toBeNull();
    expect($user->role)->toBe('admin');

    $this->assertDatabaseHas('houses', [
        'name' => 'Casa dos Jardins',
    ]);
});
