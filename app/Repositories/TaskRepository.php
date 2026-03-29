<?php

namespace App\Repositories;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TaskRepository
{
    /**
     * Retorna as tarefas de hoje para uma casa.
     */
    public function getTodayTasks(int $houseId): Collection
    {
        $todayIndex = Carbon::today()->dayOfWeekIso - 1;

        return Task::query()
            ->with(['assignees:id,name'])
            ->where('house_id', $houseId)
            ->where('day_of_week', $todayIndex)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Task $task) => [
                'id'        => $task->id,
                'title'     => $task->title,
                'completed' => $task->completed,
                'color'     => $task->color,
                'assignees' => $task->assignees->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            ]);
    }

    /**
     * Retorna contadores de tarefas (total e concluídas).
     */
    public function getStats(int $houseId): array
    {
        $total = Task::query()->where('house_id', $houseId)->count();
        $done  = Task::query()->where('house_id', $houseId)->where('completed', true)->count();

        return ['done' => $done, 'total' => $total];
    }
}
