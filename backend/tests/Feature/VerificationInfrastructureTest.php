<?php

namespace Tests\Feature;

use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Models\VerificationEvidence;
use App\Models\VerificationEvidenceAccessLog;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class VerificationInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(VerificationEvidenceStorage::DISK);
        $this->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function admin(): User
    {
        $admin = User::factory()->create(); AdminAccess::forceCreate(['user_id' => $admin->id]); return $admin;
    }

    private function requestFor(?User $user = null, string $status = 'pending'): VerificationRequest
    {
        return VerificationRequest::create(['user_id' => ($user ?? User::factory()->create())->id, 'requested_tier' => 1, 'status' => $status, 'submitted_at' => now()]);
    }

    private function document(VerificationRequest $request, string $mime = 'application/pdf'): VerificationEvidence
    {
        $path = app(VerificationEvidenceStorage::class)->newPath($request->id);
        Storage::disk(VerificationEvidenceStorage::DISK)->put($path, Crypt::encryptString('private document bytes'));
        return VerificationEvidence::create([
            'verification_request_id' => $request->id, 'uploaded_by_user_id' => $request->user_id,
            'disk' => VerificationEvidenceStorage::DISK, 'path' => $path,
            'original_filename' => "../identity\"\r\n.pdf", 'mime_type' => $mime, 'file_size_bytes' => 22,
        ]);
    }

    private function endpoint(VerificationRequest $request, VerificationEvidence $evidence): string
    {
        return "/api/admin/verification-requests/{$request->id}/evidence/{$evidence->id}/download";
    }

    public function test_admin_can_retrieve_all_allowed_types_with_private_headers_and_access_audit(): void
    {
        $admin = $this->admin(); $request = $this->requestFor();
        foreach (VerificationEvidenceStorage::ALLOWED_MIME_TYPES as $mime) {
            $evidence = $this->document($request, $mime);
            $response = $this->actingAs($admin)->get($this->endpoint($request, $evidence))->assertOk();
            $this->assertSame('private document bytes', $response->getContent());
            $response->assertHeader('Content-Type', $mime)->assertHeader('X-Content-Type-Options', 'nosniff');
            $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
            $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
            $disposition = $response->headers->get('Content-Disposition');
            $this->assertStringStartsWith('attachment;', $disposition);
            $this->assertStringNotContainsString("\r", $disposition);
            $this->assertStringNotContainsString("\n", $disposition);
            $this->assertStringNotContainsString('../', $disposition);
            $this->assertStringNotContainsString($evidence->path, $response->getContent());
            $this->assertDatabaseHas('verification_evidence_access_logs', ['actor_user_id' => $admin->id, 'verification_request_id' => $request->id, 'verification_evidence_id' => $evidence->id, 'action' => 'download_initiated']);
        }
        $this->assertDatabaseCount('verification_evidence_access_logs', 3);
    }

    public function test_unauthenticated_owner_and_unrelated_participant_cannot_use_admin_endpoint(): void
    {
        $request = $this->requestFor(); $evidence = $this->document($request); $url = $this->endpoint($request, $evidence);
        $this->getJson($url)->assertUnauthorized();
        $this->actingAs($request->user)->getJson($url)->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson($url)->assertForbidden();
        $this->assertDatabaseCount('verification_evidence_access_logs', 0);
    }

    public function test_mismatched_request_evidence_and_corrupt_storage_never_record_success(): void
    {
        $request = $this->requestFor(); $evidence = $this->document($request);
        $this->actingAs($this->admin())->getJson($this->endpoint($this->requestFor(), $evidence))->assertNotFound();
        Storage::disk(VerificationEvidenceStorage::DISK)->put($evidence->path, 'corrupt ciphertext');
        $response = $this->getJson($this->endpoint($request, $evidence))->assertUnprocessable();
        $this->assertStringNotContainsString($evidence->path, $response->getContent());
        $evidence->update(['path' => '../secret']);
        $this->getJson($this->endpoint($request, $evidence))->assertUnprocessable();
        $this->assertDatabaseCount('verification_evidence_access_logs', 0);
    }

    public function test_failed_audit_persistence_does_not_release_document(): void
    {
        $request = $this->requestFor(); $evidence = $this->document($request);
        VerificationEvidenceAccessLog::creating(fn () => throw new \RuntimeException('Audit unavailable'));
        try {
            $response = $this->actingAs($this->admin())->getJson($this->endpoint($request, $evidence))->assertStatus(500);
            $this->assertStringNotContainsString('private document bytes', $response->getContent());
        } finally { VerificationEvidenceAccessLog::flushEventListeners(); }
        $this->assertDatabaseCount('verification_evidence_access_logs', 0);
    }

    public function test_public_feedback_is_persisted_and_only_visible_to_owner_without_internal_notes(): void
    {
        foreach (['request-information', 'reject'] as $action) {
            $request = $this->requestFor(); $admin = $this->admin();
            $this->actingAs($admin)->postJson("/api/admin/verification-requests/{$request->id}/{$action}", [
                'participant_message' => 'Please provide a legible document.', 'admin_notes' => 'INTERNAL ONLY', 'rejection_reason' => 'PRIVATE LEGACY REASON',
            ])->assertOk()->assertJsonPath('data.participant_message', 'Please provide a legible document.');
            $response = $this->actingAs($request->user)->getJson("/api/me/verification-requests/{$request->id}")->assertOk()
                ->assertJsonPath('data.participant_message', 'Please provide a legible document.')
                ->assertJsonMissingPath('data.admin_notes')->assertJsonMissingPath('data.rejection_reason');
            $this->assertStringNotContainsString('INTERNAL ONLY', $response->getContent());
            $this->actingAs(User::factory()->create())->getJson("/api/me/verification-requests/{$request->id}")->assertForbidden();
        }
    }

    public function test_historical_rejection_notes_are_never_implicitly_public(): void
    {
        $request = $this->requestFor(null, 'rejected'); $request->update(['rejection_reason' => 'PRIVATE', 'admin_notes' => 'PRIVATE']);
        $this->actingAs($request->user)->getJson('/api/me/verification-requests/latest')->assertOk()
            ->assertJsonPath('data.participant_message', null)->assertJsonMissingPath('data.rejection_reason')->assertJsonMissingPath('data.admin_notes');
    }

    public function test_approval_preserves_higher_tier_and_zero_evidence_behavior_and_cancelled_is_final(): void
    {
        $admin = $this->admin();
        foreach ([0, 2] as $tier) {
            $user = User::factory()->create(['verification_tier' => $tier]); $request = $this->requestFor($user);
            $this->actingAs($admin)->postJson("/api/admin/verification-requests/{$request->id}/approve")->assertOk();
            $this->assertSame(max(1, $tier), $user->fresh()->verification_tier->value);
        }
        $this->assertDatabaseCount('verification_evidence', 0);
        $request = $this->requestFor(null, 'cancelled');
        foreach (['approve', 'reject', 'request-information'] as $action) {
            $this->postJson("/api/admin/verification-requests/{$request->id}/{$action}", ['notes' => 'test'])->assertUnprocessable();
        }
        $this->assertSame('cancelled', $request->fresh()->status->value);
    }

    public function test_browser_email_verification_uses_fixed_destination_and_preserves_json(): void
    {
        $user = User::factory()->unverified()->create(); $this->actingAs($user);
        $params = ['id' => $user->id, 'hash' => sha1($user->email), 'redirect' => 'https://attacker.invalid/'];
        // Even a legitimately signed redirect parameter is ignored.
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), $params);
        $this->withHeader('Accept', 'text/html')->get($url)->assertRedirect('http://localhost:8443/app/profile?tab=verification');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->getJson($url)->assertOk()->assertJsonPath('message', 'Email verified.');
        $this->getJson($url.'&redirect=https://other.invalid/')->assertForbidden();
    }
}
