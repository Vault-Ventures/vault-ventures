<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_user_can_enroll_new_role(): void
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);

        $res = $this->actingAs($user)->postJson('/api/me/roles', [
            'role' => 'investor',
        ]);

        $res->assertStatus(201);
        $this->assertTrue($user->fresh()->hasRole(ParticipantRole::Investor));
        $this->assertNotNull($user->fresh()->investorProfile);
        $this->assertNotNull($user->fresh()->investorProfile->preferences);
    }

    public function test_user_can_remove_role_if_multiple_roles_exist(): void
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);
        $user->roles()->create(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->create([]);

        $res = $this->actingAs($user)->deleteJson('/api/me/roles/investor');
        $res->assertOk();
        $res->assertJsonPath('data.removed_role', 'investor');
        $res->assertJsonPath('data.roles.0', 'founder');

        $this->assertFalse($user->fresh()->hasRole(ParticipantRole::Investor));
        $this->assertTrue($user->fresh()->hasRole(ParticipantRole::Founder));
        // Historical profile preserved
        $this->assertNotNull($user->fresh()->investorProfile);
    }

    public function test_user_cannot_remove_their_only_role(): void
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);

        $res = $this->actingAs($user)->deleteJson('/api/me/roles/founder');
        $res->assertStatus(422);
        $this->assertTrue($user->fresh()->hasRole(ParticipantRole::Founder));
    }

    public function test_user_can_enroll_investor_role_with_preferences(): void
    {
        $user = User::factory()->create(['bio' => null]);
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);

        $res = $this->actingAs($user)->postJson('/api/me/roles', [
            'role' => 'investor',
            'minimum_investment' => 50000,
            'maximum_investment' => 500000,
            'industry' => 'FinTech',
            'business_stage' => 'Seed',
            'location' => 'Dhaka',
            'involvement' => 'Active',
            'investment_types' => ['micro', 'large_standard'],
            'investment_thesis' => 'Backing early stage fintech founders.',
        ]);

        $res->assertStatus(201);
        $fresh = $user->fresh();
        $this->assertTrue($fresh->hasRole(ParticipantRole::Investor));
        $this->assertEquals('Backing early stage fintech founders.', $fresh->bio);

        $pref = $fresh->investorProfile->preferences;
        $this->assertNotNull($pref);
        $this->assertEquals('50000.00', $pref->minimum_investment);
        $this->assertEquals('500000.00', $pref->maximum_investment);
        $this->assertEquals('FinTech', $pref->industry);
        $this->assertEquals(['micro', 'large_standard'], $pref->investment_types);
    }

    public function test_invalid_investor_enrollment_does_not_persist_role(): void
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);

        $res = $this->actingAs($user)->postJson('/api/me/roles', [
            'role' => 'investor',
            'investment_types' => ['invalid_type_name'],
        ]);

        $res->assertStatus(422);
        $this->assertFalse($user->fresh()->hasRole(ParticipantRole::Investor));
    }

    public function test_unauthenticated_user_cannot_remove_role(): void
    {
        $res = $this->deleteJson('/api/me/roles/founder');
        $res->assertStatus(401);
    }
}
