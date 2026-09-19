<?php

namespace Tests\Feature;

use App\Enums\DealStage;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealMilestone;
use App\Models\DealTermProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiBusinessDealIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials()->withHeaders([
            'Origin' => 'http://localhost:8443',
            'Accept' => 'application/json',
        ]);
    }

    private function createFounderWithBusiness(string $businessName = 'Test Enterprise'): array
    {
        $founder = User::factory()->create();
        $founder->roles()->create(['role' => 'founder']);
        $profile = $founder->founderProfile()->create([]);

        $business = new Business;
        $business->forceFill([
            'founder_profile_id' => $profile->id,
            'name' => $businessName,
            'industry' => 'Fintech',
            'business_stage' => 'early_traction',
            'location' => 'Dhaka, Bangladesh',
            'status' => 'published',
        ])->save();

        return [$founder, $business];
    }

    private function createParticipant(string $role = 'investor'): User
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => $role]);
        if ($role === 'investor') {
            $user->investorProfile()->create([]);
        } elseif ($role === 'professional') {
            $user->professionalProfile()->create([]);
        }

        return $user;
    }

    private function createConnectionAndDeal(Business $business, User $founder, User $counterparty, string $role = 'investor', DealStage $stage = DealStage::Negotiation): array
    {
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
        ]);

        return [$connection, $deal];
    }

    public function test_one_founder_multiple_businesses_separate_deals(): void
    {
        [$founder, $businessA] = $this->createFounderWithBusiness('Alpha Ventures');

        $profile = $founder->founderProfile;
        $businessB = new Business;
        $businessB->forceFill([
            'founder_profile_id' => $profile->id,
            'name' => 'Beta Logistics',
            'industry' => 'Logistics',
            'business_stage' => 'growth',
            'location' => 'Chittagong, Bangladesh',
            'status' => 'published',
        ]);
        $businessB->save();

        $investor1 = $this->createParticipant('investor');
        $investor2 = $this->createParticipant('investor');

        [, $dealA] = $this->createConnectionAndDeal($businessA, $founder, $investor1, 'investor');
        [, $dealB] = $this->createConnectionAndDeal($businessB, $founder, $investor2, 'investor');

        // Founder sees both deals in the listing
        $response = $this->actingAs($founder)->getJson('/api/me/deals');
        $response->assertOk()
            ->assertJsonPath('data.pagination.total', 2);

        $dealIds = collect($response->json('data.items'))->pluck('id')->all();
        $this->assertContains($dealA->id, $dealIds);
        $this->assertContains($dealB->id, $dealIds);

        // Filter by Business A
        $responseA = $this->actingAs($founder)->getJson("/api/me/deals?business_id={$businessA->id}");
        $responseA->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.id', $dealA->id)
            ->assertJsonPath('data.items.0.business.name', 'Alpha Ventures');

        // Filter by Business B
        $responseB = $this->actingAs($founder)->getJson("/api/me/deals?business_id={$businessB->id}");
        $responseB->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.id', $dealB->id)
            ->assertJsonPath('data.items.0.business.name', 'Beta Logistics');

        // Investor 1 only sees Deal A
        $this->actingAs($investor1)->getJson('/api/me/deals?role=investor')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.id', $dealA->id);

        // Investor 1 is forbidden from accessing Deal B directly
        $this->actingAs($investor1)->getJson("/api/me/deals/{$dealB->id}?role=investor")
            ->assertForbidden();

        // Investor 2 is forbidden from accessing Deal A directly
        $this->actingAs($investor2)->getJson("/api/me/deals/{$dealA->id}?role=investor")
            ->assertForbidden();
    }

    public function test_same_investor_connected_to_multiple_businesses_of_same_founder(): void
    {
        [$founder, $business1] = $this->createFounderWithBusiness('Fintech One');

        $profile = $founder->founderProfile;
        $business2 = new Business;
        $business2->forceFill([
            'founder_profile_id' => $profile->id,
            'name' => 'HealthTech Two',
            'industry' => 'Healthcare',
            'business_stage' => 'prototype',
            'location' => 'Dhaka',
            'status' => 'published',
        ]);
        $business2->save();

        $investor = $this->createParticipant('investor');

        [, $deal1] = $this->createConnectionAndDeal($business1, $founder, $investor, 'investor');
        [, $deal2] = $this->createConnectionAndDeal($business2, $founder, $investor, 'investor');

        // Investor sees both independent deals
        $response = $this->actingAs($investor)->getJson('/api/me/deals?role=investor');
        $response->assertOk()
            ->assertJsonPath('data.pagination.total', 2);

        // Propose terms on Deal 1
        $prop1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal1->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 500000,
            'equity_percentage' => 10,
            'proposed_terms' => 'Deal 1 terms',
        ])->assertCreated()->json('data');

        // Propose terms on Deal 2
        $prop2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal2->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 1000000,
            'profit_sharing_percentage' => 20,
            'proposed_terms' => 'Deal 2 terms',
        ])->assertCreated()->json('data');

        // Verify proposals are isolated
        $deal1Neg = $this->actingAs($investor)->getJson("/api/me/deals/{$deal1->id}/negotiation?role=investor")
            ->assertOk()->json('data');
        $this->assertSame($prop1['id'], $deal1Neg['active_proposal']['id']);
        $this->assertSame('standard_equity', $deal1Neg['active_proposal']['investment_type']);

        $deal2Neg = $this->actingAs($investor)->getJson("/api/me/deals/{$deal2->id}/negotiation?role=investor")
            ->assertOk()->json('data');
        $this->assertSame($prop2['id'], $deal2Neg['active_proposal']['id']);
        $this->assertSame('micro_profit_sharing', $deal2Neg['active_proposal']['investment_type']);

        // Investor accepts Deal 1 proposal
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal1->id}/negotiation/{$prop1['id']}/respond?role=investor", [
            'action' => 'accept',
        ])->assertOk()->assertJsonPath('data.status', 'accepted');

        // Deal 2 proposal remains in 'proposed' state
        $this->assertDatabaseHas('deal_term_proposals', [
            'id' => $prop2['id'],
            'status' => 'proposed',
        ]);
    }

    public function test_business_with_multiple_counterparties_investor_and_professional(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness('Mega Corp');

        $investor = $this->createParticipant('investor');
        $professional = $this->createParticipant('professional');

        [, $investorDeal] = $this->createConnectionAndDeal($business, $founder, $investor, 'investor');
        [, $professionalDeal] = $this->createConnectionAndDeal($business, $founder, $professional, 'professional');

        // Investor cannot access Professional deal
        $this->actingAs($investor)->getJson("/api/me/deals/{$professionalDeal->id}?role=investor")
            ->assertForbidden();

        // Professional cannot access Investor deal
        $this->actingAs($professional)->getJson("/api/me/deals/{$investorDeal->id}?role=professional")
            ->assertForbidden();

        // Founder has access to both deals for this business
        $this->actingAs($founder)->getJson("/api/me/deals/{$investorDeal->id}")->assertOk();
        $this->actingAs($founder)->getJson("/api/me/deals/{$professionalDeal->id}")->assertOk();
    }

    public function test_cross_business_child_resource_idor_protection(): void
    {
        [$founder1, $business1] = $this->createFounderWithBusiness('Business One');
        [$founder2, $business2] = $this->createFounderWithBusiness('Business Two');

        $investor1 = $this->createParticipant('investor');
        $investor2 = $this->createParticipant('investor');

        [, $deal1] = $this->createConnectionAndDeal($business1, $founder1, $investor1, 'investor');
        [, $deal2] = $this->createConnectionAndDeal($business2, $founder2, $investor2, 'investor');

        $milestone1 = DealMilestone::create([
            'deal_id' => $deal1->id,
            'sequence_order' => 1,
            'title' => 'Milestone Deal 1',
            'target_amount' => 50000,
        ]);

        $milestone2 = DealMilestone::create([
            'deal_id' => $deal2->id,
            'sequence_order' => 1,
            'title' => 'Milestone Deal 2',
            'target_amount' => 100000,
        ]);

        // Attempting to access/update Milestone 2 via Deal 1 returns 404
        $this->actingAs($founder1)->putJson("/api/me/deals/{$deal1->id}/milestones/{$milestone2->id}", [
            'title' => 'Hacked',
        ])->assertNotFound();

        // Attempting to access Milestone 2 on Deal 2 directly as Founder 1 returns 403
        $this->actingAs($founder1)->putJson("/api/me/deals/{$deal2->id}/milestones/{$milestone2->id}", [
            'title' => 'Hacked',
        ])->assertForbidden();

        // Attempting to access Milestone 1 on Deal 2 as Founder 2 returns 404
        $this->actingAs($founder2)->putJson("/api/me/deals/{$deal2->id}/milestones/{$milestone1->id}", [
            'title' => 'Hacked',
        ])->assertNotFound();

        // Milestones remain unmodified
        $this->assertDatabaseHas('deal_milestones', ['id' => $milestone1->id, 'title' => 'Milestone Deal 1']);
        $this->assertDatabaseHas('deal_milestones', ['id' => $milestone2->id, 'title' => 'Milestone Deal 2']);
    }

    public function test_prevent_duplicate_deal_creation_on_same_connection(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness('Single Connection Corp');
        $investor = $this->createParticipant('investor');

        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
        ]);

        // First creation succeeds
        $res1 = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");
        $res1->assertCreated();

        // Second creation attempt fails with validation error
        $res2 = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");
        $res2->assertUnprocessable()
            ->assertJsonValidationErrors(['connection'], 'error.details');

        $this->assertDatabaseCount('deals', 1);
    }

    public function test_cannot_create_deal_with_inconsistent_connection_ownership(): void
    {
        [$founderA, $businessA] = $this->createFounderWithBusiness('Business A');
        [$founderB, $businessB] = $this->createFounderWithBusiness('Business B');
        $investor = $this->createParticipant('investor');

        $connectionA = BusinessConnection::create([
            'business_id' => $businessA->id,
            'founder_user_id' => $founderA->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
        ]);

        // Founder B cannot create a deal on Founder A's connection
        $this->actingAs($founderB)->postJson("/api/me/connections/{$connectionA->id}/deal")
            ->assertForbidden();

        $this->assertDatabaseCount('deals', 0);
    }

    public function test_unrelated_outsider_cannot_list_or_view_any_deals(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness('Secret Business');
        $investor = $this->createParticipant('investor');
        [, $deal] = $this->createConnectionAndDeal($business, $founder, $investor, 'investor');

        $outsider = User::factory()->create();
        $outsider->roles()->create(['role' => 'investor']);
        $outsider->investorProfile()->create([]);

        // Outsider lists deals -> empty list
        $response = $this->actingAs($outsider)->getJson('/api/me/deals?role=investor');
        $response->assertOk()
            ->assertJsonPath('data.pagination.total', 0)
            ->assertJsonPath('data.items', []);

        // Outsider direct deal access -> 403
        $this->actingAs($outsider)->getJson("/api/me/deals/{$deal->id}?role=investor")
            ->assertForbidden();
    }
}
