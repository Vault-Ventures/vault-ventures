<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ReadinessInputVersion;
use App\Models\User;
use App\Services\Readiness\ReadinessInputSchema;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReadinessInputTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private int $businessId;

    private string $endpoint;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->businessId = $this->postJson('/api/me/businesses', ['name' => 'Example'])->assertCreated()->json('data.id');
        $this->endpoint = "/api/me/businesses/{$this->businessId}/readiness-inputs";
    }

    private function saveAnswers(array $answers = [])
    {
        return $this->postJson($this->endpoint, ['answers' => (object) $answers]);
    }

    private function completeAnswers(): array
    {
        return [
            'market_customer_segment_identified' => false,
            'market_demand_evidence_sources' => ['published_research', 'customer_conversations'],
            'business_model_revenue_methods' => ['other', 'service_fees'],
            'business_model_cost_categories_identified' => true,
            'competition_review_status' => 'reviewed_none_identified',
            'competition_differentiation_status' => 'founder_defined',
            'scalability_delivery_process_status' => 'defined_not_tried',
            'scalability_capacity_review_status' => 'constraints_identified',
            'founder_relevant_execution_experience' => false,
            'founder_capability_gap_status' => 'gaps_identified_with_plan',
            'funding_estimate_basis' => 'founder_estimate',
            'funding_use_plan_status' => 'uses_identified',
            'risk_review_status' => 'reviewed_risks_identified',
            'risk_response_status' => 'responses_planned',
            'customer_validation_methods' => ['prototype_testing'],
            'customer_validation_findings' => 'mainly_unsupportive',
        ];
    }

    public function test_complete_contract_round_trip_and_schema_version(): void
    {
        $answers = $this->completeAnswers();
        $this->assertCount(16, $answers);
        $this->saveAnswers($answers)->assertCreated()->assertJsonPath('data.answers', $answers)
            ->assertJsonPath('data.version', 1)->assertJsonPath('data.schema_version', '1')
            ->assertJsonMissingPath('data.score')->assertJsonMissingPath('data.assessment');
        $this->getJson($this->endpoint)->assertOk()->assertJsonPath('data.answers', $answers);
        $this->getJson($this->endpoint.'/versions/1')->assertOk()->assertJsonPath('data.answers', $answers);
    }

    public function test_empty_missing_null_false_and_full_replacement_revisions(): void
    {
        $this->getJson($this->endpoint)->assertOk()->assertJsonPath('data', null);
        $this->saveAnswers(['market_customer_segment_identified' => false, 'risk_review_status' => null])->assertCreated();
        $this->saveAnswers(['competition_review_status' => 'not_reviewed'])->assertCreated()->assertJsonPath('data.version', 2)
            ->assertJsonMissingPath('data.answers.market_customer_segment_identified');
        $this->getJson($this->endpoint.'/versions/1')->assertJsonPath('data.answers.market_customer_segment_identified', false)
            ->assertJsonPath('data.answers.risk_review_status', null);
        $this->saveAnswers()->assertCreated()->assertJsonPath('data.version', 3);
        $this->assertStringContainsString('"answers":{}', $this->getJson($this->endpoint)->getContent());
        $this->getJson($this->endpoint.'/versions/99')->assertNotFound();
        $this->assertDatabaseCount('readiness_input_versions', 3);
    }

    public static function invalidAnswers(): array
    {
        return [
            [['market_customer_segment_identified' => 0]],
            [['market_customer_segment_identified' => '']],
            [['competition_review_status' => '']],
            [['competition_review_status' => ' not_reviewed ']],
            [['market_customer_segment_identified' => 1]],
            [['business_model_cost_categories_identified' => 'true']],
            [['founder_relevant_execution_experience' => 'false']],
            [['market_demand_evidence_sources' => []]],
            [['market_demand_evidence_sources' => ['not_investigated', 'published_research']]],
            [['market_demand_evidence_sources' => ['published_research', 'published_research']]],
            [['business_model_revenue_methods' => ['not_defined', 'other']]],
            [['business_model_revenue_methods' => ['first' => 'other']]],
            [['customer_validation_methods' => ['not_started', 'paid_usage']]],
            [['customer_validation_methods' => [['paid_usage']]]],
            [['customer_validation_findings' => 'positive']],
            [['risk_response_status' => 1]],
            [['funding_amount' => '100']],
            [['currency' => 'USD']],
            [['score' => 100]],
            [['unknown' => true]],
            [['market_demand_evidence_sources' => ['unknown']]],
        ];
    }

    #[DataProvider('invalidAnswers')]
    public function test_invalid_inputs_rejected_without_revision(array $answers): void
    {
        $this->saveAnswers($answers)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertDatabaseCount('readiness_input_versions', 0);
    }

    public function test_all_approved_enum_and_list_options_validate(): void
    {
        foreach (ReadinessInputSchema::ENUMS as $field => $values) {
            foreach ($values as $value) {
                $answers = [$field => $value];
                if ($value === 'no_external_funding_planned') {
                    $answers = ['funding_estimate_basis' => $value, 'funding_use_plan_status' => $value];
                }
                $this->saveAnswers($answers)->assertCreated();
            }
        }
        foreach (ReadinessInputSchema::LISTS as $field => $values) {
            foreach ($values as $value) {
                $this->saveAnswers([$field => [$value]])->assertCreated();
            }
        }
    }

    public function test_funding_pair_checks_existing_bdt_without_copying_amount(): void
    {
        $pair = ['funding_estimate_basis' => 'no_external_funding_planned', 'funding_use_plan_status' => 'no_external_funding_planned'];
        $this->saveAnswers(['funding_estimate_basis' => 'no_external_funding_planned'])->assertUnprocessable();
        $this->saveAnswers(['funding_use_plan_status' => 'no_external_funding_planned'])->assertUnprocessable();
        $this->saveAnswers($pair)->assertCreated();
        $req = "/api/me/businesses/{$this->businessId}/requirements";
        $this->patchJson($req, ['funding_amount' => '9999999999999.99'])->assertOk();
        $this->saveAnswers($pair)->assertUnprocessable()->assertJsonValidationErrors('answers.funding_estimate_basis', 'error.details');
        $this->saveAnswers(['funding_estimate_basis' => 'itemized_cost_estimate'])->assertCreated()->assertJsonPath('data.version', 2);
        $this->patchJson($req, ['funding_amount' => '0'])->assertOk();
        $this->saveAnswers($pair)->assertCreated()->assertJsonMissingPath('data.answers.funding_amount');
        $this->assertSame('0.00', Business::findOrFail($this->businessId)->requirements->funding_amount);
        $this->getJson($this->endpoint.'/versions/1')->assertJsonPath('data.answers', $pair);
    }

    public function test_partial_risk_and_customer_answers_and_contradictions(): void
    {
        $this->saveAnswers(['risk_review_status' => 'reviewed_no_material_risks_identified'])->assertCreated();
        $this->saveAnswers(['risk_response_status' => 'no_risks_identified'])->assertCreated();
        $this->saveAnswers(['risk_review_status' => 'not_reviewed', 'risk_response_status' => 'no_risks_identified'])->assertUnprocessable();
        $this->saveAnswers(['risk_review_status' => 'reviewed_no_material_risks_identified', 'risk_response_status' => 'responses_planned'])->assertUnprocessable();
        $this->saveAnswers(['risk_review_status' => 'reviewed_no_material_risks_identified', 'risk_response_status' => 'no_risks_identified'])->assertCreated();
        $this->saveAnswers(['customer_validation_methods' => ['not_started'], 'customer_validation_findings' => 'mixed'])->assertUnprocessable();
        $this->saveAnswers(['customer_validation_methods' => ['not_started'], 'customer_validation_findings' => null])->assertCreated();
        $this->saveAnswers(['customer_validation_methods' => ['not_started'], 'customer_validation_findings' => 'not_collected'])->assertCreated();
    }

    public function test_failed_insert_rolls_back_without_version_gap(): void
    {
        $this->saveAnswers()->assertCreated();
        config(['logging.default' => 'null']);
        ReadinessInputVersion::creating(fn () => throw new \RuntimeException('Test failure'));
        try {
            $this->saveAnswers()->assertStatus(500);
        } finally {
            ReadinessInputVersion::flushEventListeners();
        }
        $this->saveAnswers()->assertCreated()->assertJsonPath('data.version', 2);
        $this->assertDatabaseCount('readiness_input_versions', 2);
    }

    public function test_duplicate_revision_is_rejected_by_database(): void
    {
        $this->saveAnswers()->assertCreated();
        $this->expectException(QueryException::class);
        DB::table('readiness_input_versions')->insert([
            'business_id' => $this->businessId, 'version' => 1, 'schema_version' => '1', 'answers' => '{}', 'created_at' => now(),
        ]);
    }

    public function test_business_lock_precedes_revision_lookup(): void
    {
        $queries = [];
        DB::listen(function ($event) use (&$queries) {
            $queries[] = strtolower($event->sql);
        });
        $this->saveAnswers()->assertCreated();
        $businessLock = array_search(true, array_map(fn ($q) => str_contains($q, 'from '.chr(96).'businesses'.chr(96)) && str_contains($q, 'for update'), $queries), true);
        $versionLock = array_search(true, array_map(fn ($q) => str_contains($q, 'from '.chr(96).'readiness_input_versions'.chr(96)) && str_contains($q, 'for update'), $queries), true);
        $this->assertIsInt($businessLock);
        $this->assertIsInt($versionLock);
        $this->assertLessThan($versionLock, $businessLock);
    }

    public function test_inputs_do_not_change_submission_or_require_documents(): void
    {
        $this->saveAnswers()->assertCreated();
        $this->assertSame('draft', Business::findOrFail($this->businessId)->status->value);
        $this->patchJson("/api/me/businesses/{$this->businessId}", [
            'description' => 'Idea', 'industry' => 'Technology', 'business_stage' => 'Idea', 'location' => 'Dhaka',
        ])->assertOk();
        $date = $this->postJson("/api/me/businesses/{$this->businessId}/submit")->assertOk()->json('data.submitted_at');
        $this->saveAnswers($this->completeAnswers())->assertCreated();
        $this->getJson("/api/me/businesses/{$this->businessId}")->assertJsonPath('data.status', 'pending_approval')
            ->assertJsonPath('data.submitted_at', $date);
        $this->assertDatabaseCount('business_documents', 0);
    }
}
