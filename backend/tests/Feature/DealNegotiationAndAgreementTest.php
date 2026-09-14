<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealTermProposal;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealNegotiationAndAgreementTest extends TestCase
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

    private function createBusiness(User $founder): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'NovaTech AI Ltd';
        $business->description = 'Healthtech AI in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 50000.00,
            'accepted_investment_types' => ['equity', 'safe'],
            'micro_proposed_terms' => 'Micro terms.',
            'large_standard_proposed_terms' => 'Standard terms.',
            'required_experience_level' => 'Senior',
            'required_availability' => 'Part-time',
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

    private function createDeal(
        BusinessConnection $connection,
        DealStage $stage = DealStage::NdaSigned
    ): Deal {
        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $connection->business_id,
            'founder_user_id' => $connection->founder_user_id,
            'counterparty_user_id' => $connection->counterparty_user_id,
            'counterparty_role' => $connection->counterparty_role,
            'stage' => $stage,
        ]);

        $deal->histories()->create([
            'previous_state' => null,
            'new_state' => $stage,
            'changed_by_user_id' => $connection->founder_user_id,
            'changed_at' => now(),
        ]);

        return $deal;
    }

    private function createActiveNda(Business $business, User $counterparty): BusinessNda
    {
        return BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Active,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $counterparty->id,
            'requested_at' => now()->subDay(),
            'founder_accepted_at' => now(),
            'counterparty_accepted_at' => now(),
            'activated_at' => now(),
        ]);
    }

    public function test_negotiation_proposal_creation_and_versioning(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // 1. Founder submits initial proposal (v1)
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
            'loss_sharing_terms' => 'Standard loss sharing.',
            'proposed_terms' => 'Milestone release in 2 stages.',
            'note' => 'Initial micro terms.',
        ]);

        $resp1->assertCreated()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.status', 'proposed')
            ->assertJsonPath('data.proposed_by_role', 'founder')
            ->assertJsonPath('data.amount', 10000)
            ->assertJsonPath('data.profit_sharing_percentage', 5);

        $v1Id = $resp1->json('data.id');

        // 2. Investor counters with modified terms (v2)
        $resp2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/negotiation/{$v1Id}/respond", [
            'action' => 'counter',
            'terms' => [
                'investment_type' => 'micro_profit_sharing',
                'amount' => 15000.00,
                'profit_sharing_percentage' => 7.50,
                'note' => 'Counter offering 7.5% profit share for 15k BDT.',
            ],
        ]);

        $resp2->assertOk()
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.status', 'proposed')
            ->assertJsonPath('data.proposed_by_role', 'investor')
            ->assertJsonPath('data.amount', 15000)
            ->assertJsonPath('data.profit_sharing_percentage', 7.5);

        // Verify v1 proposal is now countered
        $this->assertDatabaseHas('deal_term_proposals', [
            'id' => $v1Id,
            'status' => 'countered',
            'responded_by_user_id' => $investor->id,
        ]);

        // 3. GET /me/deals/{deal}/negotiation reflects both versions and active proposal
        $getResp = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/negotiation");
        $getResp->assertOk()
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.active_proposal.version', 2)
            ->assertJsonCount(2, 'data.proposals');
    }

    public function test_negotiation_proposal_acceptance_and_decline(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'equity_percentage' => 10.00,
            'status' => 'proposed',
        ]);

        // Investor accepts proposal
        $resp = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/negotiation/{$proposal->id}/respond", [
            'action' => 'accept',
        ]);

        $resp->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.responded_by_user_id', $investor->id);

        $this->assertDatabaseHas('deal_term_proposals', [
            'id' => $proposal->id,
            'status' => 'accepted',
        ]);
    }

    public function test_proposer_cannot_respond_to_own_proposal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'equity_percentage' => 10.00,
            'status' => 'proposed',
        ]);

        $resp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/{$proposal->id}/respond", [
            'action' => 'accept',
        ]);

        $resp->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_investment_mode_validation_micro_profit_sharing(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // Missing profit share fails
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
        ]);
        $resp1->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Including equity fails
        $resp2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
            'equity_percentage' => 2.00,
        ]);
        $resp2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Valid micro investment succeeds
        $resp3 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
        ]);
        $resp3->assertCreated();
    }

    public function test_investment_mode_validation_standard_equity(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // Missing equity fails
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
        ]);
        $resp1->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Including profit share fails
        $resp2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'equity_percentage' => 10.00,
            'profit_sharing_percentage' => 5.00,
        ]);
        $resp2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Valid standard equity succeeds
        $resp3 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'equity_percentage' => 10.00,
        ]);
        $resp3->assertCreated();
    }

    public function test_professional_collaboration_terms_validation(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // All empty fails
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'professional_collaboration',
        ]);
        $resp1->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Valid with compensation amount
        $resp2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'professional_collaboration',
            'amount' => 120000.00,
            'proposed_terms' => 'Part-time tech advisory.',
        ]);
        $resp2->assertCreated();
    }

    public function test_financial_amounts_and_percentage_validation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // Negative amount fails
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => -500.00,
            'equity_percentage' => 5.00,
        ]);
        $resp1->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Out of range equity fails
        $resp2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 50000.00,
            'equity_percentage' => 105.00,
        ]);
        $resp2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_agreement_generation_from_accepted_proposal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // Attempt without accepted proposal fails
        $failResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/generate");
        $failResp->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
            'loss_sharing_terms' => 'Loss sharing pro-rata.',
            'proposed_terms' => 'Bi-monthly profit payouts.',
            'status' => 'accepted',
        ]);

        $genResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/generate");
        $genResp->assertCreated()
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.proposal_id', $proposal->id)
            ->assertJsonPath('data.agreement_type', 'profit_sharing_agreement')
            ->assertJsonPath('data.status', 'pending_signatures')
            ->assertJsonPath('data.terms_snapshot.amount', 10000)
            ->assertJsonPath('data.terms_snapshot.currency', 'BDT');

        $this->assertStringContainsString('ACADEMIC PROTOTYPE & SIMULATION DISCLAIMER', $genResp->json('data.agreement_text'));
    }

    public function test_agreement_bilateral_signing_and_finalization(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'equity_percentage' => 10.00,
            'status' => 'accepted',
        ]);

        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/generate")->assertCreated();

        // 1. Founder signs
        $sign1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/sign");
        $sign1->assertOk()
            ->assertJsonPath('data.status', 'pending_signatures');
        $this->assertNotNull($sign1->json('data.founder_signed_at'));
        $this->assertNull($sign1->json('data.counterparty_signed_at'));
        $this->assertNull($sign1->json('data.finalized_at'));

        // 2. Investor signs -> both signed, status accepted and finalized_at populated
        $sign2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/agreement/sign");
        $sign2->assertOk()
            ->assertJsonPath('data.status', 'accepted');
        $this->assertNotNull($sign2->json('data.founder_signed_at'));
        $this->assertNotNull($sign2->json('data.counterparty_signed_at'));
        $this->assertNotNull($sign2->json('data.finalized_at'));

        // 3. Agreement cannot be regenerated once finalized (immutability)
        $regenResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/generate");
        $regenResp->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_lifecycle_transition_nda_signed_to_negotiation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::NdaSigned);

        // Without active NDA -> transition fails
        $failResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'negotiation',
        ]);
        $failResp->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // With active NDA -> transition succeeds
        $this->createActiveNda($business, $investor);
        $okResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'negotiation',
        ]);
        $okResp->assertOk()
            ->assertJsonPath('data.stage', 'negotiation');
    }

    public function test_lifecycle_transition_negotiation_to_agreement(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        // 1. Without accepted proposal -> fails
        $fail1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'agreement',
        ]);
        $fail1->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // 2. With accepted proposal but without generated agreement -> fails
        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
            'status' => 'accepted',
        ]);

        $fail2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'agreement',
        ]);
        $fail2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // 3. With accepted proposal AND generated agreement -> succeeds to Agreement stage
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/agreement/generate")->assertCreated();

        $okResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'agreement',
        ]);
        $okResp->assertOk()
            ->assertJsonPath('data.stage', 'agreement');

        // History verified
        $this->assertDatabaseHas('deal_state_histories', [
            'deal_id' => $deal->id,
            'previous_state' => 'negotiation',
            'new_state' => 'agreement',
        ]);
    }

    public function test_lifecycle_transition_beyond_agreement_is_blocked(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Agreement);

        $resp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'milestone_funding_active',
        ]);

        $resp->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_multi_deal_independence_proposals_and_agreements(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        // Deal A
        $dealA = $this->createDeal($connection, DealStage::Negotiation);
        // Deal B
        $dealB = $this->createDeal($connection, DealStage::Negotiation);

        // Submit proposal on Deal A
        $this->actingAs($founder)->postJson("/api/me/deals/{$dealA->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
        ])->assertCreated();

        // Submit proposal on Deal B
        $this->actingAs($founder)->postJson("/api/me/deals/{$dealB->id}/negotiation/propose", [
            'investment_type' => 'standard_equity',
            'amount' => 200000.00,
            'equity_percentage' => 8.00,
        ])->assertCreated();

        // Verify Deal A only sees Micro
        $getA = $this->actingAs($investor)->getJson("/api/me/deals/{$dealA->id}/negotiation");
        $getA->assertOk()
            ->assertJsonPath('data.deal_id', $dealA->id)
            ->assertJsonPath('data.active_proposal.investment_type', 'micro_profit_sharing')
            ->assertJsonPath('data.active_proposal.amount', 10000);

        // Verify Deal B only sees Standard Equity
        $getB = $this->actingAs($investor)->getJson("/api/me/deals/{$dealB->id}/negotiation");
        $getB->assertOk()
            ->assertJsonPath('data.deal_id', $dealB->id)
            ->assertJsonPath('data.active_proposal.investment_type', 'standard_equity')
            ->assertJsonPath('data.active_proposal.amount', 200000);
    }

    public function test_cross_deal_idor_protection(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        $dealA = $this->createDeal($connection, DealStage::Negotiation);
        $dealB = $this->createDeal($connection, DealStage::Negotiation);

        $propA = DealTermProposal::create([
            'deal_id' => $dealA->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
            'status' => 'proposed',
        ]);

        // Attempt to respond to Deal A's proposal via Deal B's endpoint
        $resp = $this->actingAs($investor)->postJson("/api/me/deals/{$dealB->id}/negotiation/{$propA->id}/respond", [
            'action' => 'accept',
        ]);

        $resp->assertNotFound();
    }

    public function test_unrelated_user_forbidden_from_negotiation_and_agreement(): void
    {
        $founder = $this->createFounder('f@example.com');
        $investor = $this->createInvestor('inv@example.com');
        $unrelated = $this->createInvestor('unrelated@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Negotiation);

        $this->actingAs($unrelated)->getJson("/api/me/deals/{$deal->id}/negotiation")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/negotiation/propose", [
            'investment_type' => 'micro_profit_sharing',
            'amount' => 10000.00,
            'profit_sharing_percentage' => 5.00,
        ])->assertForbidden();
        $this->actingAs($unrelated)->getJson("/api/me/deals/{$deal->id}/agreement")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/agreement/generate")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/agreement/sign")->assertForbidden();
    }
}
