<?php

namespace Tests\Feature;

use App\Enums\VerificationTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationProfileIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_unauthenticated_request_to_auth_user_is_rejected(): void
    {
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_tier_0_user_profile_representation_contains_safe_verification_fields(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551234567',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', $user->name)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.phone', '+15551234567')
            ->assertJsonPath('data.verification_tier', 0)
            ->assertJsonPath('data.verification_tier_label', 'Email & Phone Verified');

        $this->assertNotNull($response->json('data.email_verified_at'));
        $this->assertNotNull($response->json('data.phone_verified_at'));
    }

    public function test_tier_0_user_with_unverified_phone_representation(): void
    {
        $user = User::factory()->create([
            'phone' => '+15559876543',
            'phone_verified_at' => null,
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('data.phone', '+15559876543')
            ->assertJsonPath('data.phone_verified_at', null)
            ->assertJsonPath('data.verification_tier', 0)
            ->assertJsonPath('data.verification_tier_label', 'Email & Phone Verified');
    }

    public function test_tier_1_user_profile_representation(): void
    {
        $user = User::factory()->create([
            'phone' => '+15553334444',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('data.verification_tier', 1)
            ->assertJsonPath('data.verification_tier_label', 'Identity Verified');
    }

    public function test_tier_2_profile_representation_remains_deferred(): void
    {
        $user = User::factory()->create([
            'phone' => '+15555556666',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier2,
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('data.verification_tier', 2)
            ->assertJsonPath('data.verification_tier_label', 'Track-Record Verified');

        // Verify tier 2 description clarifies it is deferred
        $this->assertSame(
            'Track-Record Verified (deferred to future on-platform modules).',
            VerificationTier::Tier2->description()
        );
    }

    public function test_sensitive_verification_data_is_never_exposed_in_profile(): void
    {
        $user = User::factory()->create([
            'phone' => '+15557778888',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/auth/user')
            ->assertOk();

        $data = $response->json('data');

        $this->assertArrayNotHasKey('password', $data);
        $this->assertArrayNotHasKey('remember_token', $data);
        $this->assertArrayNotHasKey('is_admin', $data);
        $this->assertArrayNotHasKey('otp', $data);
        $this->assertArrayNotHasKey('code', $data);
        $this->assertArrayNotHasKey('verification_code', $data);
        $this->assertArrayNotHasKey('evidence', $data);
        $this->assertArrayNotHasKey('storage_path', $data);
        $this->assertArrayNotHasKey('disk', $data);
        $this->assertArrayNotHasKey('admin_notes', $data);
    }

    public function test_login_response_exposes_safe_user_resource_with_verification(): void
    {
        $user = User::factory()->create([
            'password' => 'ExampleStrong123!',
            'phone' => '+15559990000',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'ExampleStrong123!',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.verification_tier', 1)
            ->assertJsonPath('data.verification_tier_label', 'Identity Verified')
            ->assertJsonPath('data.phone', '+15559990000');
    }

    public function test_existing_profile_endpoint_remains_functional(): void
    {
        $user = User::factory()->create([
            'phone' => '+15551112233',
            'phone_verified_at' => now(),
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/me/profile')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.name', $user->name)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.roles', [])
            ->assertJsonPath('data.profiles.founder', null)
            ->assertJsonPath('data.profiles.investor', null)
            ->assertJsonPath('data.profiles.professional', null);
    }
}
