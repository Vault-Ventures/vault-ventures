<?php

namespace App\Services\Admin;

use App\Services\BusinessAnalysis\AnalysisFailure;

final readonly class AdminInsightResult
{
    public const LIST_FIELDS = [
        'governance_observations',
        'operational_highlights',
        'attention_areas',
        'suggested_review_points',
    ];

    public const FORBIDDEN_FIELDS = [
        'approve_verification',
        'reject_verification',
        'verification_decision',
        'verification_score',
        'recommended_verification_action',
        'ban_user',
        'suspend_user',
        'change_role',
        'grant_admin',
        'revoke_admin',
        'advance_deal',
        'cancel_deal',
        'approve_deal',
        'release_funds',
        'resolve_discrepancy',
        'readiness_score',
        'match_score',
        'reputation_tier',
        'investment_decision',
        'admin_action',
        'recommended_action',
        'execute_action',
        'score',
        'confidence',
    ];

    public function __construct(
        public string $summary,
        public array $governanceObservations,
        public array $operationalHighlights,
        public array $attentionAreas,
        public array $suggestedReviewPoints,
    ) {}

    public static function schema(): array
    {
        $properties = [
            'summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2000],
        ];

        foreach (self::LIST_FIELDS as $field) {
            $properties[$field] = [
                'type' => 'array',
                'minItems' => 0,
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
            if (strlen($raw) > 65536 || ! mb_check_encoding($raw, 'UTF-8')) {
                throw new \UnexpectedValueException;
            }

            $data = json_decode($raw, false, 16, JSON_THROW_ON_ERROR);
            if (! $data instanceof \stdClass) {
                throw new \UnexpectedValueException;
            }

            $rawKeys = array_keys(get_object_vars($data));

            // Check for forbidden authority fields
            foreach ($rawKeys as $key) {
                if (in_array(strtolower($key), self::FORBIDDEN_FIELDS, true)) {
                    throw new AnalysisFailure('FORBIDDEN_AUTHORITY_FIELD_DETECTED', 502);
                }
            }

            $expected = ['summary', ...self::LIST_FIELDS];
            sort($rawKeys);
            sort($expected);

            if ($rawKeys !== $expected || ! self::text($data->summary, 2000)) {
                throw new \UnexpectedValueException;
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

            return new self(
                summary: trim($data->summary),
                governanceObservations: array_values(array_map('trim', $data->governance_observations)),
                operationalHighlights: array_values(array_map('trim', $data->operational_highlights)),
                attentionAreas: array_values(array_map('trim', $data->attention_areas)),
                suggestedReviewPoints: array_values(array_map('trim', $data->suggested_review_points)),
            );
        } catch (AnalysisFailure $failure) {
            throw $failure;
        } catch (\Throwable) {
            throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
        }
    }

    private static function text(mixed $value, int $maxLength): bool
    {
        return is_string($value)
            && trim($value) !== ''
            && mb_strlen($value, 'UTF-8') <= $maxLength;
    }

    public function toArray(): array
    {
        return [
            'summary' => $this->summary,
            'governance_observations' => $this->governanceObservations,
            'operational_highlights' => $this->operationalHighlights,
            'attention_areas' => $this->attentionAreas,
            'suggested_review_points' => $this->suggestedReviewPoints,
        ];
    }
}
