<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealFeedbackTest extends TestCase
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
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, string $name = 'NovaTech AI Ltd'): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = $name;
        $business->description = 'Healthtech AI in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        return $business;
    }

    public function test_non_participant_cannot_view_or_submit_feedback_on_a_deal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $unrelated = $this->createInvestor('unrelated@example.com');

        $business = $this->createBusiness($founder);
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        $this->actingAs($unrelated)
            ->getJson("/api/me/deals/{$deal->id}/feedback")
            ->assertForbidden();

        $this->actingAs($unrelated)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 5,
                'comment' => 'Great collaboration.',
            ])
            ->assertForbidden();
    }

    public function test_feedback_cannot_be_submitted_on_uncompleted_deals(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        $business = $this->createBusiness($founder);
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::MilestoneFundingActive,
        ]);

        $response = $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 5,
                'comment' => 'Should fail before completion.',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['deal'], 'error.details');
    }

    public function test_rating_bounds_validation_enforces_1_to_5(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        $business = $this->createBusiness($founder);
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        // 0 is invalid
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 0,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['rating'], 'error.details');

        // 6 is invalid
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 6,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['rating'], 'error.details');
    }

    public function test_bilateral_feedback_submission_on_completed_deal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        $business = $this->createBusiness($founder, 'Dhaka Logistics');
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        // Check status before submission
        $statusRes = $this->actingAs($founder)
            ->getJson("/api/me/deals/{$deal->id}/feedback")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deal_stage', 'completed')
            ->assertJsonStructure(['success', 'message', 'data' => [
                'deal_id',
                'deal_stage',
                'can_submit_feedback',
                'has_submitted_feedback',
                'founder_feedback_submitted',
                'counterparty_feedback_submitted',
                'reviews',
            ]]);

        $this->assertTrue($statusRes->json('data.can_submit_feedback'));
        $this->assertFalse($statusRes->json('data.has_submitted_feedback'));
        $this->assertFalse($statusRes->json('data.founder_feedback_submitted'));
        $this->assertFalse($statusRes->json('data.counterparty_feedback_submitted'));

        // 1. Founder reviews Investor
        $founderPost = $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 5,
                'comment' => 'Transparent investor, released tranches smoothly.',
            ]);

        $founderPost->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reviewer_user_id', $founder->id)
            ->assertJsonPath('data.reviewer_role', 'founder')
            ->assertJsonPath('data.recipient_user_id', $investor->id)
            ->assertJsonPath('data.recipient_role', 'investor')
            ->assertJsonPath('data.rating', 5);

        // Founder cannot submit duplicate feedback on same deal
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 4,
                'comment' => 'Trying duplicate',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['feedback'], 'error.details');

        // 2. Investor reviews Founder
        $investorPost = $this->actingAs($investor)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 4,
                'comment' => 'Delivered milestones with solid evidence.',
            ]);

        $investorPost->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reviewer_user_id', $investor->id)
            ->assertJsonPath('data.reviewer_role', 'investor')
            ->assertJsonPath('data.recipient_user_id', $founder->id)
            ->assertJsonPath('data.recipient_role', 'founder')
            ->assertJsonPath('data.rating', 4);

        // Verify final deal feedback status
        $finalStatus = $this->actingAs($investor)
            ->getJson("/api/me/deals/{$deal->id}/feedback")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertFalse($finalStatus->json('data.can_submit_feedback'));
        $this->assertTrue($finalStatus->json('data.has_submitted_feedback'));
        $this->assertTrue($finalStatus->json('data.founder_feedback_submitted'));
        $this->assertTrue($finalStatus->json('data.counterparty_feedback_submitted'));
        $this->assertCount(2, $finalStatus->json('data.reviews'));
    }

    public function test_multiple_independent_deals_between_same_parties_allow_isolated_feedbacks(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        $business1 = $this->createBusiness($founder);
        $connection1 = BusinessConnection::create([
            'business_id' => $business1->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal1 = Deal::create([
            'connection_id' => $connection1->id,
            'business_id' => $business1->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        $business2 = $this->createBusiness($founder);
        $connection2 = BusinessConnection::create([
            'business_id' => $business2->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal2 = Deal::create([
            'connection_id' => $connection2->id,
            'business_id' => $business2->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        // Submit feedback on deal 1
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal1->id}/feedback", [
                'rating' => 5,
                'comment' => 'Deal 1 review',
            ])
            ->assertStatus(201);

        // Founder can still submit feedback on deal 2
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal2->id}/feedback", [
                'rating' => 3,
                'comment' => 'Deal 2 review',
            ])
            ->assertStatus(201);

        $this->assertSame(2, DealFeedback::count());
    }

    public function test_founder_and_professional_counterparty_bilateral_feedback_on_completed_deal(): void
    {
        $founder = $this->createFounder('founder_pro@example.com');
        $professional = $this->createProfessional('pro_deal@example.com');

        $business = $this->createBusiness($founder, 'Pro Health Ltd');
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $professional->id,
            'counterparty_role' => ParticipantRole::Professional,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $professional->id,
            'counterparty_role' => ParticipantRole::Professional,
            'stage' => DealStage::Completed,
        ]);

        // 1. Founder reviews Professional
        $founderPost = $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 5,
                'comment' => 'Outstanding advisory and engineering expertise.',
            ]);

        $founderPost->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reviewer_user_id', $founder->id)
            ->assertJsonPath('data.reviewer_role', 'founder')
            ->assertJsonPath('data.recipient_user_id', $professional->id)
            ->assertJsonPath('data.recipient_role', 'professional')
            ->assertJsonPath('data.rating', 5);

        // Duplicate Founder submission rejected
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/feedback", [
                'rating' => 4,
                'comment' => 'Duplicate attempt',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['feedback'], 'error.details');

        // 2. Professional reviews Founder
        $proPost = $this->actingAs($professional)
            ->postJson("/api/me/deals/{$deal->id}/feedback?role=professional", [
                'rating' => 5,
                'comment' => 'Great founder to advise, very receptive to feedback.',
            ]);

        $proPost->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reviewer_user_id', $professional->id)
            ->assertJsonPath('data.reviewer_role', 'professional')
            ->assertJsonPath('data.recipient_user_id', $founder->id)
            ->assertJsonPath('data.recipient_role', 'founder')
            ->assertJsonPath('data.rating', 5);

        // Duplicate Professional submission rejected
        $this->actingAs($professional)
            ->postJson("/api/me/deals/{$deal->id}/feedback?role=professional", [
                'rating' => 3,
                'comment' => 'Another review',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['feedback'], 'error.details');

        // Verify status and coexistence
        $finalStatus = $this->actingAs($professional)
            ->getJson("/api/me/deals/{$deal->id}/feedback?role=professional")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertFalse($finalStatus->json('data.can_submit_feedback'));
        $this->assertTrue($finalStatus->json('data.has_submitted_feedback'));
        $this->assertTrue($finalStatus->json('data.founder_feedback_submitted'));
        $this->assertTrue($finalStatus->json('data.counterparty_feedback_submitted'));
        $this->assertCount(2, $finalStatus->json('data.reviews'));

        // Deal stage remains completed
        $this->assertSame(DealStage::Completed, $deal->fresh()->stage);
    }
}
