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

class AdminReputationAuditTest extends TestCase
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

    public function test_non_admin_is_forbidden_from_inspecting_user_reputation_audit_endpoint(): void
    {
        $regularUser = User::factory()->create();
        $targetUser = User::factory()->create();

        $this->actingAs($regularUser)
            ->getJson("/api/admin/reputation/users/{$targetUser->id}")
            ->assertForbidden();
    }

    public function test_admin_can_inspect_reputation_audit_for_any_user_across_all_their_roles(): void
    {
        $admin = User::factory()->create();
        $admin->adminAccess()->create([]);

        $target = User::factory()->create(['name' => 'Multi-Role User', 'email' => 'target@vault.test', 'verification_tier' => VerificationTier::Tier1]);
        $target->roles()->create(['role' => ParticipantRole::Founder->value]);
        $target->founderProfile()->create([]);
        $target->roles()->create(['role' => ParticipantRole::Investor->value]);

        $investor = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $investor->roles()->create(['role' => ParticipantRole::Investor->value]);

        $business = $this->createBusiness($target);
        $conn = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $target->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);
        $deal = Deal::create([
            'connection_id' => $conn->id,
            'business_id' => $business->id,
            'founder_user_id' => $target->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        DealFeedback::create([
            'deal_id' => $deal->id,
            'reviewer_user_id' => $investor->id,
            'reviewer_role' => ParticipantRole::Investor,
            'recipient_user_id' => $target->id,
            'recipient_role' => ParticipantRole::Founder,
            'rating' => 5,
            'comment' => 'Audit review test comment.',
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/admin/reputation/users/{$target->id}")
            ->assertOk();

        $data = $response->json('data');

        $this->assertSame($target->id, $data['user']['id']);
        $this->assertSame('target@vault.test', $data['user']['email']);
        $this->assertSame(1, $data['user']['verification_tier']);
        $this->assertArrayHasKey('founder', $data['reputation_by_role']);
        $this->assertArrayHasKey('investor', $data['reputation_by_role']);
        $this->assertSame(1, $data['reputation_by_role']['founder']['track_record']['completed_deals_count']);
        $this->assertSame(1, $data['reputation_by_role']['founder']['feedback']['reviews_count']);
    }
}
