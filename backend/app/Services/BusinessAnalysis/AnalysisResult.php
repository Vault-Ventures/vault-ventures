<?php

namespace App\Services\BusinessAnalysis;

/** Validated advisory output for the version 2 contract. */
final readonly class AnalysisResult
{
    public const LIST_FIELDS = ['strengths', 'weaknesses', 'opportunities', 'risks', 'recommendations'];

    private function __construct(public string $summary, public array $strengths, public array $weaknesses, public array $opportunities, public array $risks, public array $recommendations) {}

    public static function schema(): array
    {
        $properties = ['summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2000]];
        foreach (self::LIST_FIELDS as $field) {
            $properties[$field] = ['type' => 'array', 'maxItems' => 8, 'items' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 1000]];
        }

        return ['type' => 'object', 'properties' => $properties, 'required' => array_keys($properties), 'additionalProperties' => false];
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
            $expected = ['summary', ...self::LIST_FIELDS];
            sort($keys);
            sort($expected);
            if ($keys !== $expected || ! self::text($data->summary, 2000)) {
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

            return new self($data->summary, $data->strengths, $data->weaknesses, $data->opportunities, $data->risks, $data->recommendations);
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
