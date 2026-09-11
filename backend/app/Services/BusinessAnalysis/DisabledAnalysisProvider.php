<?php

namespace App\Services\BusinessAnalysis;

final class DisabledAnalysisProvider implements AnalysisProvider
{
    public function identifier(): string
    {
        return 'disabled';
    }

    public function modelIdentifier(): ?string
    {
        return null;
    }

    public function enabled(): bool
    {
        return false;
    }

    public function generate(array $snapshot): string
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }
}
