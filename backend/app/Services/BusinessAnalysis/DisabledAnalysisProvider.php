<?php

namespace App\Services\BusinessAnalysis;

final class DisabledAnalysisProvider implements AnalysisProvider
{
    public function matching(array $snapshot): string
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }

    public function deal(array $snapshot): string
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }

    public function admin(array $snapshot): string
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }

    public function readiness(array $snapshot): AnalysisResult
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }

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

    public function analyze(AnalysisInput $input): AnalysisResult
    {
        throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
    }
}
