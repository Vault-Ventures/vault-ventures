<?php

namespace App\Services\Readiness;

use App\Models\Business;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessInsight;
use App\Models\User;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Throwable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ReadinessInsightService
{
    public function capture(Business $business): array
    {
        $latest = $business->readinessAssessments()->orderByDesc('version')->first();
        if ($latest === null) {
            return ['assessment' => null, 'eligibility_reasons' => ['ASSESSMENT_MISSING']];
        }

        $snapshot = app(ReadinessAssessmentService::class)->currentSnapshot($business);
        $freshness = app(ReadinessAssessmentService::class)->freshness($latest, $snapshot);

        return ['assessment' => $latest, 'eligibility_reasons' => $freshness['is_current'] ? [] : ['ASSESSMENT_STALE']];
    }

    public function context(Business $business, ReadinessAssessment $assessment): array
    {
        return [
            'business' => $business->only(['name', 'description', 'industry', 'business_stage', 'location']),
            'readiness' => $assessment->only(['overall_score', 'factor_results', 'weak_areas', 'suggestions']),
            'assessment' => $assessment->only(['id', 'version', 'input_version', 'input_schema_version', 'rubric_version', 'source_fingerprint']),
        ];
    }

    public function fingerprint(Business $business, ReadinessAssessment $assessment): string
    {
        return hash('sha256', json_encode($this->context($business, $assessment), JSON_THROW_ON_ERROR));
    }

    public function current(Business $business, array $state): ?ReadinessInsight
    {
        if ($state['assessment'] === null || $state['eligibility_reasons'] !== []) {
            return null;
        }
        return $business->readinessInsights()->where('source_fingerprint', $this->fingerprint($business, $state['assessment']))->first();
    }

    public function freshness(ReadinessInsight $insight): array
    {
        $business = $insight->business()->firstOrFail();
        $state = $this->capture($business);
        return ['is_current' => $state['assessment'] !== null && $state['eligibility_reasons'] === []
            && hash_equals($insight->source_fingerprint, $this->fingerprint($business, $state['assessment']))];
    }

    public function metadata(Business $business): array
    {
        $provider = app(BusinessAnalysisService::class)->provider();
        $state = $this->capture($business);
        return ['generation_enabled' => $provider->enabled(),
            'provider_status' => $provider->enabled() ? 'configured' : ($provider->identifier() === 'disabled' ? 'disabled' : 'not_configured'),
            'remote_health' => 'not_checked', 'eligible' => $state['eligibility_reasons'] === [],
            'eligibility_reasons' => $state['eligibility_reasons'], 'current_version' => $this->current($business, $state)?->version];
    }

    private function assertAdvisory(array $payload): void
    {
        // Reject explicit replacement-score and platform-decision claims even inside prose.
        // This is a conservative boundary check, not a general-purpose factual verifier.
        $text = implode("\n", [$payload['summary'], ...array_merge(...array_values(array_diff_key($payload, ['summary' => true])))]);
        $forbidden = [
            '/\b(?:AI|new|replacement|adjusted|updated)\s+readiness\s+score\b/i',
            '/\breadiness\s+score\s+(?:is\s+now|has\s+been\s+(?:set|changed|updated))\b/i',
            '/\b(?:business|verification|funding|deal|NDA|agreement|milestone)\s+(?:is\s+|has\s+been\s+)(?:approved|verified|accepted|funded|completed)\b/i',
            '/\b(?:I|we|Vault Ventures)\s+(?:have\s+|has\s+)?(?:approved|verified|funded)\b/i',
        ];
        foreach ($forbidden as $pattern) {
            if (preg_match($pattern, $text)) {
                throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
            }
        }
    }

    public function generate(User $user, Business $business): array
    {
        Gate::forUser($user)->authorize('create', [ReadinessInsight::class, $business]);
        $state = $this->capture($business);
        if ($state['assessment'] === null) {
            throw ValidationException::withMessages(['readiness_assessment' => ['A current readiness assessment is required before generating insights.']]);
        }
        if ($state['eligibility_reasons'] !== []) {
            throw ValidationException::withMessages(['readiness_assessment' => ['The readiness assessment is stale; generate a fresh assessment before requesting insights.']]);
        }

        $provider = app(BusinessAnalysisService::class)->provider();
        $current = $this->current($business, $state);
        if ($current !== null) {
            return [$current, false];
        }

        $snapshot = $this->context($business, $state['assessment']);
        $fingerprint = $this->fingerprint($business, $state['assessment']);
        try {
            $payload = $provider->readiness($snapshot)->toArray();
            $this->assertAdvisory($payload);
        } catch (AnalysisFailure $failure) {
            throw $failure;
        } catch (Throwable) {
            throw new AnalysisFailure('ANALYSIS_ADAPTER_FAILURE', 503);
        }

        return DB::transaction(function () use ($user, $business, $snapshot, $fingerprint, $payload) {
            $owned = Business::query()->lockForUpdate()->findOrFail($business->id);
            Gate::forUser($user->fresh())->authorize('create', [ReadinessInsight::class, $owned]);
            $currentState = $this->capture($owned);
            if ($currentState['assessment'] === null || $currentState['eligibility_reasons'] !== []) {
                throw ValidationException::withMessages(['readiness_assessment' => ['The readiness assessment is not current.']]);
            }
            if (! hash_equals($fingerprint, $this->fingerprint($owned, $currentState['assessment']))) {
                throw new AnalysisFailure('SOURCE_CHANGED', 409);
            }
            $current = $this->current($owned, $currentState);
            if ($current !== null) {
                return [$current, false];
            }

            $latest = $owned->readinessInsights()->orderByDesc('version')->lockForUpdate()->first();
            $insight = new ReadinessInsight;
            $insight->forceFill([
                'business_id' => $owned->id,
                'readiness_assessment_id' => $currentState['assessment']->id,
                'version' => ($latest?->version ?? 0) + 1,
                'source_snapshot' => $snapshot,
                'source_fingerprint' => $fingerprint,
                'summary' => $payload['summary'],
                'strengths' => $payload['strengths'],
                'weaknesses' => $payload['weaknesses'],
                'opportunities' => $payload['opportunities'],
                'risks' => $payload['risks'],
                'recommendations' => $payload['recommendations'],
                'generated_at' => now(),
            ]);
            $insight->save();

            return [$insight, true];
        });
    }
}
