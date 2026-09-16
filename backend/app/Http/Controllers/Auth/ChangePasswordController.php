<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class ChangePasswordController extends Controller
{
    /**
     * Change the authenticated user's password.
     *
     * - Requires current_password to match.
     * - Hashes the new password.
     * - Invalidates all OTHER sessions (not the current one) to force re-auth on other devices.
     */
    public function update(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $currentSessionId = $request->session()->getId();

        DB::transaction(function () use ($user, $request, $currentSessionId) {
            $user->forceFill(['password' => $request->validated('new_password')])->save();

            // Invalidate all other sessions for this user
            DB::table('sessions')
                ->where('user_id', $user->id)
                ->where('id', '!=', $currentSessionId)
                ->delete();
        });

        return ApiResponse::success(null, 'Password changed successfully.');
    }
}
