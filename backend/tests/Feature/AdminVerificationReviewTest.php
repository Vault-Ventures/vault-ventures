<?php

namespace Tests\Feature;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\User;
use App\Models\VerificationEvidence;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminVerificationReviewTest extends TestCase
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

    public function test_unauthenticated_user_cannot_access_admin_queue_or_detail(): void
    {
        $this->getJson('/api/admin/verification-requests')
            ->assertUnauthorized();

        $this->getJson('/api/admin/verification-requests/1')
            ->assertUnauthorized();
    }

    public function test_non_admin_user_receives_forbidden(): void
    {
        $normalUser = User::factory()->create();
        $this->actingAs($normalUser, 'web');

        $this->getJson('/api/admin/verification-requests')
            ->assertForbidden();

        $this->getJson('/api/admin/verification-requests/1')
            ->assertForbidden();
    }

    public function test_authorized_admin_can_access_queue_and_sees_only_tier_1_requests_requiring_review(): void
    {
        $admin = $this->createAdminUser();
        $userA = User::factory()->create(['name' => 'Alice Founder', 'email' => 'alice@example.com']);
        $userB = User::factory()->create(['name' => 'Bob Founder', 'email' => 'bob@example.com']);
        $userC = User::factory()->create(['name' => 'Charlie Founder', 'email' => 'charlie@example.com']);

        // Tier 1 - Pending (should appear)
        $req1 = VerificationRequest::create([
            'user_id' => $userA->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subHours(2),
        ]);

        // Tier 1 - Under Review (should appear)
        $req2 = VerificationRequest::create([
            'user_id' => $userB->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::UnderReview,
            'submitted_at' => now()->subHour(),
        ]);

        // Tier 2 - Pending (deferred/invalid, should NOT appear in Tier 1 admin review queue)
        $reqTier2 = VerificationRequest::create([
            'user_id' => $userC->id,
            'requested_tier' => VerificationTier::Tier2,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subMinutes(30),
        ]);

        // Tier 1 - Approved (finalized, should NOT appear in default review queue)
        $reqApproved = VerificationRequest::create([
            'user_id' => $userC->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Approved,
            'submitted_at' => now()->subDays(3),
            'reviewed_at' => now()->subDay(),
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/admin/verification-requests');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $req1->id)
            ->assertJsonPath('data.0.user.name', 'Alice Founder')
            ->assertJsonPath('data.0.requested_tier', 1)
            ->assertJsonPath('data.0.requested_tier_label', 'Identity Verified')
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonPath('data.1.id', $req2->id)
            ->assertJsonPath('data.1.user.name', 'Bob Founder')
            ->assertJsonPath('data.1.status', 'under_review');
    }

    public function test_admin_can_view_request_detail_with_safe_metadata(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create([
            'name' => 'Diana Prince',
            'email' => 'diana@example.com',
            'phone' => '+15559876543',
        ]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now()->subHour(),
        ]);

        VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => VerificationEvidenceStorage::DISK,
            'path' => "{$request->id}/00000000-0000-0000-0000-000000000001.enc",
            'original_filename' => 'passport_scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 102400,
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson("/api/admin/verification-requests/{$request->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $request->id)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.name', 'Diana Prince')
            ->assertJsonPath('data.user.email', 'diana@example.com')
            ->assertJsonPath('data.user.phone', '+15559876543')
            ->assertJsonPath('data.requested_tier', 1)
            ->assertJsonPath('data.requested_tier_label', 'Identity Verified')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.evidence_count', 1)
            ->assertJsonCount(1, 'data.evidence')
            ->assertJsonPath('data.evidence.0.original_filename', 'passport_scan.pdf')
            ->assertJsonPath('data.evidence.0.mime_type', 'application/pdf')
            ->assertJsonPath('data.evidence.0.file_size_bytes', 102400);
    }

    public function test_evidence_contents_and_raw_storage_paths_are_not_exposed(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $secretPath = "{$request->id}/secret-uuid-12345678.enc";
        VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => VerificationEvidenceStorage::DISK,
            'path' => $secretPath,
            'original_filename' => 'sensitive_id.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 2048,
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson("/api/admin/verification-requests/{$request->id}");

        $response->assertOk();
        $json = $response->json();
        $evidenceData = $json['data']['evidence'][0];

        $this->assertArrayNotHasKey('path', $evidenceData);
        $this->assertArrayNotHasKey('disk', $evidenceData);
        $this->assertArrayNotHasKey('content', $evidenceData);
        $this->assertStringNotContainsString('secret-uuid-12345678', $response->getContent());
        $this->assertStringNotContainsString('verification_evidence', $response->getContent());
    }

    public function test_admin_cannot_view_tier_2_request_through_tier_1_admin_detail(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create();

        $requestTier2 = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier2,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'web');

        $this->getJson("/api/admin/verification-requests/{$requestTier2->id}")
            ->assertNotFound();
    }

    public function test_unsupported_admin_endpoints_return_not_found_or_method_not_allowed(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/admin/verification-requests/{$request->id}/cancel")
            ->assertNotFound();

        $this->postJson("/api/admin/verification-requests/{$request->id}/reopen")
            ->assertNotFound();

        $this->patchJson("/api/admin/verification-requests/{$request->id}")
            ->assertMethodNotAllowed();

        $this->putJson("/api/admin/verification-requests/{$request->id}")
            ->assertMethodNotAllowed();
    }
}
