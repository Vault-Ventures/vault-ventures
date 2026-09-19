<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'name' => 'Admin Controller',
            'email' => 'admin@vaultventures.test',
        ]);
        AdminAccess::forceCreate(['user_id' => $admin->id]);

        return $admin;
    }

    public function test_admin_can_list_users_with_pagination(): void
    {
        $admin = $this->createAdmin();
        User::factory()->count(5)->create();

        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/admin/users?per_page=3');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'users' => [
                        '*' => [
                            'id',
                            'name',
                            'email',
                            'verification_tier',
                            'is_suspended',
                            'roles',
                            'is_admin',
                            'created_at',
                        ],
                    ],
                    'pagination' => [
                        'current_page',
                        'last_page',
                        'per_page',
                        'total',
                    ],
                ],
            ]);

        $this->assertCount(3, $response->json('data.users'));
        $this->assertGreaterThanOrEqual(6, $response->json('data.pagination.total'));
    }

    public function test_admin_can_search_users_by_name_and_email(): void
    {
        $admin = $this->createAdmin();
        $target1 = User::factory()->create(['name' => 'Rahim Chowdhury', 'email' => 'rahim@example.com']);
        $target2 = User::factory()->create(['name' => 'Karim Ahmed', 'email' => 'special_karim@vault.io']);
        $other = User::factory()->create(['name' => 'Zubair Khan', 'email' => 'zubair@other.com']);

        $this->actingAs($admin, 'web');

        // Search by name
        $res1 = $this->getJson('/api/admin/users?search=Rahim');
        $res1->assertOk();
        $users1 = collect($res1->json('data.users'))->pluck('id')->all();
        $this->assertContains($target1->id, $users1);
        $this->assertNotContains($other->id, $users1);

        // Search by email fragment
        $res2 = $this->getJson('/api/admin/users?search=special_karim');
        $res2->assertOk();
        $users2 = collect($res2->json('data.users'))->pluck('id')->all();
        $this->assertContains($target2->id, $users2);
        $this->assertNotContains($target1->id, $users2);
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = $this->createAdmin();
        $founder = User::factory()->create(['name' => 'Founder Alpha']);
        UserRole::forceCreate(['user_id' => $founder->id, 'role' => ParticipantRole::Founder->value]);

        $investor = User::factory()->create(['name' => 'Investor Beta']);
        UserRole::forceCreate(['user_id' => $investor->id, 'role' => ParticipantRole::Investor->value]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/admin/users?role=founder');
        $response->assertOk();
        $ids = collect($response->json('data.users'))->pluck('id')->all();
        $this->assertContains($founder->id, $ids);
        $this->assertNotContains($investor->id, $ids);
    }

    public function test_admin_can_filter_users_by_verification_tier(): void
    {
        $admin = $this->createAdmin();
        $tier0User = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);
        $tier2User = User::factory()->create(['verification_tier' => VerificationTier::Tier2]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/admin/users?verification_tier=2');
        $response->assertOk();
        $ids = collect($response->json('data.users'))->pluck('id')->all();
        $this->assertContains($tier2User->id, $ids);
        $this->assertNotContains($tier0User->id, $ids);
    }

    public function test_admin_can_filter_users_by_account_status(): void
    {
        $admin = $this->createAdmin();
        $activeUser = User::factory()->create(['suspended_at' => null]);
        $suspendedUser = User::factory()->create([
            'suspended_at' => now(),
            'suspension_reason' => 'Fraudulent activity detected',
            'suspended_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin, 'web');

        // Filter active
        $resActive = $this->getJson('/api/admin/users?status=active');
        $resActive->assertOk();
        $activeIds = collect($resActive->json('data.users'))->pluck('id')->all();
        $this->assertContains($activeUser->id, $activeIds);
        $this->assertNotContains($suspendedUser->id, $activeIds);

        // Filter suspended
        $resSuspended = $this->getJson('/api/admin/users?status=suspended');
        $resSuspended->assertOk();
        $suspendedIds = collect($resSuspended->json('data.users'))->pluck('id')->all();
        $this->assertContains($suspendedUser->id, $suspendedIds);
        $this->assertNotContains($activeUser->id, $suspendedIds);
    }

    public function test_admin_can_view_user_detail(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'name' => 'Detailed User',
            'email' => 'detailed@example.com',
            'headline' => 'Tech Entrepreneur',
            'bio' => 'Experienced founder in fintech.',
            'location' => 'Dhaka, Bangladesh',
        ]);
        UserRole::forceCreate(['user_id' => $user->id, 'role' => ParticipantRole::Founder->value]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson("/api/admin/users/{$user->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Detailed User')
            ->assertJsonPath('data.headline', 'Tech Entrepreneur')
            ->assertJsonPath('data.bio', 'Experienced founder in fintech.')
            ->assertJsonPath('data.location', 'Dhaka, Bangladesh')
            ->assertJsonPath('data.is_suspended', false);

        $this->assertArrayNotHasKey('password', $response->json('data'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data'));
    }

    public function test_admin_can_suspend_user(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create(['name' => 'Bad Actor']);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/users/{$user->id}/suspend", [
            'reason' => 'Violation of platform terms of service.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_suspended', true)
            ->assertJsonPath('data.suspension_reason', 'Violation of platform terms of service.')
            ->assertJsonPath('data.suspended_by.id', $admin->id);

        $user->refresh();
        $this->assertTrue($user->isSuspended());
        $this->assertEquals('Violation of platform terms of service.', $user->suspension_reason);
        $this->assertEquals($admin->id, $user->suspended_by_user_id);
    }

    public function test_admin_cannot_suspend_self(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/users/{$admin->id}/suspend", [
            'reason' => 'Should fail',
        ]);

        $response->assertStatus(403);
        $admin->refresh();
        $this->assertFalse($admin->isSuspended());
    }

    public function test_admin_can_restore_suspended_user(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'suspended_at' => now(),
            'suspension_reason' => 'Previously suspended',
            'suspended_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/users/{$user->id}/restore");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_suspended', false);

        $this->assertNull($response->json('data.suspended_at'));
        $this->assertNull($response->json('data.suspension_reason'));

        $user->refresh();
        $this->assertFalse($user->isSuspended());
        $this->assertNull($user->suspended_at);
        $this->assertNull($user->suspension_reason);
        $this->assertNull($user->suspended_by_user_id);
    }

    public function test_non_admin_cannot_access_admin_user_endpoints(): void
    {
        $regularUser = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($regularUser, 'web');

        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->getJson("/api/admin/users/{$target->id}")->assertStatus(403);
        $this->postJson("/api/admin/users/{$target->id}/suspend")->assertStatus(403);
        $this->postJson("/api/admin/users/{$target->id}/restore")->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_admin_user_endpoints(): void
    {
        $target = User::factory()->create();

        $this->getJson('/api/admin/users')->assertStatus(401);
        $this->getJson("/api/admin/users/{$target->id}")->assertStatus(401);
        $this->postJson("/api/admin/users/{$target->id}/suspend")->assertStatus(401);
        $this->postJson("/api/admin/users/{$target->id}/restore")->assertStatus(401);
    }
}
