<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessRequirement;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BusinessSubmissionTest extends TestCase
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

    public function test_draft_creation_is_private_identity_linked_and_allows_multiple_businesses(): void
    {
        $id = $this->draft();
        $this->draft(['name' => 'Second']);
        $this->getJson("/api/me/businesses/$id")->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'draft')->assertJsonPath('data.submitted_at', null)
            ->assertJsonPath('data.requirements', [
                'funding_amount' => null, 'skills' => [], 'accepted_investment_types' => [],
                'micro_proposed_terms' => null, 'large_standard_proposed_terms' => null,
                'required_experience_level' => null, 'required_availability' => null,
                'compensation_preferences' => [],
            ])
            ->assertJsonMissingPath('data.founder_profile_id')->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.readiness_score')->assertJsonMissingPath('data.published_at');
        $this->assertSame($this->owner->founderProfile->id, Business::findOrFail($id)->founder_profile_id);
        $this->assertDatabaseCount('business_requirements', 2);
        $this->getJson('/api/me/businesses?per_page=1&page=2')->assertOk()
            ->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.id', $id)
            ->assertJsonPath('data.pagination', ['current_page' => 2, 'per_page' => 1, 'total' => 2, 'last_page' => 2]);
        $this->getJson('/api/me/businesses?per_page=101')->assertUnprocessable();
        $this->getJson('/api/me/businesses?status=draft')->assertUnprocessable();
        $this->getJson("/api/businesses/$id")->assertNotFound();
        $this->postJson("/api/me/businesses/$id/publish")->assertUnprocessable();
        $this->deleteJson("/api/me/businesses/$id")->assertStatus(405);
    }

    public function test_submission_validates_persisted_fields_and_repeat_is_idempotent_after_edits(): void
    {
        $id = $this->draft();
        $this->postJson("/api/me/businesses/$id/submit")->assertUnprocessable()
            ->assertJsonValidationErrors(['description', 'industry', 'business_stage', 'location'], 'error.details');
        $this->assertNull(Business::find($id)->submitted_at);
        $this->patchJson("/api/me/businesses/$id", ['description' => 'An idea', 'industry' => 'Technology'])->assertOk();
        $this->postJson("/api/me/businesses/$id/submit")->assertUnprocessable()
            ->assertJsonValidationErrors(['business_stage', 'location'], 'error.details');
        $this->patchJson("/api/me/businesses/$id", ['business_stage' => 'Idea', 'location' => 'Dhaka'])->assertOk();
        $first = $this->postJson("/api/me/businesses/$id/submit")->assertOk()->assertJsonPath('data.status', 'pending_approval')
            ->assertJsonPath('data.requirements.funding_amount', null)->json('data.submitted_at');
        $this->assertNotNull($first);
        $this->travel(1)->hour();
        $this->patchJson("/api/me/businesses/$id", ['description' => null, 'name' => 'Changed'])->assertOk()
            ->assertJsonPath('data.status', 'pending_approval')->assertJsonPath('data.industry', 'Technology');
        $this->postJson("/api/me/businesses/$id/submit")->assertOk()->assertJsonPath('data.submitted_at', $first);
    }

    public static function invalidFields(): array
    {
        return [
            'missing name' => [[]], 'blank' => [['name' => '  ']], 'null' => [['name' => null]],
            'long name' => [['name' => str_repeat('n', 256)]], 'description' => [['name' => 'A', 'description' => str_repeat('x', 10001)]],
            'industry' => [['name' => 'A', 'industry' => str_repeat('x', 101)]],
            'location' => [['name' => 'A', 'location' => str_repeat('x', 256)]],
            'array' => [['name' => 'A', 'business_stage' => []]],
        ];
    }

    #[DataProvider('invalidFields')]
    public function test_invalid_create_payload_leaves_no_records(array $input): void
    {
        $this->postJson('/api/me/businesses', $input)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_requirements', 0);
    }

    public function test_creation_rolls_back_when_requirements_creation_fails(): void
    {
        config(['logging.default' => 'null']);
        BusinessRequirement::creating(fn () => throw new \RuntimeException('Test failure'));
        try {
            $this->postJson('/api/me/businesses', ['name' => 'A'])->assertStatus(500)->assertJsonPath('error.code', 'HTTP_500');
        } finally {
            BusinessRequirement::flushEventListeners();
        }
        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_parent_deletion_is_restricted_and_ownership_cannot_be_mass_assigned(): void
    {
        $id = $this->draft();
        $business = Business::findOrFail($id);
        $business->fill(['founder_profile_id' => 999, 'status' => 'submitted', 'submitted_at' => now()])->save();
        $this->assertSame($this->owner->founderProfile->id, $business->fresh()->founder_profile_id);
        $this->assertSame('draft', $business->fresh()->status->value);
        $this->expectException(QueryException::class);
        $this->owner->founderProfile->delete();
    }

    public function test_business_foreign_key_rejects_missing_founder(): void
    {
        $this->expectException(QueryException::class);
        DB::table('businesses')->insert(['founder_profile_id' => 9999999, 'name' => 'Invalid']);
    }
}
