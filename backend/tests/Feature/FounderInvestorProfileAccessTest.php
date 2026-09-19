<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessInterest;
use App\Models\FounderProfile;
use App\Models\InvestorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FounderInvestorProfileAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(): User
    {
        $user = User::factory()->create([
            'name' => 'Farhan Founder',
            'email' => 'farhan@founder.com',
            'headline' => 'Building NextGen FinTech',
            'bio' => 'Experienced founder in payments',
            'location' => 'Dhaka, Bangladesh',
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Founder]);
        $user->founderProfile()->create([]);

        return $user;
    }

    private function createInvestor(string $name = 'Rahim Investor', string $email = 'rahim@investor.com'): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
            'headline' => 'Angel Investor & Advisor',
            'bio' => 'Focusing on Seed-stage FinTech and AI startups',
            'location' => 'Dhaka, Bangladesh',
            'verification_tier' => VerificationTier::Tier2,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Investor]);
        $investorProfile = $user->investorProfile()->create([]);
        $investorProfile->preferences()->create([
            'available_investment' => 10000000,
            'minimum_investment' => 500000,
            'maximum_investment' => 2500000,
            'industry' => 'FinTech',
            'risk_level' => 'moderate',
            'business_stage' => 'Seed',
            'location' => 'Dhaka',
            'involvement' => 'Active',
            'investment_types' => ['micro_profit_sharing', 'standard_equity'],
        ]);

        return $user;
    }

    private function createBusiness(User $founder): Business
    {
        return $founder->founderProfile->businesses()->create([
            'name' => 'PayFast Solutions',
            'headline' => 'Digital payment orchestration',
            'summary' => 'Comprehensive payments platform',
            'description' => 'Fast digital payments infrastructure for Bangladesh',
            'category' => 'FinTech',
            'status' => 'published',
            'published_at' => now(),
            'currency' => 'BDT',
            'raising_amount' => 5000000,
        ]);
    }

    public function test_founder_can_view_investor_profile_before_accepting_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Investor expresses interest in founder's business
        BusinessInterest::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'expressed_by_user_id' => $investor->id,
            'status' => 'active',
            'expressed_at' => now(),
        ]);

        // Founder requests investor's profile using investor's real ID
        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$investor->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $investor->id)
            ->assertJsonPath('data.user.name', 'Rahim Investor')
            ->assertJsonPath('data.user.headline', 'Angel Investor & Advisor')
            ->assertJsonPath('data.user.bio', 'Focusing on Seed-stage FinTech and AI startups')
            ->assertJsonPath('data.user.location', 'Dhaka, Bangladesh')
            ->assertJsonPath('data.user.verification_tier', 2)
            ->assertJsonPath('data.user.email', null) // Private email masked/sanitized
            ->assertJsonPath('data.roles', ['investor'])
            ->assertJsonPath('data.profiles.investor.preferences.industry', 'FinTech')
            ->assertJsonPath('data.profiles.investor.preferences.business_stage', 'Seed');

        $this->assertEquals(500000, (float) $response->json('data.profiles.investor.preferences.minimum_investment'));
        $this->assertEquals(2500000, (float) $response->json('data.profiles.investor.preferences.maximum_investment'));
    }

    public function test_founder_can_view_investor_profile_after_accepting_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Connection established
        BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
        ]);

        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$investor->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $investor->id)
            ->assertJsonPath('data.user.name', 'Rahim Investor')
            ->assertJsonPath('data.profiles.investor.preferences.industry', 'FinTech');
    }

    public function test_founder_can_view_discovered_investor_profile_before_expressing_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('Discoverable Investor', 'discoverable@investor.com');

        // Founder discovers investor on /app/founder/discover-investors and opens profile
        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$investor->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $investor->id)
            ->assertJsonPath('data.user.name', 'Discoverable Investor')
            ->assertJsonPath('data.user.headline', 'Angel Investor & Advisor')
            ->assertJsonPath('data.user.bio', 'Focusing on Seed-stage FinTech and AI startups')
            ->assertJsonPath('data.user.email', null) // Masked for privacy
            ->assertJsonPath('data.roles', ['investor'])
            ->assertJsonPath('data.profiles.investor.preferences.industry', 'FinTech')
            ->assertJsonPath('data.profiles.investor.preferences.business_stage', 'Seed');
    }

    public function test_user_cannot_access_profile_of_unenrolled_private_user(): void
    {
        $founder = $this->createFounder();
        // User with no participant role (not investor, professional, or founder)
        $privateUser = User::factory()->create([
            'name' => 'Private Member',
            'email' => 'private@user.com',
        ]);

        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$privateUser->id}/profile");

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $investor = $this->createInvestor();

        $response = $this->getJson("/api/users/{$investor->id}/profile");

        $response->assertUnauthorized();
    }

    public function test_admin_can_view_any_user_profile(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@vaultventures.com',
        ]);
        $admin->adminAccess()->save(new \App\Models\AdminAccess());

        $investor = $this->createInvestor();

        $response = $this->actingAs($admin, 'web')
            ->getJson("/api/users/{$investor->id}/profile");

        $response->assertOk()
            ->assertJsonPath('data.user.id', $investor->id)
            ->assertJsonPath('data.user.email', 'rahim@investor.com'); // Admin can view email
    }


    public function test_own_profile_endpoint_remains_functional(): void
    {
        $investor = $this->createInvestor();

        $response = $this->actingAs($investor, 'web')
            ->getJson('/api/me/profile');

        $response->assertOk()
            ->assertJsonPath('data.user.id', $investor->id)
            ->assertJsonPath('data.user.email', $investor->email)
            ->assertJsonPath('data.user.verification_tier', 2);
    }
}
