<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessNda;
use App\Models\User;
use App\Services\Disclosure\StageFourService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class StageFourServiceTest extends TestCase
{
    use RefreshDatabase;

    private StageFourService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StageFourService;
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

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor,
        DisclosureStage $stage = DisclosureStage::Nda
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => now(),
        ]);
    }

    private function createNda(
        Business $business,
        User $counterparty,
        User $founder,
        NdaStatus $status = NdaStatus::Active
    ): BusinessNda {
        return BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => $status,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $counterparty->id,
            'requested_at' => now(),
            'founder_accepted_at' => $status === NdaStatus::Active ? now() : null,
            'counterparty_accepted_at' => now(),
            'activated_at' => $status === NdaStatus::Active ? now() : null,
        ]);
    }

    public function test_founder_tier_1_can_confirm_valid_stage_3_relationship(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $result = $this->service->confirmStageFour($business, $founder, $investor);

        $this->assertSame(DisclosureStage::FullProposal, $result->stage);
        $this->assertNotNull($result->stage_4_confirmed_at);
        $this->assertDatabaseHas('business_disclosure_relationships', [
            'id' => $relationship->id,
            'stage' => DisclosureStage::FullProposal->value,
        ]);
    }

    public function test_professional_counterparty_stage_3_can_be_confirmed(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Nda);
        $this->createNda($business, $pro, $founder, NdaStatus::Active);

        $result = $this->service->confirmStageFour($business, $founder, $pro);

        $this->assertSame(DisclosureStage::FullProposal, $result->stage);
        $this->assertNotNull($result->stage_4_confirmed_at);
    }

    public function test_founder_tier_0_cannot_confirm(): void
    {
        $founder = $this->createFounder('f0@example.com', VerificationTier::Tier0);
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Founder must possess Tier 1 identity verification to confirm Stage 4.');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_counterparty_tier_0_prevents_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Counterparty must possess Tier 1 identity verification before Stage 4 can be confirmed.');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_counterparty_cannot_confirm_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Only the business founder can confirm Stage 4 access.');

        // Investor attempts to call confirmStageFour
        $this->service->confirmStageFour($business, $investor, $investor);
    }

    public function test_stage_1_cannot_jump_to_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Teaser);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Stage 4 confirmation requires relationship to be currently at Stage 3 (NDA Protected).');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_stage_2_cannot_jump_to_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Stage 4 confirmation requires relationship to be currently at Stage 3 (NDA Protected).');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_stage_3_without_active_nda_cannot_confirm(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        // NDA is pending, not active
        $this->createNda($business, $investor, $founder, NdaStatus::Pending);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('An active bilateral NDA is required before Stage 4 can be confirmed.');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_stage_3_with_declined_nda_cannot_confirm(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Declined);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('An active bilateral NDA is required before Stage 4 can be confirmed.');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_missing_relationship_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // No relationship created

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('No disclosure relationship found for this counterparty.');

        $this->service->confirmStageFour($business, $founder, $investor);
    }

    public function test_wrong_business_counterparty_pairing_rejected(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        // Relationship only exists for investor1
        $this->createRelationship($business, $investor1, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor1, $founder, NdaStatus::Active);

        // Founder tries to confirm for investor2
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('No disclosure relationship found for this counterparty.');

        $this->service->confirmStageFour($business, $founder, $investor2);
    }

    public function test_non_owner_founder_rejected(): void
    {
        $founder1 = $this->createFounder('f1@example.com');
        $founder2 = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder1);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder1, NdaStatus::Active);

        // Founder 2 tries to confirm Stage 4 for Founder 1's business
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Only the business founder can confirm Stage 4 access.');

        $this->service->confirmStageFour($business, $founder2, $investor);
    }

    public function test_founder_cannot_confirm_stage_4_for_themselves(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Cannot confirm Stage 4 for oneself.');

        $this->service->confirmStageFour($business, $founder, $founder);
    }

    public function test_already_stage_4_cannot_be_reconfirmed_or_overwritten(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        // First confirmation -> Stage 4
        $first = $this->service->confirmStageFour($business, $founder, $investor);
        $originalTimestamp = $first->stage_4_confirmed_at;

        // Second confirmation attempt -> 409 Conflict
        try {
            $this->service->confirmStageFour($business, $founder, $investor);
            $this->fail('Expected HttpException 409 was not thrown');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
            $this->assertSame('Stage 4 has already been confirmed for this relationship.', $e->getMessage());
        }

        $relationship->refresh();
        $this->assertSame(DisclosureStage::FullProposal, $relationship->stage);
        $this->assertEquals($originalTimestamp->toISOString(), $relationship->stage_4_confirmed_at->toISOString());
    }
}
