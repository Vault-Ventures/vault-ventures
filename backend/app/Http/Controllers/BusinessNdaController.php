<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessNda;
use App\Models\User;
use App\Services\Disclosure\NdaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BusinessNdaController extends Controller
{
    /**
     * Get the authenticated user's NDA status for a business relationship.
     */
    public function show(Request $request, string $business, NdaService $ndaService): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAccess($businessModel, $user);

        $isOwner = $this->isBusinessOwner($businessModel, $user);
        $targetCounterparty = $this->resolveTargetCounterparty($request, $businessModel, $user, $isOwner, false);

        $nda = $ndaService->getNda($businessModel, $user, $targetCounterparty);

        $counterpartyUserId = $isOwner ? $targetCounterparty?->id : $user->id;
        $relationship = $counterpartyUserId !== null
            ? BusinessDisclosureRelationship::where('business_id', $businessModel->id)
                ->where('counterparty_user_id', $counterpartyUserId)
                ->first()
            : null;

        return ApiResponse::success(
            $this->formatNdaResponse($businessModel, $user, $nda, $relationship, $isOwner, $targetCounterparty)
        );
    }

    /**
     * Request an NDA for a Stage 2 relationship.
     */
    public function requestNda(Request $request, string $business, NdaService $ndaService): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAccess($businessModel, $user);

        $isOwner = $this->isBusinessOwner($businessModel, $user);
        $targetCounterparty = $this->resolveTargetCounterparty($request, $businessModel, $user, $isOwner, true);

        if (! $isOwner) {
            $this->validateMultiRoleUser($request, $user);
        }

        $nda = $ndaService->requestNda($businessModel, $user, $targetCounterparty);

        $counterpartyUserId = $isOwner ? $targetCounterparty->id : $user->id;
        $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
            ->where('counterparty_user_id', $counterpartyUserId)
            ->first();

        return ApiResponse::success(
            $this->formatNdaResponse($businessModel, $user, $nda, $relationship, $isOwner, $targetCounterparty),
            'NDA requested successfully.'
        );
    }

    /**
     * Accept a pending NDA.
     */
    public function acceptNda(Request $request, string $business, NdaService $ndaService): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAccess($businessModel, $user);

        $isOwner = $this->isBusinessOwner($businessModel, $user);
        $targetCounterparty = $this->resolveTargetCounterparty($request, $businessModel, $user, $isOwner, true);

        $nda = $ndaService->acceptNda($businessModel, $user, $targetCounterparty);

        $counterpartyUserId = $isOwner ? $targetCounterparty->id : $user->id;
        $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
            ->where('counterparty_user_id', $counterpartyUserId)
            ->first();

        return ApiResponse::success(
            $this->formatNdaResponse($businessModel, $user, $nda, $relationship, $isOwner, $targetCounterparty),
            'NDA accepted successfully.'
        );
    }

    /**
     * Decline a pending NDA.
     */
    public function declineNda(Request $request, string $business, NdaService $ndaService): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAccess($businessModel, $user);

        $isOwner = $this->isBusinessOwner($businessModel, $user);
        $targetCounterparty = $this->resolveTargetCounterparty($request, $businessModel, $user, $isOwner, true);

        $nda = $ndaService->declineNda($businessModel, $user, $targetCounterparty);

        $counterpartyUserId = $isOwner ? $targetCounterparty->id : $user->id;
        $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
            ->where('counterparty_user_id', $counterpartyUserId)
            ->first();

        return ApiResponse::success(
            $this->formatNdaResponse($businessModel, $user, $nda, $relationship, $isOwner, $targetCounterparty),
            'NDA declined successfully.'
        );
    }

    /**
     * Enforce draft business protection for non-owners.
     *
     * @throws ModelNotFoundException
     */
    private function enforceBusinessAccess(Business $business, User $user): void
    {
        $isOwner = $this->isBusinessOwner($business, $user);
        if (! $isOwner && ! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }
    }

    /**
     * Check if user is the founder owner.
     */
    private function isBusinessOwner(Business $business, User $user): bool
    {
        return $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
    }

    /**
     * Resolve target counterparty user for founder requests.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function resolveTargetCounterparty(
        Request $request,
        Business $business,
        User $user,
        bool $isOwner,
        bool $requiredForOwner = true
    ): ?User {
        if (! $isOwner) {
            return null;
        }

        $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id');

        if ($targetId === null || trim((string) $targetId) === '') {
            if ($requiredForOwner) {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Target counterparty user ID is required for founder requests.'],
                ]);
            }

            return null;
        }

        $counterparty = User::find($targetId);
        if ($counterparty === null || $counterparty->id === $user->id) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Invalid counterparty user specified.'],
            ]);
        }

        return $counterparty;
    }

    /**
     * Validate role parameter for multi-role users.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function validateMultiRoleUser(Request $request, User $user): void
    {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if ($hasInvestor && $hasProfessional) {
            $roleParam = $request->input('role') ?? $request->query('role');
            if ($roleParam === null || trim((string) $roleParam) === '') {
                throw ValidationException::withMessages([
                    'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
                ]);
            }

            $normalized = strtolower(trim((string) $roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }
        }
    }

    /**
     * Format deterministic and safe NDA status response.
     */
    private function formatNdaResponse(
        Business $business,
        User $currentUser,
        ?BusinessNda $nda,
        ?BusinessDisclosureRelationship $relationship,
        bool $isOwner,
        ?User $targetCounterparty
    ): array {
        $currentStage = $relationship ? $relationship->stage->value : DisclosureStage::Teaser->value;
        $currentStageLabel = $relationship ? $relationship->stage->label() : DisclosureStage::Teaser->label();

        if ($nda !== null) {
            return [
                'business_id' => $business->id,
                'counterparty_role' => $nda->counterparty_role?->value ?? (string) $nda->counterparty_role,
                'status' => $nda->status->value,
                'status_label' => $nda->status->label(),
                'nda_version' => $nda->nda_version,
                'agreement_hash' => $nda->agreement_hash,
                'current_stage' => $currentStage,
                'current_stage_label' => $currentStageLabel,
                'stage_3_unlocked' => $nda->status === NdaStatus::Active,
                'current_user_accepted' => $isOwner ? ($nda->founder_accepted_at !== null) : ($nda->counterparty_accepted_at !== null),
                'founder_accepted' => $nda->founder_accepted_at !== null,
                'counterparty_accepted' => $nda->counterparty_accepted_at !== null,
                'requested_at' => $nda->requested_at?->toISOString(),
                'activated_at' => $nda->activated_at?->toISOString(),
                'declined_at' => $nda->declined_at?->toISOString(),
            ];
        }

        return [
            'business_id' => $business->id,
            'counterparty_role' => $relationship?->counterparty_role?->value ?? (string) $relationship?->counterparty_role,
            'status' => null,
            'status_label' => 'Not Requested',
            'nda_version' => NdaService::DEFAULT_NDA_VERSION,
            'agreement_hash' => NdaService::DEFAULT_AGREEMENT_HASH,
            'current_stage' => $currentStage,
            'current_stage_label' => $currentStageLabel,
            'stage_3_unlocked' => false,
            'current_user_accepted' => false,
            'founder_accepted' => false,
            'counterparty_accepted' => false,
            'requested_at' => null,
            'activated_at' => null,
            'declined_at' => null,
        ];
    }
}
