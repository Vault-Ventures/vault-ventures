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
use App\Models\DealMilestone;
use App\Models\FounderProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReputationSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
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

    public function test_fresh_user_has_baseline_track_record_with_zero_completed_deals_and_milestones(): void
    {
        $user = User::factory()->create(['verification_tier' => 0]);
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);
        $profile = new FounderProfile;
        $profile->user_id = $user->id;
        $profile->save();

        $response = $this->actingAs($user)
            ->getJson('/api/me/reputation')
            ->assertOk();

        $data = $response->json('data');

        $this->assertSame($user->id, $data['user_id']);
        $this->assertSame('founder', $data['role']);
        $this->assertSame(0, $data['verification']['tier']);
        $this->assertSame(0, $data['track_record']['completed_deals_count']);
        $this->assertSame(0, $data['track_record']['completed_milestones_count']);
        $this->assertSame('0.00', $data['track_record']['total_simulated_bdt']);
        $this->assertSame(0, $data['feedback']['reviews_count']);
        $this->assertNull($data['feedback']['average_rating']);
        $this->assertSame(0, $data['profile_evidence']['businesses_count']);
    }

    public function test_reputation_summary_accurately_aggregates_completed_deals_funded_milestones_and_feedback(): void
    {
        $founder = User::factory()->create(['name' => 'Founder Rahman', 'verification_tier' => VerificationTier::Tier1]);
        $founder->roles()->create(['role' => ParticipantRole::Founder->value]);
        $founder->founderProfile()->create([]);

        $investor1 = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $investor1->roles()->create(['role' => ParticipantRole::Investor->value]);

        $investor2 = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $investor2->roles()->create(['role' => ParticipantRole::Investor->value]);

        $business = $this->createBusiness($founder, 'AgriTech BD');

        // Deal 1: Completed with 2 funded milestones (100k + 200k = 300k)
        $conn1 = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor1->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);
        $deal1 = Deal::create([
            'connection_id' => $conn1->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor1->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);
        DealMilestone::create([
            'deal_id' => $deal1->id,
            'sequence_order' => 1,
            'title' => 'MVP Launch',
            'target_amount' => 100000.00,
            'status' => 'funded',
        ]);
        DealMilestone::create([
            'deal_id' => $deal1->id,
            'sequence_order' => 2,
            'title' => 'Customer Acquisition',
            'target_amount' => 200000.00,
            'status' => 'funded',
        ]);

        // Deal 2: Active (milestone_funding_active) - should NOT count toward completed deals count
        $conn2 = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor2->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);
        $deal2 = Deal::create([
            'connection_id' => $conn2->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor2->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::MilestoneFundingActive,
        ]);

        // Feedbacks received by founder
        DealFeedback::create([
            'deal_id' => $deal1->id,
            'reviewer_user_id' => $investor1->id,
            'reviewer_role' => ParticipantRole::Investor,
            'recipient_user_id' => $founder->id,
            'recipient_role' => ParticipantRole::Founder,
            'rating' => 5,
            'comment' => 'Exceptional team and execution.',
        ]);

        $response = $this->actingAs($founder)
            ->getJson('/api/me/reputation')
            ->assertOk();

        $data = $response->json('data');

        $this->assertSame(1, $data['verification']['tier']);
        $this->assertTrue($data['verification']['is_identity_verified']);
        $this->assertSame(1, $data['track_record']['completed_deals_count']);
        $this->assertSame(2, $data['track_record']['completed_milestones_count']);
        $this->assertSame('300000.00', $data['track_record']['total_simulated_bdt']);
        $this->assertSame(1, $data['feedback']['reviews_count']);
        $this->assertSame(5.0, (float) $data['feedback']['average_rating']);
        $this->assertCount(1, $data['feedback']['reviews']);
        $this->assertSame('Exceptional team and execution.', $data['feedback']['reviews'][0]['comment']);
    }

    public function test_multi_role_user_reputation_handles_explicit_role_parameter_and_combined_index(): void
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => ParticipantRole::Founder->value]);
        $user->roles()->create(['role' => ParticipantRole::Investor->value]);

        // 1. Without role parameter: returns both
        $response = $this->actingAs($user)
            ->getJson('/api/me/reputation')
            ->assertOk();

        $data = $response->json('data');
        $this->assertArrayHasKey('founder', $data);
        $this->assertArrayHasKey('investor', $data);

        // 2. With specific role parameter: returns single role
        $founderRes = $this->actingAs($user)
            ->getJson('/api/me/reputation?role=founder')
            ->assertOk();

        $this->assertSame('founder', $founderRes->json('data.role'));

        $investorRes = $this->actingAs($user)
            ->getJson('/api/me/reputation?role=investor')
            ->assertOk();

        $this->assertSame('investor', $investorRes->json('data.role'));
    }

    public function test_public_reputation_endpoint_requires_role_parameter_and_returns_verified_track_record(): void
    {
        $targetUser = User::factory()->create(['name' => 'Dr. Tareq', 'verification_tier' => VerificationTier::Tier1]);
        $targetUser->roles()->create(['role' => ParticipantRole::Investor->value]);

        $viewer = User::factory()->create();

        // Missing role param -> 422
        $this->actingAs($viewer)
            ->getJson("/api/users/{$targetUser->id}/reputation")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Valid role param -> 200
        $response = $this->actingAs($viewer)
            ->getJson("/api/users/{$targetUser->id}/reputation?role=investor")
            ->assertOk();

        $data = $response->json('data');
        $this->assertSame($targetUser->id, $data['user_id']);
        $this->assertSame('investor', $data['role']);
        $this->assertSame(1, $data['verification']['tier']);
    }
}
