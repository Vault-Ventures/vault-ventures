<?php

use App\Http\Controllers\AdminBusinessController;
use App\Http\Controllers\AdminFinancialReportController;
use App\Http\Controllers\AdminReputationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminVerificationRequestController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PhoneVerificationController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\BusinessAnalysisController;
use App\Http\Controllers\BusinessConnectionController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\BusinessDisclosureController;
use App\Http\Controllers\BusinessDocumentController;
use App\Http\Controllers\BusinessNdaController;
use App\Http\Controllers\BusinessPhotoController;
use App\Http\Controllers\BusinessRequirementController;
use App\Http\Controllers\BusinessSubmissionController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DealFeedbackController;
use App\Http\Controllers\DealMessageController;
use App\Http\Controllers\DealMilestoneController;
use App\Http\Controllers\FinancialReportController;
use App\Http\Controllers\InvestorPreferenceController;
use App\Http\Controllers\MatchDetailController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPreferenceController;
use App\Http\Controllers\ParticipantRoleController;
use App\Http\Controllers\ProfessionalProfileController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReadinessAssessmentController;
use App\Http\Controllers\ReadinessInputController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\ReputationController;
use App\Http\Controllers\UserPhotoController;
use App\Http\Controllers\VerificationEvidenceController;
use App\Http\Controllers\VerificationRequestController;
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
    Route::get('/connections', [BusinessConnectionController::class, 'index']);
    Route::get('/businesses/{business}/business-analyses', [BusinessAnalysisController::class, 'index'])->whereNumber('business');
    Route::get('/businesses/{business}/business-analyses/latest', [BusinessAnalysisController::class, 'latest'])->whereNumber('business');
    Route::get('/businesses/{business}/business-analyses/{version}', [BusinessAnalysisController::class, 'show'])->whereNumber('business')->whereNumber('version');
    Route::post('/businesses/{business}/business-analyses', [BusinessAnalysisController::class, 'store'])->whereNumber('business')->middleware(RequireSpaSession::class);
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
    Route::get('/businesses/{business}/recommendations/investors', [RecommendationController::class, 'investorsForBusiness'])->whereNumber('business');
    Route::get('/businesses/{business}/recommendations/professionals', [RecommendationController::class, 'professionalsForBusiness'])->whereNumber('business');
    Route::get('/recommendations/businesses', [RecommendationController::class, 'businesses']);
    Route::get('/matches/businesses/{business}', [MatchDetailController::class, 'showSelf'])
        ->whereNumber('business');
    Route::get('/matches/businesses/{business}/investors/{investor}', [MatchDetailController::class, 'showBusinessInvestor'])
        ->whereNumber('business')->whereNumber('investor');
    Route::get('/matches/businesses/{business}/professionals/{professional}', [MatchDetailController::class, 'showBusinessProfessional'])
        ->whereNumber('business')->whereNumber('professional');
    Route::get('/businesses/{business}/disclosure-status', [BusinessDisclosureController::class, 'status'])
        ->whereNumber('business');
    Route::get('/businesses/{business}/disclosure', [BusinessDisclosureController::class, 'showDisclosure'])
        ->whereNumber('business');
    Route::get('/businesses/{business}/nda', [BusinessNdaController::class, 'show'])
        ->whereNumber('business');
    Route::get('/businesses/{business}/connection-status', [BusinessConnectionController::class, 'status'])
        ->whereNumber('business');
    Route::get('/businesses/{business}/connection', [BusinessConnectionController::class, 'status'])
        ->whereNumber('business');
    Route::get('/deals', [DealController::class, 'index']);
    Route::get('/deals/{deal}', [DealController::class, 'show'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/history', [DealController::class, 'history'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/negotiation', [DealController::class, 'getNegotiation'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/agreement', [DealController::class, 'getAgreement'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/milestones', [DealMilestoneController::class, 'index'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/funding-summary', [DealMilestoneController::class, 'fundingSummary'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/feedback', [DealFeedbackController::class, 'show'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/messages', [DealMessageController::class, 'index'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/financial-reports', [FinancialReportController::class, 'index'])
        ->whereNumber('deal');
    Route::get('/deals/{deal}/financial-overview', [FinancialReportController::class, 'financialOverview'])
        ->whereNumber('deal');
    Route::get('/financial-reports/{report}', [FinancialReportController::class, 'show'])
        ->whereNumber('report');
    Route::get('/financial-reports/{report}/evidence/{evidence}/download', [FinancialReportController::class, 'downloadEvidence'])
        ->whereNumber('report')->whereNumber('evidence');
    Route::get('/financial-reports/{report}/discrepancies', [FinancialReportController::class, 'discrepancies'])
        ->whereNumber('report');
    Route::get('/financial-reports/{report}/audit-logs', [FinancialReportController::class, 'auditLogs'])
        ->whereNumber('report');
    Route::get('/reputation', [ReputationController::class, 'show']);

    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::post('/businesses', [BusinessController::class, 'store']);
        Route::patch('/businesses/{business}', [BusinessController::class, 'update'])->whereNumber('business');
        Route::patch('/businesses/{business}/requirements', [BusinessRequirementController::class, 'update'])->whereNumber('business');
        Route::post('/businesses/{business}/submit', [BusinessSubmissionController::class, 'store'])->whereNumber('business');
        Route::post('/businesses/{business}/publish', [BusinessSubmissionController::class, 'publish'])->whereNumber('business');
        Route::post('/businesses/{business}/logo', [BusinessPhotoController::class, 'uploadLogo'])->whereNumber('business');
        Route::post('/businesses/{business}/cover-photo', [BusinessPhotoController::class, 'uploadCoverPhoto'])->whereNumber('business');
        Route::post('/businesses/{business}/express-interest', [BusinessDisclosureController::class, 'expressInterest'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/interests', [BusinessConnectionController::class, 'expressInterest'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/reciprocal-interest', [BusinessConnectionController::class, 'expressReciprocalInterest'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/reciprocate-interest', [BusinessConnectionController::class, 'expressReciprocalInterest'])
            ->whereNumber('business');
        Route::post('/connections/{connection}/deal', [DealController::class, 'createFromConnection'])
            ->whereNumber('connection');
        Route::post('/deals/{deal}/transition', [DealController::class, 'transition'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/negotiation/propose', [DealController::class, 'proposeNegotiation'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/negotiation/{proposal}/respond', [DealController::class, 'respondNegotiation'])
            ->whereNumber('deal')->whereNumber('proposal');
        Route::post('/deals/{deal}/agreement/generate', [DealController::class, 'generateAgreement'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/agreement/sign', [DealController::class, 'signAgreement'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/milestones', [DealMilestoneController::class, 'store'])
            ->whereNumber('deal');
        Route::put('/deals/{deal}/milestones/{milestone}', [DealMilestoneController::class, 'update'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::delete('/deals/{deal}/milestones/{milestone}', [DealMilestoneController::class, 'destroy'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::post('/deals/{deal}/milestones/{milestone}/progress', [DealMilestoneController::class, 'progress'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::post('/deals/{deal}/milestones/{milestone}/submit', [DealMilestoneController::class, 'submit'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::post('/deals/{deal}/milestones/{milestone}/confirm', [DealMilestoneController::class, 'confirm'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::post('/deals/{deal}/milestones/{milestone}/dispute', [DealMilestoneController::class, 'dispute'])
            ->whereNumber('deal')->whereNumber('milestone');
        Route::post('/deals/{deal}/activate-milestones', [DealMilestoneController::class, 'activateMilestones'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/complete', [DealMilestoneController::class, 'complete'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/feedback', [DealFeedbackController::class, 'store'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/messages', [DealMessageController::class, 'store'])
            ->whereNumber('deal');
        Route::post('/deals/{deal}/financial-reports', [FinancialReportController::class, 'store'])
            ->whereNumber('deal');
        Route::post('/financial-reports/{report}/evidence', [FinancialReportController::class, 'uploadEvidence'])
            ->whereNumber('report');
        Route::post('/financial-reports/{report}/discrepancies', [FinancialReportController::class, 'flagDiscrepancy'])
            ->whereNumber('report');
        Route::post('/businesses/{business}/disclosure/confirm-stage-4', [BusinessDisclosureController::class, 'confirmStageFour'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/nda/request', [BusinessNdaController::class, 'requestNda'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/nda/accept', [BusinessNdaController::class, 'acceptNda'])
            ->whereNumber('business');
        Route::post('/businesses/{business}/nda/decline', [BusinessNdaController::class, 'declineNda'])
            ->whereNumber('business');
    });
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/investor-preferences', [InvestorPreferenceController::class, 'show']);
    Route::get('/verification-requests/latest', [VerificationRequestController::class, 'latest']);
    Route::get('/verification-requests/{verification_request}', [VerificationRequestController::class, 'show'])->whereNumber('verification_request');
    Route::get('/verification-requests/{verification_request}/evidence', [VerificationEvidenceController::class, 'index'])->whereNumber('verification_request');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // Notification preferences
    Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show']);

    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::post('/avatar', [UserPhotoController::class, 'uploadAvatar']);
        Route::post('/cover-photo', [UserPhotoController::class, 'uploadCoverPhoto']);
        Route::post('/roles', [ParticipantRoleController::class, 'store']);
        Route::delete('/roles/{role}', [ParticipantRoleController::class, 'destroy']);
        Route::patch('/profiles/professional', [ProfessionalProfileController::class, 'update']);
        Route::patch('/investor-preferences', [InvestorPreferenceController::class, 'update']);
        Route::post('/phone/send-code', [PhoneVerificationController::class, 'sendCode'])->middleware('throttle:phone_verification');
        Route::post('/phone/verify-code', [PhoneVerificationController::class, 'verifyCode'])->middleware('throttle:phone_verification');
        Route::post('/verification-requests', [VerificationRequestController::class, 'store']);
        Route::post('/verification-requests/{verification_request}/evidence', [VerificationEvidenceController::class, 'store'])->whereNumber('verification_request');

        // Mark notifications as read (state-changing — require SPA session)
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

        // Authenticated password change
        Route::put('/password', [ChangePasswordController::class, 'update']);

        // Notification preferences update
        Route::patch('/notification-preferences', [NotificationPreferenceController::class, 'update']);
    });
});

Route::middleware('auth:sanctum')->get('/users/{user}/reputation', [ReputationController::class, 'showUser'])->whereNumber('user');

Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/verification-requests', [AdminVerificationRequestController::class, 'index']);
    Route::get('/verification-requests/{verification_request}', [AdminVerificationRequestController::class, 'show'])->whereNumber('verification_request');
    Route::get('/verification-requests/{verification_request}/evidence/{evidence}/download', [AdminVerificationRequestController::class, 'downloadEvidence'])
        ->whereNumber('verification_request')->whereNumber('evidence');
    Route::get('/reputation/users/{user}', [AdminReputationController::class, 'showUser'])->whereNumber('user');
    Route::get('/financial-reports', [AdminFinancialReportController::class, 'index']);
    Route::get('/financial-reports/{report}', [AdminFinancialReportController::class, 'show'])->whereNumber('report');
    Route::get('/financial-reports/{report}/evidence/{evidence}/download', [AdminFinancialReportController::class, 'downloadEvidence'])
        ->whereNumber('report')->whereNumber('evidence');
    Route::get('/financial-reports/{report}/audit-logs', [AdminFinancialReportController::class, 'auditLogs'])
        ->whereNumber('report');
    Route::get('/financial-governance', [AdminFinancialReportController::class, 'governanceOverview']);
    Route::get('/businesses', [AdminBusinessController::class, 'index']);
    Route::get('/businesses/{business}', [AdminBusinessController::class, 'show'])->whereNumber('business');
    Route::middleware(RequireSpaSession::class)->group(function () {
        Route::post('/businesses/{business}/approve', [AdminBusinessController::class, 'approve'])->whereNumber('business');
        Route::post('/businesses/{business}/reject', [AdminBusinessController::class, 'reject'])->whereNumber('business');
        Route::post('/verification-requests/{verification_request}/approve', [AdminVerificationRequestController::class, 'approve'])->whereNumber('verification_request');
        Route::post('/verification-requests/{verification_request}/reject', [AdminVerificationRequestController::class, 'reject'])->whereNumber('verification_request');
        Route::post('/verification-requests/{verification_request}/request-information', [AdminVerificationRequestController::class, 'requestInformation'])->whereNumber('verification_request');
        Route::post('/financial-reports/{report}/review', [AdminFinancialReportController::class, 'review'])->whereNumber('report');
        Route::post('/financial-discrepancies/{discrepancy}/resolve', [AdminFinancialReportController::class, 'resolveDiscrepancy'])->whereNumber('discrepancy');
    });
});
