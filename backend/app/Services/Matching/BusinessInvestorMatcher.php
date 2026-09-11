<?php

namespace App\Services\Matching;

use App\Models\Business;
use App\Models\BusinessRequirement;
use App\Models\InvestorPreference;
use App\Services\Matching\Data\MatchFactorResult;
use App\Services\Matching\Data\MatchResult;

final class BusinessInvestorMatcher
{
    public const WEIGHT_INDUSTRY = 0.25;

    public const WEIGHT_INVESTMENT_RANGE = 0.25;

    public const WEIGHT_BUSINESS_STAGE = 0.15;

    public const WEIGHT_RISK_LEVEL = 0.15;

    public const WEIGHT_LOCATION = 0.10;

    public const WEIGHT_INVOLVEMENT = 0.10;

    /**
     * Compute deterministic match between a Business (and optional requirement) and an InvestorPreference.
     */
    public function match(
        Business|array $business,
        InvestorPreference|array $investorPreference,
        BusinessRequirement|array|null $requirement = null,
    ): MatchResult {
        $bData = $this->normalizeBusinessData($business, $requirement);
        $iData = $this->normalizeInvestorData($investorPreference);

        $factors = [
            $this->evaluateIndustry($bData['industry'], $iData['industry']),
            $this->evaluateInvestmentRange(
                $bData['investment_amount'],
                $iData['minimum_investment'],
                $iData['maximum_investment'],
                $iData['available_investment']
            ),
            $this->evaluateBusinessStage($bData['stage'], $iData['business_stage']),
            $this->evaluateRiskLevel($bData['risk_level'], $iData['risk_level']),
            $this->evaluateLocation($bData['location'], $iData['location']),
            $this->evaluateInvolvement($bData['involvement_level'], $iData['involvement']),
        ];

        return MatchResult::fromFactors($factors);
    }

