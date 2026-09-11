<?php

namespace Tests\Feature;

use App\Services\Readiness\ReadinessInputSchema;
use App\Services\Readiness\ReadinessRubric;
use App\Services\Readiness\ReadinessScoringEngine;
use Tests\TestCase;

class ReadinessScoringTest extends TestCase
{
    private function score(array $answers, ?string $funding = '100000.00'): array
    {
        return app(ReadinessScoringEngine::class)->calculate($answers, $funding);
    }

    private function example(): array
    {
        return [
            'market_customer_segment_identified' => true,
            'market_demand_evidence_sources' => ['published_research'],
            'business_model_revenue_methods' => ['service_fees'],
            'business_model_cost_categories_identified' => true,
            'competition_review_status' => 'reviewed_alternatives_found',
            'competition_differentiation_status' => 'founder_defined',
            'scalability_delivery_process_status' => 'defined_not_tried',
            'scalability_capacity_review_status' => 'constraints_identified',
            'founder_relevant_execution_experience' => true,
            'founder_capability_gap_status' => 'gaps_identified_with_plan',
            'funding_estimate_basis' => 'founder_estimate',
            'funding_use_plan_status' => 'uses_identified',
            'risk_review_status' => 'reviewed_risks_identified',
            'risk_response_status' => 'responses_planned',
            'customer_validation_methods' => ['prototype_testing'],
            'customer_validation_findings' => 'mixed',
        ];
    }

    public function test_approved_worked_examples_exact_rounding_and_weights(): void
    {
        $answers = $this->example();
        $result = $this->score($answers);
        $this->assertSame('71.88', $result['overall_score']);
        $this->assertSame(['75.00', '100.00', '75.00', '50.00', '100.00', '37.50', '87.50', '50.00'], array_column($result['factor_results'], 'score'));
        $this->assertSame(array_fill(0, 8, '12.50'), array_column($result['factor_results'], 'weight'));
        $this->assertFalse($result['is_incomplete']);
        unset($answers['scalability_delivery_process_status']);
        $this->assertSame('65.63', $this->score($answers)['overall_score']);
        $answers = $this->example();
        $answers['funding_estimate_basis'] = $answers['funding_use_plan_status'] = 'no_external_funding_planned';
        $this->assertSame('73.44', $this->score($answers, null)['overall_score']);
        $this->assertSame('73.44', $this->score($answers, '0.00')['overall_score']);
    }

    public function test_every_approved_option_mapping_and_questionnaire_coverage(): void
    {
        // Independent expected contract values, including low and neutral answers.
        $expected = [
            'market_customer_segment_identified' => [0, 100],
            'market_demand_evidence_sources' => [0, 25, 50, 75, 75, 100],
            'business_model_revenue_methods' => [0, 100, 100, 100, 100, 100, 100, 100],
            'business_model_cost_categories_identified' => [0, 100],
            'competition_review_status' => [0, 100, 100],
            'competition_differentiation_status' => [0, 50, 100],
            'scalability_delivery_process_status' => [0, 50, 100],
            'scalability_capacity_review_status' => [0, 50, 100],
            'founder_relevant_execution_experience' => [0, 100],
            'founder_capability_gap_status' => [0, 50, 25, 100],
            'funding_estimate_basis' => [0, 25, 75, 100, 50],
            'funding_use_plan_status' => [0, 50, 100, 50],
            'risk_review_status' => [0, 100, 50],
            'risk_response_status' => [0, 75, 100, 50],
            'customer_validation_methods' => [0, 25, 50, 75, 100],
            'customer_validation_findings' => [0, 25, 100, 50, 25],
        ];
        $seen = [];
        foreach (ReadinessRubric::FACTORS as [$factor, $name, $fields]) {
            foreach ($fields as [$field, $mapping]) {
                $seen[] = $field;
                $options = in_array($field, ReadinessInputSchema::BOOLEANS, true) ? [false, true]
                    : (ReadinessInputSchema::ENUMS[$field] ?? ReadinessInputSchema::LISTS[$field]);
                foreach ($options as $index => $option) {
                    $answers = [$field => isset(ReadinessInputSchema::LISTS[$field]) ? [$option] : $option];
                    if ($option === 'no_external_funding_planned') {
                        $answers = ['funding_estimate_basis' => $option, 'funding_use_plan_status' => $option];
                    }
                    $result = $this->score($answers, null)['factor_results'][$factor];
                    $this->assertSame($expected[$field][$index], $result['inputs'][$field]['contribution'], $field.':'.json_encode($option));
                }
            }
        }
        $this->assertCount(16, array_unique($seen));
        $this->assertEqualsCanonicalizing(array_keys($expected), $seen);
    }

    public function test_missing_null_false_and_max_selected_are_not_positive_defaults(): void
    {
        $empty = $this->score([], null);
        $this->assertSame('0.00', $empty['overall_score']);
        $this->assertCount(8, $empty['weak_areas']);
        $this->assertTrue($empty['is_incomplete']);
        $this->assertCount(17, $empty['suggestions']);
        foreach (array_keys($this->example()) as $field) {
            $answers = $this->example();
            $answers[$field] = null;
            $result = $this->score($answers);
            $affected = array_values(array_filter($result['factor_results'], fn ($f) => in_array($field, $f['missing_inputs'], true)));
            $this->assertCount(1, $affected);
            $this->assertSame('0.00', $affected[0]['score']);
            $this->assertTrue($affected[0]['is_incomplete']);
        }
        $answers = ['market_customer_segment_identified' => false, 'market_demand_evidence_sources' => ['founder_observation', 'published_research', 'observed_customer_behavior']];
        $market = $this->score($answers)['factor_results']['market_potential'];
        $this->assertSame('50.00', $market['score']);
        $this->assertFalse($market['is_incomplete']);
        $this->assertSame(100, $market['inputs']['market_demand_evidence_sources']['contribution']);
    }

