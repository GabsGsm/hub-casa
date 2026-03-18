<?php

use App\Http\Controllers\Settings\HouseSettingsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    // Configurações da casa (somente admin)
    Route::get('settings/casa', [HouseSettingsController::class, 'edit'])->name('house-settings.edit');
    Route::patch('settings/casa', [HouseSettingsController::class, 'update'])->name('house-settings.update');
    Route::patch('settings/casa/membros/{member}', [HouseSettingsController::class, 'updateMember'])->name('house-settings.update-member');
    Route::delete('settings/casa/membros/{member}', [HouseSettingsController::class, 'removeMember'])->name('house-settings.remove-member');
});
