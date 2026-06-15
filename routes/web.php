<?php

use App\Http\Controllers\MotoristaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [MotoristaController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/motoristas/{motorista}/pedidos', [PedidoController::class, 'index'])
        ->middleware('verified')
        ->name('motoristas.pedidos.index');
    Route::put('/motoristas/{motorista}/pedidos', [PedidoController::class, 'update'])
        ->middleware('verified')
        ->name('motoristas.pedidos.update');
    Route::get('/motoristas/{motorista}/entregas', [PedidoController::class, 'entregas'])
        ->middleware('verified')
        ->name('motoristas.entregas.index');
    Route::put('/motoristas/{motorista}/entregas', [PedidoController::class, 'updateEntregas'])
        ->middleware('verified')
        ->name('motoristas.entregas.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