    public function test_funding_null_zero_positive_maximum_and_conflict(): void
    {
        $answers = $this->example();
        $missing = $this->score($answers, null)['factor_results']['funding_requirement_realism'];
        $this->assertSame('0.00', $missing['score']);
        $this->assertTrue($missing['is_incomplete']);
        $this->assertContains('business_requirement.funding_amount', $missing['missing_inputs']);
        foreach (['0.00', '0.01', '9999999999999.99'] as $amount) {
            $this->assertSame('37.50', $this->score($answers, $amount)['factor_results']['funding_requirement_realism']['score']);
        }
        $answers['funding_estimate_basis'] = $answers['funding_use_plan_status'] = 'no_external_funding_planned';
        $conflict = $this->score($answers, '0.01')['factor_results']['funding_requirement_realism'];
        $this->assertSame('0.00', $conflict['score']);
        $this->assertTrue($conflict['is_incomplete']);
        $this->assertContains('FUNDING_DEPENDENCY_CONFLICT', $conflict['reason_codes']);
        $this->assertSame('funding.conflict', $conflict['suggestions'][0]['id']);
        $neutral = $this->score($answers, null)['factor_results']['funding_requirement_realism'];
        $this->assertSame('50.00', $neutral['score']);
        $this->assertFalse($neutral['is_incomplete']);
        $this->assertTrue($neutral['is_weak']);
        $this->assertSame('funding.none', $neutral['suggestions'][0]['id']);
    }

    public function test_every_fixed_template_is_reachable_with_its_exact_id_and_text(): void
    {
        $seen = [];
        foreach (ReadinessRubric::FACTORS as [$factor, $name, $fields]) {
            foreach ($fields as [$field, $mapping]) {
                foreach ($mapping as $option => $contribution) {
                    if ($contribution >= 60 || $option === 'no_external_funding_planned') {
                        continue;
                    }
                    $value = in_array($field, ReadinessInputSchema::BOOLEANS, true) ? $option === 'true'
                        : (isset(ReadinessInputSchema::LISTS[$field]) ? [$option] : $option);
                    $expected = ReadinessRubric::SUGGESTIONS[$field][$option] ?? ReadinessRubric::SUGGESTIONS[$field]['*'] ?? null;
                    if ($expected === null) {
                        continue;
                    }
                    $suggestions = $this->score([$field => $value])['factor_results'][$factor]['suggestions'];
                    $this->assertContains(['id' => $expected[0], 'text' => $expected[1]], $suggestions);
                    $seen[$expected[0]] = true;
                }
            }
        }
        $all = [];
        foreach (ReadinessRubric::SUGGESTIONS as $templates) {
            foreach ($templates as [$id]) {
                $all[$id] = true;
            }
        }
        $this->assertEqualsCanonicalizing(array_keys($all), array_keys($seen));
        $empty = $this->score([], null);
        foreach ($empty['suggestions'] as $suggestion) {
            if (str_starts_with($suggestion['id'], 'missing.')) {
                $field = substr($suggestion['id'], 8);
                $this->assertSame('Provide an answer for: '.ReadinessRubric::LABELS[$field].'.', $suggestion['text']);
            }
        }
        $this->assertContains([
            'id' => 'funding.missing',
            'text' => 'Record the funding requirement in BDT (৳), or explicitly state that no external funding is planned.',
            'factor' => 'funding_requirement_realism',
        ], $empty['suggestions']);
    }

    public function test_weak_suggestions_fixed_order_deduplication_and_reproducibility(): void
    {
        $result = $this->score($this->example());
        $this->assertSame(['scalability', 'funding_requirement_realism', 'customer_validation'], $result['weak_areas']);
        $this->assertSame(['scalability.try', 'scalability.respond', 'funding.estimate', 'funding.timing', 'customer.next', 'customer.mixed'], array_column($result['suggestions'], 'id'));
        $this->assertSame('Try the defined delivery process in practice and review the result.', $result['suggestions'][0]['text']);
        $this->assertEquals($result, $this->score($this->example()));
        $risk = $this->score(['risk_review_status' => 'reviewed_no_material_risks_identified', 'risk_response_status' => 'no_risks_identified'])['factor_results']['risk'];
        $this->assertCount(1, $risk['suggestions']);
        $this->assertSame('risk.revisit', $risk['suggestions'][0]['id']);
        $factor = $this->score(['market_customer_segment_identified' => false])['factor_results']['market_potential'];
        $this->assertSame(['missing.market_demand_evidence_sources', 'market.segment'], array_column($factor['suggestions'], 'id'));
        $answers = ['market_customer_segment_identified' => true, 'market_demand_evidence_sources' => ['founder_observation']];
        $this->assertFalse($this->score($answers)['factor_results']['market_potential']['is_weak']);
    }
}
