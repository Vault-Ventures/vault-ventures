<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ConnectionEstablishedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    // ── Authentication guard ──────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_notifications(): void
    {
        $this->getJson('/api/me/notifications')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_unread_count(): void
    {
        $this->getJson('/api/me/notifications/unread-count')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_mark_read(): void
    {
        $this->patchJson('/api/me/notifications/' . Str::uuid() . '/read')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_mark_all_read(): void
    {
        $this->postJson('/api/me/notifications/mark-all-read')->assertStatus(401);
    }

    // ── Empty state ───────────────────────────────────────────────────────────

    public function test_authenticated_user_gets_empty_notifications_by_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/me/notifications')
            ->assertOk()
            ->assertJson(['success' => true, 'data' => []]);
    }

    public function test_unread_count_is_zero_for_new_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/me/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);
    }

    // ── Real notification creation + retrieval ────────────────────────────────

    public function test_database_notification_appears_in_listing(): void
    {
        $user = User::factory()->create();

        // Insert a raw DB notification for isolation (no real notification class needed)
        \DB::table('notifications')->insert([
            'id'              => (string) Str::uuid(),
            'type'            => 'App\\Notifications\\ConnectionEstablishedNotification',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode([
                'type'          => 'connection_established',
                'title'         => 'New Connection',
                'body'          => 'Test notification body.',
                'business_id'   => 1,
                'business_name' => 'TestBiz',
                'other_party_id'   => 99,
                'other_party_name' => 'Other User',
                'role'          => 'investor',
            ]),
            'read_at'    => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/me/notifications')
            ->assertOk();

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('New Connection', $data[0]['title']);
        $this->assertTrue($data[0]['is_unread']);
        $this->assertNull($data[0]['read_at']);
    }

    // ── Unread count ──────────────────────────────────────────────────────────

    public function test_unread_count_reflects_db_state(): void
    {
        $user = User::factory()->create();

        $makeNotif = fn (bool $read) => \DB::table('notifications')->insert([
            'id'              => (string) Str::uuid(),
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
            'read_at'         => $read ? now() : null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $makeNotif(false); // unread
        $makeNotif(false); // unread
        $makeNotif(true);  // read

        $this->actingAs($user)
            ->getJson('/api/me/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 2);
    }

    // ── User isolation ────────────────────────────────────────────────────────

    public function test_notifications_are_scoped_to_authenticated_user(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        \DB::table('notifications')->insert([
            'id'              => (string) Str::uuid(),
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $userB->id, // belongs to B
            'data'            => json_encode(['type' => 'test', 'title' => 'B notif', 'body' => 'For B']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->actingAs($userA)
            ->getJson('/api/me/notifications')
            ->assertOk()
            ->assertJson(['data' => []]);
    }

    // ── Mark single as read ───────────────────────────────────────────────────

    public function test_mark_single_notification_as_read(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        \DB::table('notifications')->insert([
            'id'              => $id,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->actingAs($user)
            ->patchJson("/api/me/notifications/{$id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_unread', false);

        $this->assertNotNull(\DB::table('notifications')->where('id', $id)->value('read_at'));
    }

    public function test_mark_read_cross_user_returns_not_found(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $id = (string) Str::uuid();

        \DB::table('notifications')->insert([
            'id'              => $id,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $userB->id, // belongs to B
            'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // User A tries to mark User B's notification — should get 404
        $this->actingAs($userA)
            ->patchJson("/api/me/notifications/{$id}/read")
            ->assertStatus(404);
    }

    // ── Mark all as read ──────────────────────────────────────────────────────

    public function test_mark_all_read_sets_read_at_on_all_unread(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 3) as $_) {
            \DB::table('notifications')->insert([
                'id'              => (string) Str::uuid(),
                'type'            => 'TestType',
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id'   => $user->id,
                'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
                'read_at'         => null,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->actingAs($user)
            ->postJson('/api/me/notifications/mark-all-read')
            ->assertOk();

        $unreadCount = \DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $this->assertEquals(0, $unreadCount);
    }

    public function test_mark_all_read_does_not_affect_other_users(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $bId = (string) Str::uuid();

        \DB::table('notifications')->insert([
            'id'              => $bId,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $userB->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->actingAs($userA)->postJson('/api/me/notifications/mark-all-read')->assertOk();

        // User B's notification should remain unread
        $this->assertNull(\DB::table('notifications')->where('id', $bId)->value('read_at'));
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    public function test_read_notification_persists_after_re_fetch(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        \DB::table('notifications')->insert([
            'id'              => $id,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'T', 'body' => 'B']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->actingAs($user)->patchJson("/api/me/notifications/{$id}/read")->assertOk();

        // Re-fetch and confirm is_unread = false
        $response = $this->actingAs($user)->getJson('/api/me/notifications')->assertOk();
        $item = collect($response->json('data'))->firstWhere('id', $id);
        $this->assertNotNull($item);
        $this->assertFalse($item['is_unread']);
    }

    // ── Notification ordering ─────────────────────────────────────────────────

    public function test_notifications_are_ordered_newest_first(): void
    {
        $user = User::factory()->create();

        $old = (string) Str::uuid();
        $new = (string) Str::uuid();

        \DB::table('notifications')->insert([
            'id'              => $old,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'Old', 'body' => 'old']),
            'read_at'         => null,
            'created_at'      => now()->subMinutes(5),
            'updated_at'      => now()->subMinutes(5),
        ]);

        \DB::table('notifications')->insert([
            'id'              => $new,
            'type'            => 'TestType',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'data'            => json_encode(['type' => 'test', 'title' => 'New', 'body' => 'new']),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/me/notifications')->assertOk();
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertEquals($new, $ids[0]);
        $this->assertEquals($old, $ids[1]);
    }
}
