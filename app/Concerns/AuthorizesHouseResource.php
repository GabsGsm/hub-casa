<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait AuthorizesHouseResource
{
    protected function ensureCanEdit(User $user, Model $resource): void
    {
        if ($resource->house_id !== $user->house_id) {
            abort(403);
        }

        if ($user->isAdmin()) {
            return;
        }

        if (isset($resource->created_by) && $resource->created_by === $user->id) {
            return;
        }

        if (method_exists($resource, 'assignees')) {
            if ($resource->assignees()->where('user_id', $user->id)->exists()) {
                return;
            }
        }

        abort(403);
    }
}
