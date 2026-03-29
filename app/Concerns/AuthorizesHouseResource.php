<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait AuthorizesHouseResource
{
    protected function ensureCanEdit(User $user, Model $resource): void
    {
        // Suporta tanto house_id (módulos antigos) quanto casa_id (financeiro refatorado)
        $resourceHouseId = $resource->casa_id ?? $resource->house_id ?? null;

        if ($resourceHouseId !== $user->house_id) {
            abort(403);
        }

        if ($user->isAdmin()) {
            return;
        }

        // Suporta criado_por (financeiro) e created_by (outros módulos)
        $createdBy = $resource->criado_por ?? $resource->created_by ?? null;

        if ($createdBy !== null && $createdBy === $user->id) {
            return;
        }

        // Suporta responsaveis() (financeiro) e assignees() (outros módulos)
        if (method_exists($resource, 'responsaveis')) {
            if ($resource->responsaveis()->where('user_id', $user->id)->exists()) {
                return;
            }
        } elseif (method_exists($resource, 'assignees')) {
            if ($resource->assignees()->where('user_id', $user->id)->exists()) {
                return;
            }
        }

        abort(403);
    }
}