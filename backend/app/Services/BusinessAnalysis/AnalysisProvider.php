<?php

namespace App\Services\BusinessAnalysis;

interface AnalysisProvider
{
    public function matching(array $snapshot): string;

    public function deal(array $snapshot): string;

    public function admin(array $snapshot): string;

    public function readiness(array $snapshot): AnalysisResult;

    public function identifier(): string;

    public function modelIdentifier(): ?string;

    public function enabled(): bool;

    public function generate(array $snapshot): string;

    /** Typed advisory contract used by version 2 business analysis generation. */
    public function analyze(AnalysisInput $input): AnalysisResult;
}
