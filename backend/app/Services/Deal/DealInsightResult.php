<?php

namespace App\Services\Deal;

use App\Services\BusinessAnalysis\AnalysisFailure;

final readonly class DealInsightResult
{
    public const LIST_FIELDS = ['key_points', 'open_items', 'discussion_points', 'cautions'];

    public const FORBIDDEN_FIELDS = [
        'advance_deal',
        'deal_stage_decision',
        'next_stage_decision',
        'approve_deal',
        'reject_deal',
        'cancel_deal',
        'sign_nda',
        'approve_nda',
        'accept_proposal',
        'reject_proposal',
        'counter_proposal',
        'execute_agreement',
        'sign_agreement',
        'approve_milestone',
        'confirm_milestone',
        'reject_milestone',
        'release_funds',
        'funding_decision',
        'complete_deal',
        'verification_decision',
        'readiness_score',
        'match_score',
        'reputation_tier',
        'investment_decision',
        'score',
        'confidence',
        'current_stage',
    ];

    public function __construct(
        public string $summary,
        public string $currentStageSummary,
        public array $keyPoints,
        public array $openItems,
        public array $discussionPoints,
        public array $cautions,
    ) {}

    public static function schema(): array
    {
        $properties = [
            'summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2000],
            'current_stage_summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 1000],
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
            if (strlen($raw) > 49152 || ! mb_check_encoding($raw, 'UTF-8')) {
                throw new \UnexpectedValueException;
            }

            $data = json_decode($raw, false, 16, JSON_THROW_ON_ERROR);
            if (! $data instanceof \stdClass) {
                throw new \UnexpectedValueException;
            }

            $keys = array_keys(get_object_vars($data));
            $expected = ['summary', 'current_stage_summary', ...self::LIST_FIELDS];
            sort($keys);
            sort($expected);

            if ($keys !== $expected
                || ! self::text($data->summary, 2000)
                || ! self::text($data->current_stage_summary, 1000)) {
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

            foreach (self::FORBIDDEN_FIELDS as $forbidden) {
                if (property_exists($data, $forbidden)) {
                    throw new \UnexpectedValueException;
                }
            }

            return new self(
                summary: $data->summary,
                currentStageSummary: $data->current_stage_summary,
                keyPoints: $data->key_points,
                openItems: $data->open_items,
                discussionPoints: $data->discussion_points,
                cautions: $data->cautions,
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
        return [
            'summary' => $this->summary,
            'current_stage_summary' => $this->currentStageSummary,
            'key_points' => $this->keyPoints,
            'open_items' => $this->openItems,
            'discussion_points' => $this->discussionPoints,
            'cautions' => $this->cautions,
        ];
    }
}
