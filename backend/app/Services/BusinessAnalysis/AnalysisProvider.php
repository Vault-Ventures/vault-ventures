<?php

namespace App\Services\BusinessAnalysis;

interface AnalysisProvider
{
    public function identifier(): string;

    public function modelIdentifier(): ?string;

    public function enabled(): bool;

    public function generate(array $snapshot): string;
}
