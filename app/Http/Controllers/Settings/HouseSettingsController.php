<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HouseSettingsController extends Controller
{
    /**
     * Exibe a página de configurações da casa (somente admin).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->isAdmin(), 403);

        $house = $user->house;
        $members = $house->users()
            ->select(['id', 'name', 'email', 'role'])
            ->orderBy('name')
            ->get();

        return Inertia::render('settings/casa', [
            'house' => $house->only(['id', 'name', 'description']),
            'members' => $members,
        ]);
    }

    /**
     * Atualiza as informações da casa.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:120'],
        ]);

        $user->house->update($validated);

        return to_route('house-settings.edit');
    }

    /**
     * Atualiza o papel (role) de um membro da casa.
     */
    public function updateMember(Request $request, User $member): RedirectResponse
    {
        $admin = $request->user();

        abort_unless($admin->isAdmin(), 403);
        abort_unless($admin->house_id === $member->house_id, 403);

        if ($admin->id === $member->id) {
            return back()->withErrors(['role' => 'Você não pode alterar seu próprio papel.']);
        }

        $validated = $request->validate([
            'role' => ['required', 'in:admin,user'],
        ]);

        $member->role = $validated['role'];
        $member->save();

        return to_route('house-settings.edit');
    }

    /**
     * Remove um membro da casa.
     */
    public function removeMember(Request $request, User $member): RedirectResponse
    {
        $admin = $request->user();

        abort_unless($admin->isAdmin(), 403);
        abort_unless($admin->house_id === $member->house_id, 403);

        if ($admin->id === $member->id) {
            return back()->withErrors(['member' => 'Você não pode se remover da casa.']);
        }

        $member->house_id = null;
        $member->role = 'user';
        $member->save();

        return to_route('house-settings.edit');
    }
}
