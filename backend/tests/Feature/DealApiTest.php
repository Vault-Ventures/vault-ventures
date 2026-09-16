<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealApiTest extends TestCase
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

    private function createProfessional(string $email = 'pro@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createMultiRoleUser(string $email = 'multi@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
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

        $skill = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $req->skills()->sync([$skill->id]);

        return $business;
    }

    private function createConnection(
        Business $business,
        User $founder,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor
    ): BusinessConnection {
        return BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
        ]);
    }

    private function createMutualInterests(
        Business $business,
        User $founder,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor
    ): void {
        BusinessInterest::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'expressed_by_user_id' => $founder->id,
            'status' => 'active',
            'expressed_at' => now(),
        ]);

        BusinessInterest::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'expressed_by_user_id' => $counterparty->id,
            'status' => 'active',
            'expressed_at' => now(),
        ]);
    }

    private function createActiveNda(
        Business $business,
        User $founder,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor
    ): BusinessNda {
        return BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'status' => NdaStatus::Active,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $counterparty->id,
            'requested_at' => now(),
            'founder_accepted_at' => now(),
            'counterparty_accepted_at' => now(),
            'activated_at' => now(),
        ]);
    }

    // ==========================================
    // CONNECTION → DEAL & MULTIPLE INDEPENDENT DEALS TESTS
    // ==========================================

    public function test_01_valid_connection_creates_deal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.connection_id', $connection->id)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.founder_user_id', $founder->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.stage', 'matched')
            ->assertJsonPath('data.stage_label', 'Matched')
            ->assertJsonPath('data.stage_order', 1);

        $this->assertDatabaseHas('deals', [
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
            'stage' => 'matched',
        ]);

        $this->assertDatabaseHas('deal_state_histories', [
            'previous_state' => null,
            'new_state' => 'matched',
            'changed_by_user_id' => $founder->id,
        ]);
    }

    public function test_02_invalid_or_missing_connection_rejected(): void
    {
        $founder = $this->createFounder();

        $response = $this->actingAs($founder)->postJson('/api/me/connections/99999/deal');
        $response->assertNotFound();
    }

    public function test_03_unauthorized_user_cannot_create_deal_for_connection(): void
    {
        $founder = $this->createFounder('f1@example.com');
        $otherUser = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $response = $this->actingAs($otherUser)->postJson("/api/me/connections/{$connection->id}/deal");
        $response->assertStatus(403);
    }

    public function test_04_wrong_role_for_counterparty_on_creation_rejected(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        // Connection is for professional, but counterparty attempts as investor
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);

        $response = $this->actingAs($pro)->postJson("/api/me/connections/{$connection->id}/deal", [
            'role' => 'investor',
        ]);

        $response->assertStatus(403);
    }

    public function test_05_same_connection_cannot_create_duplicate_active_deals(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        // First creation succeeds
        $res1 = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");
        $res1->assertCreated();
        $dealId1 = $res1->json('data.id');

        // Second creation from the same connection is rejected with 422
        $res2 = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");
        $res2->assertStatus(422);

        // Only one active deal exists
        $this->assertDatabaseCount('deals', 1);
        $this->assertDatabaseCount('deal_state_histories', 1);
    }

    // ==========================================
    // DEAL ROOM ACCESS TESTS
    // ==========================================

    public function test_06_founder_participant_can_access_deal_room(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $deal->id)
            ->assertJsonPath('data.founder_user_id', $founder->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id);
    }

    public function test_07_investor_participant_can_access_deal_room(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $deal->id);
    }

    public function test_08_professional_participant_can_access_deal_room(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => ParticipantRole::Professional,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($pro)->getJson("/api/me/deals/{$deal->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $deal->id);
    }

    public function test_09_unrelated_user_denied_deal_room_access(): void
    {
        $founder = $this->createFounder('f1@example.com');
        $unrelated = $this->createInvestor('unrelated@example.com');
        $investor = $this->createInvestor('inv@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($unrelated)->getJson("/api/me/deals/{$deal->id}");
        $response->assertStatus(403);
    }

    public function test_10_disclosure_only_or_interest_only_user_denied_deal_room(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);

        // investor 1 has a deal
        $connection = $this->createConnection($business, $founder, $investor1, ParticipantRole::Investor);
        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor1->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        // investor 2 only has disclosure relationship
        BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor2->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DisclosureStage::Extended,
            'interest_expressed_at' => now(),
        ]);

        // investor 2 attempts to access investor 1's deal
        $response = $this->actingAs($investor2)->getJson("/api/me/deals/{$deal->id}");
        $response->assertStatus(403);
    }

    public function test_11_multi_role_user_without_role_parameter_rejected_on_access(): void
    {
        $founder = $this->createFounder();
        $multi = $this->createMultiRoleUser();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $multi, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $multi->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($multi)->getJson("/api/me/deals/{$deal->id}");
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $validResponse = $this->actingAs($multi)->getJson("/api/me/deals/{$deal->id}?role=investor");
        $validResponse->assertOk();
    }

    public function test_12_invalid_role_parameter_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}?role=invalid_role");
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ==========================================
    // LIFECYCLE & STAGE GATING TESTS
    // ==========================================

    public function test_13_lifecycle_transitions_up_to_nda_signed_with_prerequisites(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $this->createMutualInterests($business, $founder, $investor, ParticipantRole::Investor);
        $this->createActiveNda($business, $founder, $investor, ParticipantRole::Investor);

        // 1. Initial State: Matched
        $createRes = $this->actingAs($founder)->postJson("/api/me/connections/{$connection->id}/deal");
        $createRes->assertCreated()->assertJsonPath('data.stage', 'matched');
        $dealId = $createRes->json('data.id');

        // 2. Matched -> Interest Confirmed (succeeds with mutual interest)
        $t1 = $this->actingAs($founder)->postJson("/api/me/deals/{$dealId}/transition", [
            'target_state' => 'interest_confirmed',
        ]);
        $t1->assertOk()->assertJsonPath('data.stage', 'interest_confirmed');

        // 3. Interest Confirmed -> Deal Room Opened
        $t2 = $this->actingAs($founder)->postJson("/api/me/deals/{$dealId}/transition", [
            'target_state' => 'deal_room_opened',
        ]);
        $t2->assertOk()->assertJsonPath('data.stage', 'deal_room_opened');

        // 4. Deal Room Opened -> NDA Signed (succeeds with active NDA)
        $t3 = $this->actingAs($founder)->postJson("/api/me/deals/{$dealId}/transition", [
            'target_state' => 'nda_signed',
        ]);
        $t3->assertOk()->assertJsonPath('data.stage', 'nda_signed');

        // History verification
        $historyRes = $this->actingAs($investor)->getJson("/api/me/deals/{$dealId}/history");
        $historyRes->assertOk();
        $historyData = $historyRes->json('data');

        $this->assertCount(4, $historyData);
        $this->assertNull($historyData[0]['previous_state']);
        $this->assertSame('matched', $historyData[0]['new_state']);
        $this->assertSame('nda_signed', $historyData[3]['new_state']);
    }

    public function test_14_matched_to_interest_confirmed_requires_mutual_interest(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        // NO mutual interests recorded in business_interests table

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'interest_confirmed',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_15_deal_room_opened_to_nda_signed_requires_active_nda(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        // NO active NDA

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::DealRoomOpened,
        ]);

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'nda_signed',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_16_future_phase_transitions_are_blocked(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        // At NDA Signed, transition to Negotiation is blocked until Part 3
        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::NdaSigned,
        ]);

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'negotiation',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_17_skipped_state_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        // Attempt to skip to deal_room_opened directly from matched
        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'deal_room_opened',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_18_backward_transition_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::DealRoomOpened,
        ]);

        // Attempt backward transition to matched
        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'matched',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_19_same_state_transition_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'matched',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_20_unauthorized_user_cannot_transition_deal(): void
    {
        $founder = $this->createFounder('f1@example.com');
        $otherUser = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($otherUser)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'interest_confirmed',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // SECURITY & RESPONSE SAFETY TESTS
    // ==========================================

    public function test_21_guessed_deal_id_rejected(): void
    {
        $investor = $this->createInvestor();

        $response = $this->actingAs($investor)->getJson('/api/me/deals/99999');
        $response->assertNotFound();
    }

    public function test_22_safe_deal_response_does_not_leak_private_data(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Matched,
        ]);

        $response = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}");
        $response->assertOk();

        $json = $response->json('data');

        $allowedKeys = [
            'id',
            'connection_id',
            'business_id',
            'founder_user_id',
            'counterparty_user_id',
            'counterparty_role',
            'stage',
            'stage_label',
            'stage_order',
            'created_at',
            'updated_at',
        ];

        foreach (array_keys($json) as $key) {
            $this->assertContains($key, $allowedKeys, "Unexpected key in deal response: {$key}");
        }

        $this->assertArrayNotHasKey('password', $json);
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('phone', $json);
        $this->assertArrayNotHasKey('agreement_hash', $json);
    }
}
