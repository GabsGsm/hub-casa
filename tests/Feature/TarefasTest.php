<?php

use App\Models\House;
use App\Models\Task;
use App\Models\User;

test('authenticated users can visit tarefas page', function () {
    $house = House::factory()->create();
    $user = User::factory()->create([
        'house_id' => $house->id,
        'role' => 'admin',
    ]);

    $this->actingAs($user);

    $response = $this->get('/tarefas');
    $response->assertOk();
});

test('authenticated users can create and move tasks', function () {
    $house = House::factory()->create();
    $user = User::factory()->create([
        'house_id' => $house->id,
        'role' => 'admin',
    ]);

    $this->actingAs($user);

    $this->post('/tarefas', [
        'title' => 'Limpar cozinha',
        'day_of_week' => 0,
    ])->assertRedirect('/tarefas');

    $task = Task::first();

    $this->patch("/tarefas/{$task->id}/move", [
        'day_of_week' => 2,
    ])->assertRedirect('/tarefas');

    $this->assertDatabaseHas('tasks', [
        'id' => $task->id,
        'day_of_week' => 2,
    ]);
});
