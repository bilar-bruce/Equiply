<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\PeerLenderController;
use App\Http\Controllers\Api\ReservationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
});

Route::prefix('items')->group(function () {
    Route::get('/', [ItemController::class, 'index']);
    Route::get('/categories', [ItemController::class, 'categories']);
    Route::get('/{id}', [ItemController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Protected Sanctum Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & authentication management
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Item management (Peer lenders & Custodians)
    Route::post('/items', [ItemController::class, 'store']);

    // Atomic Reservations & Checkout Lifecycle
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'index']);
        Route::post('/', [ReservationController::class, 'store']);
        Route::get('/{id}', [ReservationController::class, 'show']);
        Route::post('/{id}/cancel', [ReservationController::class, 'cancel']);

        // Custodian endpoints
        Route::post('/{id}/checkout', [ReservationController::class, 'checkout']);
        Route::post('/{id}/checkin', [ReservationController::class, 'checkin']);
    });

    // Facility Administration & Account Provisioning
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'index']);
        Route::post('/users', [AdminController::class, 'store']);
        Route::patch('/users/{id}/status', [AdminController::class, 'updateStatus']);
        Route::patch('/users/{id}/peer-lender', [AdminController::class, 'updatePeerLender']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateRole']);
    });

    // Dedicated Peer Lender Portal Operations
    Route::prefix('peer-lender')->group(function () {
        Route::get('/listings', [PeerLenderController::class, 'index']);
        Route::post('/listings', [PeerLenderController::class, 'store']);
        Route::patch('/listings/{id}', [PeerLenderController::class, 'update']);
        Route::post('/listings/{id}/recall', [PeerLenderController::class, 'toggleRecall']);
    });

    // Custodian P2P Verification & Intake Endpoint
    Route::post('/custodian/items/{id}/verify-intake', [PeerLenderController::class, 'verifyIntake']);
    Route::post('/custodian/items/{id}/resolve-maintenance', [ItemController::class, 'resolveMaintenance']);
    Route::post('/custodian/rentals/{id}/settle-payout', [PeerLenderController::class, 'settlePayout']);
});
