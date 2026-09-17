<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Models\Business;
use App\Models\BusinessRequirement;
use App\Models\FounderProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BusinessApprovalAndPublishingTest extends TestCase
{
    use RefreshDatabase;

    private User $founder;
    private User $admin;
    private User $adminFounder;

    protected function setUp(): void
    {
        parent::setUp();

        $this->founder = User::factory()->create(['verification_tier' => 1]);
        $this->founder->roles()->create(['role' => 'founder']);
        $fp = new FounderProfile();
        $fp->user_id = $this->founder->id;
        $fp->save();

        $this->admin = User::factory()->create(['verification_tier' => 2]);
        DB::table('admin_access')->insert(['user_id' => $this->admin->id, 'created_at' => now(), 'updated_at' => now()]);

        // An admin who also owns a business
        $this->adminFounder = User::factory()->create(['verification_tier' => 2]);
        $this->adminFounder->roles()->create(['role' => 'founder']);
        DB::table('admin_access')->insert(['user_id' => $this->adminFounder->id, 'created_at' => now(), 'updated_at' => now()]);
        $afp = new FounderProfile();
        $afp->user_id = $this->adminFounder->id;
        $afp->save();
    }

    private function createCompleteDraft(User $owner): Business
    {
        $business = $owner->founderProfile->businesses()->create([
            'name' => 'SolarTech Innovations Ltd',
            'description' => 'Solar panel microgrids for industrial parks in Gazipur.',
            'industry' => 'Renewable Energy',
            'business_stage' => 'Seed',
            'location' => 'Gazipur, Bangladesh',
            'status' => BusinessStatus::Draft,
        ]);

        $business->requirements()->create([
            'funding_amount' => 5000000,
            'accepted_investment_types' => ['equity', 'revenue_share'],
        ]);

        return $business;
    }

    public function test_founder_submission_transitions_business_to_pending_approval(): void
    {
        $business = $this->createCompleteDraft($this->founder);

        $response = $this->actingAs($this->founder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/me/businesses/{$business->id}/submit");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending_approval');

        $this->assertSame('pending_approval', $business->fresh()->status->value);
        $this->assertNotNull($business->fresh()->submitted_at);
    }

    public function test_founder_cannot_publish_pending_business(): void
    {
        $business = $this->createCompleteDraft($this->founder);
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();

        $response = $this->actingAs($this->founder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/me/businesses/{$business->id}/publish");

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Business is pending Admin approval and cannot be published yet.');

        $this->assertSame('pending_approval', $business->fresh()->status->value);
    }

    public function test_non_admin_cannot_approve_or_reject_business(): void
    {
        $business = $this->createCompleteDraft($this->founder);
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();

        $this->actingAs($this->founder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/admin/businesses/{$business->id}/approve")
            ->assertForbidden();

        $this->actingAs($this->founder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/admin/businesses/{$business->id}/reject", ['rejection_reason' => 'Invalid'])
            ->assertForbidden();
    }

    public function test_admin_cannot_approve_their_own_business(): void
    {
        $business = $this->createCompleteDraft($this->adminFounder);
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();

        $response = $this->actingAs($this->adminFounder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/admin/businesses/{$business->id}/approve");

        $response->assertForbidden()
            ->assertJsonPath('message', 'Administrators cannot approve their own business.');
    }

    public function test_authorized_admin_can_approve_pending_business(): void
    {
        $business = $this->createCompleteDraft($this->founder);
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();

        $response = $this->actingAs($this->admin, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/admin/businesses/{$business->id}/approve");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved');

        $fresh = $business->fresh();
        $this->assertSame('approved', $fresh->status->value);
        $this->assertNotNull($fresh->approved_at);
        $this->assertSame($this->admin->id, $fresh->approved_by_user_id);
    }

    public function test_authorized_admin_can_reject_business_with_reason(): void
    {
        $business = $this->createCompleteDraft($this->founder);
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();

        $response = $this->actingAs($this->admin, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/admin/businesses/{$business->id}/reject", [
                'rejection_reason' => 'Financial projection details require verified bank statements.',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'rejected');

        $fresh = $business->fresh();
        $this->assertSame('rejected', $fresh->status->value);
        $this->assertSame('Financial projection details require verified bank statements.', $fresh->rejection_reason);
    }

    public function test_founder_can_publish_approved_business(): void
    {
        $business = $this->createCompleteDraft($this->founder);
        $business->forceFill([
            'status' => BusinessStatus::Approved,
            'approved_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ])->save();

        $response = $this->actingAs($this->founder, 'web')
            ->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json'])
            ->postJson("/api/me/businesses/{$business->id}/publish");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'published');

        $fresh = $business->fresh();
        $this->assertSame('published', $fresh->status->value);
        $this->assertNotNull($fresh->published_at);
    }

    public function test_published_business_appears_in_investor_discovery_while_pending_and_rejected_remain_hidden(): void
    {
        // 1. Create investor
        $investor = User::factory()->create(['verification_tier' => 1]);
        $investor->roles()->create(['role' => 'investor']);
        $investorProfile = $investor->investorProfile()->create();
        $investorProfile->preferences()->create([
            'industry' => 'Renewable Energy',
            'business_stage' => 'Seed',
            'location' => 'Gazipur, Bangladesh',
            'available_investment' => 10000000.00,
            'minimum_investment' => 1000000.00,
            'maximum_investment' => 6000000.00,
        ]);

        // 2. Founder creates a business
        $business = $this->createCompleteDraft($this->founder);

        // While Draft -> Not in investor discovery
        $resDraft = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();
        $this->assertNotContains($business->id, array_column($resDraft->json('data'), 'id'));

        // 3. Founder submits -> Pending Approval
        $business->forceFill(['status' => BusinessStatus::PendingApproval, 'submitted_at' => now()])->save();
        $resPending = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();
        $this->assertNotContains($business->id, array_column($resPending->json('data'), 'id'), 'Pending approval business must be hidden from investors');

        // 4. Admin approves
        $business->forceFill(['status' => BusinessStatus::Approved, 'approved_at' => now(), 'approved_by_user_id' => $this->admin->id])->save();
        $resApproved = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();
        $this->assertNotContains($business->id, array_column($resApproved->json('data'), 'id'), 'Approved but unpublished business must be hidden from investors');

        // 5. Founder publishes
        $business->forceFill(['status' => BusinessStatus::Published, 'published_at' => now()])->save();
        $resPublished = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();
        $publishedIds = array_column($resPublished->json('data'), 'id');
        $this->assertContains($business->id, $publishedIds, 'Genuinely published business must appear in investor discover');

        // 6. If Admin rejects business -> hidden from investor discovery
        $business->forceFill(['status' => BusinessStatus::Rejected, 'rejected_at' => now(), 'rejection_reason' => 'Audit failure'])->save();
        $resRejected = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();
        $this->assertNotContains($business->id, array_column($resRejected->json('data'), 'id'), 'Rejected business must be hidden from investors');
    }
}
