<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\User;
use App\Services\Disclosure\NdaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class BusinessNdaServiceTest extends TestCase
{
    use RefreshDatabase;

    private NdaService $ndaService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ndaService = new NdaService;
    }

    private function createFounder(VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create([
            'email' => 'founder_'.uniqid().'@example.com',
            'verification_tier' => $tier,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create([
            'email' => 'investor_'.uniqid().'@example.com',
            'verification_tier' => $tier,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create([
            'email' => 'pro_'.uniqid().'@example.com',
            'verification_tier' => $tier,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, BusinessStatus $status = BusinessStatus::Submitted): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'Secure Analytics Platform';
        $business->description = 'Enterprise analytics';
        $business->industry = 'technology';
        $business->business_stage = 'growth';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = $status;
        $business->submitted_at = $status === BusinessStatus::Submitted ? now() : null;
        $business->save();

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor,
        DisclosureStage $stage = DisclosureStage::Extended
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => now(),
        ]);
    }

    public function test_tier_0_user_cannot_request_nda(): void
    {
        $founder = $this->createFounder(VerificationTier::Tier1);
        $investor = $this->createInvestor(VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Tier 1 identity verification is required');

        $this->ndaService->requestNda($business, $investor);
    }

    public function test_tier_0_user_cannot_accept_nda(): void
    {
        $founder = $this->createFounder(VerificationTier::Tier1);
        $investor = $this->createInvestor(VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Tier 1 identity verification is required');

        $this->ndaService->acceptNda($business, $investor);
    }

    public function test_valid_tier_1_investor_request(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $nda = $this->ndaService->requestNda($business, $investor);

        $this->assertSame(NdaStatus::Pending, $nda->status);
        $this->assertSame($investor->id, $nda->requested_by_user_id);
        $this->assertNotNull($nda->counterparty_accepted_at);
        $this->assertNull($nda->founder_accepted_at);
        $this->assertNull($nda->activated_at);
    }

    public function test_valid_tier_1_professional_request(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);

        $nda = $this->ndaService->requestNda($business, $pro);

        $this->assertSame(NdaStatus::Pending, $nda->status);
        $this->assertSame($pro->id, $nda->requested_by_user_id);
        $this->assertSame(ParticipantRole::Professional, $nda->counterparty_role);
        $this->assertNotNull($nda->counterparty_accepted_at);
        $this->assertNull($nda->founder_accepted_at);
    }

    public function test_valid_tier_1_founder_request(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $nda = $this->ndaService->requestNda($business, $founder, $investor);

        $this->assertSame(NdaStatus::Pending, $nda->status);
        $this->assertSame($founder->id, $nda->requested_by_user_id);
        $this->assertNotNull($nda->founder_accepted_at);
        $this->assertNull($nda->counterparty_accepted_at);
        $this->assertNull($nda->activated_at);
    }

    public function test_request_only_works_from_stage_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // Stage 1 Teaser only
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Teaser);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('NDA can only be initiated for relationships currently at Stage 2');

        $this->ndaService->requestNda($business, $investor);
    }

    public function test_one_sided_acceptance_leaves_nda_pending_and_stage_at_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor requests -> investor auto-accepted, founder pending
        $nda = $this->ndaService->requestNda($business, $investor);
        $this->assertSame(NdaStatus::Pending, $nda->status);

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Extended, $relationship->stage);
    }

    public function test_bilateral_acceptance_activates_nda_and_advances_stage_to_3(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // 1. Investor requests NDA (counterparty accepted)
        $nda = $this->ndaService->requestNda($business, $investor);
        $this->assertSame(NdaStatus::Pending, $nda->status);

        // 2. Founder accepts NDA (both accepted)
        $activeNda = $this->ndaService->acceptNda($business, $founder, $investor);

        $this->assertSame(NdaStatus::Active, $activeNda->status);
        $this->assertNotNull($activeNda->founder_accepted_at);
        $this->assertNotNull($activeNda->counterparty_accepted_at);
        $this->assertNotNull($activeNda->activated_at);

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Nda, $relationship->stage);
    }

    public function test_founder_tier_0_prevents_activation(): void
    {
        $founder = $this->createFounder(VerificationTier::Tier0);
        $investor = $this->createInvestor(VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor requests
        $this->ndaService->requestNda($business, $investor);

        // Founder cannot accept because founder is Tier 0
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Tier 1 identity verification is required');

        $this->ndaService->acceptNda($business, $founder, $investor);
    }

    public function test_declining_nda_sets_status_to_declined_and_keeps_stage_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->ndaService->requestNda($business, $investor);

        $declinedNda = $this->ndaService->declineNda($business, $founder, $investor);

        $this->assertSame(NdaStatus::Declined, $declinedNda->status);
        $this->assertNotNull($declinedNda->declined_at);
        $this->assertSame($founder->id, $declinedNda->declined_by_user_id);

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Extended, $relationship->stage);
    }

    public function test_declined_nda_can_be_rerequested_without_duplicate_row(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Request -> Decline
        $this->ndaService->requestNda($business, $investor);
        $this->ndaService->declineNda($business, $founder, $investor);

        $this->assertDatabaseCount('business_ndas', 1);

        // Re-request by founder
        $rerequestedNda = $this->ndaService->requestNda($business, $founder, $investor);

        $this->assertDatabaseCount('business_ndas', 1);
        $this->assertSame(NdaStatus::Pending, $rerequestedNda->status);
        $this->assertNotNull($rerequestedNda->founder_accepted_at);
        $this->assertNull($rerequestedNda->counterparty_accepted_at);
        $this->assertNull($rerequestedNda->declined_at);
        $this->assertNull($rerequestedNda->declined_by_user_id);
    }

    public function test_draft_business_protection_throws_404_for_non_owners(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder, BusinessStatus::Draft);

        $this->expectException(ModelNotFoundException::class);

        $this->ndaService->requestNda($business, $investor);
    }

    public function test_cross_user_isolation_cannot_target_unrelated_users(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor();
        $investor2 = $this->createInvestor();
        $business = $this->createBusiness($founder);

        // Relationship exists only for investor1
        $this->createRelationship($business, $investor1, ParticipantRole::Investor, DisclosureStage::Extended);

        // Founder tries to request NDA with investor2 (no relationship exists)
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('NDA can only be initiated for relationships currently at Stage 2');

        $this->ndaService->requestNda($business, $founder, $investor2);
    }

    public function test_tier_0_user_cannot_decline_nda(): void
    {
        $founder = $this->createFounder(VerificationTier::Tier1);
        $investorTier0 = $this->createInvestor(VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investorTier0, ParticipantRole::Investor, DisclosureStage::Extended);

        // Tier 1 founder requests NDA
        $this->ndaService->requestNda($business, $founder, $investorTier0);

        // Tier 0 investor tries to decline
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Tier 1 identity verification is required to decline an NDA.');

        $this->ndaService->declineNda($business, $investorTier0);
    }

    public function test_requested_nda_populates_valid_deterministic_version_and_hash(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $nda = $this->ndaService->requestNda($business, $investor);

        $this->assertSame(NdaService::DEFAULT_NDA_VERSION, $nda->nda_version);
        $this->assertSame('v1.0', $nda->nda_version);
        $this->assertSame(NdaService::DEFAULT_AGREEMENT_HASH, $nda->agreement_hash);
        $this->assertSame(64, strlen($nda->agreement_hash));
    }
}
