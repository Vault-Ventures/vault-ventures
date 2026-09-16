<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class BusinessAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
    }

    private function draft(array $fields = []): int
    {
        return $this->postJson('/api/me/businesses', array_replace(['name' => 'Test business'], $fields))->assertCreated()->json('data.id');
    }

    public function test_cross_owner_and_admin_access_are_denied(): void
    {
        $id = $this->draft();
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->getJson('/api/me/businesses')->assertForbidden();
        $this->postJson('/api/me/businesses', ['name' => 'A'])->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->getJson('/api/me/businesses')->assertJsonPath('data.pagination.total', 0);
        $this->getJson("/api/me/businesses/$id")->assertNotFound();
        $this->patchJson("/api/me/businesses/$id", ['name' => 'Stolen'])->assertNotFound();
        $this->patchJson("/api/me/businesses/$id/requirements", ['funding_amount' => '1'])->assertNotFound();
        $this->postJson("/api/me/businesses/$id/submit")->assertNotFound();
        foreach (['view', 'update', 'submit'] as $ability) {
            $this->assertFalse(Gate::forUser($other)->allows($ability, Business::find($id)));
            $this->assertTrue(Gate::forUser($this->owner)->allows($ability, Business::find($id)));
        }
        $this->assertSame('Test business', Business::find($id)->name);
    }

    public function test_anonymous_requests_are_denied_on_all_endpoints(): void
    {
        $id = $this->draft();
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me/businesses')->assertUnauthorized();
        $this->getJson("/api/me/businesses/$id")->assertUnauthorized();
        $this->postJson('/api/me/businesses', ['name' => 'A'])->assertUnauthorized();
        $this->patchJson("/api/me/businesses/$id", [])->assertUnauthorized();
        $this->patchJson("/api/me/businesses/$id/requirements", [])->assertUnauthorized();
        $this->postJson("/api/me/businesses/$id/submit")->assertUnauthorized();
    }

    public static function protectedFields(): array
    {
        return array_map(fn ($field) => [$field], ['founder_profile_id', 'user_id', 'owner_id', 'status', 'submitted_at', 'is_admin', 'readiness_score', 'verification_status', 'published_at']);
    }

    #[DataProvider('protectedFields')]
    public function test_protected_fields_are_rejected(string $field): void
    {
        $id = $this->draft();
        $this->postJson('/api/me/businesses', ['name' => 'A', $field => 1])->assertUnprocessable();
        $this->patchJson("/api/me/businesses/$id", [$field => 1])->assertUnprocessable();
        $this->patchJson("/api/me/businesses/$id/requirements", [$field => 1])->assertUnprocessable();
        $this->postJson("/api/me/businesses/$id/submit", [$field => 1])->assertUnprocessable();
        $this->assertDatabaseCount('businesses', 1);
    }

    public function test_csrf_is_enforced_on_all_writes(): void
    {
        $id = $this->draft();
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->postJson('/api/me/businesses', ['name' => 'A'])->assertStatus(419);
        $this->patchJson("/api/me/businesses/$id", [])->assertStatus(419);
        $this->patchJson("/api/me/businesses/$id/requirements", [])->assertStatus(419);
        $this->postJson("/api/me/businesses/$id/submit")->assertStatus(419)->assertJsonPath('error.code', 'HTTP_419');
        $this->assertDatabaseCount('businesses', 1);
    }

    public function test_real_sanctum_login_session_can_create_and_read_businesses(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $id = $this->draft();
        $this->getJson("/api/me/businesses/$id")->assertOk();
        $this->getJson('/api/auth/user')->assertOk()->assertJsonMissingPath('data.businesses');
    }
    public function test_paginated_business_identity_and_profile_patch_persist_independently(): void
    {
        $first = $this->draft(['name' => 'First business']);
        for ($i = 0; $i < 15; $i++) {
            $this->draft(['name' => "Later business $i"]);
        }
        $this->getJson('/api/me/businesses?page=1')->assertOk()->assertJsonCount(15, 'data.items');
        $this->getJson('/api/me/businesses?page=2')->assertOk()->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $first)->assertJsonPath('data.pagination.total', 16);
        $this->patchJson("/api/me/businesses/$first", ['name' => 'Saved profile', 'description' => 'Persistent description'])
            ->assertOk()->assertJsonPath('data.id', $first);
        $this->getJson("/api/me/businesses/$first")->assertOk()->assertJsonPath('data.name', 'Saved profile')
            ->assertJsonPath('data.description', 'Persistent description');
        $this->getJson('/api/me/businesses?page=1')->assertOk()->assertJsonPath('data.items.0.name', 'Later business 14');
        $this->assertDatabaseHas('businesses', ['id' => $first, 'name' => 'Saved profile']);
        foreach (['new', 'edit', '99999999'] as $invalid) {
            $this->getJson("/api/me/businesses/$invalid")->assertNotFound();
        }
    }

}
