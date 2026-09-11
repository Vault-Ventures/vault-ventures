<?php

namespace Tests\Feature;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\User;
use App\Models\VerificationEvidence;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VerificationEvidenceUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(VerificationEvidenceStorage::DISK);
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_unauthenticated_upload_is_denied(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $file = UploadedFile::fake()->create('id_card.pdf', 500, 'application/pdf');

        $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ])->assertUnauthorized();

        $this->getJson("/api/me/verification-requests/{$request->id}/evidence")
            ->assertUnauthorized();
    }

    public function test_cross_user_upload_is_denied(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $requestA = VerificationRequest::create([
            'user_id' => $userA->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($userB, 'web');
        $file = UploadedFile::fake()->create('id_card.pdf', 500, 'application/pdf');

        $this->postJson("/api/me/verification-requests/{$requestA->id}/evidence", [
            'file' => $file,
        ])->assertForbidden();

        $this->getJson("/api/me/verification-requests/{$requestA->id}/evidence")
            ->assertForbidden();
    }

    public function test_valid_pdf_upload(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $fileContent = '%PDF-1.4 passport document content';
        $file = UploadedFile::fake()->createWithContent('passport.pdf', $fileContent);

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification evidence uploaded successfully.')
            ->assertJsonPath('data.verification_request_id', $request->id)
            ->assertJsonPath('data.original_filename', 'passport.pdf')
            ->assertJsonPath('data.mime_type', 'application/pdf')
            ->assertJsonPath('data.file_size_bytes', strlen($fileContent))
            ->assertJsonMissingPath('data.path')
            ->assertJsonMissingPath('data.disk')
            ->assertJsonMissingPath('data.content');

        $this->assertDatabaseCount('verification_evidence', 1);
        $evidence = VerificationEvidence::firstOrFail();
        $this->assertSame($request->id, $evidence->verification_request_id);
        $this->assertSame($user->id, $evidence->uploaded_by_user_id);
        $this->assertSame('passport.pdf', $evidence->original_filename);
    }

    public function test_valid_jpeg_upload(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $file = UploadedFile::fake()->create('drivers_license.jpeg', 200, 'image/jpeg');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.original_filename', 'drivers_license.jpeg')
            ->assertJsonPath('data.mime_type', 'image/jpeg');

        $this->assertDatabaseCount('verification_evidence', 1);
    }

    public function test_valid_png_upload(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $file = UploadedFile::fake()->create('national_id.png', 200, 'image/png');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.original_filename', 'national_id.png')
            ->assertJsonPath('data.mime_type', 'image/png');

        $this->assertDatabaseCount('verification_evidence', 1);
    }

    public function test_invalid_file_type_rejected(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $invalidFile = UploadedFile::fake()->create('malicious.sh', 10, 'application/x-sh');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $invalidFile,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.file.0', 'The file must be a PDF, JPEG, or PNG document.');

        $this->assertDatabaseCount('verification_evidence', 0);
    }

    public function test_file_exceeding_5_mib_rejected(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $largeFile = UploadedFile::fake()->create('large.pdf', 6 * 1024, 'application/pdf');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $largeFile,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.file.0', 'The file size must not exceed 5 MiB.');

        $this->assertDatabaseCount('verification_evidence', 0);
    }

    public function test_sixth_file_rejected(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');

        // Create 5 existing files
        for ($i = 1; $i <= 5; $i++) {
            VerificationEvidence::create([
                'verification_request_id' => $request->id,
                'uploaded_by_user_id' => $user->id,
                'disk' => VerificationEvidenceStorage::DISK,
                'path' => "{$request->id}/00000000-0000-0000-0000-00000000000{$i}.enc",
                'original_filename' => "doc_{$i}.pdf",
                'mime_type' => 'application/pdf',
                'file_size_bytes' => 1024,
            ]);
        }

        $file = UploadedFile::fake()->create('doc_6.pdf', 100, 'application/pdf');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.file.0', 'A maximum of 5 evidence files may be uploaded per verification request.');

        $this->assertDatabaseCount('verification_evidence', 5);
    }

    public function test_private_and_encrypted_storage_confirmed(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $rawSecretContent = '%PDF-1.4 Sensitive Passport Document Raw Bytes';
        $file = UploadedFile::fake()->createWithContent('secret_passport.pdf', $rawSecretContent);

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertCreated();

        $evidence = VerificationEvidence::firstOrFail();
        $storedRaw = Storage::disk(VerificationEvidenceStorage::DISK)->get($evidence->path);

        // Plaintext must not be present in raw disk storage
        $this->assertNotSame($rawSecretContent, $storedRaw);
        $this->assertStringNotContainsString('Sensitive Passport Document', $storedRaw);

        // Decrypted using application key must match original content
        $decrypted = Crypt::decryptString($storedRaw);
        $this->assertSame($rawSecretContent, $decrypted);
    }

    public function test_api_response_does_not_expose_file_contents_or_raw_paths(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $file = UploadedFile::fake()->createWithContent('proof.pdf', '%PDF-1.4 confidential data');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertCreated();
        $json = $response->json();

        $this->assertArrayHasKey('data', $json);
        $this->assertArrayNotHasKey('path', $json['data']);
        $this->assertArrayNotHasKey('disk', $json['data']);
        $this->assertArrayNotHasKey('content', $json['data']);
        $this->assertArrayNotHasKey('file', $json['data']);
        $this->assertStringNotContainsString('confidential data', $response->getContent());
    }

    public function test_evidence_cannot_be_uploaded_to_tier_2_request(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier2,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');
        $file = UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Evidence upload is only permitted for Tier 1 identity verification requests.');

        $this->assertDatabaseCount('verification_evidence', 0);
    }

    public function test_evidence_cannot_be_uploaded_to_finalized_request(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Approved,
            'submitted_at' => now()->subDays(2),
            'reviewed_at' => now()->subDay(),
        ]);

        $this->actingAs($user, 'web');
        $file = UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf');

        $response = $this->postJson("/api/me/verification-requests/{$request->id}/evidence", [
            'file' => $file,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.verification_request.0', 'Evidence cannot be uploaded to a closed or finalized verification request.');

        $this->assertDatabaseCount('verification_evidence', 0);
    }

    public function test_user_can_list_metadata_of_uploaded_evidence(): void
    {
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user, 'web');

        VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => VerificationEvidenceStorage::DISK,
            'path' => "{$request->id}/00000000-0000-0000-0000-000000000001.enc",
            'original_filename' => 'passport.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 2048,
        ]);

        $response = $this->getJson("/api/me/verification-requests/{$request->id}/evidence");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.original_filename', 'passport.pdf')
            ->assertJsonPath('data.0.mime_type', 'application/pdf')
            ->assertJsonPath('data.0.file_size_bytes', 2048)
            ->assertJsonMissingPath('data.0.path')
            ->assertJsonMissingPath('data.0.disk')
            ->assertJsonMissingPath('data.0.content');
    }
}
