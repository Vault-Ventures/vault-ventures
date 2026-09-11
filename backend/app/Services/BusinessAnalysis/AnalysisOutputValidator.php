<?php

namespace App\Services\BusinessAnalysis;

use JsonException;
use stdClass;

final class AnalysisOutputValidator
{
    private function check(bool $condition): void
    {
        if (! $condition) {
            throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
        }
    }

    private function object(mixed $value, array $keys): void
    {
        $this->check($value instanceof stdClass);
        $actual = array_keys(get_object_vars($value));
        sort($actual);
        sort($keys);
        $this->check($actual === $keys);
    }

    private function identifier(mixed $value): void
    {
        $this->check(is_string($value) && strlen($value) <= 128 && $value !== '');
    }

    private function list(mixed $value, int $min, int $max): void
    {
        $this->check(is_array($value) && array_is_list($value) && count($value) >= $min && count($value) <= $max);
    }

    public function validate(string $raw, array $snapshot): array
    {
        $this->check(strlen($raw) <= 8192 && mb_check_encoding($raw, 'UTF-8'));
        try {
            $output = json_decode($raw, false, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
        }
        $this->object($output, ['business_summary', 'information_coverage', 'review_points', 'recommended_actions']);
        $this->object($output->business_summary, ['source_refs']);
        $refs = $output->business_summary->source_refs;
        $this->list($refs, 1, 5);
        foreach ($refs as $ref) {
            $this->identifier($ref);
            $this->check(in_array($ref, AnalysisContract::BUSINESS_FIELDS, true));
            $this->check(($snapshot['business'][$ref] ?? null) !== null);
        }
        $this->check(count(array_unique($refs)) === count($refs));
        $factors = $snapshot['assessment']['factors'];
        $this->list($output->information_coverage, 8, 8);
        $seen = [];
        foreach ($output->information_coverage as $item) {
            $this->object($item, ['factor_key']);
            $this->identifier($item->factor_key);
            $this->check(isset($factors[$item->factor_key]) && ! isset($seen[$item->factor_key]));
            $seen[$item->factor_key] = true;
        }
        $this->check(count($seen) === count($factors));
        $this->list($output->review_points, 0, 8);
        $seen = [];
        foreach ($output->review_points as $item) {
            $this->object($item, ['factor_key', 'condition_code']);
            $this->identifier($item->factor_key);
            $this->identifier($item->condition_code);
            $this->check(isset($factors[$item->factor_key]) && in_array($item->condition_code, AnalysisContract::CONDITIONS, true));
            $factor = $factors[$item->factor_key];
            $valid = match ($item->condition_code) {
                'missing_input' => $factor['missing_keys'] !== [],
                'weak_factor' => $factor['is_weak'] === true,
                'funding_conflict' => $item->factor_key === 'funding_requirement_realism' && in_array('FUNDING_DEPENDENCY_CONFLICT', $factor['reason_codes'], true),
            };
            $key = $item->factor_key.':'.$item->condition_code;
            $this->check($valid && ! isset($seen[$key]));
            $seen[$key] = true;
        }
        $this->list($output->recommended_actions, 0, 8);
        $seen = [];
        $allowed = array_column($snapshot['assessment']['suggestions'], 'id');
        foreach ($output->recommended_actions as $item) {
            $this->object($item, ['suggestion_id']);
            $this->identifier($item->suggestion_id);
            $this->check(in_array($item->suggestion_id, $allowed, true) && ! isset($seen[$item->suggestion_id]));
            $seen[$item->suggestion_id] = true;
        }

        return json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    }
}
