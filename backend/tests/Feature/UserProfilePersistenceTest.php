<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfilePersistenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_unauthenticated_user_cannot_update_profile(): void
    {
        $this->patchJson('/api/me/profile', [
            'headline' => 'CTO at TechCorp',
        ])->assertStatus(401);
    }

    public function test_user_can_update_profile_and_persist_to_database(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'user@example.com',
        ]);

        $payload = [
            'name' => 'Updated Name',
            'headline' => 'Lead Full-Stack Architect',
            'bio' => 'Experienced software engineer specialized in fintech systems.',
            'location' => 'Dhaka, Bangladesh',
            'experience' => [
                [
                    'role' => 'Principal Architect',
                    'org' => 'Dhaka Tech Ltd',
                    'duration' => '2022 - Present',
                    'desc' => 'Leading distributed ledger architecture and microservices.',
                ],
            ],
            'portfolio' => [
                [
                    'title' => 'Core Payment Engine',
                    'role' => 'Lead Engineer',
                    'year' => '2024',
                    'desc' => 'High throughput BDT remittance processing engine.',
                    'skills' => ['Go', 'PostgreSQL', 'Redis'],
                    'link' => 'https://example.com/payment',
                ],
            ],
            'preferences' => [
                'visibility' => 'Public',
                'contact' => 'Platform messages only',
            ],
        ];

        $res = $this->actingAs($user)->patchJson('/api/me/profile', $payload);
        $res->assertOk();
        $res->assertJsonPath('data.user.name', 'Updated Name');
        $res->assertJsonPath('data.user.headline', 'Lead Full-Stack Architect');
        $res->assertJsonPath('data.user.location', 'Dhaka, Bangladesh');
        $res->assertJsonPath('data.user.experience.0.org', 'Dhaka Tech Ltd');
        $res->assertJsonPath('data.user.portfolio.0.title', 'Core Payment Engine');

        // Verify database persistence
        $fresh = $user->fresh();
        $this->assertSame('Updated Name', $fresh->name);
        $this->assertSame('Lead Full-Stack Architect', $fresh->headline);
        $this->assertSame('Dhaka, Bangladesh', $fresh->location);
        $this->assertCount(1, $fresh->experience);
        $this->assertSame('Dhaka Tech Ltd', $fresh->experience[0]['org']);
        $this->assertCount(1, $fresh->portfolio);
        $this->assertSame('Core Payment Engine', $fresh->portfolio[0]['title']);

        // Verify show endpoint returns persisted values
        $showRes = $this->actingAs($user)->getJson('/api/me/profile');
        $showRes->assertOk();
        $showRes->assertJsonPath('data.user.headline', 'Lead Full-Stack Architect');
        $showRes->assertJsonPath('data.user.location', 'Dhaka, Bangladesh');
    }

    public function test_profile_update_validation_rejects_disallowed_fields(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->patchJson('/api/me/profile', [
            'unauthorized_field' => 'injection_attempt',
        ]);

        $res->assertStatus(422);
    }
}
