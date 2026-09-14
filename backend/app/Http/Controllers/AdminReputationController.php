<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Models\User;
use App\Services\Reputation\ReputationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReputationController extends Controller
{
    public function __construct(
        protected ReputationService $reputationService
    ) {}

    /**
     * Audit reputation records for any user across all their active roles.
     */
    public function showUser(Request $request, User $user): JsonResponse
    {
        if (! $request->user()->hasAdminAccess()) {
            abort(403, 'Unauthorized. Admin access required.');
        }

        $activeRoles = $user->roles()->pluck('role')->all();
        $summaries = [];

        foreach ($activeRoles as $roleItem) {
            $roleEnum = $roleItem instanceof ParticipantRole ? $roleItem : ParticipantRole::tryFrom((string) $roleItem);
            if ($roleEnum !== null) {
                $summaries[$roleEnum->value] = $this->reputationService->getReputationSummary($user, $roleEnum);
            }
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'verification_tier' => $user->verification_tier?->value ?? (int) $user->verification_tier,
                    'roles' => $activeRoles,
                ],
                'reputation_by_role' => $summaries,
            ],
        ]);
    }
}
