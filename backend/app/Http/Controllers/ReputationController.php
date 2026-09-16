<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use App\Services\Reputation\ReputationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReputationController extends Controller
{
    public function __construct(
        protected ReputationService $reputationService
    ) {}

    /**
     * Get the authenticated user's reputation summary.
     *
     * @throws ValidationException
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $roleParam = $request->query('role');

        if ($roleParam !== null && trim($roleParam) !== '') {
            $roleEnum = ParticipantRole::tryFrom(trim($roleParam));
            if ($roleEnum === null) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role specified.'],
                ]);
            }

            $summary = $this->reputationService->getReputationSummary($user, $roleEnum);

            return ApiResponse::success($summary, 'Reputation summary retrieved successfully.');
        }

        // Return summaries for all roles assigned to the user
        $activeRoles = $user->roles()->pluck('role')->all();
        $summaries = [];

        foreach ($activeRoles as $roleItem) {
            $roleEnum = $roleItem instanceof ParticipantRole ? $roleItem : ParticipantRole::tryFrom((string) $roleItem);
            if ($roleEnum !== null) {
                $summaries[$roleEnum->value] = $this->reputationService->getReputationSummary($user, $roleEnum);
            }
        }

        // If user has only one role, unwrap for convenience while keeping consistent structure
        if (count($summaries) === 1) {
            return ApiResponse::success(reset($summaries), 'Reputation summary retrieved successfully.');
        }

        return ApiResponse::success($summaries, 'Reputation summaries retrieved successfully.');
    }

    /**
     * Get a public / counterparty reputation summary for a specific user.
     *
     * @throws ValidationException
     */
    public function showUser(Request $request, User $user): JsonResponse
    {
        $roleParam = $request->query('role');
        if ($roleParam === null || trim($roleParam) === '') {
            throw ValidationException::withMessages([
                'role' => ['The role query parameter is required when viewing another user\'s reputation.'],
            ]);
        }

        $roleEnum = ParticipantRole::tryFrom(trim($roleParam));
        if ($roleEnum === null) {
            throw ValidationException::withMessages([
                'role' => ['Invalid role specified.'],
            ]);
        }

        $summary = $this->reputationService->getReputationSummary($user, $roleEnum);

        return ApiResponse::success($summary, 'User reputation retrieved successfully.');
    }
}
