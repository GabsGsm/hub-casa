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

        Route::prefix('financeiro')->name('financeiro.')->group(function () {
            Route::get('/', [FinanceiroController::class, 'index'])
                ->name('index');

            // Ciclos
            Route::prefix('ciclos')->name('ciclos.')->group(function () {
                Route::post('/', [FinanceiroController::class, 'storeCycle'])->name('store');
                Route::put('/{cycle}', [FinanceiroController::class, 'updateCycle'])->name('update');
                Route::delete('/{cycle}', [FinanceiroController::class, 'destroyCycle'])->name('destroy');
            });

            // Gastos
            Route::prefix('gastos')->name('gastos.')->group(function () {
                Route::post('/', [FinanceiroController::class, 'storeGasto'])->name('store');
                Route::put('/{gasto}', [FinanceiroController::class, 'updateGasto'])->name('update');
                Route::delete('/{gasto}', [FinanceiroController::class, 'destroyGasto'])->name('destroy');
            });

            // Ganhos
            Route::prefix('ganhos')->name('ganhos.')->group(function () {
                Route::post('/', [FinanceiroController::class, 'storeGanho'])->name('store');
                Route::put('/{ganho}', [FinanceiroController::class, 'updateGanho'])->name('update');
                Route::delete('/{ganho}', [FinanceiroController::class, 'destroyGanho'])->name('destroy');
            });

            // Parcelamentos (grupo)
            Route::prefix('parcelamentos')->name('parcelamentos.')->group(function () {
                Route::post('/', [FinanceiroController::class, 'storeParcelamento'])->name('store');
                Route::put('/{parcelamento}', [FinanceiroController::class, 'updateParcelamento'])->name('update');
                Route::delete('/{parcelamento}', [FinanceiroController::class, 'destroyParcelamento'])->name('destroy');
            });

            // Parcelas (individual)
            Route::prefix('parcelas')->name('parcelas.')->group(function () {
                Route::put('/{parcela}', [FinanceiroController::class, 'updateParcela'])->name('update');
                Route::delete('/{parcela}', [FinanceiroController::class, 'destroyParcela'])->name('destroy');
            });
        });

        Route::prefix('tarefas')->name('tarefas.')->group(function () {
            Route::get('/', [TarefasController::class, 'index'])->name('index');
            Route::post('/', [TarefasController::class, 'store'])->name('store');
            Route::put('/{task}', [TarefasController::class, 'update'])->name('update');
            Route::patch('/{task}/move', [TarefasController::class, 'move'])->name('move');
            Route::delete('/{task}', [TarefasController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('agenda')->name('agenda.')->group(function () {
            Route::get('/', [AgendaController::class, 'index'])->name('index');
            Route::post('/', [AgendaController::class, 'store'])->name('store');
            Route::put('/{event}', [AgendaController::class, 'update'])->name('update');
            Route::delete('/{event}', [AgendaController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('compras')->name('compras.')->group(function () {
            Route::get('/', [ComprasController::class, 'index'])->name('index');
            Route::post('/', [ComprasController::class, 'store'])->name('store');
            Route::post('/{item}/registrar', [ComprasController::class, 'registrarCompra'])->name('registrar');
            Route::patch('/{item}/cancelar', [ComprasController::class, 'cancelar'])->name('cancelar');
            Route::delete('/{item}', [ComprasController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('dispensa')->name('dispensa.')->group(function () {
            Route::get('/', [DispensaController::class, 'index'])->name('index');
            Route::post('/', [DispensaController::class, 'store'])->name('store');
            Route::put('/{produto}', [DispensaController::class, 'update'])->name('update');
            Route::patch('/{produto}/estoque', [DispensaController::class, 'adjustEstoque'])->name('estoque');
            Route::delete('/{produto}', [DispensaController::class, 'destroy'])->name('destroy');
        });
    });
});

require __DIR__.'/settings.php';
