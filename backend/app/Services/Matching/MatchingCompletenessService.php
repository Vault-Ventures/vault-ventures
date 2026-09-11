<?php

namespace App\Services\Matching;

use App\Models\Business;
use App\Models\BusinessRequirement;
use App\Models\InvestorPreference;
use App\Models\ProfessionalProfile;

final class MatchingCompletenessService
{
    /**
     * Evaluate matching data completeness for an investor based strictly on inputs read by BusinessInvestorMatcher.
     *
     * @return array{is_complete: bool, missing_fields: array<int, string>, guidance_messages: array<int, string>}
     */
    public function evaluateInvestor(InvestorPreference|array|null $preference): array
    {
        $data = $this->normalizeInvestorData($preference);

        $missing = [];
        $guidance = [];

        if ($this->isEmptyString($data['industry'])) {
            $missing[] = 'industry';
            $guidance[] = 'Set your preferred industry to improve match accuracy.';
        }

        if ($data['minimum_investment'] === null && $data['maximum_investment'] === null && $data['available_investment'] === null) {
            $missing[] = 'investment_range';
            $guidance[] = 'Configure your investment range or available capital to improve match accuracy.';
        }

        if ($this->isEmptyString($data['business_stage'])) {
            $missing[] = 'business_stage';
            $guidance[] = 'Specify your preferred business stage to improve match accuracy.';
        }

        if ($this->isEmptyString($data['risk_level'])) {
            $missing[] = 'risk_level';
            $guidance[] = 'Set your risk tolerance to improve match accuracy.';
        }

        if ($this->isEmptyString($data['location'])) {
            $missing[] = 'location';
            $guidance[] = 'Specify your preferred location to improve match accuracy.';
        }

        if ($this->isEmptyString($data['involvement'])) {
            $missing[] = 'involvement';
            $guidance[] = 'Specify your expected involvement level to improve match accuracy.';
        }

        return [
            'is_complete' => empty($missing),
            'missing_fields' => $missing,
            'guidance_messages' => $guidance,
        ];
    }

    /**
     * Evaluate matching data completeness for a professional based strictly on inputs read by BusinessProfessionalMatcher.
     *
     * @return array{is_complete: bool, missing_fields: array<int, string>, guidance_messages: array<int, string>}
     */
    public function evaluateProfessional(ProfessionalProfile|array|null $profile): array
    {
        $data = $this->normalizeProfessionalData($profile);

        $missing = [];
        $guidance = [];

        if (empty($data['skills'])) {
            $missing[] = 'skills';
            $guidance[] = 'Add relevant skills to improve professional matching.';
        }

        if (empty($data['industry_experience'])) {
            $missing[] = 'industry_experience';
            $guidance[] = 'Specify your industry experience to improve match accuracy.';
        }

        if ($this->isEmptyString($data['experience_level'])) {
            $missing[] = 'experience_level';
            $guidance[] = 'Set your experience level to improve match accuracy.';
        }

        if ($this->isEmptyString($data['availability'])) {
            $missing[] = 'availability';
            $guidance[] = 'Specify your availability to improve match accuracy.';
        }

        if ($this->isEmptyString($data['location'])) {
            $missing[] = 'location';
            $guidance[] = 'Specify your location or remote preference to improve match accuracy.';
        }

        if (empty($data['compensation_preferences'])) {
            $missing[] = 'compensation_preferences';
            $guidance[] = 'Specify your compensation preferences to improve match accuracy.';
        }

        return [
            'is_complete' => empty($missing),
            'missing_fields' => $missing,
            'guidance_messages' => $guidance,
        ];
    }

    /**
     * Evaluate matching data completeness for a business from an investor matching perspective,
     * based strictly on inputs read by BusinessInvestorMatcher.
     *
     * @return array{is_complete: bool, missing_fields: array<int, string>, guidance_messages: array<int, string>}
     */
    public function evaluateBusinessForInvestor(Business|array|null $business, BusinessRequirement|array|null $requirement = null): array
    {
        $data = $this->normalizeBusinessDataForInvestor($business, $requirement);

        $missing = [];
        $guidance = [];

        if ($this->isEmptyString($data['industry'])) {
            $missing[] = 'industry';
            $guidance[] = 'Specify the business industry to improve investor matching.';
        }

        if ($data['investment_amount'] === null) {
            $missing[] = 'investment_amount';
            $guidance[] = 'Specify the target investment amount to improve investor matching.';
        }

        if ($this->isEmptyString($data['stage'])) {
            $missing[] = 'stage';
            $guidance[] = 'Specify the business development stage to improve investor matching.';
        }

        if ($this->isEmptyString($data['risk_level'])) {
            $missing[] = 'risk_level';
            $guidance[] = 'Specify the requirement risk level to improve investor matching.';
        }

        if ($this->isEmptyString($data['location'])) {
            $missing[] = 'location';
            $guidance[] = 'Specify the business location to improve investor matching.';
        }

        if ($this->isEmptyString($data['involvement_level'])) {
            $missing[] = 'involvement_level';
            $guidance[] = 'Specify the requirement involvement level to improve investor matching.';
        }

        return [
            'is_complete' => empty($missing),
            'missing_fields' => $missing,
            'guidance_messages' => $guidance,
        ];
    }

