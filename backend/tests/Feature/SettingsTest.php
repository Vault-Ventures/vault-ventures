<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    // ── Password change — authentication ─────────────────────────────────────

    public function test_unauthenticated_cannot_change_password(): void
    {
        $this->putJson('/api/me/password', [
            'current_password'          => 'anything',
            'new_password'              => 'newpass123',
            'new_password_confirmation' => 'newpass123',
        ])->assertStatus(401);
    }

    // ── Password change — validation ──────────────────────────────────────────

    public function test_change_password_requires_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)
            ->putJson('/api/me/password', [
                'new_password'              => 'newpass123',
                'new_password_confirmation' => 'newpass123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['details' => ['current_password']]]);
    }

    public function test_change_password_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)
            ->putJson('/api/me/password', [
                'current_password'          => 'wrong-password',
                'new_password'              => 'newpass123',
                'new_password_confirmation' => 'newpass123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['details' => ['current_password']]]);
    }

    public function test_change_password_requires_confirmation(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)
            ->putJson('/api/me/password', [
                'current_password'          => 'correct-password',
                'new_password'              => 'newpass123',
                'new_password_confirmation' => 'differentpass',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['details' => ['new_password']]]);
    }

    public function test_change_password_enforces_minimum_length(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)
            ->putJson('/api/me/password', [
                'current_password'          => 'correct-password',
                'new_password'              => 'short',
                'new_password_confirmation' => 'short',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['details' => ['new_password']]]);
    }

    // ── Password change — success ─────────────────────────────────────────────

    public function test_change_password_succeeds_with_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)
            ->putJson('/api/me/password', [
                'current_password'          => 'correct-password',
                'new_password'              => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ])
            ->assertOk()
            ->assertJson(['success' => true]);

        // Verify new password is actually stored
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    public function test_old_password_no_longer_works_after_change(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        $this->actingAs($user)->putJson('/api/me/password', [
            'current_password'          => 'correct-password',
            'new_password'              => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ])->assertOk();

        $user->refresh();
        $this->assertFalse(Hash::check('correct-password', $user->password));
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    // ── Notification preferences — authentication ─────────────────────────────

    public function test_unauthenticated_cannot_get_notification_preferences(): void
    {
        $this->getJson('/api/me/notification-preferences')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_update_notification_preferences(): void
    {
        $this->patchJson('/api/me/notification-preferences', [
            'preferences' => ['new_matches' => false],
        ])->assertStatus(401);
    }

    // ── Notification preferences — defaults ───────────────────────────────────

    public function test_notification_preferences_return_defaults_for_new_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/me/notification-preferences')
            ->assertOk();

        $data = $response->json('data');
        $this->assertTrue($data['new_matches']);
        $this->assertTrue($data['interest_received']);
        $this->assertTrue($data['deal_room_updates']);
        $this->assertTrue($data['milestone_updates']);
    }

    // ── Notification preferences — persistence ────────────────────────────────

    public function test_notification_preferences_persist(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/me/notification-preferences', [
                'preferences' => ['new_matches' => false, 'milestone_updates' => false],
            ])
            ->assertOk()
            ->assertJsonPath('data.new_matches', false)
            ->assertJsonPath('data.milestone_updates', false)
            ->assertJsonPath('data.deal_room_updates', true);

        // Re-fetch to confirm persistence
        $this->actingAs($user)
            ->getJson('/api/me/notification-preferences')
            ->assertOk()
            ->assertJsonPath('data.new_matches', false)
            ->assertJsonPath('data.milestone_updates', false)
            ->assertJsonPath('data.deal_room_updates', true);
    }

    public function test_notification_preferences_partial_update_preserves_others(): void
    {
        $user = User::factory()->create();

        // First update: disable new_matches
        $this->actingAs($user)->patchJson('/api/me/notification-preferences', [
            'preferences' => ['new_matches' => false],
        ])->assertOk();

        // Second update: disable deal_room_updates
        $this->actingAs($user)->patchJson('/api/me/notification-preferences', [
            'preferences' => ['deal_room_updates' => false],
        ])->assertOk();

        // Both should be persisted
        $this->actingAs($user)
            ->getJson('/api/me/notification-preferences')
            ->assertOk()
            ->assertJsonPath('data.new_matches', false)
            ->assertJsonPath('data.deal_room_updates', false)
            ->assertJsonPath('data.interest_received', true); // unchanged
    }

    // ── Notification preferences — validation ─────────────────────────────────

    public function test_notification_preferences_reject_non_boolean_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/me/notification-preferences', [
                'preferences' => ['new_matches' => 'yes'],
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    // ── Notification preferences — authorization ──────────────────────────────

    public function test_notification_preferences_are_scoped_to_authenticated_user(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        // User A disables new_matches
        $this->actingAs($userA)->patchJson('/api/me/notification-preferences', [
            'preferences' => ['new_matches' => false],
        ])->assertOk();

        // User B's preferences remain at defaults
        $this->actingAs($userB)
            ->getJson('/api/me/notification-preferences')
            ->assertOk()
            ->assertJsonPath('data.new_matches', true);
    }
}
