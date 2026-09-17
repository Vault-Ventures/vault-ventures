<?php

namespace Tests\Feature;

use App\Models\AdminAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminLoginTest extends TestCase
{
    use RefreshDatabase;

    private const ADMIN_PASSWORD = '#admin#1905';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);

        // Seed Admin Alvi
        $alvi = User::forceCreate([
            'name' => 'Admin Alvi',
            'email' => 'adminalvi@gmail.com',
            'password' => Hash::make(self::ADMIN_PASSWORD),
            'email_verified_at' => now(),
        ]);
        DB::table('admin_access')->insert(['user_id' => $alvi->id, 'created_at' => now(), 'updated_at' => now()]);

        // Seed Admin Faiza
        $faiza = User::forceCreate([
            'name' => 'Admin Faiza',
            'email' => 'adminfaiza@gmail.com',
            'password' => Hash::make(self::ADMIN_PASSWORD),
            'email_verified_at' => now(),
        ]);
        DB::table('admin_access')->insert(['user_id' => $faiza->id, 'created_at' => now(), 'updated_at' => now()]);

        // Seed Non-Admin User
        User::forceCreate([
            'name' => 'Regular User',
            'email' => 'regular@example.test',
            'password' => Hash::make('RegularPassword123!'),
            'email_verified_at' => now(),
        ]);
    }

    private function continueSession(): void
    {
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
    }

    public function test_admin_alvi_can_log_in_and_access_admin_endpoints(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'adminalvi@gmail.com',
            'password' => self::ADMIN_PASSWORD,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'adminalvi@gmail.com');

        $user = User::where('email', 'adminalvi@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasAdminAccess());
        $this->assertTrue($user->hasVerifiedEmail());

        $this->continueSession();

        $adminCheck = $this->actingAs($user)->getJson('/api/admin/verification-requests');
        $adminCheck->assertOk();

        $governanceCheck = $this->actingAs($user)->getJson('/api/admin/financial-governance');
        $governanceCheck->assertOk();

        $reportsCheck = $this->actingAs($user)->getJson('/api/admin/financial-reports');
        $reportsCheck->assertOk();
    }

    public function test_admin_faiza_can_log_in_and_access_admin_endpoints(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'adminfaiza@gmail.com',
            'password' => self::ADMIN_PASSWORD,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'adminfaiza@gmail.com');

        $user = User::where('email', 'adminfaiza@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasAdminAccess());
        $this->assertTrue($user->hasVerifiedEmail());

        $this->continueSession();

        $adminCheck = $this->actingAs($user)->getJson('/api/admin/verification-requests');
        $adminCheck->assertOk();

        $governanceCheck = $this->actingAs($user)->getJson('/api/admin/financial-governance');
        $governanceCheck->assertOk();

        $reportsCheck = $this->actingAs($user)->getJson('/api/admin/financial-reports');
        $reportsCheck->assertOk();
    }

    public function test_non_admin_cannot_access_admin_endpoints(): void
    {
        $nonAdmin = User::where('email', 'regular@example.test')->first();
        $this->assertNotNull($nonAdmin);
        $this->assertFalse($nonAdmin->hasAdminAccess());

        $response = $this->actingAs($nonAdmin)->getJson('/api/admin/verification-requests');
        $response->assertStatus(403);
    }
}
