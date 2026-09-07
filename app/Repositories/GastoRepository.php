<?php

namespace App\Repositories;

use App\Models\Gasto;
use App\Models\GastoMembroValor;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class GastoRepository
{
    /**
     * Retorna os gastos resolvidos para um mês específico.
     * Gastos recorrentes são projetados; pontuais aparecem apenas no mês do vencimento.
     */
    public function getResolvedForMonth(int $casaId, int $year, int $month): Collection
    {
        $now            = Carbon::now();
        $isCurrentMonth = ($year === $now->year && $month === $now->month);
        $mesRef         = Carbon::create($year, $month, 1)->startOfMonth();

        // Carregar gastos base (não-instâncias) e instâncias do mês
        $all = Gasto::query()
            ->with([
                'categoria:id,name,color',
                'ciclo:id,name',
                'responsaveis:id,name,color',
                'membrosValor.user:id,name,color',
                'membrosValor.ciclo:id,name',
            ])
            ->where('casa_id', $casaId)
            ->where(function ($q) use ($mesRef) {
                // Gastos base (recorrentes sem parent ou não-recorrentes)
                $q->whereNull('parent_gasto_id')
                  // OU instâncias criadas exatamente para este mês
                  ->orWhere('mes_referencia', $mesRef->format('Y-m-d'));
            })
            ->get();

        $result    = collect();
        $mesRefStr = $mesRef->format('Y-m-d');

        // Separar bases recorrentes e pontuais (sem parent)
        $bases    = $all->where('recorrente', true)->whereNull('parent_gasto_id');
        $pontuais = $all->where('recorrente', false)->whereNull('parent_gasto_id');

        // Buscar instâncias do mês via query DB (comparação de DATE no MySQL — correto)
        // NÃO usar Collection::where() pois Carbon != string em PHP
        $baseInstances = Gasto::query()
            ->with([
                'categoria:id,name,color',
                'ciclo:id,name',
                'responsaveis:id,name,color',
                'membrosValor.user:id,name,color',
                'membrosValor.ciclo:id,name',
            ])
            ->where('casa_id', $casaId)
            ->whereNotNull('parent_gasto_id')
            ->where('mes_referencia', $mesRefStr)
            ->get()
            ->keyBy('parent_gasto_id');

        foreach ($bases as $base) {
            // Se já existe uma instância para este mês, usa ela
            if ($baseInstances->has($base->id)) {
                $instancia = $baseInstances->get($base->id);
                $result->push($this->buildPayload($instancia, $instancia->vencimento->format('Y-m-d')));
                continue;
            }

            // Buscar instância mais recente antes deste mês
            $recentInstance = Gasto::query()
                ->where('parent_gasto_id', $base->id)
                ->where('mes_referencia', '<', $mesRefStr)
                ->orderByDesc('mes_referencia')
                ->first();

            $template = $recentInstance ?? $base;

            if ($isCurrentMonth) {
                // Mês atual sem instância: criar nova instância
                $nova = $this->criarInstanciaDoMes($base, $template, $year, $month);
                $nova->load([
                    'categoria:id,name,color',
                    'ciclo:id,name',
                    'responsaveis:id,name,color',
                    'membrosValor.user:id,name,color',
                    'membrosValor.ciclo:id,name',
                ]);
                $result->push($this->buildPayload($nova, $nova->vencimento->format('Y-m-d')));
            } else {
                // Mês futuro ou passado sem instância: projetar como aberto
                $origDay   = $template->dia_recorrencia ?? Carbon::parse($template->vencimento ?? $template->created_at)->day;
                $projected = $this->projectedDate($origDay, $year, $month);
                $result->push($this->buildPayload($template, $projected, Gasto::STATUS_ABERTO));
            }
        }

        foreach ($pontuais as $gasto) {
            $result->push(...$this->resolvePontual($gasto, $year, $month));
        }

        return $result->sortBy('vencimento_resolvido')->values();
    }

    private function criarInstanciaDoMes(Gasto $base, Gasto $template, int $year, int $month): Gasto
    {
        $mesRefStr  = Carbon::create($year, $month, 1)->format('Y-m-d');

        // Guard: previne criação duplicada mesmo em race conditions
        $existing = Gasto::query()
            ->where('parent_gasto_id', $base->id)
            ->where('mes_referencia', $mesRefStr)
            ->first();

        if ($existing) {
            return $existing;
        }

        $origDay    = $template->dia_recorrencia ?? Carbon::parse($template->vencimento ?? $template->created_at)->day;
        $newDueDate = Carbon::create($year, $month, min($origDay, Carbon::create($year, $month, 1)->daysInMonth));

        $nova = Gasto::create([
            'casa_id'         => $base->casa_id,
            'ciclo_id'        => $template->ciclo_id,
            'categoria_id'    => $template->categoria_id,
            'criado_por'      => $base->criado_por,
            'titulo'          => $template->titulo,
            'valor'           => $template->valor,
            'status'          => Gasto::STATUS_ABERTO,
            'vencimento'      => $newDueDate->format('Y-m-d'),
            'recorrente'      => false, // instâncias não são recorrentes por si só
            'dia_recorrencia' => $template->dia_recorrencia,
            'observacoes'     => $template->observacoes,
            'parent_gasto_id' => $base->id,
            'mes_referencia'  => $mesRefStr,
        ]);

        // Copiar responsaveis
        $responsaveisIds = $template->responsaveis()->pluck('user_id')->toArray();
        if (! empty($responsaveisIds)) {
            $nova->responsaveis()->sync($responsaveisIds);
        }

        // Copiar membrosValor
        foreach ($template->membrosValor ?? [] as $mv) {
            \App\Models\GastoMembroValor::create([
                'gasto_id' => $nova->id,
                'user_id'  => $mv->user_id,
                'valor'    => $mv->valor,
                'status'   => 'pendente',
                'ciclo_id' => $mv->ciclo_id,
            ]);
        }

        return $nova;
    }

    /**
     * Retorna gastos paginados com filtros.
     */
    public function getFilteredPaginated(int $casaId, array $filters, int $perPage = 30): LengthAwarePaginator
    {
        $query = Gasto::query()
            ->with('categoria:id,name,color', 'ciclo:id,name', 'responsaveis:id,name')
            ->where('casa_id', $casaId)
            ->whereNull('parent_gasto_id'); // Excluir instâncias de recorrência

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['ciclo_id'])) {
            $query->where('ciclo_id', $filters['ciclo_id']);
        }
        if (! empty($filters['categoria_id'])) {
            $query->where('categoria_id', $filters['categoria_id']);
        }
        if (! empty($filters['search'])) {
            $query->where('titulo', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderByDesc('vencimento')->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(int $casaId, int $userId, array $data, array $responsavelIds = []): Gasto
    {
        $gasto = Gasto::create([
            'casa_id'         => $casaId,
            'ciclo_id'        => $data['ciclo_id'] ?? null,
            'categoria_id'    => $data['categoria_id'] ?? null,
            'criado_por'      => $userId,
            'titulo'          => $data['titulo'],
            'valor'           => $data['valor'],
            'status'          => $data['status'],
            'vencimento'      => $data['vencimento'] ?? null,
            'recorrente'      => $data['recorrente'] ?? false,
            'dia_recorrencia' => $data['dia_recorrencia'] ?? null,
            'observacoes'     => $data['observacoes'] ?? null,
        ]);

        // Usar novo formato membros se disponível; fallback para responsavel_ids
        if (! empty($data['membros'])) {
            $this->syncMembrosValor($gasto, $data['membros']);
        } elseif (! empty($responsavelIds)) {
            $gasto->responsaveis()->sync($responsavelIds);
        }

        return $gasto;
    }

    public function update(Gasto $gasto, array $data, ?array $responsavelIds): Gasto
    {
        $allowed = [
            'titulo', 'valor', 'status', 'vencimento', 'ciclo_id',
            'categoria_id', 'recorrente', 'dia_recorrencia', 'observacoes',
        ];

        $gasto->fill(array_intersect_key($data, array_flip($allowed)));
        $gasto->save();

        if (! empty($data['membros'])) {
            $this->syncMembrosValor($gasto, $data['membros']);
        } elseif ($responsavelIds !== null) {
            $gasto->responsaveis()->sync($responsavelIds);
        }

        return $gasto;
    }

    public function delete(Gasto $gasto): void
    {
        $gasto->responsaveis()->detach();
        $gasto->membrosValor()->delete();
        $gasto->delete();
    }

    private function syncMembrosValor(Gasto $gasto, array $membros): void
    {
        $gasto->membrosValor()->delete();

        foreach ($membros as $membro) {
            GastoMembroValor::create([
                'gasto_id' => $gasto->id,
                'user_id'  => $membro['user_id'],
                'valor'    => $membro['valor'],
                'status'   => 'pendente',
                'ciclo_id' => $membro['ciclo_id'] ?? null,
            ]);
        }

        // Mantém a pivot antiga sincronizada para compatibilidade
        $gasto->responsaveis()->sync(array_column($membros, 'user_id'));
    }

    /**
     * Retorna os N gastos mais recentes (para dashboard).
     */
    public function getRecent(int $casaId, int $limit = 5): Collection
    {
        return Gasto::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId)
            ->whereNull('parent_gasto_id')
            ->orderByDesc('vencimento')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Gasto $g) => [
                'id'             => $g->id,
                'title'          => $g->titulo,
                'amount'         => (float) $g->valor,
                'type'           => 'gasto',
                'effective_date' => Carbon::parse($g->vencimento ?? $g->created_at)->format('d/m'),
                'category'       => $g->categoria
                    ? ['name' => $g->categoria->name, 'color' => $g->categoria->color]
                    : null,
            ]);
    }

    // -------------------------------------------------------------------------
    // Resolução de mês
    // -------------------------------------------------------------------------

    private function resolvePontual(Gasto $gasto, int $year, int $month): array
    {
        $effectiveDate = Carbon::parse($gasto->vencimento ?? $gasto->created_at);

        if ($effectiveDate->year === $year && $effectiveDate->month === $month) {
            return [$this->buildPayload($gasto, $effectiveDate->format('Y-m-d'))];
        }

        return [];
    }

    private function projectedDate(int $origDay, int $year, int $month): string
    {
        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
        $day = min($origDay, $daysInMonth);

        return Carbon::create($year, $month, $day)->format('Y-m-d');
    }

    private function buildPayload(Gasto $gasto, string $resolvedDate, ?string $statusOverride = null): array
    {
        $membrosValor = $gasto->membrosValor
            ->map(fn ($mv) => [
                'user_id'    => $mv->user_id,
                'user_name'  => $mv->user?->name,
                'user_color' => $mv->user?->color,
                'valor'      => (float) $mv->valor,
                'status'     => $mv->status,
                'ciclo_id'   => $mv->ciclo_id,
            ])
            ->values()
            ->toArray();

        // Instâncias de recorrência (parent_gasto_id preenchido) também são exibidas como recorrentes
        $isRecorrente = $gasto->recorrente || ! is_null($gasto->parent_gasto_id);

        return [
            'id'                   => $gasto->id,
            'tipo_registro'        => 'gasto',
            'titulo'               => $gasto->titulo,
            'valor'                => (float) $gasto->valor,
            'status'               => $statusOverride ?? $gasto->status,
            'vencimento'           => optional($gasto->vencimento)->format('Y-m-d'),
            'vencimento_resolvido' => $resolvedDate,
            'recorrente'           => $isRecorrente,
            'dia_recorrencia'      => $gasto->dia_recorrencia,
            'observacoes'          => $gasto->observacoes,
            'ciclo'                => $gasto->ciclo
                ? ['id' => $gasto->ciclo->id, 'name' => $gasto->ciclo->name]
                : null,
            'categoria'            => $gasto->categoria
                ? ['id' => $gasto->categoria->id, 'name' => $gasto->categoria->name, 'color' => $gasto->categoria->color]
                : null,
            'responsaveis'         => $gasto->responsaveis
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'color' => $u->color])
                ->values()
                ->toArray(),
            'membros_valor'        => $membrosValor,
            'sem_responsavel'      => $gasto->responsaveis->isEmpty() && empty($membrosValor),
        ];
    }
}
