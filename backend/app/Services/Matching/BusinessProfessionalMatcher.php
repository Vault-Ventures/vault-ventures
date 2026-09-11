<?php

namespace App\Services\Matching;

use App\Models\Business;
use App\Models\BusinessRequirement;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Services\Matching\Data\MatchFactorResult;
use App\Services\Matching\Data\MatchResult;

final class BusinessProfessionalMatcher
{
    public const WEIGHT_SKILL_OVERLAP = 0.35;

    public const WEIGHT_INDUSTRY_EXPERIENCE = 0.20;

    public const WEIGHT_EXPERIENCE_LEVEL = 0.15;

    public const WEIGHT_AVAILABILITY = 0.15;

    public const WEIGHT_LOCATION = 0.10;

    public const WEIGHT_COMPENSATION = 0.05;

    /**
     * Compute deterministic match between a Business (and optional requirement) and a ProfessionalProfile.
     */
    public function match(
        Business|array $business,
        ProfessionalProfile|array $professionalProfile,
        BusinessRequirement|array|null $requirement = null,
    ): MatchResult {
        $bData = $this->normalizeBusinessData($business, $requirement);
        $pData = $this->normalizeProfessionalData($professionalProfile);

        $factors = [
            $this->evaluateSkillOverlap($bData['skills'], $pData['skills']),
            $this->evaluateIndustryExperience($bData['industry'], $pData['industry_experience']),
            $this->evaluateExperienceLevel($bData['minimum_experience_level'], $pData['experience_level']),
            $this->evaluateAvailability($bData['commitment_type'], $pData['availability']),
            $this->evaluateLocation($bData['location'], $pData['location']),
            $this->evaluateCompensation($bData['compensation_offered'], $pData['compensation_preferences']),
        ];

        return MatchResult::fromFactors($factors);
    }

