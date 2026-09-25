<?php

namespace App\Services\BusinessAnalysis;

use App\Models\Business;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Support\Facades\DB;

final class AnalysisInputBuilder
{
    public function capture(int $businessId, AnalysisProvider $provider): array
    {
        return DB::transaction(function () use ($businessId, $provider) {
            $business = Business::query()->lockForUpdate()->findOrFail($businessId);
            $requirements = $business->requirements()->lockForUpdate()->firstOrFail();
            $input = $business->readinessInputs()->orderByDesc('version')->lockForUpdate()->first();
            $readiness = app(ReadinessAssessmentService::class);
            $basis = $readiness->snapshot($business, $input, $requirements->funding_amount);
            $assessment = $business->readinessAssessments()->where('source_fingerprint', $readiness->fingerprint($basis))->lockForUpdate()->first();
            $reasons = [];
            // Match the existing readiness lifecycle without granting approval or publishing authority.
            if (! in_array($business->status->value, ['submitted', 'pending_approval', 'approved', 'published'], true)) {
                $reasons[] = 'BUSINESS_NOT_SUBMITTED';
            }
            if ($assessment === null) {
                $reasons[] = $business->readinessAssessments()->exists() ? 'ASSESSMENT_STALE' : 'ASSESSMENT_MISSING';
            }
            $fields = [];
            foreach (AnalysisContract::BUSINESS_FIELDS as $field) {
                $fields[$field] = $business->$field;
            }
            $fields['status'] = $business->status->value;
            $factors = [];
            foreach ($assessment?->factor_results ?? [] as $key => $factor) {
                $factors[$key] = ['missing_keys' => $factor['missing_inputs'], 'is_incomplete' => $factor['is_incomplete'], 'is_weak' => $factor['is_weak'], 'reason_codes' => $factor['reason_codes']];
            }
            $snapshot = [
                'business' => $fields,
                'funding' => ['amount' => $requirements->funding_amount, 'currency' => 'BDT'],
                'readiness_input' => ['id' => $input?->id, 'version' => $input?->version, 'schema_version' => $input?->schema_version, 'answers' => $input?->answers ?? []],
                'assessment' => ['id' => $assessment?->id, 'version' => $assessment?->version, 'rubric_version' => $assessment?->rubric_version, 'source_fingerprint' => $assessment?->source_fingerprint, 'factors' => $factors, 'suggestions' => $assessment?->suggestions ?? []],
                'configuration' => AnalysisContract::versions() + ['provider_identifier' => $provider->identifier(), 'model_identifier' => $provider->modelIdentifier()],
            ];

            return ['snapshot' => $snapshot, 'fingerprint' => AnalysisContract::fingerprint($snapshot), 'eligibility_reasons' => $reasons];
        });
    }
}
