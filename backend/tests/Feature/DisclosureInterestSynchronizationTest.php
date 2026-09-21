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
use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisclosureInterestSynchronizationTest extends TestCase
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

    private function createProfessional(string $email = 'professional@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([
            'industry_experience' => ['Healthcare', 'Technology'],
            'experience_level' => 'Senior',
            'availability' => 'Full-time',
            'location' => 'Dhaka',
        ]);
        $user->unsetRelations();

        return $user;
    }

    private function createMultiRoleUser(string $email = 'multirole@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->professionalProfile()->firstOrCreate([
            'industry_experience' => ['Finance'],
            'experience_level' => 'Lead',
            'availability' => 'Part-time',
            'location' => 'Dhaka',
        ]);
        $user->unsetRelations();

        return $user;
    }

    private function createPublishedBusiness(User $founder, string $name = 'HealthTech Venture'): Business
    {
        $business = $founder->founderProfile->businesses()->create([
            'name' => $name,
            'description' => 'Healthcare solutions and clinic operations.',
            'industry' => 'Healthcare',
            'business_stage' => 'Growth',
            'location' => 'Dhaka',
            'risk_level' => 'medium',
            'expected_involvement' => 'advisory',
        ]);
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        return $business;
    }

    // 1. Professional express-interest creates disclosure relationship
    public function test_01_professional_express_interest_creates_disclosure_relationship(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $response = $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $pro->id)
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertDatabaseHas('business_disclosure_relationships', [
            'business_id' => $business->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'stage' => DisclosureStage::Extended->value,
        ]);
    }

    // 2. Professional express-interest creates canonical BusinessInterest
    public function test_02_professional_express_interest_creates_canonical_business_interest(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'expressed_by_user_id' => $pro->id,
            'status' => 'active',
        ]);
    }

    // 3. Both records refer to same business/user/role
    public function test_03_both_records_refer_to_same_business_user_and_role(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $disc = BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $pro->id)
            ->firstOrFail();

        $interest = BusinessInterest::where('business_id', $business->id)
            ->where('counterparty_user_id', $pro->id)
            ->firstOrFail();

        $this->assertSame($disc->business_id, $interest->business_id);
        $this->assertSame($disc->counterparty_user_id, $interest->counterparty_user_id);
        $this->assertSame($disc->counterparty_role->value, $interest->counterparty_role->value);
        $this->assertSame($pro->id, $interest->expressed_by_user_id);
    }

    // 4. Operation is atomic
    public function test_04_atomic_synchronization(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->assertDatabaseCount('business_disclosure_relationships', 1);
        $this->assertDatabaseCount('business_interests', 1);
    }

    // 5. Professional connection list returns one-sided interest
    public function test_05_professional_connection_list_returns_one_sided_interest(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $response = $this->actingAs($pro)->getJson('/api/me/connections?role=professional');

        $response->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.business.id', $business->id)
            ->assertJsonPath('data.items.0.counterparty_role', 'professional')
            ->assertJsonPath('data.items.0.has_counterparty_interest', true)
            ->assertJsonPath('data.items.0.has_founder_interest', false)
            ->assertJsonPath('data.items.0.is_mutual', false)
            ->assertJsonPath('data.items.0.is_connected', false);
    }

    // 6. Founder connection list returns same one-sided interest
    public function test_06_founder_connection_list_returns_same_one_sided_interest(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $response = $this->actingAs($founder)->getJson('/api/me/connections?role=founder');

        $response->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.business.id', $business->id)
            ->assertJsonPath('data.items.0.counterparty.id', $pro->id)
            ->assertJsonPath('data.items.0.counterparty_role', 'professional')
            ->assertJsonPath('data.items.0.has_counterparty_interest', true)
            ->assertJsonPath('data.items.0.has_founder_interest', false)
            ->assertJsonPath('data.items.0.is_mutual', false)
            ->assertJsonPath('data.items.0.is_connected', false);
    }

    // 7. has_counterparty_interest = true, has_founder_interest = false before Founder reciprocation
    public function test_07_has_counterparty_interest_true_and_has_founder_interest_false_before_reciprocation(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $status = $this->actingAs($pro)->getJson("/api/me/businesses/{$business->id}/connection-status");
        $status->assertOk()
            ->assertJsonPath('data.has_counterparty_interest', true)
            ->assertJsonPath('data.has_founder_interest', false)
            ->assertJsonPath('data.is_mutual', false)
            ->assertJsonPath('data.is_connected', false);
    }

    // 8. is_mutual = false, is_connected = false before reciprocation
    public function test_08_is_mutual_and_is_connected_false_before_reciprocation(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $status = $this->actingAs($founder)->getJson("/api/me/businesses/{$business->id}/connection-status?counterparty_user_id={$pro->id}&role=professional");
        $status->assertOk()
            ->assertJsonPath('data.is_mutual', false)
            ->assertJsonPath('data.is_connected', false);
    }

    // 9. Founder reciprocation creates mutual connection
    public function test_09_founder_reciprocation_creates_mutual_connection(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.has_founder_interest', true)
            ->assertJsonPath('data.has_counterparty_interest', true)
            ->assertJsonPath('data.is_mutual', true)
            ->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseCount('business_connections', 1);
        $this->assertDatabaseHas('business_connections', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
        ]);
    }

    // 10. Professional list reports connected and mutual after reciprocation
    public function test_10_professional_list_reports_connected_and_mutual_after_reciprocation(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        $response = $this->actingAs($pro)->getJson('/api/me/connections?role=professional');
        $response->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.has_founder_interest', true)
            ->assertJsonPath('data.items.0.has_counterparty_interest', true)
            ->assertJsonPath('data.items.0.is_mutual', true)
            ->assertJsonPath('data.items.0.is_connected', true);
    }

    // 11. Founder list reports connected and mutual after reciprocation
    public function test_11_founder_list_reports_connected_and_mutual_after_reciprocation(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        $response = $this->actingAs($founder)->getJson('/api/me/connections?role=founder');
        $response->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.has_founder_interest', true)
            ->assertJsonPath('data.items.0.has_counterparty_interest', true)
            ->assertJsonPath('data.items.0.is_mutual', true)
            ->assertJsonPath('data.items.0.is_connected', true);
    }

    // 12. Repeated express-interest is idempotent
    public function test_12_repeated_express_interest_is_idempotent(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $response2 = $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ]);

        $response2->assertOk()
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertDatabaseCount('business_disclosure_relationships', 1);
        $this->assertDatabaseCount('business_interests', 1);
    }

    // 13. Repeated Founder reciprocal action is idempotent
    public function test_13_repeated_founder_reciprocal_action_is_idempotent(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        $res2 = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ]);

        $res2->assertOk()->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseCount('business_connections', 1);
        $this->assertDatabaseCount('business_interests', 2);
    }

    // 14. No duplicate BusinessInterest
    public function test_14_no_duplicate_business_interest(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        for ($i = 0; $i < 3; $i++) {
            $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
                'role' => 'professional',
            ])->assertOk();
        }

        $this->assertDatabaseCount('business_interests', 1);
    }

    // 15. No duplicate BusinessConnection
    public function test_15_no_duplicate_business_connection(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        for ($i = 0; $i < 3; $i++) {
            $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
                'counterparty_user_id' => $pro->id,
                'role' => 'professional',
            ])->assertOk();
        }

        $this->assertDatabaseCount('business_connections', 1);
    }

    // 16. Professional role preserved
    public function test_16_professional_role_preserved(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $interest = BusinessInterest::where('counterparty_user_id', $pro->id)->firstOrFail();
        $this->assertSame(ParticipantRole::Professional, $interest->counterparty_role);
    }

    // 17. Investor role preserved
    public function test_17_investor_role_preserved(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        $interest = BusinessInterest::where('counterparty_user_id', $investor->id)->firstOrFail();
        $this->assertSame(ParticipantRole::Investor, $interest->counterparty_role);
    }

    // 18. Multi-role Professional action remains Professional
    public function test_18_multi_role_professional_context_remains_professional(): void
    {
        $founder = $this->createFounder();
        $multi = $this->createMultiRoleUser();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($multi)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $interest = BusinessInterest::where('counterparty_user_id', $multi->id)->firstOrFail();
        $this->assertSame(ParticipantRole::Professional, $interest->counterparty_role);

        // Does not show up in investor connections list
        $invList = $this->actingAs($multi)->getJson('/api/me/connections?role=investor');
        $invList->assertOk()->assertJsonCount(0, 'data.items');

        // Shows up in professional connections list
        $proList = $this->actingAs($multi)->getJson('/api/me/connections?role=professional');
        $proList->assertOk()->assertJsonCount(1, 'data.items');
    }

    // 19. Unauthorized/IDOR cases rejected
    public function test_19_unauthorized_and_idor_cases_rejected(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $unrelated = User::factory()->create(); // No participant roles
        $business = $this->createPublishedBusiness($founder);

        // Founder cannot express counterparty interest in own business
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertStatus(403);

        // User without participant roles rejected
        $this->actingAs($unrelated)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertStatus(403);
    }

    // 19b. Unauthenticated requests are rejected
    public function test_19b_unauthenticated_requests_are_rejected(): void
    {
        $founder = $this->createFounder();
        $business = $this->createPublishedBusiness($founder);

        $this->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertUnauthorized();
    }

    // 20. Disclosure stage behavior remains correct
    public function test_20_disclosure_stage_behavior_remains_correct_at_stage_2(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $status = $this->actingAs($pro)->getJson("/api/me/businesses/{$business->id}/disclosure-status");
        $status->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.has_expressed_interest', true);
    }

    // 21. Existing Investor flow remains green
    public function test_21_existing_investor_flow_remains_green(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'investor',
        ])->assertOk();

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        $this->assertDatabaseCount('business_connections', 1);
        $this->assertDatabaseHas('business_connections', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
        ]);
    }

    // 22. Existing disclosure-only record is reconciled idempotently in connection list
    public function test_22_existing_disclosure_only_record_is_reconciled_idempotently_in_connection_list(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        // Create disclosure-only record without business_interests row (simulating rafiul's initial state)
        BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => ParticipantRole::Professional,
            'stage' => DisclosureStage::Extended,
            'interest_expressed_at' => now(),
        ]);

        $this->assertDatabaseCount('business_interests', 0);

        // Fetching connection list should reconcile and return the item
        $response = $this->actingAs($pro)->getJson('/api/me/connections?role=professional');
        $response->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.business.id', $business->id)
            ->assertJsonPath('data.items.0.counterparty_role', 'professional')
            ->assertJsonPath('data.items.0.has_counterparty_interest', true)
            ->assertJsonPath('data.items.0.has_founder_interest', false);

        // Check that business_interests row now exists
        $this->assertDatabaseCount('business_interests', 1);
        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'expressed_by_user_id' => $pro->id,
        ]);
    }

    // 23. Deal lifecycle is not prematurely mutated
    public function test_23_deal_lifecycle_is_not_prematurely_mutated(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/express-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        // No deal created automatically
        $this->assertDatabaseCount('deals', 0);
    }
}
