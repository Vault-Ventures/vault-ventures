<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessInputVersion;
use App\Models\User;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class ReadinessAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private int $businessId;

    private string $base;

    private string $endpoint;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->businessId = $this->postJson('/api/me/businesses', ['name' => 'Example', 'description' => 'Idea', 'industry' => 'Technology', 'business_stage' => 'Idea', 'location' => 'Dhaka'])->assertCreated()->json('data.id');
        $this->base = "/api/me/businesses/{$this->businessId}";
        $this->endpoint = $this->base.'/readiness-assessments';
    }

    private function input(array $answers = [])
    {
        return $this->postJson($this->base.'/readiness-inputs', ['answers' => (object) $answers]);
    }

    private function ready(): void
    {
        $this->input()->assertCreated();
        $this->postJson($this->base.'/submit')->assertOk();
    }

    private function failure(): void
    {
        $this->partialMock(ReadinessAssessmentService::class, function ($mock) {
            $mock->shouldReceive('assess')->andThrow(new \RuntimeException('Simulated recalculation failure'));
        });
        Log::spy();
    }

    public function test_creation_reuse_history_latest_and_no_get_calculation(): void
    {
        $this->getJson($this->endpoint)->assertOk()->assertJsonPath('data', []);
        $this->getJson($this->endpoint.'/latest')->assertOk()->assertJsonPath('data', null);
        $this->postJson($this->base.'/submit')->assertOk();
        // Fixture a committed revision to exercise explicit POST creation independently of the hook.
        $input = new ReadinessInputVersion;
        $input->forceFill(['business_id' => $this->businessId, 'version' => 1, 'schema_version' => '1', 'answers' => []])->save();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data', null);
        $this->assertDatabaseCount('readiness_assessments', 0);
        $created = $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.overall_score', '0.00')->assertJsonPath('data.freshness.is_current', true)
            ->assertJsonPath('data.source_snapshot.currency', 'BDT')->json('data');
        $this->postJson($this->endpoint)->assertOk()->assertJsonPath('data.id', $created['id']);
        $this->input(['market_customer_segment_identified' => true])->assertCreated();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.version', 2)->assertJsonPath('data.freshness.is_current', true);
        $this->getJson($this->endpoint.'/1')->assertJsonPath('data.overall_score', '0.00')
            ->assertJsonPath('data.freshness.is_current', false)->assertJsonPath('data.freshness.stale_reasons.0', 'INPUT_REVISION_CHANGED');
        $this->getJson($this->endpoint)->assertJsonCount(2, 'data')->assertJsonPath('data.0.version', 2);
        $this->getJson($this->endpoint.'/999')->assertNotFound();
        $this->assertDatabaseCount('readiness_assessments', 2);
    }

    public function test_eligibility_validation_and_all_payload_fields_rejected(): void
    {
        $this->postJson($this->endpoint)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->postJson($this->base.'/submit')->assertOk();
        $this->postJson($this->endpoint)->assertUnprocessable()->assertJsonValidationErrors('readiness_inputs', 'error.details');
        $this->input()->assertCreated();
        foreach (['score', 'version', 'rubric_version', 'answers', 'overall_score', 'factor_results', 'source_snapshot', 'business_id', 'owner_id', 'currency', 'unknown'] as $field) {
            $this->postJson($this->endpoint, [$field => 1])->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        }
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_submission_and_input_triggers_and_irrelevant_changes(): void
    {
        $this->input()->assertCreated();
        $this->assertDatabaseCount('readiness_assessments', 0);
        $this->postJson($this->base.'/submit')->assertOk();
        $this->assertDatabaseCount('readiness_assessments', 1);
        $this->postJson($this->base.'/submit')->assertOk();
        $this->patchJson($this->base, ['name' => 'Changed name'])->assertOk();
        $this->patchJson($this->base.'/requirements', ['required_availability' => 'Weekends'])->assertOk();
        $this->assertDatabaseCount('readiness_assessments', 1);
        $this->input()->assertCreated();
        $this->assertDatabaseCount('readiness_assessments', 2);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.input_version', 2)->assertJsonPath('data.freshness.is_current', true);
    }

    public function test_bdt_funding_changes_including_null_zero_and_conflict_preserve_history(): void
    {
        $pair = ['funding_estimate_basis' => 'no_external_funding_planned', 'funding_use_plan_status' => 'no_external_funding_planned'];
        $this->input($pair)->assertCreated();
        $this->postJson($this->base.'/submit')->assertOk();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.factor_results.funding_requirement_realism.score', '50.00');
        $original = ReadinessAssessment::firstOrFail()->getRawOriginal();
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '0'])->assertOk();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.version', 2)->assertJsonPath('data.source_snapshot.funding_amount', '0.00');
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '0.00'])->assertOk();
        $this->assertDatabaseCount('readiness_assessments', 2);
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '9999999999999.99'])->assertOk();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.version', 3)
            ->assertJsonPath('data.source_snapshot.funding_amount', '9999999999999.99')
            ->assertJsonPath('data.factor_results.funding_requirement_realism.score', '0.00')
            ->assertJsonPath('data.factor_results.funding_requirement_realism.reason_codes.0', 'FUNDING_DEPENDENCY_CONFLICT');
        $this->assertSame($original, ReadinessAssessment::firstOrFail()->getRawOriginal());
        $this->assertSame($pair, ReadinessInputVersion::firstOrFail()->answers);
        $this->patchJson($this->base.'/requirements', ['funding_amount' => null])->assertOk();
        $this->postJson($this->endpoint)->assertOk()->assertJsonPath('data.version', 1)->assertJsonPath('data.freshness.is_current', true);
        // Latest means highest historical version, even when an older identical snapshot is reused.
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.version', 3)->assertJsonPath('data.freshness.is_current', false);
        $this->assertDatabaseCount('readiness_assessments', 3);
    }

    public function test_recalculation_failure_preserves_committed_input_and_retry(): void
    {
        $this->ready();
        $this->failure();
        $this->input(['market_customer_segment_identified' => true])->assertCreated()->assertJsonPath('data.version', 2);
        $this->assertDatabaseCount('readiness_input_versions', 2);
        $this->assertDatabaseCount('readiness_assessments', 1);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false)
            ->assertJsonPath('data.freshness.stale_reasons.0', 'INPUT_REVISION_CHANGED');
        Log::shouldHaveReceived('error')->once();
        $this->app->forgetInstance(ReadinessAssessmentService::class);
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 2)->assertJsonPath('data.freshness.is_current', true);
    }

    public function test_funding_and_submission_failures_preserve_source_success(): void
    {
        $this->input()->assertCreated();
        $this->failure();
        $this->postJson($this->base.'/submit')->assertOk()->assertJsonPath('data.status', 'pending_approval');
        $this->assertSame('pending_approval', Business::findOrFail($this->businessId)->status->value);
        $this->assertDatabaseCount('readiness_assessments', 0);
        Log::shouldHaveReceived('error')->once();
        $this->app->forgetInstance(ReadinessAssessmentService::class);
        $this->postJson($this->endpoint)->assertCreated();
        $this->failure();
        $this->patchJson($this->base.'/requirements', ['funding_amount' => '1234.56'])->assertOk();
        $this->assertSame('1234.56', Business::findOrFail($this->businessId)->requirements->funding_amount);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false)
            ->assertJsonPath('data.freshness.stale_reasons.0', 'FUNDING_AMOUNT_CHANGED');
        // Facade::spy() retains an existing mock: both simulated failures must be logged.
        Log::shouldHaveReceived('error')->with('Readiness recalculation failed.', [
            'business_id' => $this->businessId, 'exception_type' => \RuntimeException::class,
        ])->twice();
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_ownership_admin_boundary_anonymous_and_csrf(): void
    {
        $this->ready();
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->postJson($this->endpoint)->assertStatus(419);
        config(['sanctum.middleware.validate_csrf_token' => ValidateCsrfToken::class]);
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        foreach ([$this->endpoint, $this->endpoint.'/latest', $this->endpoint.'/1'] as $url) {
            $this->getJson($url)->assertForbidden();
        }
        $this->postJson($this->endpoint)->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        foreach ([$this->endpoint, $this->endpoint.'/latest', $this->endpoint.'/1'] as $url) {
            $this->getJson($url)->assertNotFound();
        }
        $this->postJson($this->endpoint)->assertNotFound();
        $this->assertFalse(Gate::forUser($other)->allows('view', ReadinessAssessment::first()));
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        foreach ([$this->endpoint, $this->endpoint.'/latest', $this->endpoint.'/1'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson($this->endpoint)->assertUnauthorized();
    }

    public function test_real_sanctum_session_and_immutable_history(): void
    {
        $this->ready();
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $this->postJson($this->endpoint)->assertOk();
        $this->getJson($this->endpoint.'/latest')->assertOk();
        $assessment = ReadinessAssessment::firstOrFail();
        $this->assertFalse(Gate::forUser($this->owner)->allows('update', $assessment));
        $this->assertFalse(Gate::forUser($this->owner)->allows('delete', $assessment));
        $this->patchJson($this->endpoint.'/1', ['overall_score' => 100])->assertStatus(405);
        $this->deleteJson($this->endpoint.'/1')->assertStatus(405);
        foreach (['update', 'delete'] as $operation) {
            try {
                if ($operation === 'update') {
                    $assessment->overall_score = '100.00';
                    $assessment->save();
                } else {
                    $assessment->delete();
                }
                $this->fail('Historical mutation must fail.');
            } catch (\LogicException $exception) {
                $this->assertSame('Assessment history is append-only.', $exception->getMessage());
            }
        }
    }

    public function test_source_rollback_discards_after_commit_recalculation(): void
    {
        $this->ready();
        DB::beginTransaction();
        $this->input(['market_customer_segment_identified' => true])->assertCreated();
        $this->assertDatabaseCount('readiness_assessments', 1);
        DB::rollBack();
        $this->assertDatabaseCount('readiness_input_versions', 1);
        $this->assertDatabaseCount('readiness_assessments', 1);
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', true);
    }

    public function test_schema_and_rubric_changes_invalidate_without_rewriting_history(): void
    {
        $this->ready();
        $service = app(ReadinessAssessmentService::class);
        $assessment = ReadinessAssessment::firstOrFail();
        $original = $assessment->getRawOriginal();
        $snapshot = $service->currentSnapshot(Business::findOrFail($this->businessId));
        foreach (['rubric_version' => 'RUBRIC_CHANGED', 'input_schema_version' => 'INPUT_SCHEMA_CHANGED'] as $key => $reason) {
            $changed = array_replace($snapshot, [$key => 'future-test-version']);
            $freshness = $service->freshness($assessment, $changed);
            $this->assertFalse($freshness['is_current']);
            $this->assertContains($reason, $freshness['stale_reasons']);
        }
        $input = new ReadinessInputVersion;
        $input->forceFill(['business_id' => $this->businessId, 'version' => 2, 'schema_version' => 'unsupported-test-schema', 'answers' => []])->save();
        $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false);
        $this->postJson($this->endpoint)->assertUnprocessable()->assertJsonValidationErrors('readiness_inputs', 'error.details');
        $this->assertSame($original, $assessment->fresh()->getRawOriginal());
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_database_rejects_duplicate_versions_fingerprints_and_cross_business_inputs(): void
    {
        $this->ready();
        $row = ReadinessAssessment::firstOrFail()->getRawOriginal();
        unset($row['id']);
        $otherId = $this->postJson('/api/me/businesses', ['name' => 'Other'])->assertCreated()->json('data.id');
        $otherInput = new ReadinessInputVersion;
        $otherInput->forceFill(['business_id' => $otherId, 'version' => 1, 'schema_version' => '1', 'answers' => []])->save();
        $cases = [
            ['source_fingerprint' => str_repeat('a', 64)],
            ['version' => 2],
            ['version' => 2, 'source_fingerprint' => str_repeat('b', 64), 'readiness_input_version_id' => $otherInput->id],
        ];
        foreach ($cases as $changes) {
            try {
                DB::table('readiness_assessments')->insert(array_replace($row, $changes));
                $this->fail('Database constraint must reject this assessment.');
            } catch (QueryException $exception) {
                $this->assertSame('23000', $exception->errorInfo[0]);
            }
        }
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_assessment_writers_lock_business_before_version_and_reuse_lookup(): void
    {
        $this->ready();
        $queries = [];
        DB::listen(function ($event) use (&$queries) {
            $queries[] = strtolower($event->sql);
        });
        $this->postJson($this->endpoint)->assertOk();
        $locks = array_values(array_filter($queries, fn ($sql) => str_contains($sql, 'for update')));
        $this->assertStringContainsString('businesses', $locks[0]);
        $this->assertStringContainsString('business_requirements', $locks[1]);
        $this->assertStringContainsString('readiness_input_versions', $locks[2]);
        $this->assertStringContainsString('source_fingerprint', $locks[3]);
        $this->assertDatabaseCount('readiness_assessments', 1);
    }

    public function test_assessment_insert_failure_preserves_source_and_allows_retry_without_version_gap(): void
    {
        $this->ready();
        Log::spy();
        ReadinessAssessment::creating(fn () => throw new \RuntimeException('Simulated insert failure'));
        try {
            $this->input(['market_customer_segment_identified' => true])->assertCreated();
            $this->assertDatabaseCount('readiness_input_versions', 2);
            $this->assertDatabaseCount('readiness_assessments', 1);
            $this->getJson($this->endpoint.'/latest')->assertJsonPath('data.freshness.is_current', false);
            Log::shouldHaveReceived('error')->once();
        } finally {
            ReadinessAssessment::flushEventListeners();
            ReadinessAssessment::clearBootedModels();
        }
        $this->postJson($this->endpoint)->assertCreated()->assertJsonPath('data.version', 2);
    }
}