    /**
     * Evaluate matching data completeness for a business from a professional matching perspective,
     * based strictly on inputs read by BusinessProfessionalMatcher.
     *
     * @return array{is_complete: bool, missing_fields: array<int, string>, guidance_messages: array<int, string>}
     */
    public function evaluateBusinessForProfessional(Business|array|null $business, BusinessRequirement|array|null $requirement = null): array
    {
        $data = $this->normalizeBusinessDataForProfessional($business, $requirement);

        $missing = [];
        $guidance = [];

        if ($this->isEmptyString($data['industry'])) {
            $missing[] = 'industry';
            $guidance[] = 'Specify the business industry to improve professional matching.';
        }

        if (empty($data['skills'])) {
            $missing[] = 'skills';
            $guidance[] = 'Add required skills to improve professional matching.';
        }

        if ($this->isEmptyString($data['minimum_experience_level'])) {
            $missing[] = 'minimum_experience_level';
            $guidance[] = 'Specify the minimum experience level to improve professional matching.';
        }

        if ($this->isEmptyString($data['commitment_type'])) {
            $missing[] = 'commitment_type';
            $guidance[] = 'Specify the commitment type to improve professional matching.';
        }

        if ($this->isEmptyString($data['location'])) {
            $missing[] = 'location';
            $guidance[] = 'Specify location preference to improve professional matching.';
        }

        if (! $data['has_explicit_compensation']) {
            $missing[] = 'compensation_offered';
            $guidance[] = 'Specify offered compensation terms to improve professional matching.';
        }

        return [
            'is_complete' => empty($missing),
            'missing_fields' => $missing,
            'guidance_messages' => $guidance,
        ];
    }

    /**
     * Evaluate general business matching completeness.
     *
     * @return array{is_complete: bool, missing_fields: array<int, string>, guidance_messages: array<int, string>}
     */
    public function evaluateBusiness(Business|array|null $business, BusinessRequirement|array|null $requirement = null, ?string $perspective = null): array
    {
        if ($perspective === 'investor') {
            return $this->evaluateBusinessForInvestor($business, $requirement);
        }

        if ($perspective === 'professional') {
            return $this->evaluateBusinessForProfessional($business, $requirement);
        }

        $invResult = $this->evaluateBusinessForInvestor($business, $requirement);
        $profResult = $this->evaluateBusinessForProfessional($business, $requirement);

        $missing = array_values(array_unique(array_merge($invResult['missing_fields'], $profResult['missing_fields'])));
        $guidance = array_values(array_unique(array_merge($invResult['guidance_messages'], $profResult['guidance_messages'])));

        return [
            'is_complete' => empty($missing),
            'missing_fields' => $missing,
            'guidance_messages' => $guidance,
        ];
    }

    private function isEmptyString(mixed $val): bool
    {
        if ($val === null) {
            return true;
        }

        if (is_string($val)) {
            return trim($val) === '';
        }

        return false;
    }

    private function toDecimalStringOrNull(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $val = (string) $value;
            if (bccomp($val, '0', 4) >= 0) {
                return $val;
            }
        }

