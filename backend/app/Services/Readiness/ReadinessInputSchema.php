<?php

namespace App\Services\Readiness;

use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class ReadinessInputSchema
{
    public const VERSION = '1';

    public const BOOLEANS = ['market_customer_segment_identified', 'business_model_cost_categories_identified', 'founder_relevant_execution_experience'];

    public const ENUMS = [
        'competition_review_status' => ['not_reviewed', 'reviewed_alternatives_found', 'reviewed_none_identified'],
        'competition_differentiation_status' => ['not_defined', 'founder_defined', 'discussed_with_target_customers'],
        'scalability_delivery_process_status' => ['not_defined', 'defined_not_tried', 'tried_in_practice'],
        'scalability_capacity_review_status' => ['not_reviewed', 'constraints_identified', 'constraints_and_response_plan_identified'],
        'founder_capability_gap_status' => ['not_reviewed', 'reviewed_no_gaps_identified', 'gaps_identified_without_plan', 'gaps_identified_with_plan'],
        'funding_estimate_basis' => ['not_prepared', 'founder_estimate', 'itemized_cost_estimate', 'supplier_quotes_or_prior_actual_costs', 'no_external_funding_planned'],
        'funding_use_plan_status' => ['not_defined', 'uses_identified', 'uses_and_timing_identified', 'no_external_funding_planned'],
        'risk_review_status' => ['not_reviewed', 'reviewed_risks_identified', 'reviewed_no_material_risks_identified'],
        'risk_response_status' => ['not_prepared', 'responses_planned', 'responses_tried', 'no_risks_identified'],
        'customer_validation_findings' => ['not_collected', 'insufficient_to_conclude', 'mainly_supportive', 'mixed', 'mainly_unsupportive'],
    ];

    public const LISTS = [
        'market_demand_evidence_sources' => ['not_investigated', 'founder_observation', 'published_research', 'customer_conversations', 'survey_results', 'observed_customer_behavior'],
        'business_model_revenue_methods' => ['not_defined', 'product_sales', 'service_fees', 'subscriptions', 'transaction_commissions', 'licensing', 'advertising', 'other'],
        'customer_validation_methods' => ['not_started', 'concept_feedback', 'prototype_testing', 'pilot_usage', 'paid_usage'],
    ];

    public static function rules(): array
    {
        $keys = array_merge(self::BOOLEANS, array_keys(self::ENUMS), array_keys(self::LISTS));
        $rules = ['answers' => ['present', 'array:'.implode(',', $keys)]];
        foreach (self::BOOLEANS as $key) {
            $rules['answers.'.$key] = ['sometimes', 'nullable', function ($attribute, $value, $fail) {
                if (! is_bool($value)) {
                    $fail('The answer must be a JSON boolean.');
                }
            }];
        }
        foreach (self::ENUMS as $key => $options) {
            $rules['answers.'.$key] = ['sometimes', 'nullable', 'string', Rule::in($options)];
        }
        foreach (self::LISTS as $key => $options) {
            $rules['answers.'.$key] = ['sometimes', 'nullable', 'array', 'list', 'min:1'];
            $rules['answers.'.$key.'.*'] = ['required', 'string', 'distinct:strict', Rule::in($options)];
        }

        return $rules;
    }

    public static function assertConsistent(array $answers, ?string $fundingAmount): void
    {
        $errors = [];
        foreach (['market_demand_evidence_sources' => 'not_investigated', 'business_model_revenue_methods' => 'not_defined', 'customer_validation_methods' => 'not_started'] as $key => $exclusive) {
            if (in_array($exclusive, $answers[$key] ?? [], true) && count($answers[$key]) !== 1) {
                $errors['answers.'.$key] = ['This option must appear alone.'];
            }
        }
        $basis = $answers['funding_estimate_basis'] ?? null;
        $use = $answers['funding_use_plan_status'] ?? null;
        if ($basis === 'no_external_funding_planned' || $use === 'no_external_funding_planned') {
            foreach (['funding_estimate_basis' => $basis, 'funding_use_plan_status' => $use] as $key => $value) {
                if ($value !== 'no_external_funding_planned') {
                    $errors['answers.'.$key] = ['Both funding answers must indicate no external funding planned together.'];
                }
            }
            // Existing DECIMAL(15,2) funding_amount is BDT; never convert it through a float.
            if ($fundingAmount !== null && $fundingAmount !== '0.00') {
                $errors['answers.funding_estimate_basis'] = ['No external funding planned requires an unspecified or zero BDT funding amount.'];
            }
        }
        $review = $answers['risk_review_status'] ?? null;
        $response = $answers['risk_response_status'] ?? null;
        if ($review !== null && $response !== null
            && (($review === 'reviewed_no_material_risks_identified') !== ($response === 'no_risks_identified'))) {
            $errors['answers.risk_response_status'] = ['The supplied risk review and response answers contradict each other.'];
        }
        if (in_array('not_started', $answers['customer_validation_methods'] ?? [], true)
            && ($answers['customer_validation_findings'] ?? null) !== null
            && $answers['customer_validation_findings'] !== 'not_collected') {
            $errors['answers.customer_validation_findings'] = ['Validation not started requires findings not collected when both are supplied.'];
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
