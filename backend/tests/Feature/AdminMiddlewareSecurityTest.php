<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMiddlewareSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdmin(string $email = 'admin@example.com'): User
    {
        $user = User::factory()->create(['email' => $email]);
        $user->adminAccess()->create([]);
        $user->unsetRelations();

        return $user;
    }

    public function test_unauthenticated_requests_to_admin_routes_return_401(): void
    {
        $this->getJson('/api/admin/verification-requests')
            ->assertStatus(401);

        $this->getJson('/api/admin/financial-reports')
            ->assertStatus(401);

        $this->getJson('/api/admin/financial-governance')
            ->assertStatus(401);
    }

    public function test_authenticated_non_admin_users_are_rejected_with_403(): void
    {
        $nonAdmin = User::factory()->create(['email' => 'regular@example.com']);
        $targetUser = User::factory()->create(['email' => 'target@example.com']);

        $endpoints = [
            ['method' => 'getJson', 'url' => '/api/admin/verification-requests'],
            ['method' => 'getJson', 'url' => "/api/admin/reputation/users/{$targetUser->id}"],
            ['method' => 'getJson', 'url' => '/api/admin/financial-reports'],
            ['method' => 'getJson', 'url' => '/api/admin/financial-governance'],
        ];

        foreach ($endpoints as $ep) {
            $response = $this->actingAs($nonAdmin)->{$ep['method']}($ep['url']);
            $response->assertStatus(403);
            $response->assertJson([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
                'error' => [
                    'code' => 'HTTP_403',
                ],
            ]);
        }
    }

    public function test_authenticated_admin_users_can_access_admin_routes(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->getJson('/api/admin/verification-requests')
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->actingAs($admin)
            ->getJson('/api/admin/financial-reports')
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->actingAs($admin)
            ->getJson('/api/admin/financial-governance')
            ->assertOk()
            ->assertJson(['success' => true]);
    }
}