    /**
     * Factor 1: Industry Match (25%)
     */
    public function evaluateIndustry(?string $businessIndustry, ?string $investorIndustry): MatchFactorResult
    {
        $bInd = trim((string) $businessIndustry);
        $iInd = trim((string) $investorIndustry);

        if ($bInd !== '' && $iInd !== '' && strcasecmp($bInd, $iInd) === 0) {
            return new MatchFactorResult(
                factorKey: 'industry',
                factorName: 'Industry Match',
                weight: self::WEIGHT_INDUSTRY,
                score: 1.0,
                explanation: 'Both parties are focused on '.$bInd.'.',
            );
        }

        if ($iInd === '' || strcasecmp($iInd, 'Any') === 0 || strcasecmp($iInd, 'All') === 0) {
            return new MatchFactorResult(
                factorKey: 'industry',
                factorName: 'Industry Match',
                weight: self::WEIGHT_INDUSTRY,
                score: 0.75,
                explanation: $bInd !== ''
                    ? 'Investor has open industry preferences, compatible with '.$bInd.'.'
                    : 'Industry preferences are flexible.',
            );
        }

        if ($bInd === '') {
            return new MatchFactorResult(
                factorKey: 'industry',
                factorName: 'Industry Match',
                weight: self::WEIGHT_INDUSTRY,
                score: 0.50,
                explanation: 'Business has not specified a primary industry.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'industry',
            factorName: 'Industry Match',
            weight: self::WEIGHT_INDUSTRY,
            score: 0.0,
            explanation: 'Business industry ('.$bInd.') differs from investor preference ('.$iInd.').',
        );
    }

    /**
     * Factor 2: Investment Range Compatibility (25%)
     */
    public function evaluateInvestmentRange(
        float|int|string|null $targetAmount,
        float|int|string|null $minInvestment,
        float|int|string|null $maxInvestment,
        float|int|string|null $availableInvestment,
    ): MatchFactorResult {
        $target = $this->toDecimalStringOrNull($targetAmount);
        $min = $this->toDecimalStringOrNull($minInvestment);
        $max = $this->toDecimalStringOrNull($maxInvestment);
        $avail = $this->toDecimalStringOrNull($availableInvestment);

        if ($target === null) {
            return new MatchFactorResult(
                factorKey: 'investment_range',
                factorName: 'Investment Range Compatibility',
                weight: self::WEIGHT_INVESTMENT_RANGE,
                score: 0.50,
                explanation: 'Business has not specified a target investment amount.',
            );
        }

        $targetFormatted = number_format((float) $target, 2);

        // Case A: Both min and max are specified
        if ($min !== null && $max !== null) {
            $minFormatted = number_format((float) $min, 2);
            $maxFormatted = number_format((float) $max, 2);

            if (bccomp($target, $min, 4) >= 0 && bccomp($target, $max, 4) <= 0) {
                return new MatchFactorResult(
                    factorKey: 'investment_range',
                    factorName: 'Investment Range Compatibility',
                    weight: self::WEIGHT_INVESTMENT_RANGE,
                    score: 1.0,
                    explanation: 'Target investment of ৳'.$targetFormatted.' is within investor range (৳'.$minFormatted.' - ৳'.$maxFormatted.').',
                );
            }

            if (bccomp($target, $min, 4) < 0) {
                $diff = bcsub($min, $target, 4);
                $ratio = bccomp($min, '0', 4) > 0 ? (float) bcdiv($diff, $min, 6) : 1.0;
                $score = max(0.0, 1.0 - $ratio);
                $score = min(0.75, round($score, 4));

                return new MatchFactorResult(
                    factorKey: 'investment_range',
                    factorName: 'Investment Range Compatibility',
                    weight: self::WEIGHT_INVESTMENT_RANGE,
                    score: $score,
                    explanation: 'Target investment of ৳'.$targetFormatted.' is below investor minimum of ৳'.$minFormatted.'.',
                );
            }

            // target > max
            $diff = bcsub($target, $max, 4);
            $ratio = bccomp($target, '0', 4) > 0 ? (float) bcdiv($diff, $target, 6) : 1.0;
            $score = max(0.0, 1.0 - $ratio);
            $score = min(0.75, round($score, 4));

            return new MatchFactorResult(
                factorKey: 'investment_range',
                factorName: 'Investment Range Compatibility',
                weight: self::WEIGHT_INVESTMENT_RANGE,
                score: $score,
                explanation: 'Target investment of ৳'.$targetFormatted.' exceeds investor maximum of ৳'.$maxFormatted.'.',
            );
        }

        // Case B: Only available_investment specified
        if ($avail !== null) {
            $availFormatted = number_format((float) $avail, 2);

            if (bccomp($target, $avail, 4) <= 0) {
                return new MatchFactorResult(
                    factorKey: 'investment_range',
                    factorName: 'Investment Range Compatibility',
                    weight: self::WEIGHT_INVESTMENT_RANGE,
                    score: 1.0,
                    explanation: 'Target investment of ৳'.$targetFormatted.' is fully within available capital of ৳'.$availFormatted.'.',
                );
            }

            $score = bccomp($target, '0', 4) > 0 ? (float) bcdiv($avail, $target, 6) : 0.0;
            $score = min(0.75, max(0.0, round($score, 4)));

            return new MatchFactorResult(
                factorKey: 'investment_range',
                factorName: 'Investment Range Compatibility',
                weight: self::WEIGHT_INVESTMENT_RANGE,
                score: $score,
                explanation: 'Target investment of ৳'.$targetFormatted.' exceeds available capital of ৳'.$availFormatted.'.',
            );
        }

        // Case C: No constraints set by investor
        return new MatchFactorResult(
            factorKey: 'investment_range',
            factorName: 'Investment Range Compatibility',
            weight: self::WEIGHT_INVESTMENT_RANGE,
            score: 0.75,
            explanation: 'Investor has not set strict investment amount limits.',
        );
    }

    /**
     * Factor 3: Business Stage Match (15%)
     */
    public function evaluateBusinessStage(?string $businessStage, ?string $investorStage): MatchFactorResult
    {
        $bStage = trim((string) $businessStage);
        $iStage = trim((string) $investorStage);

        if ($bStage !== '' && $iStage !== '' && strcasecmp($bStage, $iStage) === 0) {
            return new MatchFactorResult(
                factorKey: 'business_stage',
                factorName: 'Business Stage Match',
                weight: self::WEIGHT_BUSINESS_STAGE,
                score: 1.0,
                explanation: 'Business stage ('.$bStage.') matches investor preference.',
            );
        }

        if ($iStage === '' || strcasecmp($iStage, 'Any') === 0 || strcasecmp($iStage, 'All') === 0) {
            return new MatchFactorResult(
                factorKey: 'business_stage',
                factorName: 'Business Stage Match',
                weight: self::WEIGHT_BUSINESS_STAGE,
                score: 0.75,
                explanation: $bStage !== ''
                    ? 'Investor is open to multiple stages including '.$bStage.'.'
                    : 'Business stage preferences are flexible.',
            );
        }

        if ($bStage === '') {
            return new MatchFactorResult(
                factorKey: 'business_stage',
                factorName: 'Business Stage Match',
                weight: self::WEIGHT_BUSINESS_STAGE,
                score: 0.50,
                explanation: 'Business has not specified its current development stage.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'business_stage',
            factorName: 'Business Stage Match',
            weight: self::WEIGHT_BUSINESS_STAGE,
            score: 0.0,
            explanation: 'Business stage ('.$bStage.') differs from preferred stage ('.$iStage.').',
        );
    }

    /**
     * Factor 4: Risk Level Compatibility (15%)
     */
    public function evaluateRiskLevel(?string $businessRisk, ?string $investorRisk): MatchFactorResult
    {
        $bRisk = trim((string) $businessRisk);
        $iRisk = trim((string) $investorRisk);

        $riskMap = [
            'low' => 1,
            'conservative' => 1,
            'moderate' => 2,
            'medium' => 2,
            'high' => 3,
            'aggressive' => 3,
        ];

        $bRank = $riskMap[strtolower($bRisk)] ?? null;
        $iRank = $riskMap[strtolower($iRisk)] ?? null;

        if ($bRank !== null && $iRank !== null) {
            if ($bRank === $iRank) {
                return new MatchFactorResult(
                    factorKey: 'risk_level',
                    factorName: 'Risk Level Compatibility',
                    weight: self::WEIGHT_RISK_LEVEL,
                    score: 1.0,
                    explanation: 'Risk profile ('.$bRisk.') directly aligns with investor tolerance.',
                );
            }

            if ($bRank < $iRank) {
                return new MatchFactorResult(
                    factorKey: 'risk_level',
                    factorName: 'Risk Level Compatibility',
                    weight: self::WEIGHT_RISK_LEVEL,
                    score: 1.0,
                    explanation: 'Business risk ('.$bRisk.') is well within investor tolerance ('.$iRisk.').',
                );
            }

            $diff = $bRank - $iRank;
            if ($diff === 1) {
                return new MatchFactorResult(
                    factorKey: 'risk_level',
                    factorName: 'Risk Level Compatibility',
                    weight: self::WEIGHT_RISK_LEVEL,
                    score: 0.50,
                    explanation: 'Business risk ('.$bRisk.') is slightly higher than preferred tolerance ('.$iRisk.').',
                );
            }

            return new MatchFactorResult(
                factorKey: 'risk_level',
                factorName: 'Risk Level Compatibility',
                weight: self::WEIGHT_RISK_LEVEL,
                score: 0.0,
                explanation: 'Business risk ('.$bRisk.') exceeds investor risk tolerance ('.$iRisk.').',
            );
        }

        return new MatchFactorResult(
            factorKey: 'risk_level',
            factorName: 'Risk Level Compatibility',
            weight: self::WEIGHT_RISK_LEVEL,
            score: 0.50,
            explanation: 'Risk profile is unconstrained or not specified.',
        );
    }

    /**
     * Factor 5: Location Preference (10%)
     */
    public function evaluateLocation(?string $businessLocation, ?string $investorLocation): MatchFactorResult
    {
        $bLoc = trim((string) $businessLocation);
        $iLoc = trim((string) $investorLocation);

        if ($bLoc !== '' && $iLoc !== '' && strcasecmp($bLoc, $iLoc) === 0) {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location Preference',
                weight: self::WEIGHT_LOCATION,
                score: 1.0,
                explanation: 'Both parties are located in or prefer '.$bLoc.'.',
            );
        }

        if ($iLoc === '' || strcasecmp($iLoc, 'Any') === 0 || strcasecmp($iLoc, 'All') === 0) {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location Preference',
                weight: self::WEIGHT_LOCATION,
                score: 0.75,
                explanation: 'Investor has no geographic restriction.',
            );
        }

        if ($bLoc === '') {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location Preference',
                weight: self::WEIGHT_LOCATION,
                score: 0.50,
                explanation: 'Business location is not specified.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'location',
            factorName: 'Location Preference',
            weight: self::WEIGHT_LOCATION,
            score: 0.25,
            explanation: 'Business location ('.$bLoc.') differs from preferred location ('.$iLoc.').',
        );
    }

