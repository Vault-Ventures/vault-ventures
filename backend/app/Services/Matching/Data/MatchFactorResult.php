<?php

namespace App\Services\Matching\Data;

final class MatchFactorResult
{
    public function __construct(
        public readonly string $factorKey,
        public readonly string $factorName,
        public readonly float $weight,
        public readonly float $score,
        public readonly string $explanation,
    ) {}

    public function weightedScore(): float
    {
        return round($this->score * $this->weight * 100, 2);
    }

    public function strength(): string
    {
        return match (true) {
            $this->score >= 0.80 => 'Strong',
            $this->score >= 0.60 => 'Good',
            $this->score >= 0.40 => 'Moderate',
            default => 'Weak',
        };
    }

    public function toArray(): array
    {
        return [
            'factor_key' => $this->factorKey,
            'factor_name' => $this->factorName,
            'weight' => $this->weight,
            'weight_percentage' => (int) round($this->weight * 100),
            'score' => round($this->score, 4),
            'weighted_score' => $this->weightedScore(),
            'strength' => $this->strength(),
            'explanation' => $this->explanation,
        ];
    }
}
