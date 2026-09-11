<?php

namespace Tests\Feature;

use App\Enums\VerificationTier;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class VerificationGatingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);

        // Register testing routes protected by verification.tier middleware
        Route::middleware(['auth:sanctum', 'verification.tier:1'])
            ->get('/api/test/tier1-protected', fn () => ApiResponse::success(['access' => 'granted_tier_1']));

        Route::middleware(['auth:sanctum', 'verification.tier:2'])
            ->get('/api/test/tier2-protected', fn () => ApiResponse::success(['access' => 'granted_tier_2']));
    }

    public function test_unauthenticated_request_is_rejected_by_gating_middleware(): void
    {
        $this->getJson('/api/test/tier1-protected')
            ->assertUnauthorized();
    }

    public function test_tier_0_user_is_rejected_by_tier_1_gate(): void
    {
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier0,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/test/tier1-protected');

        $response->assertForbidden()
            ->assertJsonPath('error.code', 'HTTP_403');
    }

    public function test_tier_1_user_passes_tier_1_gate(): void
    {
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $this->actingAs($user, 'web');

        $this->getJson('/api/test/tier1-protected')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.access', 'granted_tier_1');
    }

    public function test_tier_1_user_is_rejected_by_tier_2_gate(): void
    {
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/test/tier2-protected');

        $response->assertForbidden()
            ->assertJsonPath('error.code', 'HTTP_403');
    }

    public function test_tier_2_user_passes_tier_1_and_tier_2_gates(): void
    {
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier2,
        ]);
        $this->actingAs($user, 'web');

        $this->getJson('/api/test/tier1-protected')
            ->assertOk()
            ->assertJsonPath('data.access', 'granted_tier_1');

        $this->getJson('/api/test/tier2-protected')
            ->assertOk()
            ->assertJsonPath('data.access', 'granted_tier_2');
    }

    public function test_user_model_verification_helper_methods(): void
    {
        $user0 = User::factory()->unverified()->create([
            'phone' => null,
            'phone_verified_at' => null,
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $this->assertFalse($user0->hasTier0Verification());
        $this->assertFalse($user0->isIdentityVerified());
        $this->assertFalse($user0->isTrackRecordVerified());
        $this->assertTrue($user0->hasVerificationTier(0));
        $this->assertFalse($user0->hasVerificationTier(1));
        $this->assertFalse($user0->hasVerificationTier(2));

        $user1 = User::factory()->create([
            'phone' => '+15551111111',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $this->assertTrue($user1->hasTier0Verification());
        $this->assertTrue($user1->isIdentityVerified());
        $this->assertFalse($user1->isTrackRecordVerified());
        $this->assertTrue($user1->hasVerificationTier(0));
        $this->assertTrue($user1->hasVerificationTier(1));
        $this->assertFalse($user1->hasVerificationTier(2));

        $user2 = User::factory()->create([
            'phone' => '+15552222222',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier2,
        ]);

        $this->assertTrue($user2->hasTier0Verification());
        $this->assertTrue($user2->isIdentityVerified());
        $this->assertTrue($user2->isTrackRecordVerified());
        $this->assertTrue($user2->hasVerificationTier(0));
        $this->assertTrue($user2->hasVerificationTier(1));
        $this->assertTrue($user2->hasVerificationTier(2));
    }

    public function test_gate_definitions_for_verification_tiers(): void
    {
        $user0 = User::factory()->unverified()->create([
            'phone' => null,
            'phone_verified_at' => null,
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $this->assertFalse(Gate::forUser($user0)->allows('tier-0'));
        $this->assertFalse(Gate::forUser($user0)->allows('identity-verified'));
        $this->assertFalse(Gate::forUser($user0)->allows('track-record-verified'));
        $this->assertTrue(Gate::forUser($user0)->allows('verification-tier', 0));
        $this->assertFalse(Gate::forUser($user0)->allows('verification-tier', 1));
        $this->assertFalse(Gate::forUser($user0)->allows('verification-tier', 2));

        $user1 = User::factory()->create([
            'phone' => '+15553333333',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $this->assertTrue(Gate::forUser($user1)->allows('tier-0'));
        $this->assertTrue(Gate::forUser($user1)->allows('identity-verified'));
        $this->assertFalse(Gate::forUser($user1)->allows('track-record-verified'));
        $this->assertTrue(Gate::forUser($user1)->allows('verification-tier', 1));
        $this->assertFalse(Gate::forUser($user1)->allows('verification-tier', 2));

        $user2 = User::factory()->create([
            'phone' => '+15554444444',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier2,
        ]);

        $this->assertTrue(Gate::forUser($user2)->allows('tier-0'));
        $this->assertTrue(Gate::forUser($user2)->allows('identity-verified'));
        $this->assertTrue(Gate::forUser($user2)->allows('track-record-verified'));
        $this->assertTrue(Gate::forUser($user2)->allows('verification-tier', 2));
    }

    public function test_tier_2_qualification_remains_deferred(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $this->actingAs($user, 'web');

        // User cannot request Tier 2
        $this->postJson('/api/me/verification-requests', ['requested_tier' => 2])
            ->assertUnprocessable();

        // User tier remains Tier 1
        $this->assertSame(VerificationTier::Tier1, $user->fresh()->verification_tier);
        $this->assertFalse($user->fresh()->isTrackRecordVerified());
    }
}
