<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessApplication;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FounderProfessionalProfileAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(): User
    {
        $user = User::factory()->create([
            'name' => 'Farhan Founder',
            'email' => 'farhan@founder.com',
            'headline' => 'Building NextGen FinTech',
            'bio' => 'Experienced founder in payments',
            'location' => 'Dhaka, Bangladesh',
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Founder]);
        $user->founderProfile()->create([]);

        return $user;
    }

    private function createProfessional(string $name = 'Nadia Rahman', string $email = 'nadia@professional.com', ?string $avatarUrl = null): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
            'headline' => 'Senior Growth & Product Lead',
            'bio' => '10+ years scaling SaaS and FinTech platforms across South Asia.',
            'location' => 'Dhaka, Bangladesh',
            'avatar_url' => $avatarUrl,
            'verification_tier' => VerificationTier::Tier2,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Professional]);
        $profProfile = $user->professionalProfile()->create([
            'experience_level' => 'Senior / Executive',
            'availability' => 'Full-time / Fractional',
            'location' => 'Dhaka, Bangladesh',
            'industry_experience' => ['FinTech', 'SaaS'],
            'compensation_preferences' => ['Standard Equity', 'Advisory Retainer'],
        ]);

        foreach (['Product Management', 'Growth Strategy'] as $skillName) {
            $skill = Skill::firstOrCreate(
                ['normalized_name' => mb_strtolower(trim($skillName))],
                ['name' => trim($skillName)]
            );
            $profProfile->skills()->syncWithoutDetaching([$skill->id]);
        }

        return $user;
    }

    private function createBusiness(User $founder): Business
    {
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'PayFast Solutions',
            'headline' => 'Digital payment orchestration',
            'summary' => 'Comprehensive payments platform',
            'description' => 'Fast digital payments infrastructure for Bangladesh',
            'category' => 'FinTech',
            'industry' => 'FinTech',
            'status' => 'published',
            'published_at' => now(),
            'currency' => 'BDT',
            'raising_amount' => 5000000,
        ]);

        $business->requirements()->create([
            'funding_amount' => 5000000,
            'accepted_investment_types' => ['standard_equity'],
        ]);

        return $business;
    }

    public function test_founder_can_view_discovered_professional_profile_before_interest_or_application(): void
    {
        $founder = $this->createFounder();
        $professional = $this->createProfessional('Discoverable Professional', 'discoverable@professional.com', '/storage/avatars/nadia-avatar.png');

        // Founder requests professional's profile using professional's user ID
        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$professional->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $professional->id)
            ->assertJsonPath('data.user.name', 'Discoverable Professional')
            ->assertJsonPath('data.user.headline', 'Senior Growth & Product Lead')
            ->assertJsonPath('data.user.bio', '10+ years scaling SaaS and FinTech platforms across South Asia.')
            ->assertJsonPath('data.user.location', 'Dhaka, Bangladesh')
            ->assertJsonPath('data.user.avatar_url', '/storage/avatars/nadia-avatar.png')
            ->assertJsonPath('data.user.verification_tier', 2)
            ->assertJsonPath('data.user.email', null) // Private email masked for privacy
            ->assertJsonPath('data.roles', ['professional'])
            ->assertJsonPath('data.profiles.professional.experience_level', 'Senior / Executive')
            ->assertJsonPath('data.profiles.professional.availability', 'Full-time / Fractional')
            ->assertJsonPath('data.profiles.professional.location', 'Dhaka, Bangladesh')
            ->assertJsonPath('data.profiles.professional.industry_experience', ['FinTech', 'SaaS'])
            ->assertJsonPath('data.profiles.professional.compensation_preferences', ['Standard Equity', 'Advisory Retainer']);

        $skills = $response->json('data.profiles.professional.skills');
        $this->assertEqualsCanonicalizing(['Product Management', 'Growth Strategy'], $skills);
    }

    public function test_recommendations_endpoint_includes_professional_user_id_and_avatar_url(): void
    {
        $founder = $this->createFounder();
        $professional = $this->createProfessional('Nadia Rahman', 'nadia@professional.com', '/storage/avatars/nadia-photo.webp');
        $business = $this->createBusiness($founder);

        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/professionals");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        $matchedItem = collect($data)->firstWhere('user_id', $professional->id);
        $this->assertNotNull($matchedItem, 'Professional recommendation must include the professional user_id');
        $this->assertEquals('Nadia Rahman', $matchedItem['name']);
        $this->assertEquals('/storage/avatars/nadia-photo.webp', $matchedItem['avatar_url']);
        $this->assertContains('Product Management', $matchedItem['skills']);
    }

    public function test_founder_can_view_professional_profile_with_application_or_connection(): void
    {
        $founder = $this->createFounder();
        $professional = $this->createProfessional();
        $business = $this->createBusiness($founder);

        BusinessApplication::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'professional_user_id' => $professional->id,
            'status' => 'pending',
            'cover_note' => 'I would love to help scale your product.',
        ]);

        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$professional->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $professional->id)
            ->assertJsonPath('data.user.name', 'Nadia Rahman');
    }
}
