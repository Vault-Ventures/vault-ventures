<?php

namespace Tests\Feature;

use App\Models\ReadinessInputVersion;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class ReadinessInputAuthorizationTest extends TestCase
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

    public function test_owner_nonfounder_admin_and_cross_business_isolation(): void
    {
        $this->saveAnswers()->assertCreated();
        $otherId = $this->postJson('/api/me/businesses', ['name' => 'Other'])->assertCreated()->json('data.id');
        $this->getJson("/api/me/businesses/$otherId/readiness-inputs/versions/1")->assertNotFound();
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->getJson($this->endpoint)->assertForbidden();
        $this->saveAnswers()->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->getJson($this->endpoint)->assertNotFound();
        $this->getJson($this->endpoint.'/versions/1')->assertNotFound();
        $this->saveAnswers()->assertNotFound();
        $this->assertFalse(Gate::forUser($other)->allows('view', ReadinessInputVersion::first()));
        $this->assertDatabaseCount('readiness_input_versions', 1);
    }

    public function test_anonymous_and_csrf_denial(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->saveAnswers()->assertStatus(419);
        config(['sanctum.middleware.validate_csrf_token' => ValidateCsrfToken::class]);
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->getJson($this->endpoint)->assertUnauthorized();
        $this->getJson($this->endpoint.'/versions/1')->assertUnauthorized();
        $this->saveAnswers()->assertUnauthorized();
    }

    public function test_protected_fields_and_missing_answers_rejected(): void
    {
        foreach (['business_id', 'owner_id', 'user_id', 'schema_version', 'version', 'score', 'weights', 'assessment'] as $field) {
            $this->postJson($this->endpoint, ['answers' => new \stdClass, $field => 1])->assertUnprocessable();
        }
        $this->postJson($this->endpoint, [])->assertUnprocessable();
        $this->postJson($this->endpoint, ['answers' => null])->assertUnprocessable();
        $this->assertDatabaseCount('readiness_input_versions', 0);
    }

    public function test_no_mutation_routes_or_policy_permissions(): void
    {
        $this->saveAnswers()->assertCreated();
        foreach ([$this->endpoint, $this->endpoint.'/versions/1'] as $url) {
            $this->patchJson($url, ['answers' => []])->assertStatus(405);
            $this->deleteJson($url)->assertStatus(405);
        }
        $input = ReadinessInputVersion::firstOrFail();
        $this->assertTrue(Gate::forUser($this->owner)->allows('view', $input));
        $this->assertFalse(Gate::forUser($this->owner)->allows('update', $input));
        $this->assertFalse(Gate::forUser($this->owner)->allows('delete', $input));
        foreach (['update', 'delete'] as $operation) {
            try {
                if ($operation === 'update') {
                    $input->answers = ['risk_review_status' => 'not_reviewed'];
                    $input->save();
                } else {
                    $input->delete();
                }
                $this->fail('Historical mutation must fail.');
            } catch (\LogicException $exception) {
                $this->assertSame('Readiness input history is append-only.', $exception->getMessage());
            }
        }
    }

    public function test_real_sanctum_session_preserves_access(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $this->saveAnswers(['market_customer_segment_identified' => true])->assertCreated();
        $this->getJson($this->endpoint)->assertOk();
        $this->getJson($this->endpoint.'/versions/1')->assertOk();
    }
}