    /**
     * Factor 6: Expected Involvement (10%)
     */
    public function evaluateInvolvement(?string $businessInvolvement, ?string $investorInvolvement): MatchFactorResult
    {
        $bInv = trim((string) $businessInvolvement);
        $iInv = trim((string) $investorInvolvement);

        if ($bInv !== '' && $iInv !== '' && strcasecmp($bInv, $iInv) === 0) {
            return new MatchFactorResult(
                factorKey: 'involvement',
                factorName: 'Expected Involvement',
                weight: self::WEIGHT_INVOLVEMENT,
                score: 1.0,
                explanation: 'Expected involvement ('.$bInv.') matches investor preference.',
            );
        }

        if ($iInv === '' || strcasecmp($iInv, 'Any') === 0 || strcasecmp($iInv, 'All') === 0 || strcasecmp($iInv, 'Flexible') === 0) {
            return new MatchFactorResult(
                factorKey: 'involvement',
                factorName: 'Expected Involvement',
                weight: self::WEIGHT_INVOLVEMENT,
                score: 0.75,
                explanation: 'Investor is flexible regarding involvement level.',
            );
        }

        if ($bInv === '') {
            return new MatchFactorResult(
                factorKey: 'involvement',
                factorName: 'Expected Involvement',
                weight: self::WEIGHT_INVOLVEMENT,
                score: 0.50,
                explanation: 'Business has not specified an involvement expectation.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'involvement',
            factorName: 'Expected Involvement',
            weight: self::WEIGHT_INVOLVEMENT,
            score: 0.0,
            explanation: 'Business expects '.$bInv.' involvement, while investor prefers '.$iInv.'.',
        );
    }

    private function normalizeBusinessData(Business|array $business, BusinessRequirement|array|null $requirement): array
    {
        $isModelBiz = $business instanceof Business;
        $isModelReq = $requirement instanceof BusinessRequirement;
        $b = $business instanceof Business ? $business->toArray() : $business;
        $r = $requirement instanceof BusinessRequirement ? $requirement->toArray() : ($requirement ?? []);

        return [
            'industry' => $b['industry'] ?? null,
            'stage' => $b['stage'] ?? ($isModelBiz ? ($b['business_stage'] ?? null) : null),
            'location' => $b['location'] ?? $r['location_preference'] ?? null,
            'investment_amount' => $r['investment_amount'] ?? ($isModelReq ? ($r['funding_amount'] ?? null) : ($b['investment_amount'] ?? null)),
            'risk_level' => $r['risk_level'] ?? ($isModelBiz ? ($b['risk_level'] ?? null) : null),
            'involvement_level' => $r['involvement_level'] ?? ($isModelBiz ? ($b['expected_involvement'] ?? null) : null),
        ];
    }

    private function normalizeInvestorData(InvestorPreference|array $investorPreference): array
    {
        $i = $investorPreference instanceof InvestorPreference ? $investorPreference->toArray() : $investorPreference;

        return [
            'industry' => $i['industry'] ?? null,
            'business_stage' => $i['business_stage'] ?? null,
            'location' => $i['location'] ?? null,
            'risk_level' => $i['risk_level'] ?? null,
            'involvement' => $i['involvement'] ?? null,
            'minimum_investment' => $i['minimum_investment'] ?? null,
            'maximum_investment' => $i['maximum_investment'] ?? null,
            'available_investment' => $i['available_investment'] ?? null,
        ];
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
}
