<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Services\Matching\CandidateRecommendationService;
use App\Services\Matching\MatchingCompletenessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function investorsForBusiness(
        Request $request,
        string $business,
        CandidateRecommendationService $service,
        MatchingCompletenessService $completenessService
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing('founderProfile');

        if (! $user->hasRole(ParticipantRole::Founder) || ! $user->founderProfile) {
            return ApiResponse::error('Forbidden. Founder role is required.', 'FORBIDDEN', 403);
        }

        $businessModel = Business::find($business);
        if (! $businessModel) {
            return ApiResponse::error('Business not found.', 'NOT_FOUND', 404);
        }

        if ($businessModel->founder_profile_id !== $user->founderProfile->id) {
            return ApiResponse::error('Forbidden. You do not own this business.', 'FORBIDDEN', 403);
        }

        $recommendations = $service->recommendInvestorsForBusiness($businessModel, $user);
        $completeness = $completenessService->evaluateBusinessForInvestor($businessModel);

        return ApiResponse::success($recommendations, 'Success.', 200, [
            'data_completeness' => $completeness,
        ]);
    }

    public function professionalsForBusiness(
        Request $request,
        string $business,
        CandidateRecommendationService $service,
        MatchingCompletenessService $completenessService
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing('founderProfile');

        if (! $user->hasRole(ParticipantRole::Founder) || ! $user->founderProfile) {
            return ApiResponse::error('Forbidden. Founder role is required.', 'FORBIDDEN', 403);
        }

        $businessModel = Business::find($business);
        if (! $businessModel) {
            return ApiResponse::error('Business not found.', 'NOT_FOUND', 404);
        }

        if ($businessModel->founder_profile_id !== $user->founderProfile->id) {
            return ApiResponse::error('Forbidden. You do not own this business.', 'FORBIDDEN', 403);
        }

        $recommendations = $service->recommendProfessionalsForBusiness($businessModel, $user);
        $completeness = $completenessService->evaluateBusinessForProfessional($businessModel);

        return ApiResponse::success($recommendations, 'Success.', 200, [
            'data_completeness' => $completeness,
        ]);
    }

    public function businesses(
        Request $request,
        CandidateRecommendationService $service,
        MatchingCompletenessService $completenessService
    ): JsonResponse {
        $user = $request->user();
        $user->loadMissing(['investorProfile.preferences', 'professionalProfile.skills']);
        $requestedRole = $request->query('role');

        $hasInvestor = $user->hasRole(ParticipantRole::Investor) && (bool) $user->investorProfile;
        $hasProfessional = $user->hasRole(ParticipantRole::Professional) && (bool) $user->professionalProfile;

        if (! $hasInvestor && ! $hasProfessional) {
            return ApiResponse::error('Forbidden. Investor or Professional role is required.', 'FORBIDDEN', 403);
        }

        if ($requestedRole === 'investor') {
            if (! $hasInvestor) {
                return ApiResponse::error('Forbidden. Investor role is required for investor recommendations.', 'FORBIDDEN', 403);
            }

            $recommendations = $service->recommendBusinessesForInvestor($user);
            $completeness = $completenessService->evaluateInvestor($user->investorProfile?->preferences);

            return ApiResponse::success($recommendations, 'Success.', 200, [
                'data_completeness' => $completeness,
            ]);
        }

        if ($requestedRole === 'professional') {
            if (! $hasProfessional) {
                return ApiResponse::error('Forbidden. Professional role is required for professional recommendations.', 'FORBIDDEN', 403);
            }

            $recommendations = $service->recommendBusinessesForProfessional($user);
            $completeness = $completenessService->evaluateProfessional($user->professionalProfile);

            return ApiResponse::success($recommendations, 'Success.', 200, [
                'data_completeness' => $completeness,
            ]);
        }

        // If no explicit role specified:
        if ($hasInvestor && ! $hasProfessional) {
            $recommendations = $service->recommendBusinessesForInvestor($user);
            $completeness = $completenessService->evaluateInvestor($user->investorProfile?->preferences);

            return ApiResponse::success($recommendations, 'Success.', 200, [
                'data_completeness' => $completeness,
            ]);
        }

        if ($hasProfessional && ! $hasInvestor) {
            $recommendations = $service->recommendBusinessesForProfessional($user);
            $completeness = $completenessService->evaluateProfessional($user->professionalProfile);

            return ApiResponse::success($recommendations, 'Success.', 200, [
                'data_completeness' => $completeness,
            ]);
        }

        // Default to investor when user holds both and no parameter is given
        $recommendations = $service->recommendBusinessesForInvestor($user);
        $completeness = $completenessService->evaluateInvestor($user->investorProfile?->preferences);

        return ApiResponse::success($recommendations, 'Success.', 200, [
            'data_completeness' => $completeness,
        ]);
    }
}
