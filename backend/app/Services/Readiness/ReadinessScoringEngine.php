<?php

namespace App\Services\Readiness;

use Illuminate\Support\Facades\Validator;

final class ReadinessScoringEngine
{
    public static function decimal(int $units, int $places = 2): string
    {
        $scale = 10 ** $places;

        return intdiv($units, $scale).'.'.str_pad((string) ($units % $scale), $places, '0', STR_PAD_LEFT);
    }

    public function calculate(array $answers, ?string $fundingAmount): array
    {
        Validator::make(['answers' => $answers], ReadinessInputSchema::rules())->validate();
        // Validate immutable answer consistency; current funding conflicts are scored explicitly below.
        ReadinessInputSchema::assertConsistent($answers, null);
        $factors = [];
        $weak = [];
        $allSuggestions = [];
        $sumHalfUnits = 0;
        $incomplete = false;
        foreach (ReadinessRubric::FACTORS as [$key, $name, $inputs]) {
            $mapped = [];
            $missing = [];
            $reasons = [];
            $halfUnits = 0;
            $suggestions = [];
            foreach ($inputs as [$field, $mapping]) {
                $value = $answers[$field] ?? null;
                $contribution = null;
                $selected = [];
                if ($value === null) {
                    $missing[] = $field;
                } else {
                    foreach (is_array($value) ? $value : [$value] as $option) {
                        $option = is_bool($option) ? ($option ? 'true' : 'false') : $option;
                        $selected[$option] = $mapping[$option];
                    }
                    $contribution = max($selected);
                    $halfUnits += $contribution;
                }
                $mapped[$field] = ['answer' => $value, 'option_contributions' => (object) $selected,
                    'contribution' => $contribution, 'rule' => is_array($value) ? 'MAX_SELECTED' : 'DIRECT_MAPPING'];
            }
            $factorIncomplete = $missing !== [];
            if ($factorIncomplete) {
                $halfUnits = 0;
                $reasons[] = 'MISSING_REQUIRED_INPUT';
            }
            $special = null;
            if ($key === 'funding_requirement_realism') {
                $noFunding = ($answers['funding_estimate_basis'] ?? null) === 'no_external_funding_planned'
                    && ($answers['funding_use_plan_status'] ?? null) === 'no_external_funding_planned';
                if ($noFunding && $fundingAmount !== null && $fundingAmount !== '0.00') {
                    $halfUnits = 0;
                    $factorIncomplete = true;
                    $reasons[] = 'FUNDING_DEPENDENCY_CONFLICT';
                    $special = ['funding.conflict', 'Reconcile the positive BDT funding amount with the answers stating that no external funding is planned.'];
                } elseif ($noFunding) {
                    $halfUnits = 100;
                    $reasons[] = 'NO_EXTERNAL_FUNDING_PLANNED';
                    $special = ['funding.none', 'No external funding is currently planned. If that changes, update the BDT funding amount and its estimate and use plans.'];
                } elseif ($fundingAmount === null) {
                    $halfUnits = 0;
                    $factorIncomplete = true;
                    $missing[] = 'business_requirement.funding_amount';
                    $reasons[] = 'MISSING_FUNDING_AMOUNT';
                    $special = ['funding.missing', 'Record the funding requirement in BDT (৳), or explicitly state that no external funding is planned.'];
                }
            }
            $isWeak = $halfUnits < 120 || $factorIncomplete;
            if ($isWeak) {
                foreach ($inputs as [$field]) {
                    if (in_array($field, $missing, true)) {
                        $suggestions['missing.'.$field] = ['id' => 'missing.'.$field, 'text' => 'Provide an answer for: '.ReadinessRubric::LABELS[$field].'.'];
                    }
                }
                if ($special !== null) {
                    $suggestions[$special[0]] = ['id' => $special[0], 'text' => $special[1]];
                }
                foreach ($inputs as [$field]) {
                    $input = $mapped[$field];
                    if ($input['contribution'] === null || $input['contribution'] >= 60) {
                        continue;
                    }
                    $answer = $input['answer'];
                    // Lists use their highest-contributing option; exclusive low options appear alone.
                    $option = is_array($answer) ? $answer[0] : (is_bool($answer) ? ($answer ? 'true' : 'false') : $answer);
                    $template = ReadinessRubric::SUGGESTIONS[$field][$option] ?? ReadinessRubric::SUGGESTIONS[$field]['*'] ?? null;
                    if ($template !== null) {
                        $suggestions[$template[0]] = ['id' => $template[0], 'text' => $template[1]];
                    }
                }
            }
            $factors[$key] = ['name' => $name, 'weight' => '12.50', 'inputs' => $mapped,
                'score' => self::decimal($halfUnits * 50), 'weighted_contribution' => self::decimal($halfUnits * 625, 4),
                'is_weak' => $isWeak, 'is_incomplete' => $factorIncomplete,
                'missing_inputs' => $missing, 'reason_codes' => $reasons, 'suggestions' => array_values($suggestions),
                'calculation_rule' => $reasons === [] ? 'EQUAL_INPUT_MEAN' : 'EXPLICIT_FACTOR_OVERRIDE'];
            $sumHalfUnits += $halfUnits;
            $incomplete = $incomplete || $factorIncomplete;
            if ($isWeak) {
                $weak[] = $key;
            }
            foreach ($suggestions as $id => $suggestion) {
                $allSuggestions[$id] = $suggestion + ['factor' => $key];
            }
        }

        // Overall = sum of half-score units / 16; integer half-up rounding to cents.
        return ['factor_results' => $factors, 'overall_score' => self::decimal(intdiv($sumHalfUnits * 100 + 8, 16)),
            'weak_areas' => $weak, 'suggestions' => array_values($allSuggestions), 'is_incomplete' => $incomplete,
            'calculation' => ['sum_half_units' => $sumHalfUnits, 'divisor' => 16, 'rounding' => 'HALF_UP_2_DECIMALS']];
    }
}
