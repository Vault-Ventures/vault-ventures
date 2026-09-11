<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessDocument;
use App\Models\DocumentAccessLog;
use App\Models\User;
use App\Services\BusinessDocumentStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BusinessDocumentTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private int $businessId;

    private string $endpoint;

    private const PDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(BusinessDocumentStorage::DISK);
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->businessId = $this->postJson('/api/me/businesses', ['name' => 'Example'])->assertCreated()->json('data.id');
        $this->endpoint = "/api/me/businesses/{$this->businessId}/documents";
    }

    private function pdf(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('plan.pdf', self::PDF);
    }

    private function upload(string $kind = 'business_plan'): int
    {
        return $this->post($this->endpoint, ['kind' => $kind, 'file' => $this->pdf()])->assertCreated()->json('data.id');
    }

    public static function kinds(): array
    {
        return [['business_plan'], ['pitch_deck']];
    }

    #[DataProvider('kinds')]
    public function test_upload_list_and_audited_download_with_encrypted_private_storage(string $kind): void
    {
        $id = $this->upload($kind);
        $record = BusinessDocument::findOrFail($id);
        $ciphertext = Storage::disk(BusinessDocumentStorage::DISK)->get($record->path);
        $this->assertNotSame(self::PDF, $ciphertext);
        $this->assertSame(self::PDF, Crypt::decryptString($ciphertext));
        $this->assertSame($this->businessId, $record->business->id);
        $this->getJson($this->endpoint)->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.kind', $kind)->assertJsonPath('data.0.original_name', 'plan.pdf')
            ->assertJsonPath('data.0.size_bytes', strlen(self::PDF))
            ->assertJsonMissingPath('data.0.disk')->assertJsonMissingPath('data.0.path')
            ->assertJsonMissingPath('data.0.owner_id')->assertJsonMissingPath('data.0.url');
        $this->assertDatabaseCount('document_access_logs', 0);
        $response = $this->get("$this->endpoint/$id/download")->assertOk()->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertSame(self::PDF, $response->getContent());
        $this->assertStringContainsString('attachment;', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertDatabaseHas('document_access_logs', [
            'business_document_id' => $id, 'actor_user_id' => $this->owner->id, 'action' => 'download_initiated',
        ]);
        $this->assertSame($this->owner->id, $record->accessLogs()->first()->actor->id);
        $this->get("$this->endpoint/$id/download")->assertOk();
        $this->assertDatabaseCount('document_access_logs', 2);
    }

    public function test_invalid_file_kind_content_extension_and_size_are_rejected(): void
    {
        // Use a real UploadedFile for MIME detection; Laravel's fake infers MIME from the filename.
        $textFile = UploadedFile::fake()->createWithContent('text.txt', 'Not a PDF');
        foreach ([
            ['kind' => 'financial_evidence', 'file' => $this->pdf()],
            ['kind' => 'identity', 'file' => $this->pdf()],
            ['kind' => 'business_plan', 'file' => new UploadedFile($textFile->getRealPath(), 'plan.pdf', null, null, true)],
            ['kind' => 'pitch_deck', 'file' => UploadedFile::fake()->createWithContent('deck.html', self::PDF)],
            ['kind' => 'pitch_deck', 'file' => UploadedFile::fake()->createWithContent('deck.pdf', self::PDF)->size(2049)],
            ['kind' => 'business_plan'],
        ] as $payload) {
            $this->post($this->endpoint, $payload)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        }
        $this->assertDatabaseCount('business_documents', 0);
        $this->assertSame([], Storage::disk(BusinessDocumentStorage::DISK)->allFiles());
    }

    public function test_size_boundary_and_count_limit(): void
    {
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()->size(2048)])->assertCreated();
        for ($i = 1; $i < 10; $i++) {
            $this->upload();
        }
        $this->post($this->endpoint, ['kind' => 'pitch_deck', 'file' => $this->pdf()])->assertUnprocessable()
            ->assertJsonValidationErrors('file', 'error.details');
        $this->assertDatabaseCount('business_documents', 10);
        $this->assertCount(10, Storage::disk(BusinessDocumentStorage::DISK)->allFiles());
    }

    public function test_partial_storage_failure_cleans_up_and_does_not_create_metadata(): void
    {
        config(['logging.default' => 'null']);
        $this->partialMock(BusinessDocumentStorage::class, function ($mock) {
            $mock->shouldReceive('put')->once()->andReturnUsing(function ($path, $file) {
                Storage::disk(BusinessDocumentStorage::DISK)->put($path, 'partial write');
                throw new \RuntimeException('Test-only storage failure');
            });
        });
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertStatus(500)
            ->assertJsonPath('error.code', 'HTTP_500');
        $this->assertDatabaseCount('business_documents', 0);
        $this->assertSame([], Storage::disk(BusinessDocumentStorage::DISK)->allFiles());
    }

    public function test_metadata_failure_cleans_up_the_written_file(): void
    {
        config(['logging.default' => 'null']);
        BusinessDocument::creating(fn () => throw new \RuntimeException('Test-only metadata failure'));
        try {
            $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertStatus(500);
        } finally {
            BusinessDocument::flushEventListeners();
        }
        $this->assertSame([], Storage::disk(BusinessDocumentStorage::DISK)->allFiles());
        $this->assertDatabaseCount('business_documents', 0);
    }

    public function test_audit_failure_prevents_download(): void
    {
        $id = $this->upload();
        config(['logging.default' => 'null']);
        DocumentAccessLog::creating(fn () => throw new \RuntimeException('Test-only audit failure'));
        try {
            $response = $this->get("$this->endpoint/$id/download")->assertStatus(500)->assertJsonPath('error.code', 'HTTP_500');
            $this->assertStringNotContainsString('%PDF', $response->getContent());
        } finally {
            DocumentAccessLog::flushEventListeners();
        }
        $this->assertDatabaseCount('document_access_logs', 0);
    }

    public function test_missing_or_tampered_files_are_not_downloaded(): void
    {
        $id = $this->upload();
        $record = BusinessDocument::findOrFail($id);
        Storage::disk(BusinessDocumentStorage::DISK)->delete($record->path);
        $this->get("$this->endpoint/$id/download")->assertNotFound();
        Storage::disk(BusinessDocumentStorage::DISK)->put($record->path, 'corrupt');
        config(['logging.default' => 'null']);
        $this->get("$this->endpoint/$id/download")->assertStatus(500);
        $this->assertDatabaseCount('document_access_logs', 0);
    }

    public function test_documents_do_not_change_submission_eligibility_or_status(): void
    {
        $this->upload();
        $this->postJson("/api/me/businesses/{$this->businessId}/submit")->assertUnprocessable();
        $this->assertSame('draft', Business::findOrFail($this->businessId)->status->value);
        $id = $this->postJson('/api/me/businesses', [
            'name' => 'No documents', 'description' => 'Idea', 'industry' => 'Technology',
            'business_stage' => 'Idea', 'location' => 'Dhaka',
        ])->assertCreated()->json('data.id');
        $timestamp = $this->postJson("/api/me/businesses/$id/submit")->assertOk()->json('data.submitted_at');
        $this->endpoint = "/api/me/businesses/$id/documents";
        $this->upload('pitch_deck');
        $this->getJson("/api/me/businesses/$id")->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.submitted_at', $timestamp);
        $this->postJson("/api/me/businesses/$id/submit")->assertOk()->assertJsonPath('data.submitted_at', $timestamp);
    }
}