        return null;
    }

    private function normalizeInvestorData(InvestorPreference|array|null $pref): array
    {
        if ($pref instanceof InvestorPreference) {
            $p = $pref->toArray();
        } elseif (is_array($pref)) {
            $p = $pref;
        } else {
            $p = [];
        }

        return [
            'industry' => $p['industry'] ?? null,
            'business_stage' => $p['business_stage'] ?? null,
            'location' => $p['location'] ?? null,
            'risk_level' => $p['risk_level'] ?? null,
            'involvement' => $p['involvement'] ?? null,
            'minimum_investment' => $this->toDecimalStringOrNull($p['minimum_investment'] ?? null),
            'maximum_investment' => $this->toDecimalStringOrNull($p['maximum_investment'] ?? null),
            'available_investment' => $this->toDecimalStringOrNull($p['available_investment'] ?? null),
        ];
    }

    private function normalizeProfessionalData(ProfessionalProfile|array|null $profile): array
    {
        if ($profile instanceof ProfessionalProfile) {
            $skills = $profile->relationLoaded('skills')
                ? $profile->skills->pluck('name')->all()
                : $profile->skills()->pluck('name')->all();

            $p = $profile->toArray();
            $p['skills'] = $skills;
        } elseif (is_array($profile)) {
            $p = $profile;
            $skills = [];
            if (isset($p['skills']) && is_array($p['skills'])) {
                $skills = array_map(fn ($s) => is_array($s) ? ($s['name'] ?? '') : (string) $s, $p['skills']);
            }
            $p['skills'] = array_values(array_filter($skills));
        } else {
            $p = [
                'skills' => [],
            ];
        }

        return [
            'skills' => $p['skills'] ?? [],
            'industry_experience' => is_array($p['industry_experience'] ?? null) ? $p['industry_experience'] : [],
            'experience_level' => $p['experience_level'] ?? null,
            'availability' => $p['availability'] ?? null,
            'location' => $p['location'] ?? null,
            'compensation_preferences' => is_array($p['compensation_preferences'] ?? null) ? $p['compensation_preferences'] : [],
        ];
    }

    private function normalizeBusinessDataForInvestor(Business|array|null $business, BusinessRequirement|array|null $requirement): array
    {
        $isModelBiz = $business instanceof Business;
        $isModelReq = $requirement instanceof BusinessRequirement;

        if ($requirement === null && $isModelBiz) {
            $requirement = $business->relationLoaded('requirements') ? $business->requirements : $business->requirements()->first();
            $isModelReq = $requirement instanceof BusinessRequirement;
        }

        $b = $business instanceof Business ? $business->toArray() : ($business ?? []);
        $r = $requirement instanceof BusinessRequirement ? $requirement->toArray() : ($requirement ?? []);

        return [
            'industry' => $b['industry'] ?? null,
            'stage' => $b['stage'] ?? ($isModelBiz ? ($b['business_stage'] ?? null) : null),
            'location' => $r['location_preference'] ?? $b['location'] ?? null,
            'investment_amount' => $this->toDecimalStringOrNull($r['investment_amount'] ?? ($isModelReq ? ($r['funding_amount'] ?? null) : ($b['investment_amount'] ?? null))),
            'risk_level' => $r['risk_level'] ?? ($isModelBiz ? ($b['risk_level'] ?? null) : null),
            'involvement_level' => $r['involvement_level'] ?? ($isModelBiz ? ($b['expected_involvement'] ?? null) : null),
        ];
    }

    private function normalizeBusinessDataForProfessional(Business|array|null $business, BusinessRequirement|array|null $requirement): array
    {
        $isModelBiz = $business instanceof Business;
        $isModelReq = $requirement instanceof BusinessRequirement;

        if ($requirement === null && $isModelBiz) {
            $requirement = $business->relationLoaded('requirements') ? $business->requirements : $business->requirements()->first();
            $isModelReq = $requirement instanceof BusinessRequirement;
        }

        $b = $business instanceof Business ? $business->toArray() : ($business ?? []);
        $r = $requirement instanceof BusinessRequirement ? $requirement->toArray() : ($requirement ?? []);

        // Extract skills exactly matching BusinessProfessionalMatcher
        $skills = [];
        if ($requirement instanceof BusinessRequirement && $requirement->relationLoaded('skills')) {
            $skills = $requirement->skills->pluck('name')->all();
        } elseif ($requirement instanceof BusinessRequirement) {
            $skills = $requirement->skills()->pluck('name')->all();
        } elseif (isset($r['skills']) && is_array($r['skills'])) {
            $skills = array_map(fn ($s) => is_array($s) ? ($s['name'] ?? '') : (string) $s, $r['skills']);
        } elseif (isset($b['skills_needed']) && is_array($b['skills_needed'])) {
            $skills = $b['skills_needed'];
        }

        // Check if compensation is explicitly configured on the requirement
        $hasExplicitCompensation = false;
        $equity = $r['equity_offered'] ?? null;
        $profit = $r['profit_share_offered'] ?? null;
        if (($equity !== null && (float) $equity > 0) || ($profit !== null && (float) $profit > 0)) {
            $hasExplicitCompensation = true;
        }
        if (isset($r['compensation_type']) && is_string($r['compensation_type']) && trim($r['compensation_type']) !== '') {
            $hasExplicitCompensation = true;
        }
        if ($isModelReq && isset($r['compensation_preferences']) && is_array($r['compensation_preferences']) && ! empty($r['compensation_preferences'])) {
            $hasExplicitCompensation = true;
        }

        return [
            'industry' => $b['industry'] ?? null,
            'location' => $r['location_preference'] ?? $b['location'] ?? null,
            'minimum_experience_level' => $r['minimum_experience_level'] ?? ($isModelReq ? ($r['required_experience_level'] ?? null) : null),
            'commitment_type' => $r['commitment_type'] ?? ($isModelReq ? ($r['required_availability'] ?? null) : null),
            'skills' => array_values(array_filter($skills)),
            'has_explicit_compensation' => $hasExplicitCompensation,
        ];
    }
}
