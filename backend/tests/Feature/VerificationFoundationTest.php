<?php

namespace Tests\Feature;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\User;
use App\Models\VerificationAuditLog;
use App\Models\VerificationEvidence;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;

class VerificationFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_default_verification_tier_is_tier_0(): void
    {
        $user = User::factory()->create();

        $this->assertSame(VerificationTier::Tier0, $user->verification_tier);
        $this->assertFalse($user->isIdentityVerified());
        $this->assertFalse($user->isTrackRecordVerified());
        $this->assertFalse($user->hasVerifiedPhone());
        $this->assertFalse($user->hasTier0Verification());

        $user->email_verified_at = now();
        $user->phone_verified_at = now();
        $user->save();

        $this->assertTrue($user->hasTier0Verification());
    }

    public function test_verification_tier_enum_semantics(): void
    {
        $this->assertSame(0, VerificationTier::Tier0->value);
        $this->assertSame(1, VerificationTier::Tier1->value);
        $this->assertSame(2, VerificationTier::Tier2->value);

        $this->assertSame('Email & Phone Verified', VerificationTier::Tier0->label());
        $this->assertSame('Identity Verified', VerificationTier::Tier1->label());
        $this->assertSame('Track-Record Verified', VerificationTier::Tier2->label());

        $this->assertStringContainsString('Email and phone', VerificationTier::Tier0->description());
        $this->assertStringContainsString('Identity', VerificationTier::Tier1->description());
        $this->assertStringContainsString('Track-Record', VerificationTier::Tier2->description());
    }

    public function test_user_tier_progression_helpers(): void
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);

        $this->assertTrue($user->isIdentityVerified());
        $this->assertFalse($user->isTrackRecordVerified());

        $user->verification_tier = VerificationTier::Tier2;
        $user->save();

        $this->assertTrue($user->isIdentityVerified());
        $this->assertTrue($user->isTrackRecordVerified());
    }

    public function test_verification_request_model_and_relations(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'assigned_admin_id' => $admin->id,
            'submitted_at' => now(),
        ]);

        $this->assertSame($user->id, $request->user->id);
        $this->assertSame($admin->id, $request->assignedAdmin->id);
        $this->assertSame(VerificationTier::Tier1, $request->requested_tier);
        $this->assertSame(VerificationRequestStatus::Pending, $request->status);

        // Verification Evidence relation
        $evidence = VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => 'verification_evidence',
            'path' => $request->id.'/00000000-0000-0000-0000-000000000001.enc',
            'original_filename' => 'passport.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 1024,
        ]);

        $this->assertSame(1, $request->evidence()->count());
        $this->assertSame($request->id, $evidence->verificationRequest->id);
        $this->assertSame($user->id, $evidence->uploadedBy->id);

        // Verification Audit Log relation
        $log = VerificationAuditLog::create([
            'verification_request_id' => $request->id,
            'actor_user_id' => $admin->id,
            'action' => 'review_started',
            'previous_status' => VerificationRequestStatus::Pending->value,
            'new_status' => VerificationRequestStatus::UnderReview->value,
            'notes' => 'Review started by admin.',
            'occurred_at' => now(),
        ]);

        $this->assertSame(1, $request->auditLogs()->count());
        $this->assertSame($request->id, $log->verificationRequest->id);
        $this->assertSame($admin->id, $log->actor->id);
    }

    public function test_foreign_key_deletes_are_restricted(): void
    {
        $user = User::factory()->create();

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        // Attempting to delete the user while a verification request exists should be restricted
        $this->expectException(QueryException::class);
        $user->delete();
    }

    public function test_evidence_storage_service_stores_and_reads_encrypted_bytes(): void
    {
        Storage::fake(VerificationEvidenceStorage::DISK);
        $storage = new VerificationEvidenceStorage;

        $fileContent = '%PDF-1.4 test evidence document bytes';
        $file = UploadedFile::fake()->createWithContent('id_card.pdf', $fileContent);

        $requestId = 42;
        $path = $storage->newPath($requestId);

        $this->assertMatchesRegularExpression('/^42\/[0-9a-f-]{36}\.enc$/', $path);

        $storage->put($path, $file);

        // Verify stored file on fake disk is NOT plaintext
        $rawBytes = Storage::disk(VerificationEvidenceStorage::DISK)->get($path);
        $this->assertNotEquals($fileContent, $rawBytes);

        // Create evidence model instance
        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $evidence = VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => VerificationEvidenceStorage::DISK,
            'path' => $request->id.'/00000000-0000-0000-0000-000000000002.enc',
            'original_filename' => 'id_card.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => strlen($fileContent),
        ]);

        $storage->put($evidence->path, $file);

        $decrypted = $storage->read($evidence);
        $this->assertSame($fileContent, $decrypted);

        // Cleanup
        $storage->cleanup($evidence->path);
        Storage::disk(VerificationEvidenceStorage::DISK)->assertMissing($evidence->path);
    }

    public function test_evidence_storage_validates_mime_types_and_size_limits(): void
    {
        $storage = new VerificationEvidenceStorage;

        // Valid PDF, JPEG, PNG
        $validPdf = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');
        $validJpg = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg');
        $validPng = UploadedFile::fake()->create('photo.png', 100, 'image/png');

        $storage->validateFile($validPdf);
        $storage->validateFile($validJpg);
        $storage->validateFile($validPng);

        // Invalid file type (e.g. text/plain or exe)
        $invalidFile = UploadedFile::fake()->create('script.sh', 10, 'application/x-sh');
        $this->expectException(ValidationException::class);
        $storage->validateFile($invalidFile);
    }

    public function test_evidence_storage_rejects_files_exceeding_5_mib(): void
    {
        $storage = new VerificationEvidenceStorage;

        // 6 MiB file
        $tooLarge = UploadedFile::fake()->create('large.pdf', 6 * 1024, 'application/pdf');

        $this->expectException(ValidationException::class);
        $storage->validateFile($tooLarge);
    }

    public function test_evidence_storage_read_rejects_tampered_paths(): void
    {
        Storage::fake(VerificationEvidenceStorage::DISK);
        $storage = new VerificationEvidenceStorage;

        $user = User::factory()->create();
        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $evidence = VerificationEvidence::create([
            'verification_request_id' => $request->id,
            'uploaded_by_user_id' => $user->id,
            'disk' => VerificationEvidenceStorage::DISK,
            'path' => '../other_folder/leak.txt',
            'original_filename' => 'id_card.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 100,
        ]);

        $this->expectException(RuntimeException::class);
        $storage->read($evidence);
    }
}
