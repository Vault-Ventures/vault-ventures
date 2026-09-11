<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\InvestorProfile;
use App\Models\ProfessionalProfile;
use App\Services\Matching\BusinessInvestorMatcher;
use App\Services\Matching\BusinessProfessionalMatcher;
use App\Services\Matching\MatchingCompletenessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchDetailController extends Controller
{
    /**
     * Show explainable match detail for authenticated user's own profile against a business.
     */
    public function showSelf(
        Request $request,
        string $business,
        BusinessInvestorMatcher $investorMatcher,
        BusinessProfessionalMatcher $professionalMatcher,
        MatchingCompletenessService $completenessService,
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing(['founderProfile', 'investorProfile.preferences', 'professionalProfile.skills']);

        $hasInvestor = $user->hasRole(ParticipantRole::Investor) && (bool) $user->investorProfile;
        $hasProfessional = $user->hasRole(ParticipantRole::Professional) && (bool) $user->professionalProfile;

        if (! $hasInvestor && ! $hasProfessional) {
            return ApiResponse::error('Forbidden. Investor or Professional role is required.', 'FORBIDDEN', 403);
        }

        $roleParam = $request->query('role');
        if ($roleParam !== null) {
            $roleParam = strtolower(trim((string) $roleParam));
            if (! in_array($roleParam, ['investor', 'professional'], true)) {
                return ApiResponse::error('Invalid role specified. Supported roles are investor or professional.', 'UNPROCESSABLE_ENTITY', 422);
            }
        }

        // Multi-role resolution
        $resolvedRole = null;
        if ($hasInvestor && $hasProfessional) {
            if ($roleParam === null || $roleParam === '') {
                return ApiResponse::error('The role parameter is required for multi-role users. Specify role=investor or role=professional.', 'UNPROCESSABLE_ENTITY', 422);
            }
            $resolvedRole = $roleParam;
        } elseif ($hasInvestor) {
            if ($roleParam === 'professional') {
                return ApiResponse::error('Forbidden. You do not have the professional role or profile.', 'FORBIDDEN', 403);
            }
            $resolvedRole = 'investor';
        } elseif ($hasProfessional) {
            if ($roleParam === 'investor') {
                return ApiResponse::error('Forbidden. You do not have the investor role or profile.', 'FORBIDDEN', 403);
            }
            $resolvedRole = 'professional';
        }

        $businessModel = Business::with(['requirements.skills'])->find($business);
        if (! $businessModel) {
            return ApiResponse::error('Business not found or not published.', 'NOT_FOUND', 404);
        }

        $isOwner = $user->hasRole(ParticipantRole::Founder)
            && $businessModel->founder_profile_id === $user->founderProfile?->id;

        // Draft protection for non-owners
        if (! $isOwner && $businessModel->status !== BusinessStatus::Submitted) {
            return ApiResponse::error('Business not found or not published.', 'NOT_FOUND', 404);
        }

        if ($resolvedRole === 'investor') {
            $investorModel = $user->investorProfile;
            $matchResult = $investorMatcher->match(
                $businessModel,
                $investorModel->preferences ?? [],
                $businessModel->requirements
            );
            $completeness = $completenessService->evaluateInvestor($investorModel->preferences);

            return ApiResponse::success([
                'role' => 'investor',
                'business' => [
                    'id' => $businessModel->id,
                    'name' => $businessModel->name,
                    'description' => $businessModel->description,
                    'industry' => $businessModel->industry,
                    'business_stage' => $businessModel->business_stage,
                    'risk_level' => $businessModel->risk_level,
                    'expected_involvement' => $businessModel->expected_involvement,
                    'location' => $businessModel->location,
                    'funding_amount' => $businessModel->requirements?->funding_amount,
                    'accepted_investment_types' => $businessModel->requirements?->accepted_investment_types ?? [],
                ],
                'investor' => [
                    'id' => $investorModel->id,
                    'user_id' => $investorModel->user_id,
                    'name' => $user->name,
                    'verification_tier' => $user->verification_tier instanceof VerificationTier
                        ? $user->verification_tier->value
                        : (int) ($user->verification_tier ?? 0),
                    'verification_tier_label' => $user->verification_tier instanceof VerificationTier
                        ? $user->verification_tier->label()
                        : (VerificationTier::tryFrom((int) ($user->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                    'industry' => $investorModel->preferences?->industry,
                    'location' => $investorModel->preferences?->location,
                    'risk_level' => $investorModel->preferences?->risk_level,
                    'business_stage' => $investorModel->preferences?->business_stage,
                    'investment_types' => $investorModel->preferences?->investment_types ?? [],
                    'available_investment' => $investorModel->preferences?->available_investment,
                    'minimum_investment' => $investorModel->preferences?->minimum_investment,
                    'maximum_investment' => $investorModel->preferences?->maximum_investment,
                    'involvement' => $investorModel->preferences?->involvement,
                ],
                'match' => $matchResult->toArray(),
            ], 'Success.', 200, [
                'data_completeness' => $completeness,
            ]);
        }

        // resolvedRole === 'professional'
        $professionalModel = $user->professionalProfile;
        $matchResult = $professionalMatcher->match(
            $businessModel,
            $professionalModel,
            $businessModel->requirements
        );
        $completeness = $completenessService->evaluateProfessional($professionalModel);

        return ApiResponse::success([
            'role' => 'professional',
            'business' => [
                'id' => $businessModel->id,
                'name' => $businessModel->name,
                'description' => $businessModel->description,
                'industry' => $businessModel->industry,
                'business_stage' => $businessModel->business_stage,
                'risk_level' => $businessModel->risk_level,
                'expected_involvement' => $businessModel->expected_involvement,
                'location' => $businessModel->location,
                'funding_amount' => $businessModel->requirements?->funding_amount,
                'required_experience_level' => $businessModel->requirements?->required_experience_level,
                'required_availability' => $businessModel->requirements?->required_availability,
                'compensation_preferences' => $businessModel->requirements?->compensation_preferences ?? [],
                'skills' => $businessModel->requirements?->skills->pluck('name')->values()->all() ?? [],
            ],
            'professional' => [
                'id' => $professionalModel->id,
                'user_id' => $professionalModel->user_id,
                'name' => $user->name,
                'verification_tier' => $user->verification_tier instanceof VerificationTier
                    ? $user->verification_tier->value
                    : (int) ($user->verification_tier ?? 0),
                'verification_tier_label' => $user->verification_tier instanceof VerificationTier
                    ? $user->verification_tier->label()
                    : (VerificationTier::tryFrom((int) ($user->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                'industry_experience' => $professionalModel->industry_experience ?? [],
                'experience_level' => $professionalModel->experience_level,
                'availability' => $professionalModel->availability,
                'location' => $professionalModel->location,
                'compensation_preferences' => $professionalModel->compensation_preferences ?? [],
                'skills' => $professionalModel->skills->pluck('name')->values()->all(),
            ],
            'match' => $matchResult->toArray(),
        ], 'Success.', 200, [
            'data_completeness' => $completeness,
        ]);
    }

    public function showBusinessInvestor(
        Request $request,
        string $business,
        string $investor,
        BusinessInvestorMatcher $matcher
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing(['founderProfile', 'investorProfile']);

        $businessModel = Business::with(['requirements'])->findOrFail($business);
        $investorModel = InvestorProfile::with(['user', 'preferences'])->findOrFail($investor);

        $isFounderOwner = $user->hasRole(ParticipantRole::Founder)
            && $businessModel->founder_profile_id === $user->founderProfile?->id;

        $isInvestorTarget = $user->hasRole(ParticipantRole::Investor)
            && $investorModel->user_id === $user->id;

        if (! $isFounderOwner && ! $isInvestorTarget) {
            return ApiResponse::error('Forbidden. You do not have permission to view this match detail.', 'FORBIDDEN', 403);
        }

        // If the requesting user is the investor, the business must be submitted (unless they also own it)
        if ($isInvestorTarget && ! $isFounderOwner && $businessModel->status !== BusinessStatus::Submitted) {
            return ApiResponse::error('Business not found or not published.', 'NOT_FOUND', 404);
        }

        $matchResult = $matcher->match(
            $businessModel,
            $investorModel->preferences ?? [],
            $businessModel->requirements
        );

        return ApiResponse::success([
            'business' => [
                'id' => $businessModel->id,
                'name' => $businessModel->name,
                'description' => $businessModel->description,
                'industry' => $businessModel->industry,
                'business_stage' => $businessModel->business_stage,
                'risk_level' => $businessModel->risk_level,
                'expected_involvement' => $businessModel->expected_involvement,
                'location' => $businessModel->location,
                'funding_amount' => $businessModel->requirements?->funding_amount,
                'accepted_investment_types' => $businessModel->requirements?->accepted_investment_types ?? [],
            ],
            'investor' => [
                'id' => $investorModel->id,
                'user_id' => $investorModel->user_id,
                'name' => $investorModel->user?->name,
                'verification_tier' => $investorModel->user?->verification_tier instanceof VerificationTier
                    ? $investorModel->user->verification_tier->value
                    : (int) ($investorModel->user?->verification_tier ?? 0),
                'verification_tier_label' => $investorModel->user?->verification_tier instanceof VerificationTier
                    ? $investorModel->user->verification_tier->label()
                    : (VerificationTier::tryFrom((int) ($investorModel->user?->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                'industry' => $investorModel->preferences?->industry,
                'location' => $investorModel->preferences?->location,
                'risk_level' => $investorModel->preferences?->risk_level,
                'business_stage' => $investorModel->preferences?->business_stage,
                'investment_types' => $investorModel->preferences?->investment_types ?? [],
                'available_investment' => $investorModel->preferences?->available_investment,
                'minimum_investment' => $investorModel->preferences?->minimum_investment,
                'maximum_investment' => $investorModel->preferences?->maximum_investment,
                'involvement' => $investorModel->preferences?->involvement,
            ],
            'match' => $matchResult->toArray(),
        ]);
    }

    public function showBusinessProfessional(
        Request $request,
        string $business,
        string $professional,
        BusinessProfessionalMatcher $matcher
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing(['founderProfile', 'professionalProfile']);

        $businessModel = Business::with(['requirements.skills'])->findOrFail($business);
        $professionalModel = ProfessionalProfile::with(['user', 'skills'])->findOrFail($professional);

        $isFounderOwner = $user->hasRole(ParticipantRole::Founder)
            && $businessModel->founder_profile_id === $user->founderProfile?->id;

        $isProfessionalTarget = $user->hasRole(ParticipantRole::Professional)
            && $professionalModel->user_id === $user->id;

        if (! $isFounderOwner && ! $isProfessionalTarget) {
            return ApiResponse::error('Forbidden. You do not have permission to view this match detail.', 'FORBIDDEN', 403);
        }

        // If the requesting user is the professional, the business must be submitted (unless they also own it)
        if ($isProfessionalTarget && ! $isFounderOwner && $businessModel->status !== BusinessStatus::Submitted) {
            return ApiResponse::error('Business not found or not published.', 'NOT_FOUND', 404);
        }

        $matchResult = $matcher->match(
            $businessModel,
            $professionalModel,
            $businessModel->requirements
        );

        return ApiResponse::success([
            'business' => [
                'id' => $businessModel->id,
                'name' => $businessModel->name,
                'description' => $businessModel->description,
                'industry' => $businessModel->industry,
                'business_stage' => $businessModel->business_stage,
                'risk_level' => $businessModel->risk_level,
                'expected_involvement' => $businessModel->expected_involvement,
                'location' => $businessModel->location,
                'funding_amount' => $businessModel->requirements?->funding_amount,
                'required_experience_level' => $businessModel->requirements?->required_experience_level,
                'required_availability' => $businessModel->requirements?->required_availability,
                'compensation_preferences' => $businessModel->requirements?->compensation_preferences ?? [],
                'skills' => $businessModel->requirements?->skills->pluck('name')->values()->all() ?? [],
            ],
            'professional' => [
                'id' => $professionalModel->id,
                'user_id' => $professionalModel->user_id,
                'name' => $professionalModel->user?->name,
                'verification_tier' => $professionalModel->user?->verification_tier instanceof VerificationTier
                    ? $professionalModel->user->verification_tier->value
                    : (int) ($professionalModel->user?->verification_tier ?? 0),
                'verification_tier_label' => $professionalModel->user?->verification_tier instanceof VerificationTier
                    ? $professionalModel->user->verification_tier->label()
                    : (VerificationTier::tryFrom((int) ($professionalModel->user?->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                'industry_experience' => $professionalModel->industry_experience ?? [],
                'experience_level' => $professionalModel->experience_level,
                'availability' => $professionalModel->availability,
                'location' => $professionalModel->location,
                'compensation_preferences' => $professionalModel->compensation_preferences ?? [],
                'skills' => $professionalModel->skills->pluck('name')->values()->all(),
            ],
            'match' => $matchResult->toArray(),
        ]);
    }
}
