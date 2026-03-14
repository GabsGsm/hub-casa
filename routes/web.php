<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DispensaController;
use App\Http\Controllers\FinanceiroController;
use App\Http\Controllers\HouseController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\ComprasController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TarefasController;
use App\Http\Middleware\EnsureUserHasHouse;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::middleware('guest')->group(function () {
    Route::inertia('/', 'welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ])->name('home');
});

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));

    Route::get('/onboarding', [OnboardingController::class, 'index'])
        ->name('onboarding');
    Route::post('/casas', [HouseController::class, 'store'])
        ->name('casas.store');

    Route::middleware([EnsureUserHasHouse::class])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/financeiro', [FinanceiroController::class, 'index'])
            ->name('financeiro');
        Route::post('/financeiro/ciclos', [FinanceiroController::class, 'storeCycle'])
            ->name('financeiro.ciclos.store');
        Route::put('/financeiro/ciclos/{cycle}', [FinanceiroController::class, 'updateCycle'])
            ->name('financeiro.ciclos.update');
        Route::delete('/financeiro/ciclos/{cycle}', [FinanceiroController::class, 'destroyCycle'])
            ->name('financeiro.ciclos.destroy');
        Route::post('/financeiro/lancamentos', [FinanceiroController::class, 'storeTransaction'])
            ->name('financeiro.lancamentos.store');
        Route::put('/financeiro/lancamentos/{transaction}', [FinanceiroController::class, 'updateTransaction'])
            ->name('financeiro.lancamentos.update');
        Route::delete('/financeiro/lancamentos/{transaction}', [FinanceiroController::class, 'destroyTransaction'])
            ->name('financeiro.lancamentos.destroy');

        Route::get('/tarefas', [TarefasController::class, 'index'])
            ->name('tarefas');
        Route::post('/tarefas', [TarefasController::class, 'store'])
            ->name('tarefas.store');
        Route::put('/tarefas/{task}', [TarefasController::class, 'update'])
            ->name('tarefas.update');
        Route::patch('/tarefas/{task}/move', [TarefasController::class, 'move'])
            ->name('tarefas.move');
        Route::delete('/tarefas/{task}', [TarefasController::class, 'destroy'])
            ->name('tarefas.destroy');

        Route::get('/agenda', [AgendaController::class, 'index'])
            ->name('agenda');
        Route::post('/agenda', [AgendaController::class, 'store'])
            ->name('agenda.store');
        Route::put('/agenda/{event}', [AgendaController::class, 'update'])
            ->name('agenda.update');
        Route::delete('/agenda/{event}', [AgendaController::class, 'destroy'])
            ->name('agenda.destroy');

        Route::get('/compras', [ComprasController::class, 'index'])
            ->name('compras');
        Route::post('/compras', [ComprasController::class, 'store'])
            ->name('compras.store');
        Route::put('/compras/{item}', [ComprasController::class, 'update'])
            ->name('compras.update');
        Route::delete('/compras/{item}', [ComprasController::class, 'destroy'])
            ->name('compras.destroy');

        Route::get('/dispensa', [DispensaController::class, 'index'])
            ->name('dispensa');
        Route::post('/dispensa', [DispensaController::class, 'store'])
            ->name('dispensa.store');
        Route::put('/dispensa/{item}', [DispensaController::class, 'update'])
            ->name('dispensa.update');
        Route::delete('/dispensa/{item}', [DispensaController::class, 'destroy'])
            ->name('dispensa.destroy');
    });
});

require __DIR__.'/settings.php';
