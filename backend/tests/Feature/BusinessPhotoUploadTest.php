<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessPhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private int $businessId;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders([
            'Origin' => 'http://localhost:8443',
            'Accept' => 'application/json',
        ]);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();

        $res = $this->postJson('/api/me/businesses', [
            'name' => 'TechVenture Ltd',
            'description' => 'A technology company',
            'industry' => 'SaaS',
            'business_stage' => 'Seed',
            'location' => 'Dhaka',
        ])->assertCreated();

        $this->businessId = $res->json('data.id');
    }

    public function test_founder_can_upload_business_logo(): void
    {
        $file = UploadedFile::fake()->create('logo.jpg', 500, 'image/jpeg');

        $response = $this->postJson("/api/me/businesses/{$this->businessId}/logo", [
            'logo' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.logo_url', fn ($val) => str_starts_with($val, '/storage/business-logos/'))
            ->assertJsonPath('data.business.logo_url', fn ($val) => str_starts_with($val, '/storage/business-logos/'));

        $url = $response->json('data.logo_url');
        $storagePath = str_replace('/storage/', '', $url);
        Storage::disk('public')->assertExists($storagePath);

        $business = Business::findOrFail($this->businessId);
        $this->assertSame($url, $business->logo_url);
    }

    public function test_founder_can_upload_business_cover_photo(): void
    {
        $file = UploadedFile::fake()->create('cover.jpg', 1200, 'image/jpeg');

        $response = $this->postJson("/api/me/businesses/{$this->businessId}/cover-photo", [
            'cover_photo' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cover_photo_url', fn ($val) => str_starts_with($val, '/storage/business-covers/'))
            ->assertJsonPath('data.business.cover_photo_url', fn ($val) => str_starts_with($val, '/storage/business-covers/'));

        $url = $response->json('data.cover_photo_url');
        $storagePath = str_replace('/storage/', '', $url);
        Storage::disk('public')->assertExists($storagePath);

        $business = Business::findOrFail($this->businessId);
        $this->assertSame($url, $business->cover_photo_url);
    }

    public function test_non_owner_cannot_upload_business_photo(): void
    {
        $otherUser = User::factory()->unverified()->create();
        $this->app['auth']->forgetGuards();
        $this->actingAs($otherUser, 'web')->withCredentials()->withHeaders([
            'Origin' => 'http://localhost:8443',
            'Accept' => 'application/json',
        ]);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();

        $file = UploadedFile::fake()->create('logo.jpg', 500, 'image/jpeg');

        $this->postJson("/api/me/businesses/{$this->businessId}/logo", [
            'logo' => $file,
        ])->assertNotFound();
    }

    public function test_invalid_image_is_rejected(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $this->postJson("/api/me/businesses/{$this->businessId}/logo", [
            'logo' => $file,
        ])->assertUnprocessable();
    }
}
