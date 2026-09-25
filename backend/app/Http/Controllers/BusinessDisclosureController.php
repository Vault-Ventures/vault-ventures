<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Http\Resources\BusinessDocumentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessNda;
use App\Models\User;
use App\Services\Disclosure\DisclosureService;
use App\Services\Disclosure\StageFourService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BusinessDisclosureController extends Controller
{
    /**
     * Express interest in a business, transitioning disclosure from Stage 1 (Teaser) to Stage 2 (Extended Information).
     */
    public function expressInterest(Request $request, string $business, DisclosureService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner && ! in_array($businessModel->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business]);
        }

        $roleParam = $request->input('role') ?? $request->query('role');
        $relationship = $service->expressInterest($businessModel, $user, is_string($roleParam) ? $roleParam : null);

        return ApiResponse::success([
            'business_id' => $relationship->business_id,
            'counterparty_user_id' => $relationship->counterparty_user_id,
            'counterparty_role' => $relationship->counterparty_role?->value ?? (string) $relationship->counterparty_role,
            'stage' => $relationship->stage->value,
            'stage_label' => $relationship->stage->label(),
            'has_expressed_interest' => $relationship->interest_expressed_at !== null,
            'interest_expressed_at' => $relationship->interest_expressed_at?->toISOString(),
        ], 'Interest expressed successfully.');
    }

    /**
     * Get the authenticated user's active disclosure relationship and stage with a business.
     */
    public function status(Request $request, string $business, DisclosureService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner && ! in_array($businessModel->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business]);
        }

        $relationship = $service->getRelationship($businessModel, $user);

        if ($relationship !== null) {
            return ApiResponse::success([
                'business_id' => $businessModel->id,
                'counterparty_user_id' => $user->id,
                'counterparty_role' => $relationship->counterparty_role?->value ?? (string) $relationship->counterparty_role,
                'stage' => $relationship->stage->value,
                'stage_label' => $relationship->stage->label(),
                'has_expressed_interest' => $relationship->interest_expressed_at !== null,
                'interest_expressed_at' => $relationship->interest_expressed_at?->toISOString(),
            ]);
        }

        return ApiResponse::success([
            'business_id' => $businessModel->id,
            'counterparty_user_id' => $user->id,
            'counterparty_role' => null,
            'stage' => DisclosureStage::Teaser->value,
            'stage_label' => DisclosureStage::Teaser->label(),
            'has_expressed_interest' => false,
            'interest_expressed_at' => null,
        ]);
    }

    /**
     * Confirm Stage 4 (Full Proposal) disclosure access for a counterparty relationship.
     */
    public function confirmStageFour(Request $request, string $business, StageFourService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner) {
            if (! in_array($businessModel->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
                throw (new ModelNotFoundException)->setModel(Business::class, [$business]);
            }

            throw new HttpException(403, 'Only the business founder can confirm Stage 4 access.');
        }

        $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id');
        if ($targetId === null || trim((string) $targetId) === '') {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Target counterparty user ID is required.'],
            ]);
        }

        $counterparty = User::find($targetId);
        if ($counterparty === null) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Invalid counterparty user specified.'],
            ]);
        }

        $relationship = $service->confirmStageFour($businessModel, $user, $counterparty);

        return ApiResponse::success([
            'business_id' => $relationship->business_id,
            'counterparty_user_id' => $relationship->counterparty_user_id,
            'counterparty_role' => $relationship->counterparty_role?->value ?? (string) $relationship->counterparty_role,
            'stage' => $relationship->stage->value,
            'stage_label' => $relationship->stage->label(),
            'stage_4_confirmed_at' => $relationship->stage_4_confirmed_at?->toISOString(),
            'has_expressed_interest' => $relationship->interest_expressed_at !== null,
            'interest_expressed_at' => $relationship->interest_expressed_at?->toISOString(),
        ], 'Stage 4 confirmed successfully.');
    }

    /**
     * Get staged business disclosure data according to the authenticated participant's disclosure level.
     */
    public function showDisclosure(Request $request, string $business): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner && ! in_array($businessModel->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business]);
        }

        $relationship = null;
        $counterparty = null;
        $stage = DisclosureStage::Teaser;

        if ($isOwner) {
            $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id');
            if ($targetId !== null && trim((string) $targetId) !== '') {
                $targetUser = User::find($targetId);
                if ($targetUser === null || $targetUser->id === $user->id) {
                    throw ValidationException::withMessages([
                        'counterparty_user_id' => ['Invalid counterparty user specified.'],
                    ]);
                }

                $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
                    ->where('counterparty_user_id', $targetUser->id)
                    ->first();

                if ($relationship === null) {
                    throw new HttpException(404, 'No disclosure relationship found for this counterparty.');
                }

                $stage = $relationship->stage;
                $counterparty = $targetUser;
            } else {
                $stage = DisclosureStage::FullProposal;
                $counterparty = null;
            }
        } else {
            $hasInvestor = $user->hasRole(ParticipantRole::Investor);
            $hasProfessional = $user->hasRole(ParticipantRole::Professional);

            if (! $hasInvestor && ! $hasProfessional) {
                throw new HttpException(403, 'Only Investors, Skilled Professionals, or the business owner can access disclosure data.');
            }

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
            } elseif ($hasInvestor) {
                $roleParam = $request->input('role') ?? $request->query('role');
                if ($roleParam !== null && strtolower(trim((string) $roleParam)) !== 'investor') {
                    throw new HttpException(403, 'User does not possess the requested role.');
                }
            } else {
                $roleParam = $request->input('role') ?? $request->query('role');
                if ($roleParam !== null && strtolower(trim((string) $roleParam)) !== 'professional') {
                    throw new HttpException(403, 'User does not possess the requested role.');
                }
            }

            $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
                ->where('counterparty_user_id', $user->id)
                ->first();

            $stage = $relationship ? $relationship->stage : DisclosureStage::Teaser;
            $counterparty = $user;
        }

        if (! $isOwner || $counterparty !== null) {
            if ($stage === DisclosureStage::Nda || $stage === DisclosureStage::FullProposal) {
                $founderUser = $businessModel->founderProfile?->user;
                if ($founderUser === null || ! $founderUser->isIdentityVerified() || ! $counterparty->isIdentityVerified()) {
                    throw new HttpException(403, 'Tier 1 identity verification is required for Stage '.$stage->value.' access.');
                }

                $nda = BusinessNda::where('business_id', $businessModel->id)
                    ->where('counterparty_user_id', $counterparty->id)
                    ->first();

                if ($nda === null || $nda->status !== NdaStatus::Active) {
                    throw new HttpException(403, 'An active bilateral NDA is required for Stage '.$stage->value.' access.');
                }

                if ($stage === DisclosureStage::FullProposal && $relationship?->stage_4_confirmed_at === null) {
                    throw new HttpException(403, 'Stage 4 has not been confirmed by the founder.');
                }
            }
        }

        return ApiResponse::success(
            $this->formatDisclosureResponse($request, $businessModel, $stage, $relationship)
        );
    }

    /**
     * Format staged business disclosure data.
     */
    private function formatDisclosureResponse(
        Request $request,
        Business $business,
        DisclosureStage $stage,
        ?BusinessDisclosureRelationship $relationship
    ): array {
        $disclosure = [
            'stage' => $stage->value,
            'stage_label' => $stage->label(),
            'has_expressed_interest' => $relationship !== null && $relationship->interest_expressed_at !== null,
            'interest_expressed_at' => $relationship?->interest_expressed_at?->toISOString(),
            'stage_4_confirmed_at' => $relationship?->stage_4_confirmed_at?->toISOString(),
        ];

        $businessData = [
            'id' => $business->id,
            'name' => $business->name,
            'description' => $business->description,
            'industry' => $business->industry,
            'business_stage' => $business->business_stage,
            'location' => $business->location,
            'logo_url' => $business->logo_url,
            'cover_photo_url' => $business->cover_photo_url,
            'status' => $business->status->value,
            'founder_verification_tier' => $business->founderProfile?->user?->verification_tier instanceof VerificationTier
                ? $business->founderProfile->user->verification_tier->value
                : (int) ($business->founderProfile?->user?->verification_tier ?? 0),
        ];

        if ($stage->value >= DisclosureStage::Extended->value) {
            $businessData['risk_level'] = $business->risk_level;
            $businessData['expected_involvement'] = $business->expected_involvement;
        }

        if ($stage->value >= DisclosureStage::FullProposal->value) {
            $businessData['status'] = $business->status->value;
            $businessData['submitted_at'] = $business->submitted_at?->toISOString();
            $businessData['created_at'] = $business->created_at?->toISOString();
            $businessData['updated_at'] = $business->updated_at?->toISOString();
        }

        $requirementsData = null;
        if ($stage->value >= DisclosureStage::Extended->value) {
            $req = $business->requirements;
            if ($req !== null) {
                $requirementsData = [
                    'funding_amount' => $req->funding_amount,
                    'skills' => $req->skills->pluck('name')->all(),
                    'accepted_investment_types' => $req->accepted_investment_types ?? [],
                    'required_experience_level' => $req->required_experience_level,
                    'required_availability' => $req->required_availability,
                    'compensation_preferences' => $req->compensation_preferences ?? [],
                ];

                if ($stage->value >= DisclosureStage::Nda->value) {
                    $requirementsData['micro_proposed_terms'] = $req->micro_proposed_terms;
                    $requirementsData['large_standard_proposed_terms'] = $req->large_standard_proposed_terms;
                }
            }
        }

        $readinessData = null;
        $latestAssessment = $business->readinessAssessments()->orderByDesc('version')->first();
        if ($latestAssessment !== null) {
            $factorResults = [];
            if (is_array($latestAssessment->factor_results)) {
                foreach ($latestAssessment->factor_results as $key => $val) {
                    $factorResults[$key] = [
                        'name' => $val['name'] ?? null,
                        'score' => $val['score'] ?? null,
                        'weight' => $val['weight'] ?? null,
                        'weighted_contribution' => $val['weighted_contribution'] ?? null,
                        'is_weak' => $val['is_weak'] ?? null,
                        'is_incomplete' => $val['is_incomplete'] ?? null,
                    ];
                }
            }
            $readinessData = [
                'overall_score' => $latestAssessment->overall_score,
                'factor_results' => $factorResults,
                'weak_areas' => $latestAssessment->weak_areas,
                'suggestions' => $latestAssessment->suggestions,
                'evaluated_at' => $latestAssessment->evaluated_at?->toISOString(),
            ];
        }

        $documentsData = [];
        if ($stage === DisclosureStage::Nda) {
            $docs = $business->documents()->where('kind', 'pitch_deck')->orderBy('id')->get();
            $documentsData = BusinessDocumentResource::collection($docs)->resolve($request);
        } elseif ($stage === DisclosureStage::FullProposal) {
            $docs = $business->documents()->orderBy('id')->get();
            $documentsData = BusinessDocumentResource::collection($docs)->resolve($request);
        }

        return [
            'disclosure' => $disclosure,
            'business' => $businessData,
            'requirements' => $requirementsData,
            'readiness' => $readinessData,
            'documents' => $documentsData,
        ];
    }
}
