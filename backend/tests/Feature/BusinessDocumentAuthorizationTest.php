<?php

namespace Tests\Feature;

use App\Models\BusinessDocument;
use App\Models\User;
use App\Services\BusinessDocumentStorage;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class BusinessDocumentAuthorizationTest extends TestCase
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

    public function test_cross_owner_admin_and_nested_document_isolation(): void
    {
        $id = $this->upload();
        $otherBusiness = $this->postJson('/api/me/businesses', ['name' => 'Another'])->assertCreated()->json('data.id');
        $this->get("/api/me/businesses/$otherBusiness/documents/$id/download")->assertNotFound();
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->getJson($this->endpoint)->assertForbidden();
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertForbidden();
        $this->get("$this->endpoint/$id/download")->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->getJson($this->endpoint)->assertNotFound();
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertNotFound();
        $this->get("$this->endpoint/$id/download")->assertNotFound();
        $this->assertDatabaseCount('document_access_logs', 0);
        $this->assertDatabaseCount('business_documents', 1);
    }

    public function test_anonymous_access_and_csrf_are_rejected(): void
    {
        $id = $this->upload();
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertStatus(419);
        config(['sanctum.middleware.validate_csrf_token' => ValidateCsrfToken::class]);
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->getJson($this->endpoint)->assertUnauthorized();
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf()])->assertUnauthorized();
        $this->get("$this->endpoint/$id/download")->assertUnauthorized();
        $this->assertDatabaseCount('document_access_logs', 0);
    }

    public static function protectedFields(): array
    {
        return array_map(fn ($name) => [$name], ['disk', 'path', 'owner_id', 'user_id', 'business_id', 'actor_user_id', 'disclosure_stage', 'verification_status', 'deal_id']);
    }

    #[DataProvider('protectedFields')]
    public function test_protected_fields_are_rejected(string $field): void
    {
        $this->post($this->endpoint, ['kind' => 'business_plan', 'file' => $this->pdf(), $field => 'invalid'])
            ->assertUnprocessable()->assertJsonValidationErrors($field, 'error.details');
        $this->assertDatabaseCount('business_documents', 0);
        $this->assertSame([], Storage::disk(BusinessDocumentStorage::DISK)->allFiles());
    }

    public function test_storage_is_outside_served_roots_and_no_public_route_exists(): void
    {
        $config = require base_path('config/filesystems.php');
        $root = str_replace('\\', '/', $config['disks']['business_documents']['root']);
        foreach (['local', 'public'] as $disk) {
            $this->assertFalse(str_starts_with($root.'/', str_replace('\\', '/', $config['disks'][$disk]['root']).'/'));
        }
        $this->assertFalse($config['disks']['business_documents']['serve']);
        $this->assertSame('private', $config['disks']['business_documents']['visibility']);
        $this->assertFalse(Route::has('storage.business_documents'));
        $id = $this->upload();
        $record = BusinessDocument::findOrFail($id);
        foreach (["/storage/{$record->path}", "/business-documents/{$record->path}", "/storage/business-documents/{$record->path}"] as $url) {
            $response = $this->get($url);
            $this->assertContains($response->getStatusCode(), [403, 404]);
            $this->assertStringNotContainsString('%PDF', $response->getContent());
        }
        // Even an internally signed local-disk URL cannot reach the separate document root.
        $signed = URL::temporarySignedRoute(
            'storage.local', now()->addMinute(), ['path' => $record->path], absolute: false,
        );
        $this->get($signed)->assertNotFound();
        $this->assertFalse(Storage::disk('local')->exists($record->path));
        $this->assertFalse(Storage::disk('public')->exists($record->path));
        $this->assertDatabaseCount('document_access_logs', 0);
    }

    public function test_real_sanctum_session_can_upload_and_download(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $id = $this->upload();
        $this->get("$this->endpoint/$id/download")->assertOk();
        $this->getJson($this->endpoint)->assertOk();
    }
}
