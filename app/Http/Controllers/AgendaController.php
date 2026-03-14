<?php

namespace App\Http\Controllers;

use App\Http\Requests\Agenda\StoreAgendaEventRequest;
use App\Http\Requests\Agenda\UpdateAgendaEventRequest;
use App\Models\AgendaEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        $events = AgendaEvent::query()
            ->where('house_id', $house->id)
            ->orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(function (AgendaEvent $event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->date->format('Y-m-d'),
                    'time' => $event->time,
                ];
            });

        return Inertia::render('agenda/index', [
            'events' => $events,
        ]);
    }

    public function store(StoreAgendaEventRequest $request): RedirectResponse
    {
        $house = $request->user()->house;

        AgendaEvent::create([
            'house_id' => $house->id,
            'created_by' => $request->user()->id,
            'title' => $request->validated()['title'],
            'description' => $request->validated()['description'] ?? null,
            'date' => $request->validated()['date'],
            'time' => $request->validated()['time'],
        ]);

        return redirect()->route('agenda')->with('success', 'Compromisso criado.');
    }

    public function update(UpdateAgendaEventRequest $request, AgendaEvent $event): RedirectResponse
    {
        $this->ensureCanEdit($request, $event);

        $event->fill(array_filter($request->validated(), fn ($value) => $value !== null));
        $event->save();

        return redirect()->route('agenda')->with('success', 'Compromisso atualizado.');
    }

    public function destroy(Request $request, AgendaEvent $event): RedirectResponse
    {
        $this->ensureCanEdit($request, $event);
        $event->delete();

        return redirect()->route('agenda')->with('success', 'Compromisso removido.');
    }

    private function ensureCanEdit(Request $request, AgendaEvent $event): void
    {
        if ($event->house_id !== $request->user()->house_id) {
            abort(403);
        }
    }
}
