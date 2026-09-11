<?php

namespace App\Services\BusinessAnalysis;

use App\Services\Readiness\ReadinessRubric;

final class AnalysisRenderer
{
    public function render(array $output, array $snapshot): array
    {
        $summary = [];
        foreach ($output['business_summary']['source_refs'] as $ref) {
            $summary[] = ['source_ref' => $ref, 'value' => $snapshot['business'][$ref], 'basis' => 'Founder-provided'];
        }
        $definitions = [];
        foreach (ReadinessRubric::FACTORS as [$key,$name,$inputs]) {
            $definitions[$key] = ['name' => $name, 'keys' => array_column($inputs, 0)];
        }
        $coverage = [];
        foreach ($output['information_coverage'] as $item) {
            $factor = $definitions[$item['factor_key']];
            $answers = [];
            foreach ($factor['keys'] as $field) {
                $value = $snapshot['readiness_input']['answers'][$field] ?? null;
                $answers[] = ['input_key' => $field, 'status' => $value === null ? 'missing' : 'supplied', 'value' => $value];
            }
            $coverage[] = ['factor_key' => $item['factor_key'], 'name' => $factor['name'], 'inputs' => $answers];
        }
        $review = [];
        foreach ($output['review_points'] as $item) {
            $factor = $snapshot['assessment']['factors'][$item['factor_key']];
            $review[] = $item + ['label' => match ($item['condition_code']) {
                'missing_input' => 'Missing input','weak_factor' => 'Weak factor','funding_conflict' => 'Funding dependency conflict',
            }, 'basis' => 'Existing deterministic assessment', 'missing_keys' => $factor['missing_keys'], 'reason_codes' => $factor['reason_codes']];
        }
        $suggestions = array_column($snapshot['assessment']['suggestions'], null, 'id');
        $actions = [];
        foreach ($output['recommended_actions'] as $item) {
            $actions[] = $suggestions[$item['suggestion_id']];
        }

        return [
            'business_summary' => $summary, 'information_coverage' => $coverage, 'review_points' => $review, 'recommended_actions' => $actions,
            'funding' => ['amount' => $snapshot['funding']['amount'], 'currency' => 'BDT', 'presence' => $snapshot['funding']['amount'] === null ? 'missing' : 'supplied', 'conflict' => in_array('FUNDING_DEPENDENCY_CONFLICT', $snapshot['assessment']['factors']['funding_requirement_realism']['reason_codes'], true)],
            'basis' => 'Founder-provided information and existing deterministic findings. This presentation is not an independent evaluation or a readiness verdict.',
        ];
    }
}
