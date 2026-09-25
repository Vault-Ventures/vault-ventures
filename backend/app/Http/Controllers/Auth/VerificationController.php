<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class VerificationController extends Controller
{
    public function verify(Request $request): JsonResponse|RedirectResponse
    {
        $user = User::find($request->route('id'));
        abort_unless($user instanceof User, 404, 'User not found.');

        abort_unless(
            hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification())),
            403,
            'Invalid verification link.'
        );

        if (! $user->hasVerifiedEmail()) {
            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
            }
        }

        if ($request->user() && (int) $request->user()->id === (int) $user->id) {
            $request->user()->email_verified_at = $user->email_verified_at;
        }

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
