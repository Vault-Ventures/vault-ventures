<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

final class VerificationController extends Controller
{
    public function verify(EmailVerificationRequest $request): JsonResponse|RedirectResponse
    {
        $request->fulfill();

        if (! $request->expectsJson()) {
            // cors.php validates this deployment-controlled origin. Never use a request redirect.
            $origin = config('cors.allowed_origins.0');
            abort_unless(is_string($origin) && $origin !== '', 503);
            return redirect()->away($origin.'/app/profile?tab=verification');
        }

        return ApiResponse::success(null, 'Email verified.');
    }

    public function resend(Request $request): JsonResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return ApiResponse::success(null, 'If verification is needed, a verification link will be sent.');
    }
}