    /**
     * Factor 1: Required Skill Overlap (35%)
     *
     * @param  array<int, string>  $requiredSkills
     * @param  array<int, string>  $professionalSkills
     */
    public function evaluateSkillOverlap(array $requiredSkills, array $professionalSkills): MatchFactorResult
    {
        $normalizedReq = array_values(array_unique(array_filter(array_map(
            fn ($s) => mb_strtolower(trim((string) $s)),
            $requiredSkills
        ))));

        $normalizedPro = array_values(array_unique(array_filter(array_map(
            fn ($s) => mb_strtolower(trim((string) $s)),
            $professionalSkills
        ))));

        $totalReq = count($normalizedReq);

        if ($totalReq === 0) {
            $proCount = count($normalizedPro);

            return new MatchFactorResult(
                factorKey: 'skills',
                factorName: 'Required Skill Overlap',
                weight: self::WEIGHT_SKILL_OVERLAP,
                score: $proCount > 0 ? 0.75 : 0.50,
                explanation: $proCount > 0
                    ? 'No specific skills required; professional offers '.$proCount.' skills.'
                    : 'No specific skill requirements specified.',
            );
        }

        $matched = array_values(array_intersect($normalizedReq, $normalizedPro));
        $matchedCount = count($matched);
        $missing = array_values(array_diff($normalizedReq, $normalizedPro));

        $score = round($matchedCount / $totalReq, 4);

        if ($matchedCount === $totalReq) {
            return new MatchFactorResult(
                factorKey: 'skills',
                factorName: 'Required Skill Overlap',
                weight: self::WEIGHT_SKILL_OVERLAP,
                score: 1.0,
                explanation: 'All '.$totalReq.' required skills matched ('.implode(', ', $matched).').',
            );
        }

        if ($matchedCount > 0) {
            return new MatchFactorResult(
                factorKey: 'skills',
                factorName: 'Required Skill Overlap',
                weight: self::WEIGHT_SKILL_OVERLAP,
                score: $score,
                explanation: $matchedCount.' of '.$totalReq.' required skills matched ('.implode(', ', $matched).'). Missing: '.implode(', ', $missing).'.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'skills',
            factorName: 'Required Skill Overlap',
            weight: self::WEIGHT_SKILL_OVERLAP,
            score: 0.0,
            explanation: 'No matching skills found for required skills ('.implode(', ', $requiredSkills).').',
        );
    }

    /**
     * Factor 2: Industry Experience (20%)
     *
     * @param  array<int, string>  $professionalIndustries
     */
    public function evaluateIndustryExperience(?string $businessIndustry, array $professionalIndustries): MatchFactorResult
    {
        $bInd = trim((string) $businessIndustry);

        $normalizedProInd = array_map(
            fn ($ind) => mb_strtolower(trim((string) $ind)),
            $professionalIndustries
        );

        if ($bInd !== '') {
            $bIndLower = mb_strtolower($bInd);

            if (in_array($bIndLower, $normalizedProInd, true)) {
                return new MatchFactorResult(
                    factorKey: 'industry_experience',
                    factorName: 'Industry Experience',
                    weight: self::WEIGHT_INDUSTRY_EXPERIENCE,
                    score: 1.0,
                    explanation: 'Professional has direct experience in '.$bInd.'.',
                );
            }

            if (! empty($professionalIndustries)) {
                return new MatchFactorResult(
                    factorKey: 'industry_experience',
                    factorName: 'Industry Experience',
                    weight: self::WEIGHT_INDUSTRY_EXPERIENCE,
                    score: 0.25,
                    explanation: 'Professional has experience in other industries ('.implode(', ', $professionalIndustries).'), but not directly in '.$bInd.'.',
                );
            }

            return new MatchFactorResult(
                factorKey: 'industry_experience',
                factorName: 'Industry Experience',
                weight: self::WEIGHT_INDUSTRY_EXPERIENCE,
                score: 0.50,
                explanation: 'Professional has general / unconstrained industry experience.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'industry_experience',
            factorName: 'Industry Experience',
            weight: self::WEIGHT_INDUSTRY_EXPERIENCE,
            score: 0.50,
            explanation: 'Business industry is not specified.',
        );
    }

    /**
     * Factor 3: Experience Level (15%)
     */
    public function evaluateExperienceLevel(?string $requiredLevel, ?string $professionalLevel): MatchFactorResult
    {
        $req = trim((string) $requiredLevel);
        $pro = trim((string) $professionalLevel);

        $levelMap = [
            'junior' => 1,
            'entry' => 1,
            'entry-level' => 1,
            'mid' => 2,
            'mid-level' => 2,
            'intermediate' => 2,
            'senior' => 3,
            'experienced' => 3,
            'lead' => 4,
            'principal' => 4,
            'executive' => 4,
        ];

        $reqRank = $levelMap[strtolower($req)] ?? null;
        $proRank = $levelMap[strtolower($pro)] ?? null;

        if ($reqRank !== null && $proRank !== null) {
            if ($proRank >= $reqRank) {
                return new MatchFactorResult(
                    factorKey: 'experience_level',
                    factorName: 'Experience Level',
                    weight: self::WEIGHT_EXPERIENCE_LEVEL,
                    score: 1.0,
                    explanation: 'Professional experience level ('.$pro.') meets or exceeds requirement ('.$req.').',
                );
            }

            $diff = $reqRank - $proRank;
            if ($diff === 1) {
                return new MatchFactorResult(
                    factorKey: 'experience_level',
                    factorName: 'Experience Level',
                    weight: self::WEIGHT_EXPERIENCE_LEVEL,
                    score: 0.50,
                    explanation: 'Professional experience level ('.$pro.') is slightly below desired level ('.$req.').',
                );
            }

            return new MatchFactorResult(
                factorKey: 'experience_level',
                factorName: 'Experience Level',
                weight: self::WEIGHT_EXPERIENCE_LEVEL,
                score: 0.0,
                explanation: 'Professional experience level ('.$pro.') does not meet requirement ('.$req.').',
            );
        }

        return new MatchFactorResult(
            factorKey: 'experience_level',
            factorName: 'Experience Level',
            weight: self::WEIGHT_EXPERIENCE_LEVEL,
            score: 0.75,
            explanation: 'Experience level is open or not strictly specified.',
        );
    }

    /**
     * Factor 4: Availability (15%)
     */
    public function evaluateAvailability(?string $requiredCommitment, ?string $professionalAvailability): MatchFactorResult
    {
        $req = trim((string) $requiredCommitment);
        $pro = trim((string) $professionalAvailability);

        if ($req !== '' && $pro !== '') {
            if (strcasecmp($req, $pro) === 0) {
                return new MatchFactorResult(
                    factorKey: 'availability',
                    factorName: 'Availability',
                    weight: self::WEIGHT_AVAILABILITY,
                    score: 1.0,
                    explanation: 'Professional availability ('.$pro.') matches required commitment.',
                );
            }

            // If professional is full time, they can accommodate part time / advisory / contract
            if (strcasecmp($pro, 'Full time') === 0 || strcasecmp($pro, 'Full-time') === 0) {
                return new MatchFactorResult(
                    factorKey: 'availability',
                    factorName: 'Availability',
                    weight: self::WEIGHT_AVAILABILITY,
                    score: 1.0,
                    explanation: 'Professional full-time availability accommodates '.$req.' requirement.',
                );
            }

            // If professional is flexible / open
            if (strcasecmp($pro, 'Flexible') === 0 || strcasecmp($pro, 'Any') === 0) {
                return new MatchFactorResult(
                    factorKey: 'availability',
                    factorName: 'Availability',
                    weight: self::WEIGHT_AVAILABILITY,
                    score: 0.85,
                    explanation: 'Professional has flexible availability.',
                );
            }

            return new MatchFactorResult(
                factorKey: 'availability',
                factorName: 'Availability',
                weight: self::WEIGHT_AVAILABILITY,
                score: 0.0,
                explanation: 'Professional is available '.$pro.', but position requires '.$req.'.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'availability',
            factorName: 'Availability',
            weight: self::WEIGHT_AVAILABILITY,
            score: 0.75,
            explanation: 'Availability requirements are open or unspecified.',
        );
    }

    /**
     * Factor 5: Location (10%)
     */
    public function evaluateLocation(?string $businessLocation, ?string $professionalLocation): MatchFactorResult
    {
        $bLoc = trim((string) $businessLocation);
        $pLoc = trim((string) $professionalLocation);

        if ($bLoc !== '' && $pLoc !== '' && strcasecmp($bLoc, $pLoc) === 0) {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location',
                weight: self::WEIGHT_LOCATION,
                score: 1.0,
                explanation: 'Both parties are based in '.$bLoc.'.',
            );
        }

        if ($pLoc === '' || strcasecmp($pLoc, 'Remote') === 0 || strcasecmp($pLoc, 'Any') === 0) {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location',
                weight: self::WEIGHT_LOCATION,
                score: 0.75,
                explanation: 'Location preference is flexible / remote-friendly.',
            );
        }

        if ($bLoc === '') {
            return new MatchFactorResult(
                factorKey: 'location',
                factorName: 'Location',
                weight: self::WEIGHT_LOCATION,
                score: 0.50,
                explanation: 'Business location is not specified.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'location',
            factorName: 'Location',
            weight: self::WEIGHT_LOCATION,
            score: 0.25,
            explanation: 'Professional is based in '.$pLoc.', while business is in '.$bLoc.' (remote collaboration may apply).',
        );
    }

    /**
     * Factor 6: Compensation Preference Compatibility (5%)
     *
     * @param  array<int, string>  $offeredCompensation
     * @param  array<int, string>  $professionalPreferences
     */
    public function evaluateCompensation(array $offeredCompensation, array $professionalPreferences): MatchFactorResult
    {
        $offered = array_values(array_unique(array_filter(array_map(
            fn ($c) => strtolower(trim((string) $c)),
            $offeredCompensation
        ))));

        $preferred = array_values(array_unique(array_filter(array_map(
            fn ($c) => strtolower(trim((string) $c)),
            $professionalPreferences
        ))));

        if (empty($preferred)) {
            return new MatchFactorResult(
                factorKey: 'compensation',
                factorName: 'Compensation Preference Compatibility',
                weight: self::WEIGHT_COMPENSATION,
                score: 0.75,
                explanation: 'Professional has open compensation preferences.',
            );
        }

        if (empty($offered)) {
            return new MatchFactorResult(
                factorKey: 'compensation',
                factorName: 'Compensation Preference Compatibility',
                weight: self::WEIGHT_COMPENSATION,
                score: 0.50,
                explanation: 'Business has not specified compensation structure.',
            );
        }

        $overlap = array_values(array_intersect($offered, $preferred));

        if (! empty($overlap)) {
            return new MatchFactorResult(
                factorKey: 'compensation',
                factorName: 'Compensation Preference Compatibility',
                weight: self::WEIGHT_COMPENSATION,
                score: 1.0,
                explanation: 'Compensation preferences ('.implode(', ', $overlap).') are aligned.',
            );
        }

        return new MatchFactorResult(
            factorKey: 'compensation',
            factorName: 'Compensation Preference Compatibility',
            weight: self::WEIGHT_COMPENSATION,
            score: 0.0,
            explanation: 'Compensation preferences ('.implode(', ', $preferred).') do not overlap with offered terms ('.implode(', ', $offered).').',
        );
    }

    private function normalizeBusinessData(Business|array $business, BusinessRequirement|array|null $requirement): array
    {
        $isModelReq = $requirement instanceof BusinessRequirement;
        $b = $business instanceof Business ? $business->toArray() : $business;
        $r = $requirement instanceof BusinessRequirement ? $requirement->toArray() : ($requirement ?? []);

        // Extract skills
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

        // Extract compensation offered
        $compensation = [];
        $equity = $r['equity_offered'] ?? null;
        $profit = $r['profit_share_offered'] ?? null;
        if (($equity !== null && (float) $equity > 0) || ($profit !== null && (float) $profit > 0)) {
            $compensation[] = 'equity';
        }
        if (isset($r['compensation_type']) && is_string($r['compensation_type'])) {
            $compensation[] = strtolower($r['compensation_type']);
        }
        if ($isModelReq && isset($r['compensation_preferences']) && is_array($r['compensation_preferences'])) {
            foreach ($r['compensation_preferences'] as $cp) {
                if (is_string($cp) && trim($cp) !== '') {
                    $compensation[] = strtolower(trim($cp));
                }
            }
        }
        if (empty($compensation)) {
            // Default assumes standard compensation / salary unless equity-only
            $compensation = ['salary', 'equity'];
        }

        return [
            'industry' => $b['industry'] ?? null,
            'location' => $b['location'] ?? $r['location_preference'] ?? null,
            'minimum_experience_level' => $r['minimum_experience_level'] ?? ($isModelReq ? ($r['required_experience_level'] ?? null) : null),
            'commitment_type' => $r['commitment_type'] ?? ($isModelReq ? ($r['required_availability'] ?? null) : null),
            'skills' => $skills,
            'compensation_offered' => array_values(array_unique($compensation)),
        ];
    }

    private function normalizeProfessionalData(ProfessionalProfile|array $professionalProfile): array
    {
        $p = $professionalProfile instanceof ProfessionalProfile ? $professionalProfile->toArray() : $professionalProfile;

        // Extract skills
        $skills = [];
        if ($professionalProfile instanceof ProfessionalProfile && $professionalProfile->relationLoaded('skills')) {
            $skills = $professionalProfile->skills->pluck('name')->all();
        } elseif (isset($p['skills']) && is_array($p['skills'])) {
            $skills = array_map(fn ($s) => is_array($s) ? ($s['name'] ?? '') : (string) $s, $p['skills']);
        }

        return [
            'industry_experience' => $p['industry_experience'] ?? [],
            'experience_level' => $p['experience_level'] ?? null,
            'availability' => $p['availability'] ?? null,
            'location' => $p['location'] ?? null,
            'compensation_preferences' => $p['compensation_preferences'] ?? [],
            'skills' => $skills,
        ];
    }
}
