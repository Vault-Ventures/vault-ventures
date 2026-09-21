<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessConnectionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(string $email = 'founder@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(string $email = 'investor@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(string $email = 'pro@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createMultiRoleUser(string $email = 'multi@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, BusinessStatus $status = BusinessStatus::Submitted): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'Secure Pay Ltd';
        $business->description = 'Fintech infrastructure in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = $status;
        $business->submitted_at = $status === BusinessStatus::Submitted ? now() : null;
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 50000.00,
            'accepted_investment_types' => ['equity', 'safe'],
            'micro_proposed_terms' => 'Micro terms for angel checks up to $10k.',
            'large_standard_proposed_terms' => 'Standard SAFE note with $5M valuation cap.',
            'required_experience_level' => 'Senior',
            'required_availability' => 'Part-time (10h/week)',
            'compensation_preferences' => ['equity'],
        ]);

        $skill1 = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $skill2 = Skill::firstOrCreate(['normalized_name' => 'fintech', 'name' => 'Fintech']);
        $req->skills()->sync([$skill1->id, $skill2->id]);

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor,
        DisclosureStage $stage = DisclosureStage::Teaser,
        bool $expressedInterest = false
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => $expressedInterest ? now() : null,
        ]);
    }

    // ==========================================
    // 1. Founder can express interest to Investor
    // ==========================================
    public function test_01_founder_can_express_interest_to_investor(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.founder_user_id', $founder->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.has_founder_interest', true)
            ->assertJsonPath('data.has_counterparty_interest', false)
            ->assertJsonPath('data.is_mutual', false)
            ->assertJsonPath('data.is_connected', false);

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
            'expressed_by_user_id' => $founder->id,
            'status' => 'active',
        ]);
    }

    // ==========================================
    // 2. Founder can express interest to Professional
    // ==========================================
    public function test_02_founder_can_express_interest_to_professional(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional);

        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.has_founder_interest', true)
            ->assertJsonPath('data.is_connected', false);

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'expressed_by_user_id' => $founder->id,
            'status' => 'active',
        ]);
    }

    // ==========================================
    // 3. Non-owner Founder cannot express interest for another Founder business
    // ==========================================
    public function test_03_non_owner_founder_cannot_express_interest_for_another_founder_business(): void
    {
        $founder1 = $this->createFounder('founder1@example.com');
        $founder2 = $this->createFounder('founder2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder1);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($founder2)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // 4. Investor can reciprocate a valid Founder interest
    // ==========================================
    public function test_04_investor_can_reciprocate_a_valid_founder_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        // Founder expresses interest first
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // Investor reciprocates
        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.has_founder_interest', true)
            ->assertJsonPath('data.has_counterparty_interest', true)
            ->assertJsonPath('data.is_mutual', true)
            ->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
            'expressed_by_user_id' => $investor->id,
            'status' => 'active',
        ]);
    }

    // ==========================================
    // 5. Professional can reciprocate a valid Founder interest
    // ==========================================
    public function test_05_professional_can_reciprocate_a_valid_founder_interest(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional);

        // Founder expresses interest first
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        // Professional reciprocates
        $response = $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'professional',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.has_founder_interest', true)
            ->assertJsonPath('data.has_counterparty_interest', true)
            ->assertJsonPath('data.is_mutual', true)
            ->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseHas('business_interests', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'expressed_by_user_id' => $pro->id,
            'status' => 'active',
        ]);
    }

    // ==========================================
    // 6. Mutual Investor interest creates one Connection
    // ==========================================
    public function test_06_mutual_investor_interest_creates_one_connection(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
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

    // ==========================================
    // 7. Mutual Professional interest creates one Connection
    // ==========================================
    public function test_07_mutual_professional_interest_creates_one_connection(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'professional',
        ])->assertOk();

        $this->assertDatabaseCount('business_connections', 1);
        $this->assertDatabaseHas('business_connections', [
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
        ]);
    }

    // ==========================================
    // 8. Repeated reciprocal action does not create duplicate Connection
    // ==========================================
    public function test_08_repeated_reciprocal_action_does_not_create_duplicate_connection(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // First reciprocate
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Second reciprocate
        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseCount('business_connections', 1);
        $this->assertDatabaseCount('business_interests', 2);
    }

    // ==========================================
    // 9. Repeated Founder interest does not create duplicate active interest
    // ==========================================
    public function test_09_repeated_founder_interest_does_not_create_duplicate_active_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        // First call
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // Second call
        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.has_founder_interest', true);

        $this->assertDatabaseCount('business_interests', 1);
    }

    // ==========================================
    // 10. Cross-business interest is rejected
    // ==========================================
    public function test_10_cross_business_interest_is_rejected(): void
    {
        $founder1 = $this->createFounder('f1@example.com');
        $founder2 = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $biz1 = $this->createBusiness($founder1);
        $biz2 = $this->createBusiness($founder2);

        // Relationship only exists on biz1
        $this->createRelationship($biz1, $investor, ParticipantRole::Investor);

        // Founder 2 tries to express interest on biz2 without relationship
        $response = $this->actingAs($founder2)->postJson("/api/me/businesses/{$biz2->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 11. Invalid target role rejected
    // ==========================================
    public function test_11_invalid_target_role_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'admin',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 12. Investor cannot target another Investor
    // ==========================================
    public function test_12_investor_cannot_target_another_investor(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor1, ParticipantRole::Investor);
        $this->createRelationship($business, $investor2, ParticipantRole::Investor);

        // Investor 1 tries to express founder interest targeting Investor 2
        $response = $this->actingAs($investor1)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor2->id,
            'role' => 'investor',
        ]);

        // Non-founder calling interests without founder interest from business owner
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 13. Professional cannot target another Professional
    // ==========================================
    public function test_13_professional_cannot_target_another_professional(): void
    {
        $founder = $this->createFounder();
        $pro1 = $this->createProfessional('pro1@example.com');
        $pro2 = $this->createProfessional('pro2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro1, ParticipantRole::Professional);
        $this->createRelationship($business, $pro2, ParticipantRole::Professional);

        $response = $this->actingAs($pro1)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $pro2->id,
            'role' => 'professional',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 14. Counterparty cannot impersonate another user
    // ==========================================
    public function test_14_counterparty_cannot_impersonate_another_user(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor1, ParticipantRole::Investor);
        $this->createRelationship($business, $investor2, ParticipantRole::Investor);

        // Founder expresses interest in investor1
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor1->id,
            'role' => 'investor',
        ])->assertOk();

        // Investor2 tries to reciprocate on behalf of investor1
        // The endpoint resolves identity strictly from $request->user()
        $response = $this->actingAs($investor2)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'counterparty_user_id' => $investor1->id,
            'role' => 'investor',
        ]);

        // Fails because founder has not expressed interest in investor2
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 15. Multi-role user without role parameter rejected
    // ==========================================
    public function test_15_multi_role_user_without_role_parameter_rejected(): void
    {
        $founder = $this->createFounder();
        $multi = $this->createMultiRoleUser();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $multi, ParticipantRole::Investor);

        // Founder expresses interest specifying role
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $multi->id,
            'role' => 'investor',
        ])->assertOk();

        // Multi-role user reciprocates without role parameter
        $response = $this->actingAs($multi)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", []);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 16. Invalid role rejected
    // ==========================================
    public function test_16_invalid_role_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'invalid_role',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 17. Tier 0 user can express interest if otherwise authorized
    // ==========================================
    public function test_17_tier_0_user_can_express_interest_if_otherwise_authorized(): void
    {
        $founder = $this->createFounder('founder_t0@example.com', VerificationTier::Tier0);
        $investor = $this->createInvestor('investor_t0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        // Tier 0 founder expresses interest
        $response1 = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);
        $response1->assertOk()
            ->assertJsonPath('data.has_founder_interest', true);

        // Tier 0 investor reciprocates
        $response2 = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);
        $response2->assertOk()
            ->assertJsonPath('data.is_connected', true);
    }

    // ==========================================
    // 18. Invalid/missing disclosure relationship rejected
    // ==========================================
    public function test_18_invalid_missing_disclosure_relationship_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // NO disclosure relationship created

        $response = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // 19. Draft/private business isolation preserved
    // ==========================================
    public function test_19_draft_private_business_isolation_preserved(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $draftBusiness = $this->createBusiness($founder, BusinessStatus::Draft);

        // Investor accessing draft business gets 404
        $response = $this->actingAs($investor)->getJson("/api/me/businesses/{$draftBusiness->id}/connection-status");
        $response->assertNotFound();

        $response2 = $this->actingAs($investor)->postJson("/api/me/businesses/{$draftBusiness->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);
        $response2->assertNotFound();
    }

    // ==========================================
    // 20. Connection is scoped to exact business + participant pair
    // ==========================================
    public function test_20_connection_is_scoped_to_exact_business_participant_pair(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $biz1 = $this->createBusiness($founder);
        $biz2 = $this->createBusiness($founder);

        $this->createRelationship($biz1, $investor1, ParticipantRole::Investor);
        $this->createRelationship($biz2, $investor1, ParticipantRole::Investor);
        $this->createRelationship($biz1, $investor2, ParticipantRole::Investor);

        // Connect on biz1 with investor1
        $this->actingAs($founder)->postJson("/api/me/businesses/{$biz1->id}/interests", [
            'counterparty_user_id' => $investor1->id,
            'role' => 'investor',
        ])->assertOk();
        $this->actingAs($investor1)->postJson("/api/me/businesses/{$biz1->id}/reciprocal-interest", [
            'role' => 'investor',
        ])->assertOk();

        // Check biz1 + investor1 is connected
        $res1 = $this->actingAs($investor1)->getJson("/api/me/businesses/{$biz1->id}/connection-status");
        $res1->assertOk()->assertJsonPath('data.is_connected', true);

        // Check biz2 + investor1 is NOT connected
        $res2 = $this->actingAs($investor1)->getJson("/api/me/businesses/{$biz2->id}/connection-status");
        $res2->assertOk()->assertJsonPath('data.is_connected', false);

        // Check biz1 + investor2 is NOT connected
        $res3 = $this->actingAs($investor2)->getJson("/api/me/businesses/{$biz1->id}/connection-status");
        $res3->assertOk()->assertJsonPath('data.is_connected', false);
    }

    // ==========================================
    // 21. Connection creation is transactional/duplicate-safe
    // ==========================================
    public function test_21_connection_creation_is_transactional_and_duplicate_safe(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // Pre-create connection row directly
        BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
        ]);

        // Reciprocate should not fail on unique constraint
        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_connected', true);

        $this->assertDatabaseCount('business_connections', 1);
    }

    // ==========================================
    // 22. Unauthorized connection status access rejected
    // ==========================================
    public function test_22_unauthorized_connection_status_access_rejected(): void
    {
        $founder = $this->createFounder();
        $unrelatedUser = User::factory()->create(); // No participant roles
        $business = $this->createBusiness($founder);

        $response = $this->actingAs($unrelatedUser)->getJson("/api/me/businesses/{$business->id}/connection-status");
        $response->assertStatus(403);
    }

    // ==========================================
    // 23. Safe response does not leak private fields
    // ==========================================
    public function test_23_safe_response_does_not_leak_private_fields(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/interests", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        $response = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/reciprocal-interest", [
            'role' => 'investor',
        ]);

        $response->assertOk();
        $json = $response->json('data');

        // Allowed safe keys
        $allowedKeys = [
            'business_id',
            'founder_user_id',
            'counterparty_user_id',
            'counterparty_role',
            'has_founder_interest',
            'founder_interest_expressed_at',
            'has_counterparty_interest',
            'counterparty_interest_expressed_at',
            'is_mutual',
            'is_connected',
            'connected_at',
            'connection_id',
        ];

        foreach (array_keys($json) as $key) {
            $this->assertContains($key, $allowedKeys, "Unexpected field in response: {$key}");
        }

        // Ensure private user data is not leaked
        $this->assertArrayNotHasKey('password', $json);
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('phone', $json);
        $this->assertArrayNotHasKey('agreement_hash', $json);
    }
    public function test_connection_list_includes_pending_mutual_ids_and_isolates_roles(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $professional = $this->createProfessional();
        $outsider = $this->createInvestor('outsider@example.com');
        $business = $this->createBusiness($founder);
        $service = app(\App\Services\Connection\ConnectionService::class);
        $this->createRelationship($business, $investor);
        $this->createRelationship($business, $professional, ParticipantRole::Professional);
        $service->expressFounderInterest($business, $founder, $investor);
        $service->expressFounderInterest($business, $founder, $professional);
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')->assertOk()
            ->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.connection_id', null)
            ->assertJsonPath('data.items.0.is_mutual', false)->assertJsonPath('data.items.0.has_founder_interest', true);
        $connected = $service->expressReciprocalInterest($business, $investor);
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')->assertOk()
            ->assertJsonPath('data.items.0.connection_id', $connected['connection']->id)
            ->assertJsonPath('data.items.0.is_mutual', true)->assertJsonPath('data.items.0.is_connected', true);
        $this->actingAs($professional)->getJson('/api/me/connections?role=professional')->assertOk()
            ->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.counterparty_role', 'professional');
        $this->actingAs($founder)->getJson('/api/me/connections?role=founder')->assertOk()->assertJsonCount(2, 'data.items');
        $this->actingAs($outsider)->getJson('/api/me/connections?role=investor')->assertOk()->assertJsonCount(0, 'data.items');
        $this->actingAs($outsider)->getJson('/api/me/connections?role=founder')->assertForbidden();
        $business->forceFill(['status' => BusinessStatus::Draft])->save();
        $this->actingAs($investor)->getJson('/api/me/connections?role=investor')->assertOk()->assertJsonCount(0, 'data.items');
    }

    public function test_repeated_reciprocal_interest_notifies_each_party_only_once(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor);
        $service = app(\App\Services\Connection\ConnectionService::class);
        $service->expressFounderInterest($business, $founder, $investor);
        $first = $service->expressReciprocalInterest($business, $investor);
        $second = $service->expressReciprocalInterest($business, $investor);
        $this->assertSame($first['connection']->id, $second['connection']->id);
        $this->assertDatabaseCount('business_connections', 1);
        $this->assertSame(1, $founder->notifications()->count());
        $this->assertSame(1, $investor->notifications()->count());
    }

}
