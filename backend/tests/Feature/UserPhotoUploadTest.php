<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserPhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        Storage::fake('public');
    }

    public function test_user_can_upload_avatar(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('avatar.jpg', 1500, 'image/jpeg');

        $res = $this->actingAs($user)->postJson('/api/me/avatar', [
            'avatar' => $file,
        ]);

        $res->assertOk();
        $res->assertJsonStructure(['success', 'message', 'data' => ['avatar_url']]);
        $avatarUrl = $res->json('data.avatar_url');
        $this->assertStringStartsWith('/storage/avatars/', $avatarUrl);

        // Verify database persistence
        $fresh = $user->fresh();
        $this->assertSame($avatarUrl, $fresh->avatar_url);

        // Verify storage file existence
        $path = str_replace('/storage/', '', $avatarUrl);
        Storage::disk('public')->assertExists($path);
    }

    public function test_user_can_upload_cover_photo(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('cover.png', 2500, 'image/png');

        $res = $this->actingAs($user)->postJson('/api/me/cover-photo', [
            'cover_photo' => $file,
        ]);

        $res->assertOk();
        $res->assertJsonStructure(['success', 'message', 'data' => ['cover_photo_url']]);
        $coverUrl = $res->json('data.cover_photo_url');
        $this->assertStringStartsWith('/storage/covers/', $coverUrl);

        // Verify database persistence
        $fresh = $user->fresh();
        $this->assertSame($coverUrl, $fresh->cover_photo_url);

        // Verify storage file existence
        $path = str_replace('/storage/', '', $coverUrl);
        Storage::disk('public')->assertExists($path);
    }

    public function test_avatar_upload_rejects_invalid_file_type(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');

        $res = $this->actingAs($user)->postJson('/api/me/avatar', [
            'avatar' => $file,
        ]);

        $res->assertStatus(422);
        $this->assertNull($user->fresh()->avatar_url);
    }

    public function test_photo_upload_rejects_oversized_file(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('huge.jpg', 6000, 'image/jpeg'); // 6MB > 5MB limit

        $res = $this->actingAs($user)->postJson('/api/me/avatar', [
            'avatar' => $file,
        ]);

        $res->assertStatus(422);
    }
}
