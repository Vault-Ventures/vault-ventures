<?php

namespace App\Services\BusinessAnalysis;

use RuntimeException;

final class AnalysisFailure extends RuntimeException
{
    public function __construct(public readonly string $reason, public readonly int $status)
    {
        parent::__construct(match ($reason) {
            'ANALYSIS_DISABLED' => 'Business analysis generation is disabled.',
            'INVALID_ANALYSIS_OUTPUT' => 'The adapter returned invalid analysis output.',
            'SOURCE_CHANGED' => 'Business analysis sources changed. Please try again.',
            'GENERATION_IN_PROGRESS' => 'Business analysis generation is already in progress.',
            'GENERATION_LOCK_LOST' => 'The generation lock expired or is no longer owned.',
            'ANALYSIS_RATE_LIMIT' => 'The business analysis generation limit has been reached.',
            default => 'Business analysis is unavailable.',
        });
    }
}
