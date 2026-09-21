<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminUserDirectoryTest extends TestCase
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
        $admin = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@vault.test']);
        $admin->adminAccess()->create([]);

        return $admin;
    }

    public function test_unauthenticated_request_to_admin_users_is_rejected_with_401(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_non_admin_users_are_forbidden_with_403(): void
    {
        $founder = User::factory()->create();
        $founder->roles()->create(['role' => ParticipantRole::Founder->value]);

        $investor = User::factory()->create();
        $investor->roles()->create(['role' => ParticipantRole::Investor->value]);

        $pro = User::factory()->create();
        $pro->roles()->create(['role' => ParticipantRole::Professional->value]);

        $this->actingAs($founder)->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($investor)->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($pro)->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_can_list_users_with_pagination_and_safe_attributes(): void
    {
        $admin = $this->createAdmin();

        $user1 = User::factory()->create([
            'name' => 'Farhan Founder',
            'email' => 'farhan@vault.test',
            'phone' => '+8801700000001',
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user1->roles()->create(['role' => ParticipantRole::Founder->value]);

        $user2 = User::factory()->create([
            'name' => 'Sohail Investor',
            'email' => 'sohail@vault.test',
            'phone' => '+8801700000002',
            'verification_tier' => VerificationTier::Tier2,
        ]);
        $user2->roles()->create(['role' => ParticipantRole::Investor->value]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/users?per_page=10')
            ->assertOk();

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'users' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'is_admin',
                        'roles',
                        'verification_tier',
                        'verification_tier_label',
                        'status',
                        'status_label',
                        'is_suspended',
                        'suspended_at',
                        'suspension_reason',
                        'email_verified',
                        'email_verified_at',
                        'phone_verified',
                        'phone_verified_at',
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

        $users = $response->json('data.users');
        $this->assertGreaterThanOrEqual(3, count($users)); // admin + user1 + user2

        // Verify password and remember_token are NOT exposed in any record
        foreach ($users as $u) {
            $this->assertArrayNotHasKey('password', $u);
            $this->assertArrayNotHasKey('remember_token', $u);
        }
    }

    public function test_search_by_name_and_email(): void
    {
        $admin = $this->createAdmin();

        User::factory()->create(['name' => 'Shayan Ahmed', 'email' => 'shayan@vault.test']);
        User::factory()->create(['name' => 'Rafiul Karim', 'email' => 'rafiul@vault.test']);
        User::factory()->create(['name' => 'Tawsif Khan', 'email' => 'tawsif@vault.test']);

        // Search name
        $resName = $this->actingAs($admin)->getJson('/api/admin/users?q=shayan')->assertOk();
        $this->assertSame(1, $resName->json('data.pagination.total'));
        $this->assertSame('Shayan Ahmed', $resName->json('data.users.0.name'));

        // Search email
        $resEmail = $this->actingAs($admin)->getJson('/api/admin/users?q=rafiul@vault.test')->assertOk();
        $this->assertSame(1, $resEmail->json('data.pagination.total'));
        $this->assertSame('Rafiul Karim', $resEmail->json('data.users.0.name'));
    }

    public function test_filter_by_role_and_multi_role_serialization(): void
    {
        $admin = $this->createAdmin();

        $founder = User::factory()->create(['name' => 'Only Founder', 'email' => 'founder@vault.test']);
        $founder->roles()->create(['role' => ParticipantRole::Founder->value]);

        $multi = User::factory()->create(['name' => 'Jim Multi', 'email' => 'jim@vault.test']);
        $multi->roles()->create(['role' => ParticipantRole::Founder->value]);
        $multi->roles()->create(['role' => ParticipantRole::Investor->value]);
        $multi->roles()->create(['role' => ParticipantRole::Professional->value]);

        $pro = User::factory()->create(['name' => 'Only Pro', 'email' => 'pro@vault.test']);
        $pro->roles()->create(['role' => ParticipantRole::Professional->value]);

        // Filter role=founder should return both founder and jim
        $resFounder = $this->actingAs($admin)->getJson('/api/admin/users?role=founder')->assertOk();
        $founderUserIds = collect($resFounder->json('data.users'))->pluck('id')->all();
        $this->assertContains($founder->id, $founderUserIds);
        $this->assertContains($multi->id, $founderUserIds);
        $this->assertNotContains($pro->id, $founderUserIds);

        // Filter role=investor should return jim
        $resInvestor = $this->actingAs($admin)->getJson('/api/admin/users?role=investor')->assertOk();
        $investorUserIds = collect($resInvestor->json('data.users'))->pluck('id')->all();
        $this->assertContains($multi->id, $investorUserIds);
        $this->assertNotContains($founder->id, $investorUserIds);

        // Check multi-role serialization returns all 3 roles
        $multiUserData = collect($resInvestor->json('data.users'))->firstWhere('id', $multi->id);
        $this->assertCount(3, $multiUserData['roles']);
        $this->assertContains('founder', $multiUserData['roles']);
        $this->assertContains('investor', $multiUserData['roles']);
        $this->assertContains('professional', $multiUserData['roles']);
    }

    public function test_filter_by_verification_tier_and_status(): void
    {
        $admin = $this->createAdmin();

        $tier0 = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);
        $tier1 = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $tier2 = User::factory()->create(['verification_tier' => VerificationTier::Tier2]);

        // Filter tier 2
        $resTier2 = $this->actingAs($admin)->getJson('/api/admin/users?verification_tier=2')->assertOk();
        $tier2Ids = collect($resTier2->json('data.users'))->pluck('id')->all();
        $this->assertContains($tier2->id, $tier2Ids);
        $this->assertNotContains($tier0->id, $tier2Ids);
        $this->assertNotContains($tier1->id, $tier2Ids);

        // Filter status=active
        $resActive = $this->actingAs($admin)->getJson('/api/admin/users?status=active')->assertOk();
        $activeIds = collect($resActive->json('data.users'))->pluck('id')->all();
        $this->assertContains($tier1->id, $activeIds);

        if (Schema::hasColumn('users', 'suspended_at')) {
            $suspended = User::factory()->create([
                'verification_tier' => VerificationTier::Tier1,
                'suspended_at' => now(),
                'suspension_reason' => 'Violation of platform terms',
            ]);

            $resSuspended = $this->actingAs($admin)->getJson('/api/admin/users?status=suspended')->assertOk();
            $suspendedIds = collect($resSuspended->json('data.users'))->pluck('id')->all();
            $this->assertContains($suspended->id, $suspendedIds);
            $this->assertNotContains($tier1->id, $suspendedIds);
        }
    }
}
