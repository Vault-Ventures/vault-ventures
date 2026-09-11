<?php

namespace Tests\Feature;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class VerificationRequestCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_unauthenticated_user_denied_creation_and_access(): void
    {
        $this->postJson('/api/me/verification-requests')
            ->assertUnauthorized();

        $this->getJson('/api/me/verification-requests/latest')
            ->assertUnauthorized();

        $this->getJson('/api/me/verification-requests/1')
            ->assertUnauthorized();
    }

    public function test_email_not_verified_is_denied(): void
    {
        $user = User::factory()->unverified()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/verification-requests');
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.email.0', 'Email verification is required before requesting identity verification.');
    }

    public function test_phone_not_verified_is_denied(): void
    {
        $user = User::factory()->create([
            'phone' => null,
            'phone_verified_at' => null,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/verification-requests');
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.phone.0', 'Phone verification is required before requesting identity verification.');
    }

    public function test_tier_0_verified_user_creates_tier_1_request_in_pending_status_without_auto_approval(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/verification-requests');

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification request submitted successfully.')
            ->assertJsonPath('data.requested_tier', 1)
            ->assertJsonPath('data.requested_tier_label', 'Identity Verified')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonMissingPath('data.evidence')
            ->assertJsonMissingPath('data.admin_notes')
            ->assertJsonMissingPath('data.rejection_reason');

        $this->assertDatabaseCount('verification_requests', 1);
        $record = VerificationRequest::firstOrFail();
        $this->assertSame($user->id, $record->user_id);
        $this->assertSame(VerificationTier::Tier1, $record->requested_tier);
        $this->assertSame(VerificationRequestStatus::Pending, $record->status);
        $this->assertNotNull($record->submitted_at);
        $this->assertNull($record->reviewed_at);

        // Verification tier remains Tier 0 (no automatic approval)
        $freshUser = $user->fresh();
        $this->assertSame(VerificationTier::Tier0, $freshUser->verification_tier);
        $this->assertFalse($freshUser->isIdentityVerified());
    }

    public function test_duplicate_active_request_is_rejected(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/verification-requests')
            ->assertCreated();

        // Attempting to submit another request while one is pending is rejected
        $response = $this->postJson('/api/me/verification-requests');
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.request.0', 'You already have an active verification request under review.');
    }

    public function test_user_can_retrieve_their_latest_verification_request(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        // Before creating, latest is null
        $this->getJson('/api/me/verification-requests/latest')
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->postJson('/api/me/verification-requests')
            ->assertCreated();

        $this->getJson('/api/me/verification-requests/latest')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.requested_tier', 1)
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_user_ownership_protection_on_show_endpoint(): void
    {
        $userA = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $userB = User::factory()->create([
            'phone' => '+15557654321',
            'phone_verified_at' => now(),
        ]);

        $this->actingAs($userA, 'web');
        $this->postJson('/api/me/verification-requests')
            ->assertCreated();
        $requestA = VerificationRequest::firstOrFail();

        // User A can view own request
        $this->getJson("/api/me/verification-requests/{$requestA->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $requestA->id);

        // Gate checks
        $this->assertTrue(Gate::forUser($userA)->allows('view', $requestA));
        $this->assertFalse(Gate::forUser($userB)->allows('view', $requestA));

        // User B cannot view User A's request
        $this->app['auth']->forgetGuards();
        $this->actingAs($userB, 'web');
        $this->getJson("/api/me/verification-requests/{$requestA->id}")
            ->assertForbidden();
    }

    public function test_previously_rejected_or_cancelled_request_allows_new_submission(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $pastRequest = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Rejected,
            'rejection_reason' => 'Document unreadable.',
            'submitted_at' => now()->subDays(2),
            'reviewed_at' => now()->subDay(),
        ]);

        $this->postJson('/api/me/verification-requests')
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseCount('verification_requests', 2);
    }

    public function test_requesting_tier_2_is_rejected(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/verification-requests', ['requested_tier' => 2]);
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.requested_tier.0', 'The selected requested tier is invalid.');
    }

    public function test_already_tier_1_verified_user_cannot_create_duplicate_request(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/verification-requests');
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_tier.0', 'You are already identity verified.');
    }
}
