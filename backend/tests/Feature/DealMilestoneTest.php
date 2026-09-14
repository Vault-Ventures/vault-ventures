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
use App\Models\DealAgreement;
use App\Models\DealMilestone;
use App\Models\DealTermProposal;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealMilestoneTest extends TestCase
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

    private function createAdmin(string $email = 'admin@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->adminAccess()->create([]);
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
            'status' => 'connected',
            'connected_at' => now(),
        ]);
    }

    private function createDeal(
        BusinessConnection $connection,
        DealStage $stage = DealStage::Agreement
    ): Deal {
        return Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $connection->business_id,
            'founder_user_id' => $connection->founder_user_id,
            'counterparty_user_id' => $connection->counterparty_user_id,
            'counterparty_role' => $connection->counterparty_role,
            'stage' => $stage,
        ]);
    }

    private function setupAgreement(Deal $deal, float $amount = 100000.00): DealAgreement
    {
        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $deal->founder_user_id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => $amount,
            'profit_sharing_percentage' => 10.00,
            'status' => 'accepted',
        ]);

        return DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'profit_sharing_agreement',
            'title' => 'Micro Investment Profit Sharing Agreement',
            'agreement_text' => 'Standard agreement text...',
            'terms_snapshot' => [
                'proposal_id' => $proposal->id,
                'amount' => $amount,
                'currency' => 'BDT',
                'investment_type' => 'micro_profit_sharing',
                'profit_sharing_percentage' => 10.00,
            ],
            'status' => 'accepted',
            'founder_signed_at' => now(),
            'founder_signed_user_id' => $deal->founder_user_id,
            'counterparty_signed_at' => now(),
            'counterparty_signed_user_id' => $deal->counterparty_user_id,
            'finalized_at' => now(),
        ]);
    }

    public function test_milestone_creation_and_listing(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // 1. Create Milestone 1
        $resp1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'sequence_order' => 1,
            'title' => 'MVP Launch',
            'description' => 'Deploy working prototype in Bangladesh market.',
            'target_amount' => 50000.00,
            'target_date' => '2026-10-01',
        ]);

        $resp1->assertCreated()
            ->assertJsonPath('data.sequence_order', 1)
            ->assertJsonPath('data.title', 'MVP Launch')
            ->assertJsonPath('data.target_amount', 50000)
            ->assertJsonPath('data.currency', 'BDT')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.progress_percentage', 0);

        // 2. Create Milestone 2 (Counterparty creates)
        $resp2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'sequence_order' => 2,
            'title' => 'First 100 Paying Customers',
            'target_amount' => 50000.00,
            'target_date' => '2026-12-01',
        ]);

        $resp2->assertCreated()
            ->assertJsonPath('data.sequence_order', 2)
            ->assertJsonPath('data.title', 'First 100 Paying Customers')
            ->assertJsonPath('data.target_amount', 50000);

        // 3. Duplicate sequence_order is rejected
        $dup = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'sequence_order' => 1,
            'title' => 'Duplicate',
            'target_amount' => 10000.00,
        ]);
        $dup->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // 4. List Milestones
        $listResp = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/milestones");
        $listResp->assertOk()
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.summary.total_committed_bdt', 100000)
            ->assertJsonPath('data.summary.total_allocated_bdt', 100000)
            ->assertJsonPath('data.summary.total_released_bdt', 0)
            ->assertJsonPath('data.summary.remaining_locked_bdt', 100000)
            ->assertJsonCount(2, 'data.milestones');
    }

    public function test_milestone_activation_validates_agreement_and_allocation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // Define Milestone 1 with 40,000 (Under-allocated by 60,000)
        DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 40000.00,
            'status' => 'pending',
        ]);

        // Attempt activation -> Fails due to allocation mismatch
        $failResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/activate-milestones");
        $failResp->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Add Milestone 2 with 60,000 (Total = 100,000)
        DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 2,
            'title' => 'Tranche 2',
            'target_amount' => 60000.00,
            'status' => 'pending',
        ]);

        // Attempt activation -> Succeeds
        $okResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/activate-milestones");
        $okResp->assertOk()
            ->assertJsonPath('data.stage', 'milestone_funding_active');

        // Milestone 1 is now active, Milestone 2 is pending
        $m1 = DealMilestone::where('deal_id', $deal->id)->where('sequence_order', 1)->first();
        $m2 = DealMilestone::where('deal_id', $deal->id)->where('sequence_order', 2)->first();
        $this->assertEquals('active', $m1->status);
        $this->assertEquals('pending', $m2->status);

        // State history recorded
        $this->assertDatabaseHas('deal_state_histories', [
            'deal_id' => $deal->id,
            'previous_state' => 'agreement',
            'new_state' => 'milestone_funding_active',
        ]);
    }

    public function test_milestone_progress_update_and_submission_workflow(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Prototype Launch',
            'target_amount' => 100000.00,
            'status' => 'active',
            'progress_percentage' => 0,
        ]);

        // 1. Investor cannot update progress (Founder only)
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 50,
        ])->assertForbidden();

        // 2. Founder updates progress to 50%
        $p1 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 50,
            'notes' => 'Frontend components completed.',
        ]);
        $p1->assertOk()
            ->assertJsonPath('data.progress_percentage', 50)
            ->assertJsonPath('data.evidence_notes', 'Frontend components completed.');

        // 3. Submitting with progress < 100% fails
        $subFail = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/submit", [
            'evidence_notes' => 'Some proof',
        ]);
        $subFail->assertUnprocessable();

        // 4. Submitting with 100% and evidence succeeds
        $subOk = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/submit", [
            'progress_percentage' => 100,
            'evidence_notes' => 'System fully deployed and live at https://example.com.',
            'evidence_urls' => ['https://example.com/demo.mp4'],
        ]);
        $subOk->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.progress_percentage', 100)
            ->assertJsonPath('data.evidence_notes', 'System fully deployed and live at https://example.com.')
            ->assertJsonPath('data.evidence_urls.0', 'https://example.com/demo.mp4');
    }

    public function test_milestone_dispute_and_revision_flow(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Initial Tranche',
            'target_amount' => 100000.00,
            'status' => 'submitted',
            'progress_percentage' => 100,
            'evidence_notes' => 'Here is my submission note.',
            'submitted_at' => now(),
            'submitted_by_user_id' => $founder->id,
        ]);

        // 1. Founder cannot dispute/review their own submission
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/dispute", [
            'reason' => 'Invalid',
        ])->assertForbidden();

        // 2. Investor disputes with reason
        $dispResp = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/dispute", [
            'dispute_reason' => 'Please attach the deployment certificate and user test logs.',
        ]);

        $dispResp->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.dispute_reason', 'Please attach the deployment certificate and user test logs.');

        // Milestone is now active again for Founder to revise
        $m1->refresh();
        $this->assertEquals('active', $m1->status);
    }

    public function test_milestone_confirmation_and_simulated_tranche_release(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 150000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Phase 1 MVP',
            'target_amount' => 50000.00,
            'status' => 'submitted',
            'progress_percentage' => 100,
            'evidence_notes' => 'Phase 1 complete.',
            'submitted_at' => now(),
            'submitted_by_user_id' => $founder->id,
        ]);

        $m2 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 2,
            'title' => 'Phase 2 Scale',
            'target_amount' => 100000.00,
            'status' => 'pending',
            'progress_percentage' => 0,
        ]);

        // 1. Founder cannot self-confirm
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm")
            ->assertForbidden();

        // 2. Investor confirms Milestone 1
        $confResp = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm", [
            'notes' => 'Verified and approved.',
        ]);

        $confResp->assertOk()
            ->assertJsonPath('data.status', 'funded')
            ->assertJsonPath('data.confirmed_by_user_id', $investor->id)
            ->assertJsonPath('data.confirmation_notes', 'Verified and approved.');
        $this->assertNotNull($confResp->json('data.confirmed_at'));
        $this->assertNotNull($confResp->json('data.funded_at'));

        // 3. Milestone 2 is now automatically active
        $m2->refresh();
        $this->assertEquals('active', $m2->status);

        // 4. Funding summary reflects 50,000 released out of 150,000 committed
        $sumResp = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}/funding-summary");
        $sumResp->assertOk()
            ->assertJsonPath('data.total_committed_bdt', 150000)
            ->assertJsonPath('data.total_released_bdt', 50000)
            ->assertJsonPath('data.remaining_locked_bdt', 100000)
            ->assertJsonPath('data.funding_progress_percentage', 33.33);
    }

    public function test_explicit_deal_completion_endpoint(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 50000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Single Tranche',
            'target_amount' => 50000.00,
            'status' => 'submitted',
            'progress_percentage' => 100,
            'evidence_notes' => 'Finished.',
            'submitted_at' => now(),
            'submitted_by_user_id' => $founder->id,
        ]);

        // 1. Completion is blocked when milestone is still unfunded
        $failComplete = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/complete");
        $failComplete->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // 2. Generic /transition endpoint is blocked from completing
        $failTrans = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/transition", [
            'target_state' => 'completed',
        ]);
        $failTrans->assertUnprocessable();

        // 3. Confirm milestone to funded
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm")->assertOk();

        // 4. Explicit completion succeeds
        $compResp = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/complete");
        $compResp->assertOk()
            ->assertJsonPath('data.stage', 'completed');

        $deal->refresh();
        $this->assertEquals(DealStage::Completed, $deal->stage);

        // State history recorded
        $this->assertDatabaseHas('deal_state_histories', [
            'deal_id' => $deal->id,
            'previous_state' => 'milestone_funding_active',
            'new_state' => 'completed',
        ]);
    }

    public function test_professional_collaboration_milestones(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);

        // Professional collaboration with 0 funding amount
        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Architecture Review Deliverable',
            'description' => 'Complete security and system architecture audit.',
            'target_amount' => 0.00,
            'status' => 'active',
            'progress_percentage' => 0,
        ]);

        // Founder records progress
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 100,
            'notes' => 'Review completed and doc prepared.',
        ])->assertOk();

        // Founder submits
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/submit", [
            'evidence_notes' => 'Architecture doc link.',
        ])->assertOk();

        // Professional confirms
        $this->actingAs($pro)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm", [
            'role' => 'professional',
        ])->assertOk();

        $m1->refresh();
        $this->assertEquals('funded', $m1->status);

        // Complete deal
        $this->actingAs($pro)->postJson("/api/me/deals/{$deal->id}/complete", [
            'role' => 'professional',
        ])->assertOk();

        $deal->refresh();
        $this->assertEquals(DealStage::Completed, $deal->stage);
    }

    public function test_multi_deal_independence_and_idor_protection(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        $dealA = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $dealB = $this->createDeal($connection, DealStage::MilestoneFundingActive);

        $mA = DealMilestone::create([
            'deal_id' => $dealA->id,
            'sequence_order' => 1,
            'title' => 'Milestone Deal A',
            'target_amount' => 10000.00,
            'status' => 'active',
        ]);

        $mB = DealMilestone::create([
            'deal_id' => $dealB->id,
            'sequence_order' => 1,
            'title' => 'Milestone Deal B',
            'target_amount' => 50000.00,
            'status' => 'active',
        ]);

        // Attempting to update Milestone A via Deal B endpoint returns 404
        $resp = $this->actingAs($founder)->putJson("/api/me/deals/{$dealB->id}/milestones/{$mA->id}", [
            'title' => 'Hacked Title',
        ]);
        $resp->assertNotFound();

        // Attempting to submit Milestone A via Deal B endpoint returns 404
        $sub = $this->actingAs($founder)->postJson("/api/me/deals/{$dealB->id}/milestones/{$mA->id}/submit", [
            'progress_percentage' => 100,
            'evidence_notes' => 'Test',
        ]);
        $sub->assertNotFound();
    }

    public function test_admin_is_view_audit_only_and_cannot_bypass_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $admin = $this->createAdmin();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 100000.00,
            'status' => 'submitted',
            'progress_percentage' => 100,
            'evidence_notes' => 'Evidence submitted',
            'submitted_at' => now(),
            'submitted_by_user_id' => $founder->id,
        ]);

        // 1. Admin CAN view milestones & funding summary
        $this->actingAs($admin)->getJson("/api/me/deals/{$deal->id}/milestones")->assertOk();
        $this->actingAs($admin)->getJson("/api/me/deals/{$deal->id}/funding-summary")->assertOk();

        // 2. Admin CANNOT confirm milestone (Standard progression bypass blocked)
        $this->actingAs($admin)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm")
            ->assertForbidden();

        // 3. Admin CANNOT submit progress
        $this->actingAs($admin)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 50,
        ])->assertForbidden();
    }

    public function test_immutability_of_confirmed_and_funded_milestones(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Funded Tranche',
            'target_amount' => 100000.00,
            'status' => 'funded',
            'progress_percentage' => 100,
            'confirmed_at' => now(),
            'funded_at' => now(),
        ]);

        // Attempting to update a funded milestone fails with validation error
        $resp = $this->actingAs($founder)->putJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}", [
            'title' => 'Changed Title',
        ]);

        $resp->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_sequential_milestone_enforcement_blocks_skipping(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 50000.00,
            'status' => 'active',
        ]);

        $m2 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 2,
            'title' => 'Tranche 2',
            'target_amount' => 50000.00,
            'status' => 'pending',
        ]);

        // Attempting to submit progress on Milestone 2 (pending) fails
        $p2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m2->id}/progress", [
            'progress_percentage' => 50,
        ]);
        $p2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Attempting to submit Milestone 2 fails
        $s2 = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m2->id}/submit", [
            'progress_percentage' => 100,
            'evidence_notes' => 'Skip test',
        ]);
        $s2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // Attempting to confirm Milestone 2 fails
        $c2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m2->id}/confirm");
        $c2->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_multi_role_counterparty_requires_role_parameter(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $investor->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $investor->professionalProfile()->firstOrCreate([]);
        $investor->unsetRelations();

        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 100000.00,
            'status' => 'submitted',
            'progress_percentage' => 100,
            'evidence_notes' => 'Done',
            'submitted_at' => now(),
            'submitted_by_user_id' => $founder->id,
        ]);

        // 1. Without role parameter, multi-role validation fails
        $noRole = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm");
        $noRole->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');

        // 2. With mismatched role parameter, fails with 403
        $wrongRole = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm", [
            'role' => 'professional',
        ]);
        $wrongRole->assertForbidden();

        // 3. With matching role parameter, succeeds
        $ok = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm", [
            'role' => 'investor',
        ]);
        $ok->assertOk()->assertJsonPath('data.status', 'funded');
    }

    public function test_validation_rules_negative_amount_and_percentage_bounds(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        // 1. Negative amount fails on creation
        $negAmount = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'sequence_order' => 1,
            'title' => 'Negative Amount',
            'target_amount' => -500.00,
        ]);
        $negAmount->assertUnprocessable();

        // 2. Empty title fails
        $noTitle = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'sequence_order' => 1,
            'title' => '',
            'target_amount' => 1000.00,
        ]);
        $noTitle->assertUnprocessable();

        // 3. Progress percentage < 0 or > 100 fails
        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 100000.00,
            'status' => 'active',
        ]);

        $invalidPct = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 150,
        ]);
        $invalidPct->assertUnprocessable();
    }

    public function test_non_participant_forbidden_from_all_milestone_endpoints(): void
    {
        $founder = $this->createFounder('f1@example.com');
        $investor = $this->createInvestor('i1@example.com');
        $unrelated = $this->createInvestor('unrelated@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($connection, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 100000.00);

        $m1 = DealMilestone::create([
            'deal_id' => $deal->id,
            'sequence_order' => 1,
            'title' => 'Tranche 1',
            'target_amount' => 100000.00,
            'status' => 'active',
        ]);

        $this->actingAs($unrelated)->getJson("/api/me/deals/{$deal->id}/milestones")->assertForbidden();
        $this->actingAs($unrelated)->getJson("/api/me/deals/{$deal->id}/funding-summary")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/milestones", [
            'title' => 'Hack',
            'target_amount' => 1000.00,
        ])->assertForbidden();
        $this->actingAs($unrelated)->putJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}", [
            'title' => 'Hack',
        ])->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/progress", [
            'progress_percentage' => 50,
        ])->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/submit", [
            'progress_percentage' => 100,
            'evidence_notes' => 'Hack',
        ])->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/milestones/{$m1->id}/confirm")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/activate-milestones")->assertForbidden();
        $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/complete")->assertForbidden();
    }
}
