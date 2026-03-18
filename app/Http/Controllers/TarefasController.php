<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TarefasController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $house = $user->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $tasks = Task::query()
            ->with('assignees:id,name')
            ->where('house_id', $house->id)
            ->orderBy('day_of_week')
            ->orderBy('sort_order')
            ->get()
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'color' => $task->color,
                    'day_of_week' => $task->day_of_week,
                    'sort_order' => $task->sort_order,
                    'completed' => $task->completed,
                    'assignees' => $task->assignees->map(fn ($user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                    ]),
                ];
            });

        $members = $house->users()->get(['id', 'name']);

        return Inertia::render('tarefas/index', [
            'house' => [
                'id' => $house->id,
                'name' => $house->name,
            ],
            'tasks' => $tasks,
            'members' => $members,
            'weekLabel' => $this->weekLabel(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $house = $user->house;

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
            'day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $sortOrder = Task::query()
            ->where('house_id', $house->id)
            ->where('day_of_week', $validated['day_of_week'])
            ->max('sort_order');

        $task = Task::create([
            'house_id' => $house->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#7C3AED',
            'day_of_week' => $validated['day_of_week'],
            'sort_order' => ($sortOrder ?? 0) + 1,
            'completed' => false,
        ]);

        if (! empty($validated['assignee_ids'])) {
            $task->assignees()->sync($validated['assignee_ids']);
        }

        return redirect()->route('tarefas.index')->with('success', 'Tarefa criada.');
    }

    public function update(Request $request, Task $task)
    {
        $this->ensureCanEdit($request, $task);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
            'completed' => ['nullable', 'boolean'],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $task->fill(array_filter($validated, fn ($value) => $value !== null));
        $task->save();

        if (array_key_exists('assignee_ids', $validated)) {
            $task->assignees()->sync($validated['assignee_ids'] ?? []);
        }

        return redirect()->route('tarefas.index')->with('success', 'Tarefa atualizada.');
    }

    public function destroy(Request $request, Task $task)
    {
        $this->ensureCanEdit($request, $task);
        $task->assignees()->detach();
        $task->delete();

        return redirect()->route('tarefas.index')->with('success', 'Tarefa removida.');
    }

    public function move(Request $request, Task $task)
    {
        $this->ensureCanEdit($request, $task);

        $validated = $request->validate([
            'day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $task->day_of_week = $validated['day_of_week'];
        $task->sort_order = $validated['sort_order'] ?? $task->sort_order;
        $task->save();

        return redirect()->route('tarefas.index')->with('success', 'Tarefa movida.');
    }

    private function ensureCanEdit(Request $request, Task $task): void
    {
        $user = $request->user();

        if ($task->house_id !== $user->house_id) {
            abort(403);
        }

        if ($user->isAdmin()) {
            return;
        }

        if ($task->created_by === $user->id) {
            return;
        }

        if ($task->assignees()->where('user_id', $user->id)->exists()) {
            return;
        }

        abort(403);
    }

    private function weekLabel(): string
    {
        $today = Carbon::today();
        $start = $today->copy()->startOfWeek(Carbon::MONDAY);
        $end = $today->copy()->endOfWeek(Carbon::SUNDAY);

        return $start->locale('pt_BR')->translatedFormat('d').'–'.$end->locale('pt_BR')->translatedFormat('d M');
    }
}
