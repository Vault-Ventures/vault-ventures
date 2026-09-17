<?php

namespace App\Services\Readiness;

use App\Enums\BusinessStatus;
use App\Models\Business;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessInputVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class ReadinessAssessmentService
{
    public function snapshot(Business $business, ?ReadinessInputVersion $input, ?string $funding): array
    {
        return ['business_id' => $business->id, 'business_status' => $business->status->value,
            'readiness_input_version_id' => $input?->id, 'input_version' => $input?->version,
            'input_schema_version' => $input?->schema_version, 'rubric_version' => ReadinessRubric::VERSION,
            'funding_amount' => $funding, 'currency' => 'BDT'];
    }

    public function fingerprint(array $snapshot): string
    {
        return hash('sha256', json_encode($snapshot, JSON_THROW_ON_ERROR));
    }

    public function currentSnapshot(Business $business): array
    {
        return $this->snapshot($business->fresh(),
            $business->readinessInputs()->orderByDesc('version')->first(),
            $business->requirements()->firstOrFail()->funding_amount);
    }

    public function freshness(ReadinessAssessment $assessment, array $current): array
    {
        $reasons = [];
        $old = $assessment->source_snapshot;
        if (! in_array($current['business_status'], ['submitted', 'pending_approval', 'approved', 'published'], true)) {
            $reasons[] = 'BUSINESS_NOT_SUBMITTED';
        }
        if ($current['readiness_input_version_id'] !== $old['readiness_input_version_id']) {
            $reasons[] = 'INPUT_REVISION_CHANGED';
        }
        if ($current['input_schema_version'] !== $old['input_schema_version']) {
            $reasons[] = 'INPUT_SCHEMA_CHANGED';
        }
        if ($current['funding_amount'] !== $old['funding_amount']) {
            $reasons[] = 'FUNDING_AMOUNT_CHANGED';
        }
        if ($current['rubric_version'] !== $old['rubric_version']) {
            $reasons[] = 'RUBRIC_CHANGED';
        }

        return ['is_current' => $reasons === [] && $assessment->source_fingerprint === $this->fingerprint($current),
            'stale_reasons' => $reasons];
    }

    public function assess(int $businessId): array
    {
        return DB::transaction(function () use ($businessId) {
            $business = Business::query()->lockForUpdate()->findOrFail($businessId);
            if ($business->status === BusinessStatus::Draft || $business->status === BusinessStatus::Rejected) {
                throw ValidationException::withMessages(['business' => ['The business must be submitted before assessment.']]);
            }
            $requirements = $business->requirements()->lockForUpdate()->firstOrFail();
            $input = $business->readinessInputs()->orderByDesc('version')->lockForUpdate()->first();
            if ($input === null) {
                throw ValidationException::withMessages(['readiness_inputs' => ['Save a readiness-input revision before assessment.']]);
            }
            if ($input->schema_version !== ReadinessRubric::INPUT_SCHEMA_VERSION) {
                throw ValidationException::withMessages(['readiness_inputs' => ['The input schema is not supported by the current rubric.']]);
            }
            $snapshot = $this->snapshot($business, $input, $requirements->funding_amount);
            $fingerprint = $this->fingerprint($snapshot);
            $existing = $business->readinessAssessments()->where('source_fingerprint', $fingerprint)->lockForUpdate()->first();
            if ($existing !== null) {
                return [$existing, false];
            }
            $result = app(ReadinessScoringEngine::class)->calculate($input->answers, $requirements->funding_amount);
            $latest = $business->readinessAssessments()->orderByDesc('version')->lockForUpdate()->first();
            $assessment = new ReadinessAssessment;
            $assessment->forceFill($result + [
                'business_id' => $business->id, 'readiness_input_version_id' => $input->id,
                'version' => ($latest?->version ?? 0) + 1, 'input_version' => $input->version,
                'input_schema_version' => $input->schema_version, 'rubric_version' => ReadinessRubric::VERSION,
                'source_snapshot' => $snapshot, 'source_fingerprint' => $fingerprint, 'evaluated_at' => now(),
            ]);
            $assessment->save();

            return [$assessment, true];
        }, 3);
    }

    public function recalculateSafely(int $businessId): void
    {
        try {
            $business = Business::find($businessId);
            if ($business === null || in_array($business->status, [BusinessStatus::Draft, BusinessStatus::Rejected], true) || ! $business->readinessInputs()->exists()) {
                return;
            }
            $this->assess($businessId);
        } catch (Throwable $exception) {
            // Source data is already committed; even logging failure must not reverse its success response.
            try {
                Log::error('Readiness recalculation failed.', ['business_id' => $businessId, 'exception_type' => $exception::class]);
            } catch (Throwable) { /* Source success is preserved. */
            }
        }
    }
}
