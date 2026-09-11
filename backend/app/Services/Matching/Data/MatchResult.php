<?php

namespace App\Services\Matching\Data;

final class MatchResult
{
    /**
     * @param  array<int, MatchFactorResult>  $factors
     */
    public function __construct(
        public readonly int $overallScore,
        public readonly string $matchGrade,
        public readonly string $summaryExplanation,
        public readonly array $factors,
        public readonly array $strongestAlignments,
        public readonly array $potentialGaps,
        public readonly string $disclaimer = 'Match scores are recommendations, not guarantees. Review the underlying information before making decisions.',
    ) {}

    /**
     * @param  array<int, MatchFactorResult>  $factors
     */
    public static function fromFactors(array $factors): self
    {
        $totalWeighted = 0.0;
        foreach ($factors as $factor) {
            $totalWeighted += ($factor->score * $factor->weight * 100);
        }

        $overallScore = (int) max(0, min(100, round($totalWeighted)));

        $matchGrade = match (true) {
            $overallScore >= 80 => 'Strong Match',
            $overallScore >= 65 => 'Good Match',
            $overallScore >= 50 => 'Moderate Match',
            default => 'Weak Match',
        };

        // Strongest alignments: factors with score >= 0.7, sorted descending by score then weight
        $alignments = array_values(array_filter($factors, fn (MatchFactorResult $f) => $f->score >= 0.70));
        usort($alignments, function (MatchFactorResult $a, MatchFactorResult $b) {
            if ($a->score === $b->score) {
                return $b->weight <=> $a->weight;
            }

            return $b->score <=> $a->score;
        });

        // Potential gaps: factors with score < 0.50, sorted ascending by score
        $gaps = array_values(array_filter($factors, fn (MatchFactorResult $f) => $f->score < 0.50));
        usort($gaps, fn (MatchFactorResult $a, MatchFactorResult $b) => $a->score <=> $b->score);

        // Generate concise summary explanation
        $summaryExplanation = self::buildSummaryExplanation($overallScore, $alignments, $gaps);

        return new self(
            overallScore: $overallScore,
            matchGrade: $matchGrade,
            summaryExplanation: $summaryExplanation,
            factors: $factors,
            strongestAlignments: $alignments,
            potentialGaps: $gaps,
        );
    }

    /**
     * @param  array<int, MatchFactorResult>  $alignments
     * @param  array<int, MatchFactorResult>  $gaps
     */
    private static function buildSummaryExplanation(int $score, array $alignments, array $gaps): string
    {
        if ($score >= 80 && ! empty($alignments)) {
            $topNames = array_map(fn (MatchFactorResult $f) => $f->factorName, array_slice($alignments, 0, 3));

            return 'Strong alignment across '.implode(', ', $topNames).'.';
        }

        if ($score >= 50) {
            if (! empty($alignments) && ! empty($gaps)) {
                return 'Good compatibility in '.$alignments[0]->factorName.', with minor gaps in '.$gaps[0]->factorName.'.';
            }

            return 'Moderate overall compatibility based on profile and preference criteria.';
        }

        if (! empty($gaps)) {
            $gapNames = array_map(fn (MatchFactorResult $f) => $f->factorName, array_slice($gaps, 0, 2));

            return 'Significant differences in '.implode(' and ', $gapNames).'.';
        }

        return 'Limited alignment across specified criteria.';
    }

    public function toArray(): array
    {
        return [
            'overall_score' => $this->overallScore,
            'match_grade' => $this->matchGrade,
            'summary_explanation' => $this->summaryExplanation,
            'factors' => array_map(fn (MatchFactorResult $f) => $f->toArray(), $this->factors),
            'strongest_alignments' => array_map(fn (MatchFactorResult $f) => $f->toArray(), $this->strongestAlignments),
            'potential_gaps' => array_map(fn (MatchFactorResult $f) => $f->toArray(), $this->potentialGaps),
            'disclaimer' => $this->disclaimer,
        ];
    }
}
