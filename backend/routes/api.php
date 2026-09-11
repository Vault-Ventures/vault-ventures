<?php

use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\BusinessDocumentController;
use App\Http\Controllers\BusinessRequirementController;
use App\Http\Controllers\BusinessSubmissionController;
use App\Http\Controllers\InvestorPreferenceController;
use App\Http\Controllers\ParticipantRoleController;
use App\Http\Controllers\ProfessionalProfileController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReadinessInputController;
use App\Http\Controllers\ReadinessAssessmentController;
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
    Route::get('/businesses/{business}/business-analyses', [\App\Http\Controllers\BusinessAnalysisController::class, 'index'])->whereNumber('business');
    Route::get('/businesses/{business}/business-analyses/latest', [\App\Http\Controllers\BusinessAnalysisController::class, 'latest'])->whereNumber('business');
    Route::get('/businesses/{business}/business-analyses/{version}', [\App\Http\Controllers\BusinessAnalysisController::class, 'show'])->whereNumber('business')->whereNumber('version');
    Route::post('/businesses/{business}/business-analyses', [\App\Http\Controllers\BusinessAnalysisController::class, 'store'])->whereNumber('business')->middleware(RequireSpaSession::class);
    Route::get('/businesses/{business}/readiness-assessments', [ReadinessAssessmentController::class, 'index'])->whereNumber('business');
    Route::get('/businesses/{business}/readiness-assessments/latest', [ReadinessAssessmentController::class, 'latest'])->whereNumber('business');
    Route::get('/businesses/{business}/readiness-assessments/{version}', [ReadinessAssessmentController::class, 'show'])
        ->whereNumber('business')->whereNumber('version');
    Route::post('/businesses/{business}/readiness-assessments', [ReadinessAssessmentController::class, 'store'])
        ->middleware(RequireSpaSession::class)->whereNumber('business');
    Route::get('/businesses/{business}/readiness-inputs', [ReadinessInputController::class, 'latest'])->whereNumber('business');
    Route::get('/businesses/{business}/readiness-inputs/versions/{version}', [ReadinessInputController::class, 'show'])
        ->whereNumber('business')->whereNumber('version');
    Route::post('/businesses/{business}/readiness-inputs', [ReadinessInputController::class, 'store'])
        ->middleware(RequireSpaSession::class)->whereNumber('business');
    Route::get('/businesses/{business}/documents', [BusinessDocumentController::class, 'index'])->whereNumber('business');
    Route::get('/businesses/{business}/documents/{document}/download', [BusinessDocumentController::class, 'download'])
        ->whereNumber('business')->whereNumber('document');
    Route::post('/businesses/{business}/documents', [BusinessDocumentController::class, 'store'])
        ->middleware(RequireSpaSession::class)->whereNumber('business');
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::get('/businesses/{business}', [BusinessController::class, 'show'])->whereNumber('business');
    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::post('/businesses', [BusinessController::class, 'store']);
        Route::patch('/businesses/{business}', [BusinessController::class, 'update'])->whereNumber('business');
        Route::patch('/businesses/{business}/requirements', [BusinessRequirementController::class, 'update'])->whereNumber('business');
        Route::post('/businesses/{business}/submit', [BusinessSubmissionController::class, 'store'])->whereNumber('business');
    });
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/investor-preferences', [InvestorPreferenceController::class, 'show']);
    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::post('/roles', [ParticipantRoleController::class, 'store']);
        Route::patch('/profiles/professional', [ProfessionalProfileController::class, 'update']);
        Route::patch('/investor-preferences', [InvestorPreferenceController::class, 'update']);
    });
});
