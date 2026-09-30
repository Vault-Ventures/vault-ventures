<?php

namespace Tests\Feature;

use App\Models\AdminAccess;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Models\VerificationAuditLog;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminAuditHistoryTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        AdminAccess::forceCreate(['user_id' => $admin->id]);
        $this->actingAs($admin, 'web');
        return $admin;
    }

    public function test_guest_and_participant_roles_cannot_read_admin_audits(): void
    {
        foreach (['verification-requests', 'financial-reports'] as $resource) {
            $this->getJson("/api/admin/$resource/1/audit-logs")->assertUnauthorized();
        }
        foreach (['founder', 'investor', 'professional'] as $role) {
            $user = User::factory()->create();
            $user->roles()->create(['role' => $role]);
            $this->actingAs($user, 'web');
            foreach (['verification-requests', 'financial-reports'] as $resource) {
                $this->getJson("/api/admin/$resource/1/audit-logs")->assertForbidden();
            }
        }
    }

    public function test_history_is_persisted_scoped_chronological_and_read_only(): void
    {
        $admin = $this->admin();
        $record = VerificationRequest::create(['user_id' => $admin->id, 'requested_tier' => 1, 'status' => 'approved', 'submitted_at' => now()]);
        $other = VerificationRequest::create(['user_id' => $admin->id, 'requested_tier' => 1, 'status' => 'rejected']);
        foreach ([[$record, 'approved', '2026-01-02 00:00:00'], [$record, 'needs_information', '2026-01-01 00:00:00'], [$other, 'rejected', '2026-01-01 00:00:00']] as [$request, $action, $time]) {
            VerificationAuditLog::create(['verification_request_id' => $request->id, 'actor_user_id' => $admin->id, 'action' => $action, 'previous_status' => 'pending', 'new_status' => $action, 'notes' => 'Persisted reason', 'occurred_at' => $time]);
        }
        $before = $record->getRawOriginal();
        $count = VerificationAuditLog::count();
        $response = $this->getJson("/api/admin/verification-requests/{$record->id}/audit-logs")->assertOk()
            ->assertJsonCount(2, 'data.audit_logs')->assertJsonPath('data.audit_logs.0.action', 'needs_information')
            ->assertJsonPath('data.audit_logs.1.action', 'approved')->assertJsonPath('data.audit_logs.1.previous_status', 'pending')
            ->assertJsonPath('data.audit_logs.1.new_status', 'approved')->assertJsonPath('data.audit_logs.1.actor.name', $admin->name)
            ->assertJsonPath('data.audit_logs.1.notes', 'Persisted reason')->assertJsonPath('data.evidence_access_logs', []);
        $this->assertArrayNotHasKey('email', $response->json('data.audit_logs.0.actor'));
        $this->assertSame($before, $record->fresh()->getRawOriginal());
        $this->assertSame($count, VerificationAuditLog::count());
        $all = $this->getJson('/api/admin/verification-requests?status=all')->assertOk()->json('data');
        $this->assertContains($record->id, array_column($all, 'id'));
        $queue = $this->getJson('/api/admin/verification-requests')->assertOk()->json('data');
        $this->assertNotContains($record->id, array_column($queue, 'id'));
        $this->getJson("/api/admin/verification-requests/{$record->id}")->assertOk();
    }

    public function test_empty_missing_and_out_of_scope_requests(): void
    {
        $admin = $this->admin();
        $record = VerificationRequest::create(['user_id' => $admin->id, 'requested_tier' => 1, 'status' => 'pending']);
        $this->getJson("/api/admin/verification-requests/{$record->id}/audit-logs")->assertOk()->assertJsonPath('data.audit_logs', []);
        $tier2 = VerificationRequest::create(['user_id' => $admin->id, 'requested_tier' => 2, 'status' => 'pending']);
        $this->getJson("/api/admin/verification-requests/{$tier2->id}/audit-logs")->assertNotFound();
        $this->getJson('/api/admin/verification-requests/999999999/audit-logs')->assertNotFound();
        $this->getJson('/api/admin/financial-reports/999999999/audit-logs')->assertNotFound();
    }

    public function test_evidence_access_history_is_scoped_and_excludes_storage_details(): void
    {
        $admin = $this->admin();
        $records = [];
        foreach ([1, 2] as $index) {
            $record = VerificationRequest::create(['user_id' => $admin->id, 'requested_tier' => 1, 'status' => 'pending']);
            $evidence = \App\Models\VerificationEvidence::create([
                'verification_request_id' => $record->id, 'uploaded_by_user_id' => $admin->id,
                'disk' => 'local', 'path' => 'private-secret.enc', 'original_filename' => 'identity.pdf',
                'mime_type' => 'application/pdf', 'file_size_bytes' => 100,
            ]);
            \App\Models\VerificationEvidenceAccessLog::create([
                'verification_request_id' => $record->id, 'verification_evidence_id' => $evidence->id,
                'actor_user_id' => $admin->id, 'action' => 'download_initiated', 'occurred_at' => now(),
            ]);
            $records[] = [$record, $evidence];
        }
        [$record, $evidence] = $records[0];
        $response = $this->getJson("/api/admin/verification-requests/{$record->id}/audit-logs")->assertOk()
            ->assertJsonCount(1, 'data.evidence_access_logs')
            ->assertJsonPath('data.evidence_access_logs.0.verification_evidence_id', $evidence->id)
            ->assertJsonPath('data.evidence_access_logs.0.actor.name', $admin->name);
        $this->assertStringNotContainsString('private-secret', $response->getContent());
        $this->assertArrayNotHasKey('path', $response->json('data.evidence_access_logs.0'));
    }
}
