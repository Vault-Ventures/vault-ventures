<?php

use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\InvestorPreferenceController;
use App\Http\Controllers\ParticipantRoleController;
use App\Http\Controllers\ProfessionalProfileController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\RequireSpaSession;
use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ApiResponse::success(['status' => 'ok']))
    ->name('api.health');

Route::prefix('auth')->middleware(RequireSpaSession::class)->group(function () {
    Route::post('/register', [SessionController::class, 'register'])->middleware('throttle:registration');
    Route::post('/login', [SessionController::class, 'login'])->middleware('throttle:login');
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:recovery');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:recovery');
    Route::post('/logout', [SessionController::class, 'logout'])->middleware('auth:sanctum');
    Route::post('/email/verification-notification', [VerificationController::class, 'resend'])
        ->middleware(['auth:sanctum', 'throttle:verification'])->name('verification.send');
});

Route::get('/auth/user', [SessionController::class, 'me'])->middleware('auth:sanctum');
// A verification link opened from email is a browser navigation, so start a web session.
Route::get('/auth/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->middleware(['web', 'auth:sanctum', 'signed', 'throttle:verification'])->name('verification.verify');

Route::prefix('me')->middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/investor-preferences', [InvestorPreferenceController::class, 'show']);
    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::post('/roles', [ParticipantRoleController::class, 'store']);
        Route::patch('/profiles/professional', [ProfessionalProfileController::class, 'update']);
        Route::patch('/investor-preferences', [InvestorPreferenceController::class, 'update']);
    });
});
