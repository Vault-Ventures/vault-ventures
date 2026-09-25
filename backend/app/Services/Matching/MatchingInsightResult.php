<?php

namespace App\Services\Matching;

use App\Services\BusinessAnalysis\AnalysisFailure;

final readonly class MatchingInsightResult
{
    public const INVESTOR_FACTORS = ['industry', 'investment_range', 'business_stage', 'risk_level', 'location', 'involvement'];

    public const PROFESSIONAL_FACTORS = ['skills', 'industry_experience', 'experience_level', 'availability', 'location', 'compensation'];

    public const LIST_FIELDS = ['strengths', 'weaknesses', 'opportunities', 'risks', 'recommendations'];

    private function __construct(
        public string $counterpartyRole,
        public string $summary,
        public array $factorExplanations,
        public float $confidence,
        public array $strengths,
        public array $weaknesses,
        public array $opportunities,
        public array $risks,
        public array $recommendations,
    ) {}

    public static function schema(): array
    {
        $properties = [
            'counterparty_role' => ['type' => 'string', 'enum' => ['investor', 'professional']],
            'summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2000],
            'factor_explanations' => [
                'type' => 'array',
                'minItems' => 1,
                'maxItems' => 6,
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'factor_key' => ['type' => 'string'],
                        'explanation' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 1000],
                        'confidence' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                    ],
                    'required' => ['factor_key', 'explanation', 'confidence'],
                    'additionalProperties' => false,
                ],
            ],
            'confidence' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
        ];

        foreach (self::LIST_FIELDS as $field) {
            $properties[$field] = [
                'type' => 'array',
                'maxItems' => 8,
                'items' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 1000],
            ];
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => array_keys($properties),
            'additionalProperties' => false,
        ];
    }

    public static function fromJson(string $raw): self
    {
        try {
            if (strlen($raw) > 49152 || ! mb_check_encoding($raw, 'UTF-8')) {
                throw new \UnexpectedValueException;
            }

            $data = json_decode($raw, false, 16, JSON_THROW_ON_ERROR);
            if (! $data instanceof \stdClass) {
                throw new \UnexpectedValueException;
            }

            $keys = array_keys(get_object_vars($data));
            $expected = ['counterparty_role', 'summary', 'factor_explanations', 'confidence', ...self::LIST_FIELDS];
            sort($keys);
            sort($expected);

            if ($keys !== $expected || ! in_array($data->counterparty_role, ['investor', 'professional'], true)
                || ! self::text($data->summary, 2000) || (! is_int($data->confidence) && ! is_float($data->confidence))
                || $data->confidence < 0 || $data->confidence > 1 || ! is_array($data->factor_explanations)
                || count($data->factor_explanations) < 1 || count($data->factor_explanations) > 6) {
                throw new \UnexpectedValueException;
            }

            $allowedFactors = $data->counterparty_role === 'investor' ? self::INVESTOR_FACTORS : self::PROFESSIONAL_FACTORS;
            $factorKeys = [];
            foreach ($data->factor_explanations as $factor) {
                if (! is_object($factor) || array_diff(array_keys(get_object_vars($factor)), ['factor_key', 'explanation', 'confidence']) !== []
                    || ! isset($factor->factor_key, $factor->explanation, $factor->confidence)
                    || ! in_array($factor->factor_key, $allowedFactors, true)
                    || in_array($factor->factor_key, $factorKeys, true)
                    || ! self::text($factor->explanation, 1000)
                    || (! is_int($factor->confidence) && ! is_float($factor->confidence)) || $factor->confidence < 0 || $factor->confidence > 1) {
                    throw new \UnexpectedValueException;
                }
                $factorKeys[] = $factor->factor_key;
            }

            foreach (self::LIST_FIELDS as $field) {
                if (! is_array($data->$field) || count($data->$field) > 8) {
                    throw new \UnexpectedValueException;
                }

                foreach ($data->$field as $item) {
                    if (! self::text($item, 1000)) {
                        throw new \UnexpectedValueException;
                    }
                }
            }

            foreach (['score', 'match_score', 'overall_score', 'adjusted_score', 'recommended_score', 'predicted_score', 'rank', 'ranking', 'rerank', 'candidate_rank', 'decision', 'eligibility_decision', 'approval_decision', 'verification_decision', 'investment_decision', 'connection_decision', 'match_grade', 'summary_explanation', 'disclaimer'] as $forbidden) {
                if (property_exists($data, $forbidden)) {
                    throw new \UnexpectedValueException;
                }
            }

            return new self(
                counterpartyRole: $data->counterparty_role,
                summary: $data->summary,
                factorExplanations: array_map(fn (object $factor) => get_object_vars($factor), $data->factor_explanations),
                confidence: (float) $data->confidence,
                strengths: $data->strengths,
                weaknesses: $data->weaknesses,
                opportunities: $data->opportunities,
                risks: $data->risks,
                recommendations: $data->recommendations,
            );
        } catch (\JsonException|\UnexpectedValueException) {
            throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
        }
    }

    private static function text(mixed $value, int $limit): bool
    {
        return is_string($value) && trim($value) !== '' && mb_strlen($value) <= $limit;
    }

    public function toArray(): array
    {
        return get_object_vars($this);
    }
}