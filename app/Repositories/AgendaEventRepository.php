<?php

namespace App\Repositories;

use App\Models\AgendaEvent;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AgendaEventRepository
{
    /**
     * Retorna os próximos eventos a partir de hoje.
     */
    public function getUpcoming(int $houseId, int $limit = 4): Collection
    {
        return AgendaEvent::query()
            ->where('house_id', $houseId)
            ->whereDate('date', '>=', Carbon::today())
            ->orderBy('date')
            ->orderBy('time')
            ->limit($limit)
            ->get()
            ->map(fn (AgendaEvent $event) => [
                'id'    => $event->id,
                'title' => $event->title,
                'date'  => $event->date->format('d/m'),
                'time'  => substr((string) $event->time, 0, 5),
            ]);
    }
}
