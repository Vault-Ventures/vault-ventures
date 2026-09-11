<?php

namespace Tests\Feature;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\User;
use App\Models\VerificationAuditLog;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminVerificationDecisionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(VerificationEvidenceStorage::DISK);
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdminUser(): User
    {
        $user = User::factory()->create();
        AdminAccess::forceCreate(['user_id' => $user->id]);

        return $user;
    }

    public function test_non_admin_cannot_perform_review_actions(): void
    {
        $normalUser = User::factory()->create();
        $targetUser = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $targetUser->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($normalUser, 'web');

        $this->postJson("/api/admin/verification-requests/{$request->id}/approve")
            ->assertForbidden();

        $this->postJson("/api/admin/verification-requests/{$request->id}/reject")
            ->assertForbidden();

        $this->postJson("/api/admin/verification-requests/{$request->id}/request-information")
            ->assertForbidden();
    }

    public function test_admin_can_approve_tier_1_request_and_user_elevates_to_tier_1(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subHours(2),
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/verification-requests/{$request->id}/approve", [
            'admin_notes' => 'All identification documents verified successfully.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification request approved successfully.')
            ->assertJsonPath('data.id', $request->id)
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.assigned_admin_id', $admin->id)
            ->assertJsonPath('data.admin_notes', 'All identification documents verified successfully.');

        // Verify request updated in database
        $freshRequest = $request->fresh();
        $this->assertSame(VerificationRequestStatus::Approved, $freshRequest->status);
        $this->assertSame($admin->id, $freshRequest->assigned_admin_id);
        $this->assertNotNull($freshRequest->reviewed_at);

        // Verify user tier promoted to Tier 1
        $freshUser = $user->fresh();
        $this->assertSame(VerificationTier::Tier1, $freshUser->verification_tier);
        $this->assertTrue($freshUser->isIdentityVerified());

        // Verify audit log created
        $this->assertDatabaseCount('verification_audit_logs', 1);
        $audit = VerificationAuditLog::firstOrFail();
        $this->assertSame($request->id, $audit->verification_request_id);
        $this->assertSame($admin->id, $audit->actor_user_id);
        $this->assertSame('approved', $audit->action);
        $this->assertSame(VerificationRequestStatus::Pending->value, $audit->previous_status);
        $this->assertSame(VerificationRequestStatus::Approved->value, $audit->new_status);
        $this->assertSame('All identification documents verified successfully.', $audit->notes);
    }

    public function test_admin_can_reject_tier_1_request_and_user_remains_at_tier_0(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subHours(3),
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/verification-requests/{$request->id}/reject", [
            'rejection_reason' => 'National ID photo was blurry and illegible.',
            'admin_notes' => 'Internal reviewer note: rejected due to document quality.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification request rejected.')
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'National ID photo was blurry and illegible.')
            ->assertJsonPath('data.admin_notes', 'Internal reviewer note: rejected due to document quality.');

        // Verify request updated
        $freshRequest = $request->fresh();
        $this->assertSame(VerificationRequestStatus::Rejected, $freshRequest->status);
        $this->assertSame('National ID photo was blurry and illegible.', $freshRequest->rejection_reason);
        $this->assertSame($admin->id, $freshRequest->assigned_admin_id);

        // Verify user tier remains Tier 0
        $freshUser = $user->fresh();
        $this->assertSame(VerificationTier::Tier0, $freshUser->verification_tier);
        $this->assertFalse($freshUser->isIdentityVerified());

        // Verify audit log created
        $audit = VerificationAuditLog::firstOrFail();
        $this->assertSame($request->id, $audit->verification_request_id);
        $this->assertSame($admin->id, $audit->actor_user_id);
        $this->assertSame('rejected', $audit->action);
        $this->assertSame(VerificationRequestStatus::Pending->value, $audit->previous_status);
        $this->assertSame(VerificationRequestStatus::Rejected->value, $audit->new_status);
        $this->assertSame('National ID photo was blurry and illegible.', $audit->notes);
    }

    public function test_admin_can_request_more_information_and_user_remains_at_tier_0(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier0,
        ]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subHour(),
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/verification-requests/{$request->id}/request-information", [
            'admin_notes' => 'Please provide a clear color scan of the back of your National ID.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Additional information requested.')
            ->assertJsonPath('data.status', 'needs_information')
            ->assertJsonPath('data.admin_notes', 'Please provide a clear color scan of the back of your National ID.');

        // Verify request updated
        $freshRequest = $request->fresh();
        $this->assertSame(VerificationRequestStatus::NeedsInformation, $freshRequest->status);
        $this->assertSame($admin->id, $freshRequest->assigned_admin_id);

        // User tier unchanged
        $freshUser = $user->fresh();
        $this->assertSame(VerificationTier::Tier0, $freshUser->verification_tier);

        // Audit log created
        $audit = VerificationAuditLog::firstOrFail();
        $this->assertSame($request->id, $audit->verification_request_id);
        $this->assertSame('needs_information', $audit->action);
        $this->assertSame(VerificationRequestStatus::Pending->value, $audit->previous_status);
        $this->assertSame(VerificationRequestStatus::NeedsInformation->value, $audit->new_status);
    }

    public function test_invalid_repeated_transition_on_finalized_request_is_rejected(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Approved,
            'submitted_at' => now()->subDays(2),
            'reviewed_at' => now()->subDay(),
        ]);

        $this->actingAs($admin, 'web');

        // Cannot approve already approved request
        $this->postJson("/api/admin/verification-requests/{$request->id}/approve")
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Verification request is already finalized and cannot be modified.');

        // Cannot reject already approved request
        $this->postJson("/api/admin/verification-requests/{$request->id}/reject")
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Verification request is already finalized and cannot be modified.');

        // Cannot request information on already approved request
        $this->postJson("/api/admin/verification-requests/{$request->id}/request-information")
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Verification request is already finalized and cannot be modified.');
    }

    public function test_tier_2_request_cannot_be_reviewed(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier2,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/admin/verification-requests/{$request->id}/approve")
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Only Tier 1 verification requests can be reviewed.');
    }
}
