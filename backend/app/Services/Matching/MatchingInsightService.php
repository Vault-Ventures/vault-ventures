<?php

namespace App\Services\Matching;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\InvestorProfile;
use App\Models\MatchingInsight;
use App\Models\ProfessionalProfile;
use App\Models\User;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\BusinessAnalysis\AnalysisProvider;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class MatchingInsightService
{
    public const FORMULA_VERSION = 'matching-v1';

    public const OUTPUT_CONTRACT_VERSION = 'matching-insight-v1';

    public function resolve(User $user, Business $business, string $role, int $candidateId): array
    {
        $user->loadMissing(['founderProfile', 'investorProfile.preferences', 'professionalProfile.skills']);
        $business->loadMissing(['requirements.skills', 'founderProfile']);

        if (! in_array($role, ['investor', 'professional'], true)) {
            throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
        }

        $isFounderOwner = $user->hasRole(ParticipantRole::Founder)
            && $business->founder_profile_id === $user->founderProfile?->id;

        if ($role === 'investor') {
            $candidate = InvestorProfile::with(['user', 'preferences'])->find($candidateId);
            if (! $candidate) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }
            $isCandidateOwner = $user->hasRole(ParticipantRole::Investor) && $candidate->user_id === $user->id;
            if (! $isFounderOwner && ! $isCandidateOwner) {
                throw new AuthorizationException;
            }
            if ($isCandidateOwner && ! $isFounderOwner && ! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }
            if ($isFounderOwner && ! collect(app(CandidateRecommendationService::class)->recommendInvestorsForBusiness($business, $user))->contains('id', $candidate->id)) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }

            $match = app(BusinessInvestorMatcher::class)->match($business, $candidate->preferences ?? [], $business->requirements);
            $profile = $candidate->preferences?->toArray() ?? [];
        } else {
            $candidate = ProfessionalProfile::with(['user', 'skills'])->find($candidateId);
            if (! $candidate) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }
            $isCandidateOwner = $user->hasRole(ParticipantRole::Professional) && $candidate->user_id === $user->id;
            if (! $isFounderOwner && ! $isCandidateOwner) {
                throw new AuthorizationException;
            }
            if ($isCandidateOwner && ! $isFounderOwner && ! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }
            if ($isFounderOwner && ! collect(app(CandidateRecommendationService::class)->recommendProfessionalsForBusiness($business, $user))->contains('id', $candidate->id)) {
                throw new AnalysisFailure('MATCH_NOT_AVAILABLE', 404);
            }

            $match = app(BusinessProfessionalMatcher::class)->match($business, $candidate, $business->requirements);
            $profile = $candidate->toArray();
            $profile['skills'] = $candidate->skills->pluck('name')->values()->all();
        }

        $context = $this->context($business, [
            'counterparty_role' => $role,
            'candidate_id' => $candidate->id,
            'profile' => $profile,
            'match' => $match->toArray(),
        ]);

        return ['business' => $business, 'candidate' => $candidate, 'context' => $context, 'match' => $match];
    }

    public function context(Business $business, array $matchContext): array
    {
        $role = $matchContext['counterparty_role'] ?? $matchContext['candidate_type'] ?? null;
        $businessData = $business->only(['id', 'name', 'description', 'industry', 'business_stage', 'location', 'risk_level', 'expected_involvement']);
        $profileFields = $role === 'professional'
            ? ['industry_experience', 'experience_level', 'availability', 'location', 'compensation_preferences', 'skills']
            : ['industry', 'business_stage', 'risk_level', 'location', 'involvement', 'available_investment', 'minimum_investment', 'maximum_investment', 'investment_types'];
        $profile = array_intersect_key($matchContext['profile'] ?? [], array_flip($profileFields));

        return [
            'formula_version' => self::FORMULA_VERSION,
            'business' => $businessData,
            'candidate' => [
                'counterparty_role' => $role,
                'id' => $matchContext['candidate_id'] ?? null,
                'profile' => $profile,
            ],
            'match' => [
                'overall_score' => $matchContext['match']['overall_score'] ?? null,
                'match_grade' => $matchContext['match']['match_grade'] ?? null,
                'summary_explanation' => $matchContext['match']['summary_explanation'] ?? null,
                'factors' => $matchContext['match']['factors'] ?? [],
                'strongest_alignments' => $matchContext['match']['strongest_alignments'] ?? [],
                'potential_gaps' => $matchContext['match']['potential_gaps'] ?? [],
            ],
        ];
    }

    public function fingerprint(Business $business, array $context): string
    {
        $snapshot = $this->normalizeContext($business, $context);

        return hash('sha256', json_encode($this->canonicalize($snapshot), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    public function current(Business $business, array $context): ?MatchingInsight
    {
        $snapshot = $this->normalizeContext($business, $context);
        $fingerprint = $this->fingerprint($business, $snapshot);
        $candidate = $snapshot['candidate'];

        return $business->matchingInsights()
            ->where('candidate_id', $candidate['id'])
            ->where('counterparty_role', $candidate['counterparty_role'])
            ->where('source_fingerprint', $fingerprint)
            ->first();
    }

    public function freshness(MatchingInsight $insight, User $user): array
    {
        try {
            $resolved = $this->resolve($user, $insight->business, $insight->counterparty_role, $insight->candidate_id);
            $currentFingerprint = $this->fingerprint($resolved['business'], $resolved['context']);

            return ['is_current' => hash_equals($insight->source_fingerprint, $currentFingerprint)];
        } catch (Throwable) {
            return ['is_current' => false];
        }
    }

    public function history(User $user, Business $business, string $role, int $candidateId)
    {
        $this->resolve($user, $business, $role, $candidateId);

        return $business->matchingInsights()
            ->where('candidate_id', $candidateId)
            ->where('counterparty_role', $role)
            ->orderByDesc('version')
            ->get();
    }

    public function generate(User $user, Business $business, string $role, int $candidateId): array
    {
        $lock = Cache::store('database')->lock('matching-insight:generate:'.$business->id.':'.$role.':'.$candidateId, 60);
        if (! $lock->get()) {
            throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
        }

        try {
            $initial = $this->resolve($user, $business, $role, $candidateId);
            if ($current = $this->current($business, $initial['context'])) {
                return [$current, false];
            }

            $provider = app(BusinessAnalysisService::class)->provider();
            if (! $provider->enabled()) {
                throw new AnalysisFailure('PROVIDER_UNAVAILABLE', 503);
            }

            try {
                $validated = MatchingInsightResult::fromJson($provider->matching($initial['context']));
                if ($validated->counterpartyRole !== $role) {
                    throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
                }
            } catch (AnalysisFailure $failure) {
                throw $failure;
            } catch (Throwable) {
                throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
            }

            $latest = $this->resolve($user, $business->fresh(), $role, $candidateId);
            if (! hash_equals($this->fingerprint($initial['business'], $initial['context']), $this->fingerprint($latest['business'], $latest['context']))) {
                throw new AnalysisFailure('SOURCE_CHANGED', 409);
            }

            try {
                return $this->persist($latest['business'], $latest['context'], $validated);
            } catch (UniqueConstraintViolationException) {
                $current = $this->current($latest['business'], $latest['context']);
                if ($current !== null) {
                    return [$current, false];
                }

                throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
            }
        } finally {
            $lock->release();
        }
    }

    public function persist(Business $business, array $context, MatchingInsightResult $result): array
    {
        $snapshot = $this->normalizeContext($business, $context);
        $fingerprint = $this->fingerprint($business, $snapshot);
        $candidate = $snapshot['candidate'];

        return DB::transaction(function () use ($business, $snapshot, $fingerprint, $candidate, $result) {
            $current = $business->matchingInsights()
                ->where('candidate_id', $candidate['id'])
                ->where('counterparty_role', $candidate['counterparty_role'])
                ->where('source_fingerprint', $fingerprint)
                ->first();
            if ($current !== null) {
                return [$current, false];
            }

            $latest = $business->matchingInsights()
                ->where('candidate_id', $candidate['id'])
                ->where('counterparty_role', $candidate['counterparty_role'])
                ->lockForUpdate()
                ->max('version');

            $insight = new MatchingInsight;
            $insight->forceFill([
                'business_id' => $business->id,
                'candidate_type' => $candidate['counterparty_role'],
                'candidate_id' => $candidate['id'],
                'counterparty_role' => $candidate['counterparty_role'],
                'version' => ($latest ?? 0) + 1,
                'formula_version' => $snapshot['formula_version'],
                'output_contract_version' => self::OUTPUT_CONTRACT_VERSION,
                'source_snapshot' => $snapshot,
                'source_fingerprint' => $fingerprint,
                'summary' => $result->summary,
                'factor_explanations' => $result->factorExplanations,
                'confidence' => $result->confidence,
                'strengths' => $result->strengths,
                'weaknesses' => $result->weaknesses,
                'opportunities' => $result->opportunities,
                'risks' => $result->risks,
                'recommendations' => $result->recommendations,
                'generated_at' => now(),
            ]);
            $insight->save();

            return [$insight, true];
        });
    }

    protected function normalizeContext(Business $business, array $context): array
    {
        if (isset($context['business'], $context['candidate'], $context['match'], $context['formula_version'])) {
            return $this->canonicalize($context);
        }

        return $this->canonicalize($this->context($business, $context));
    }

    protected function canonicalize(array $value): array
    {
        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->canonicalize($item);
            }
        }
        ksort($value);

        return $value;
    }
}
