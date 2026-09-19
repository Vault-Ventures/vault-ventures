<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessInterestWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(string $email = 'founder@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(string $email = 'investor@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'Apex FinTech';
        $business->description = 'Next-gen payment rails.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = BusinessStatus::Published;
        $business->submitted_at = now();
        $business->save();

        return $business;
    }

    public function test_investor_can_withdraw_own_pending_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Investor expresses interest
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Verify active interest exists
        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'expressed_by_user_id' => $investor->id,
            'status' => 'active',
        ]);

        // Investor withdraws interest
        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.withdrawn', true);

        // Verify interest status is withdrawn
        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'expressed_by_user_id' => $investor->id,
            'status' => 'withdrawn',
        ]);

        // Verify disclosure relationship reverted to Teaser with interest_expressed_at = null
        $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $investor->id)
            ->first();
        $this->assertNotNull($relationship);
        $this->assertEquals(DisclosureStage::Teaser, $relationship->stage);
        $this->assertNull($relationship->interest_expressed_at);
    }

    public function test_founder_and_investor_no_longer_see_withdrawn_interest_in_connections(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Express interest
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Both see 1 connection pending
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');

        $this->actingAs($founder)->getJson('/api/me/connections?role=founder')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');

        // Investor withdraws interest
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Both see 0 connections
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')
            ->assertOk()
            ->assertJsonCount(0, 'data.items');

        $this->actingAs($founder)->getJson('/api/me/connections?role=founder')
            ->assertOk()
            ->assertJsonCount(0, 'data.items');
    }

    public function test_investor_cannot_withdraw_another_investors_interest(): void
    {
        $founder = $this->createFounder();
        $investorA = $this->createInvestor('investorA@example.com');
        $investorB = $this->createInvestor('investorB@example.com');
        $business = $this->createBusiness($founder);

        // Investor A expresses interest
        $this->actingAs($investorA)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Investor B attempts to withdraw (Investor B has no interest in this business)
        $this->actingAs($investorB)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertStatus(422);

        // Investor A's interest remains active
        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investorA->id,
            'expressed_by_user_id' => $investorA->id,
            'status' => 'active',
        ]);
    }

    public function test_withdrawal_is_rejected_when_no_active_interest_exists(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertStatus(422);
    }

    public function test_withdrawal_is_rejected_after_mutual_interest_confirmed(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Investor expresses interest
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Founder reciprocates interest
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        $this->assertDatabaseHas('business_connections', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
        ]);

        // Investor attempts to withdraw after mutual connection established
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertStatus(422);
    }

    public function test_founder_cannot_withdraw_interest_from_own_business_as_counterparty(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertStatus(403);
    }

    public function test_investor_can_re_express_interest_after_withdrawal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Express
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Withdraw
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/withdraw-interest", [
            'role' => 'investor',
        ])->assertOk();

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'status' => 'withdrawn',
        ]);

        // Re-express interest
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'status' => 'active',
        ]);

        // Check connections list shows the item again
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');
    }
}
