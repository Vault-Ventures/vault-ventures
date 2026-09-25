<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessAnalysis;
use App\Models\ReadinessAssessment;
use App\Models\User;
use App\Services\BusinessAnalysis\AnalysisContract;
use App\Services\BusinessAnalysis\AnalysisProvider;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Fixtures\EnforcedCsrf;
use Tests\Fixtures\FakeAnalysisProvider;
use Tests\TestCase;

class BusinessAnalysisTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private int $businessId;

    private string $base;

    private string $endpoint;

    protected function setUp(): void
    {
        parent::setUp();
        // Retain regression coverage of the existing reference-only contract and history.
        config(['business_analysis.output_version' => '1']);
        Http::preventStrayRequests();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->businessId = $this->postJson('/api/me/businesses', ['name' => 'Example', 'description' => 'Founder description', 'industry' => 'Technology', 'business_stage' => 'Idea', 'location' => 'Dhaka'])->assertCreated()->json('data.id');
        $this->base = "/api/me/businesses/{$this->businessId}";
        $this->endpoint = $this->base.'/business-analyses';
    }

    private function ready(array $answers = []): void
    {
        $this->postJson($this->base.'/readiness-inputs', ['answers' => (object) $answers])->assertCreated();
        $this->postJson($this->base.'/submit')->assertOk();
    }

    private function fake(?\Closure $callback = null): FakeAnalysisProvider
    {
        $fake = new FakeAnalysisProvider($callback ?? fn ($snapshot) => FakeAnalysisProvider::validOutput($snapshot));
        $this->app->instance(AnalysisProvider::class, $fake);

        return $fake;
    }

    private function capture(): array
    {
        return app(BusinessAnalysisService::class)->capture(Business::findOrFail($this->businessId));
    }

    public function test_gemini_owner_generation_preserves_v1_contract_and_redacts_http_errors(): void
    {
        $this->ready();
        $secret = bin2hex(random_bytes(24));
        config(['ai.provider' => 'gemini', 'ai.api_key' => $secret, 'ai.model' => 'gemini-3.8-flash']);
        $snapshot = $this->capture()['snapshot'];
        Http::fake(['*' => Http::sequence()->push(AiFoundationTest::envelope(FakeAnalysisProvider::validOutput($snapshot)))
            ->push(['error' => ['message' => $secret]], 429)]);
        $before = $this->sourceRows();
        $response = $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.provider_identifier', 'gemini')->assertJsonPath('data.test_fixture', false);
        $this->assertStringNotContainsString($secret, $response->getContent());
        $this->assertSame($before, $this->sourceRows());
        Http::assertSent(function ($request) {
            $data = json_decode($request['input'], true);
            $this->assertSame(['untrusted_business_data', 'available_factors', 'applicable_suggestion_ids'], array_keys($data));
            return true;
        });
        // A fresh model configuration forces a new attempt while retaining prior history.
        config(['ai.model' => 'gemini-3.7-flash']);
        $failure = $this->postJson($this->endpoint)->assertStatus(503)->assertJsonPath('error.code', 'ANALYSIS_PROVIDER_RATE_LIMIT');
        $this->assertStringNotContainsString($secret, $failure->getContent());
        $this->assertDatabaseCount('business_analyses', 1);
        $this->assertSame($before, $this->sourceRows());
    }

    private function sourceRows(): array
    {
        $result = [];
        foreach (['businesses', 'business_requirements', 'readiness_input_versions', 'readiness_assessments'] as $table) {
            $result[$table] = DB::table($table)->orderBy('id')->get()->toJson();
        }

        return $result;
    }

    public static function lifecycleStates(): array
    {
        return [['submitted', true], ['pending_approval', true], ['approved', true], ['published', true], ['draft', false], ['rejected', false]];
    }

    #[DataProvider('lifecycleStates')]
    public function test_analysis_eligibility_respects_current_business_lifecycle(string $status, bool $eligible): void
    {
        $this->ready();
        $business = Business::findOrFail($this->businessId);
        $business->forceFill(['status' => $status])->save();
        if ($eligible) {
            app(\App\Services\Readiness\ReadinessAssessmentService::class)->assess($business->id);
        }
        $state = $this->capture();
        $this->assertSame($eligible, $state['eligibility_reasons'] === []);
        $this->assertSame($status, $business->fresh()->status->value);
        Http::assertNothingSent();
    }

    public function test_disabled_and_eligibility_do_not_generate_lock_or_consume_allowance(): void
    {
        $this->getJson($this->endpoint.'/latest')->assertOk()->assertJsonPath('data', null)->assertJsonPath('meta.generation_enabled', false)->assertJsonPath('meta.eligible', false);
        $this->postJson($this->endpoint)->assertUnprocessable();
        $this->postJson($this->base.'/submit')->assertOk();
        $this->postJson($this->endpoint)->assertUnprocessable();
        $this->postJson($this->base.'/readiness-inputs', ['answers' => new \stdClass])->assertCreated();
        $before = $this->sourceRows();
        for ($i = 0; $i < 4; $i++) {
            $this->postJson($this->endpoint)->assertStatus(503)->assertJsonPath('error.code', 'ANALYSIS_DISABLED');
        }
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('meta.eligible', true)->assertJsonPath('meta.current_version', null);
        $this->assertDatabaseCount('business_analyses', 0);
        $this->assertDatabaseCount('cache_locks', 0);
        $this->assertDatabaseCount('cache', 0);
        $this->assertSame($before, $this->sourceRows());
        Http::assertNothingSent();
    }

    public function test_valid_output_exact_rendering_and_allowlisted_private_snapshot(): void
    {
        $this->ready(['market_customer_segment_identified' => false, 'market_demand_evidence_sources' => ['not_investigated']]);
        $fake = $this->fake(function ($snapshot) {
            $output = json_decode(FakeAnalysisProvider::validOutput($snapshot), true);
            $output['review_points'] = [['factor_key' => 'market_potential', 'condition_code' => 'weak_factor'], ['factor_key' => 'risk', 'condition_code' => 'missing_input']];

            return json_encode($output);
        });
        $before = $this->sourceRows();
        $response = $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.provider_identifier', 'test_fake')->assertJsonPath('data.test_fixture', true)
            ->assertJsonPath('data.freshness.is_current', true)->assertJsonPath('meta.current_version', 1)
            ->assertJsonPath('data.rendered_output.business_summary.0.value', 'Example')
            ->assertJsonPath('data.rendered_output.business_summary.0.basis', 'Founder-provided')
            ->assertJsonPath('data.rendered_output.information_coverage.0.inputs.0.value', false)
            ->assertJsonPath('data.rendered_output.information_coverage.0.inputs.0.status', 'supplied')
            ->assertJsonPath('data.rendered_output.information_coverage.0.inputs.1.value', ['not_investigated'])
            ->assertJsonPath('data.rendered_output.funding.amount', null)
            ->assertJsonPath('data.rendered_output.funding.currency', 'BDT');
        $this->assertCount(8, $response->json('data.rendered_output.information_coverage'));
        $snapshot = $fake->snapshots[0];
        $this->assertSame(['business', 'funding', 'readiness_input', 'assessment', 'configuration'], array_keys($snapshot));
        $this->assertSame([...AnalysisContract::BUSINESS_FIELDS, 'status'], array_keys($snapshot['business']));
        $this->assertSame(['missing_keys', 'is_incomplete', 'is_weak', 'reason_codes'], array_keys($snapshot['assessment']['factors']['market_potential']));
        $serialized = json_encode($snapshot);
        foreach (['email', 'password', 'overall_score', 'weight', 'skills', 'documents', 'micro_proposed_terms', 'founder_profile_id'] as $key) {
            $this->assertStringNotContainsString('"'.$key.'":', $serialized);
        }
        $suggestions = array_column(ReadinessAssessment::firstOrFail()->suggestions, null, 'id');
        foreach ($response->json('data.rendered_output.recommended_actions') as $action) {
            $this->assertSame($suggestions[$action['id']], $action);
        }
        $this->assertSame($before, $this->sourceRows());
        $this->assertStringNotContainsString('percentage', json_encode($response->json('data')));
        Http::assertNothingSent();
    }

    public static function invalidCases(): array
    {
        return array_map(fn ($s) => [$s], [
            'malformed', 'oversize', 'utf8', 'unknown_top', 'unknown_nested', 'duplicate_refs', 'unknown_ref', 'empty_refs', 'long_id',
            'duplicate_factor', 'unknown_factor', 'coverage_short', 'unknown_condition', 'ineligible_condition', 'duplicate_review',
            'unknown_suggestion', 'duplicate_action', 'score', 'amount', 'prose', 'invented', 'object_list',
        ]);
    }

    private static function badOutput(string $case, array $snapshot): string
    {
        if ($case === 'malformed') {
            return '{';
        }
        if ($case === 'oversize') {
            return str_repeat(' ', 8193);
        }
        if ($case === 'utf8') {
            return "\xFF";
        }
        $o = json_decode(FakeAnalysisProvider::validOutput($snapshot), true);
        switch ($case) {
            case 'unknown_top': $o['extra'] = true;
                break;
            case 'unknown_nested': $o['business_summary']['text'] = 'Invented summary';
                break;
            case 'duplicate_refs': $o['business_summary']['source_refs'] = ['name', 'name'];
                break;
            case 'unknown_ref': $o['business_summary']['source_refs'] = ['email'];
                break;
            case 'empty_refs': $o['business_summary']['source_refs'] = [];
                break;
            case 'long_id': $o['business_summary']['source_refs'] = [str_repeat('x', 129)];
                break;
            case 'duplicate_factor': $o['information_coverage'][1] = $o['information_coverage'][0];
                break;
            case 'unknown_factor': $o['information_coverage'][0]['factor_key'] = 'invented';
                break;
            case 'coverage_short': array_pop($o['information_coverage']);
                break;
            case 'unknown_condition': $o['review_points'] = [['factor_key' => 'risk', 'condition_code' => 'investment_ready']];
                break;
            case 'ineligible_condition': $o['review_points'] = [['factor_key' => 'risk', 'condition_code' => 'funding_conflict']];
                break;
            case 'duplicate_review': $o['review_points'] = array_fill(0, 2, ['factor_key' => 'risk', 'condition_code' => 'missing_input']);
                break;
            case 'unknown_suggestion': $o['recommended_actions'] = [['suggestion_id' => 'invented']];
                break;
            case 'duplicate_action': $o['recommended_actions'] = array_fill(0, 2, $o['recommended_actions'][0]);
                break;
            case 'score': $o['overall_score'] = 100;
                break;
            case 'amount': $o['funding_amount'] = '100.00';
                break;
            case 'prose': $o['review_points'] = [['factor_key' => 'risk', 'condition_code' => 'missing_input', 'text' => '<b>Claim</b>']];
                break;
            case 'invented': $o['customer_count'] = 1000;
                break;
            case 'object_list': $o['information_coverage'] = (object) $o['information_coverage'];
                break;
        }

        return json_encode($o, JSON_THROW_ON_ERROR);
    }

    #[DataProvider('invalidCases')]
    public function test_invalid_output_rejected_atomically(string $case): void
    {
        $this->ready();
        $this->fake(fn ($snapshot) => self::badOutput($case, $snapshot));
        $before = $this->sourceRows();
        $this->postJson($this->endpoint)->assertStatus(502)->assertJsonPath('error.code', 'INVALID_ANALYSIS_OUTPUT');
        $this->assertDatabaseCount('business_analyses', 0);
        $this->assertSame($before, $this->sourceRows());
    }

    public function test_payload_rejected_and_no_public_fake_selection(): void
    {
        $this->ready();
        foreach (['provider', 'adapter', 'model', 'endpoint', 'credentials', 'version', 'source_snapshot', 'score', 'answers'] as $field) {
            $this->postJson($this->endpoint, [$field => 'test_fake'])->assertUnprocessable();
        }
        $this->postJson($this->endpoint)->assertStatus(503);
        $this->assertDatabaseCount('business_analyses', 0);
    }

    public function test_reuse_history_recurring_source_and_pagination(): void
    {
        $this->ready();
        $fake = $this->fake();
        $this->postJson($this->endpoint)->assertCreated();
        $original = BusinessAnalysis::firstOrFail()->getRawOriginal();
        $this->postJson($this->endpoint)->assertOk()->assertJsonPath('data.version', 1);
        $this->assertSame(1, $fake->calls);
        $this->patchJson($this->base, ['description' => 'Updated'])->assertOk();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false)->assertJsonPath('meta.current_version', null);
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 2);
        $this->patchJson($this->base, ['description' => 'Founder description'])->assertOk();
        $this->postJson($this->endpoint)->assertOk()->assertJsonPath('data.version', 1);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.version', 2)->assertJsonPath('data.freshness.is_current', false)->assertJsonPath('meta.current_version', 1);
        $this->getJson($this->endpoint.'/1')->assertJsonPath('data.freshness.is_current', true);
        $this->getJson($this->endpoint.'?per_page=1')->assertJsonCount(1, 'data')->assertJsonPath('meta.pagination.total', 2);
        $this->getJson($this->endpoint.'?per_page=51')->assertUnprocessable();
        $this->getJson($this->endpoint.'/99')->assertNotFound();
        $this->assertSame($original, BusinessAnalysis::firstOrFail()->getRawOriginal());
    }

    public function test_exact_bdt_null_zero_and_current_matching_assessment(): void
    {
        $this->ready();
        $this->fake();
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.rendered_output.funding.amount', null);
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '0'])->assertOk();
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.rendered_output.funding.amount', '0.00');
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '9999999999999.99'])->assertOk();
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.rendered_output.funding.amount', '9999999999999.99');
        $this->patchJson($this->base.'/requirements', ['funding_amount' => null])->assertOk();
        $this->postJson($this->endpoint)->assertOk()->assertJsonPath('data.version', 1);
        $this->assertDatabaseCount('readiness_assessments', 3);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('meta.current_version', 1)->assertJsonPath('data.freshness.is_current', false);
    }

    public function test_source_change_during_generation_rejects_persistence(): void
    {
        $this->ready();
        $this->fake(function ($snapshot) {
            $this->patchJson($this->base, ['location' => 'Chattogram'])->assertOk();

            return FakeAnalysisProvider::validOutput($snapshot);
        });
        $this->postJson($this->endpoint)->assertStatus(409)->assertJsonPath('error.code', 'SOURCE_CHANGED');
        $this->assertDatabaseCount('business_analyses', 0);
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_all_snapshot_dependencies_and_excluded_fields(): void
    {
        $this->ready();
        $this->fake();
        $state = $this->capture();
        foreach (AnalysisContract::BUSINESS_FIELDS as $field) {
            $s = $state['snapshot'];
            $s['business'][$field] .= ' changed';
            $this->assertNotSame($state['fingerprint'], AnalysisContract::fingerprint($s));
        }
        foreach (['input_contract_version', 'output_contract_version', 'instruction_version', 'renderer_version', 'provider_identifier', 'model_identifier'] as $field) {
            $s = $state['snapshot'];
            $s['configuration'][$field] = 'changed';
            $this->assertNotSame($state['fingerprint'], AnalysisContract::fingerprint($s));
        }
        foreach (['id', 'version', 'schema_version'] as $field) {
            $s = $state['snapshot'];
            $s['readiness_input'][$field] = 'changed';
            $this->assertNotSame($state['fingerprint'], AnalysisContract::fingerprint($s));
        }
        foreach (['id', 'source_fingerprint'] as $field) {
            $s = $state['snapshot'];
            $s['assessment'][$field] = 'changed';
            $this->assertNotSame($state['fingerprint'], AnalysisContract::fingerprint($s));
        }
        $this->postJson($this->endpoint)->assertCreated();
        $this->patchJson($this->base, ['risk_level' => 'High', 'expected_involvement' => 'Advisory'])->assertOk();
        $this->patchJson($this->base.'/requirements', ['skills' => ['PHP'], 'required_availability' => 'Weekends'])->assertOk();
        $this->assertSame($state['fingerprint'], $this->capture()['fingerprint']);
        $this->postJson($this->base.'/readiness-inputs', ['answers' => new \stdClass])->assertCreated();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false);
    }

    public function test_failure_logs_only_safe_metadata_and_preserves_source(): void
    {
        $this->ready();
        Log::spy();
        $this->fake(fn () => throw new \RuntimeException('Private response data'));
        $before = $this->sourceRows();
        $this->postJson($this->endpoint)->assertStatus(503)->assertJsonPath('error.code', 'ANALYSIS_ADAPTER_FAILURE');
        Log::shouldHaveReceived('warning')->once()->with('Business analysis failed.', \Mockery::on(fn ($context) => array_keys($context) === ['business_id', 'failure_code', 'elapsed_ms']));
        $this->assertSame($before, $this->sourceRows());
        $this->assertDatabaseCount('business_analyses', 0);
    }

    public function test_non_reused_attempt_limit_and_reuse_exemption(): void
    {
        $this->ready();
        $fake = $this->fake();
        $this->postJson($this->endpoint)->assertCreated();
        for ($i = 0; $i < 2; $i++) {
            $this->patchJson($this->base, ['name' => 'Name '.$i])->assertOk();
            $this->postJson($this->endpoint)->assertCreated();
        }
        $this->postJson($this->endpoint)->assertOk();
        $this->patchJson($this->base, ['name' => 'Over limit'])->assertOk();
        $this->postJson($this->endpoint)->assertStatus(429);
        $this->assertSame(3, $fake->calls);
        $this->travel(3601)->seconds();
        $this->postJson($this->endpoint)->assertCreated();
    }

    public function test_generation_lock_conflict_expiry_and_ownership(): void
    {
        $this->ready();
        $fake = $this->fake();
        $key = 'business-analysis:generate:'.$this->businessId;
        $other = Cache::store('database')->lock($key, 60);
        $this->assertTrue($other->get());
        $this->postJson($this->endpoint)->assertStatus(409);
        $this->assertSame(0, $fake->calls);
        $other->release();
        $this->fake(function ($snapshot) {
            $this->travel(61)->seconds();

            return FakeAnalysisProvider::validOutput($snapshot);
        });
        $this->postJson($this->endpoint)->assertStatus(409)->assertJsonPath('error.code', 'GENERATION_LOCK_LOST');
        $successor = null;
        $this->fake(function ($snapshot) use ($key, &$successor) {
            $this->travel(61)->seconds();
            $successor = Cache::store('database')->lock($key, 60);
            $this->assertTrue($successor->get());

            return FakeAnalysisProvider::validOutput($snapshot);
        });
        try {
            $this->postJson($this->endpoint)->assertStatus(409)->assertJsonPath('error.code', 'GENERATION_LOCK_LOST');
            $this->assertTrue($successor->isOwnedByCurrentProcess());
        } finally {
            $successor?->release();
        }
        $this->assertDatabaseCount('business_analyses', 0);
    }

    public function test_database_constraints_and_immutable_history(): void
    {
        $this->ready();
        $this->fake();
        $this->postJson($this->endpoint)->assertCreated();
        $analysis = BusinessAnalysis::firstOrFail();
        $row = $analysis->getRawOriginal();
        unset($row['id']);
        foreach ([['source_fingerprint' => str_repeat('a', 64)], ['version' => 2], ['version' => 2, 'source_fingerprint' => str_repeat('b', 64), 'business_id' => $this->businessId + 1000]] as $changes) {
            try {
                DB::table('business_analyses')->insert(array_replace($row, $changes));
                $this->fail('Constraint must reject.');
            } catch (QueryException $e) {
                $this->assertSame('23000', $e->errorInfo[0]);
            }
        }
        $this->assertFalse(Gate::forUser($this->owner)->allows('update', $analysis));
        $this->assertFalse(Gate::forUser($this->owner)->allows('delete', $analysis));
        foreach (['update', 'delete'] as $operation) {
            try {
                if ($operation === 'update') {
                    $analysis->version = 99;
                    $analysis->save();
                } else {
                    $analysis->delete();
                }
                $this->fail('Immutable history must reject.');
            } catch (\LogicException $e) {
                $this->assertSame('Business analysis history is append-only.', $e->getMessage());
            }
        }
        $this->patchJson($this->endpoint.'/1', [])->assertStatus(405);
        $this->deleteJson($this->endpoint.'/1')->assertStatus(405);
    }

    public function test_ownership_admin_csrf_and_anonymous_boundaries(): void
    {
        $this->ready();
        $this->fake();
        $this->postJson($this->endpoint)->assertCreated();
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->postJson($this->endpoint)->assertStatus(419);
        config(['sanctum.middleware.validate_csrf_token' => ValidateCsrfToken::class]);
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->getJson($this->endpoint)->assertForbidden();
        $this->postJson($this->endpoint)->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        foreach ([$this->endpoint, $this->endpoint.'/latest', $this->endpoint.'/1'] as $url) {
            $this->getJson($url)->assertNotFound();
        }
        $this->postJson($this->endpoint)->assertNotFound();
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        foreach ([$this->endpoint, $this->endpoint.'/latest', $this->endpoint.'/1'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson($this->endpoint)->assertUnauthorized();
    }

    public function test_real_sanctum_session_disabled_and_fake_environment_guard(): void
    {
        $this->ready();
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $this->getJson($this->endpoint.'/latest')->assertOk();
        $this->postJson($this->endpoint)->assertStatus(503);
        $this->fake();
        $this->app->instance('env', 'production');
        try {
            $this->assertFalse(app(BusinessAnalysisService::class)->provider()->enabled());
            try {
                new FakeAnalysisProvider(fn () => '{}');
                $this->fail('Fake must reject outside tests.');
            } catch (\LogicException $e) {
                $this->assertStringContainsString('automated tests', $e->getMessage());
            }
        } finally {
            $this->app->instance('env', 'testing');
        }
    }

    public function test_stale_assessment_rejected_without_recalculating(): void
    {
        $this->ready();
        $fake = $this->fake();
        // Simulate a committed source edit whose Part 2 recalculation did not complete.
        Business::findOrFail($this->businessId)->requirements()->update(['funding_amount' => '10.00']);
        $before = $this->sourceRows();
        $this->postJson($this->endpoint)->assertUnprocessable();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('meta.eligibility_reasons.0', 'ASSESSMENT_STALE');
        $this->assertSame(0, $fake->calls);
        $this->assertSame($before, $this->sourceRows());
    }

    public function test_funding_conflict_rendered_only_from_existing_assessment(): void
    {
        $this->ready(['funding_estimate_basis' => 'no_external_funding_planned', 'funding_use_plan_status' => 'no_external_funding_planned']);
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '0.01'])->assertOk();
        $this->fake(function ($snapshot) {
            $output = json_decode(FakeAnalysisProvider::validOutput($snapshot), true);
            $output['review_points'] = [['factor_key' => 'funding_requirement_realism', 'condition_code' => 'funding_conflict']];

            return json_encode($output);
        });
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.rendered_output.funding.conflict', true)
            ->assertJsonPath('data.rendered_output.funding.amount', '0.01')
            ->assertJsonPath('data.rendered_output.review_points.0.label', 'Funding dependency conflict');
    }

    public function test_existing_but_inapplicable_suggestion_and_complete_factor_condition_rejected(): void
    {
        $this->ready(['market_customer_segment_identified' => true, 'market_demand_evidence_sources' => ['observed_customer_behavior']]);
        foreach (['suggestion', 'condition'] as $case) {
            $this->fake(function ($snapshot) use ($case) {
                $output = json_decode(FakeAnalysisProvider::validOutput($snapshot), true);
                if ($case === 'suggestion') {
                    $output['recommended_actions'] = [['suggestion_id' => 'market.segment']];
                } else {
                    $output['review_points'] = [['factor_key' => 'market_potential', 'condition_code' => 'weak_factor']];
                }

                return json_encode($output);
            });
            $this->postJson($this->endpoint)->assertStatus(502);
        }
        $this->assertDatabaseCount('business_analyses', 0);
    }

    public function test_overlapping_request_cannot_generate_duplicate_analysis(): void
    {
        $this->ready();
        $fake = $this->fake(function ($snapshot) {
            $this->postJson($this->endpoint)->assertStatus(409)->assertJsonPath('error.code', 'GENERATION_IN_PROGRESS');

            return FakeAnalysisProvider::validOutput($snapshot);
        });
        $this->postJson($this->endpoint)->assertCreated();
        $this->postJson($this->endpoint)->assertOk();
        $this->assertSame(1, $fake->calls);
        $this->assertDatabaseCount('business_analyses', 1);
    }

    public function test_cross_business_assessment_foreign_key(): void
    {
        $this->ready();
        $this->fake();
        $this->postJson($this->endpoint)->assertCreated();
        $otherId = $this->postJson('/api/me/businesses', ['name' => 'Other'])->assertCreated()->json('data.id');
        $row = BusinessAnalysis::firstOrFail()->getRawOriginal();
        unset($row['id']);
        $row['business_id'] = $otherId;
        $this->expectException(QueryException::class);
        DB::table('business_analyses')->insert($row);
    }

    public function test_insert_failure_has_no_history_version_gap_or_source_mutation(): void
    {
        $this->ready();
        $this->fake();
        $before = $this->sourceRows();
        BusinessAnalysis::creating(fn () => throw new \RuntimeException('Simulated persistence failure'));
        try {
            $this->postJson($this->endpoint)->assertStatus(503)->assertJsonPath('error.code', 'ANALYSIS_FAILURE');
            $this->assertDatabaseCount('business_analyses', 0);
            $this->assertSame($before, $this->sourceRows());
        } finally {
            BusinessAnalysis::flushEventListeners();
            BusinessAnalysis::clearBootedModels();
        }
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 1);
    }
}
