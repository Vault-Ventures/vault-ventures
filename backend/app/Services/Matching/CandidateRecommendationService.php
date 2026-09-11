<?php

namespace App\Services\Matching;

use App\Enums\BusinessStatus;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\InvestorProfile;
use App\Models\ProfessionalProfile;
use App\Models\User;

class CandidateRecommendationService
{
    public function __construct(
        private readonly BusinessInvestorMatcher $investorMatcher,
        private readonly BusinessProfessionalMatcher $professionalMatcher,
    ) {}

    /**
     * Recommend top 10 investors for a given business.
     *
     * Candidates must be verified (Tier 1+).
     *
     * @return array<int, array<string, mixed>>
     */
    public function recommendInvestorsForBusiness(Business $business, ?User $excludeUser = null, int $limit = 10): array
    {
        $business->loadMissing(['requirements']);

        $query = InvestorProfile::with(['user', 'preferences'])
            ->whereHas('user', fn ($q) => $q->where('verification_tier', '>=', 1));

        if ($excludeUser) {
            $query->where('user_id', '!=', $excludeUser->id);
        }

        $investors = $query->get();
        $results = [];

        foreach ($investors as $investor) {
            $matchResult = $this->investorMatcher->match(
                $business,
                $investor->preferences ?? [],
                $business->requirements
            );

            $results[] = [
                'id' => $investor->id,
                'user_id' => $investor->user_id,
                'name' => $investor->user?->name,
                'verification_tier' => $investor->user?->verification_tier instanceof VerificationTier
                    ? $investor->user->verification_tier->value
                    : (int) ($investor->user?->verification_tier ?? 0),
                'verification_tier_label' => $investor->user?->verification_tier instanceof VerificationTier
                    ? $investor->user->verification_tier->label()
                    : (VerificationTier::tryFrom((int) ($investor->user?->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                'industry' => $investor->preferences?->industry,
                'location' => $investor->preferences?->location,
                'risk_level' => $investor->preferences?->risk_level,
                'business_stage' => $investor->preferences?->business_stage,
                'investment_types' => $investor->preferences?->investment_types ?? [],
                'available_investment' => $investor->preferences?->available_investment,
                'minimum_investment' => $investor->preferences?->minimum_investment,
                'maximum_investment' => $investor->preferences?->maximum_investment,
                'involvement' => $investor->preferences?->involvement,
                'match' => $matchResult->toArray(),
                'overall_score' => $matchResult->overallScore,
            ];
        }

        usort($results, function (array $a, array $b) {
            if ($a['overall_score'] === $b['overall_score']) {
                return $a['id'] <=> $b['id'];
            }

            return $b['overall_score'] <=> $a['overall_score'];
        });

        // Strip the sorting helper key 'overall_score' if already in 'match.overall_score'
        $top = array_slice($results, 0, $limit);
        foreach ($top as &$item) {
            unset($item['overall_score']);
        }

        return $top;
    }

    /**
     * Recommend top 10 professionals for a given business.
     *
     * Candidates must be verified (Tier 1+).
     *
     * @return array<int, array<string, mixed>>
     */
    public function recommendProfessionalsForBusiness(Business $business, ?User $excludeUser = null, int $limit = 10): array
    {
        $business->loadMissing(['requirements.skills']);

        $query = ProfessionalProfile::with(['user', 'skills'])
            ->whereHas('user', fn ($q) => $q->where('verification_tier', '>=', 1));

        if ($excludeUser) {
            $query->where('user_id', '!=', $excludeUser->id);
        }

        $professionals = $query->get();
        $results = [];

        foreach ($professionals as $prof) {
            $matchResult = $this->professionalMatcher->match(
                $business,
                $prof,
                $business->requirements
            );

            $results[] = [
                'id' => $prof->id,
                'user_id' => $prof->user_id,
                'name' => $prof->user?->name,
                'verification_tier' => $prof->user?->verification_tier instanceof VerificationTier
                    ? $prof->user->verification_tier->value
                    : (int) ($prof->user?->verification_tier ?? 0),
                'verification_tier_label' => $prof->user?->verification_tier instanceof VerificationTier
                    ? $prof->user->verification_tier->label()
                    : (VerificationTier::tryFrom((int) ($prof->user?->verification_tier ?? 0))?->label() ?? 'Tier 0'),
                'industry_experience' => $prof->industry_experience ?? [],
                'experience_level' => $prof->experience_level,
                'availability' => $prof->availability,
                'location' => $prof->location,
                'compensation_preferences' => $prof->compensation_preferences ?? [],
                'skills' => $prof->skills->pluck('name')->values()->all(),
                'match' => $matchResult->toArray(),
                'overall_score' => $matchResult->overallScore,
            ];
        }

        usort($results, function (array $a, array $b) {
            if ($a['overall_score'] === $b['overall_score']) {
                return $a['id'] <=> $b['id'];
            }

            return $b['overall_score'] <=> $a['overall_score'];
        });

        $top = array_slice($results, 0, $limit);
        foreach ($top as &$item) {
            unset($item['overall_score']);
        }

        return $top;
    }

    /**
     * Recommend top 10 published businesses seeking investment for an investor.
     *
     * Only published businesses seeking funding (funding_amount > 0) with Tier 1+ founders are recommended.
     *
     * @return array<int, array<string, mixed>>
     */
    public function recommendBusinessesForInvestor(User $user, int $limit = 10): array
    {
        $user->loadMissing(['investorProfile.preferences', 'founderProfile']);

        $investorPreference = $user->investorProfile?->preferences;
        $excludedFounderProfileId = $user->founderProfile?->id;

        $query = Business::where('status', BusinessStatus::Submitted->value)
            ->whereHas('founderProfile.user', fn ($q) => $q->where('verification_tier', '>=', 1))
            ->whereHas('requirements', fn ($q) => $q->whereNotNull('funding_amount')->where('funding_amount', '>', 0))
            ->with(['requirements.skills']);

        if ($excludedFounderProfileId) {
            $query->where('founder_profile_id', '!=', $excludedFounderProfileId);
        }

        $businesses = $query->get();
        $results = [];

        foreach ($businesses as $business) {
            $matchResult = $this->investorMatcher->match(
                $business,
                $investorPreference ?? [],
                $business->requirements
            );

            $results[] = [
                'id' => $business->id,
                'name' => $business->name,
                'description' => $business->description,
                'industry' => $business->industry,
                'business_stage' => $business->business_stage,
                'risk_level' => $business->risk_level,
                'expected_involvement' => $business->expected_involvement,
                'location' => $business->location,
                'funding_amount' => $business->requirements?->funding_amount,
                'accepted_investment_types' => $business->requirements?->accepted_investment_types ?? [],
                'match' => $matchResult->toArray(),
                'overall_score' => $matchResult->overallScore,
            ];
        }

        usort($results, function (array $a, array $b) {
            if ($a['overall_score'] === $b['overall_score']) {
                return $a['id'] <=> $b['id'];
            }

            return $b['overall_score'] <=> $a['overall_score'];
        });

        $top = array_slice($results, 0, $limit);
        foreach ($top as &$item) {
            unset($item['overall_score']);
        }

        return $top;
    }

    /**
     * Recommend top 10 published businesses seeking professionals for a professional.
     *
     * Only published businesses seeking professional roles/skills with Tier 1+ founders are recommended.
     *
     * @return array<int, array<string, mixed>>
     */
    public function recommendBusinessesForProfessional(User $user, int $limit = 10): array
    {
        $user->loadMissing(['professionalProfile.skills', 'founderProfile']);

        $professionalProfile = $user->professionalProfile;
        $excludedFounderProfileId = $user->founderProfile?->id;

        $query = Business::where('status', BusinessStatus::Submitted->value)
            ->whereHas('founderProfile.user', fn ($q) => $q->where('verification_tier', '>=', 1))
            ->whereHas('requirements', function ($q) {
                $q->where(function ($sub) {
                    $sub->whereHas('skills')
                        ->orWhereNotNull('required_experience_level')
                        ->orWhereNotNull('required_availability');
                });
            })
            ->with(['requirements.skills']);

        if ($excludedFounderProfileId) {
            $query->where('founder_profile_id', '!=', $excludedFounderProfileId);
        }

        $businesses = $query->get();
        $results = [];

        foreach ($businesses as $business) {
            $matchResult = $this->professionalMatcher->match(
                $business,
                $professionalProfile ?? [],
                $business->requirements
            );

            $results[] = [
                'id' => $business->id,
                'name' => $business->name,
                'description' => $business->description,
                'industry' => $business->industry,
                'business_stage' => $business->business_stage,
                'risk_level' => $business->risk_level,
                'expected_involvement' => $business->expected_involvement,
                'location' => $business->location,
                'funding_amount' => $business->requirements?->funding_amount,
                'required_experience_level' => $business->requirements?->required_experience_level,
                'required_availability' => $business->requirements?->required_availability,
                'compensation_preferences' => $business->requirements?->compensation_preferences ?? [],
                'skills' => $business->requirements?->skills->pluck('name')->values()->all() ?? [],
                'match' => $matchResult->toArray(),
                'overall_score' => $matchResult->overallScore,
            ];
        }

        usort($results, function (array $a, array $b) {
            if ($a['overall_score'] === $b['overall_score']) {
                return $a['id'] <=> $b['id'];
            }

            return $b['overall_score'] <=> $a['overall_score'];
        });

        $top = array_slice($results, 0, $limit);
        foreach ($top as &$item) {
            unset($item['overall_score']);
        }

        return $top;
    }
}
