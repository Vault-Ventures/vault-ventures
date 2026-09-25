<?php

namespace App\Services\BusinessAnalysis;

/** Explicit outbound boundary: no models, identity records, documents or history. */
final readonly class AnalysisInput
{
    public array $business;

    public function __construct(array $business)
    {
        $safe = [];
        foreach (AnalysisContract::BUSINESS_FIELDS as $field) {
            $value = $business[$field] ?? null;
            if ($value !== null && (! is_string($value) || ! mb_check_encoding($value, 'UTF-8') || strlen($value) > 12000)) {
                throw new AnalysisFailure('INVALID_ANALYSIS_INPUT', 422);
            }
            $safe[$field] = $value;
        }
        $this->business = $safe;
    }
}
