<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessApplication;
use App\Models\FounderProfile;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(string $name = 'Farhan Founder', string $email = 'farhan@founder.com'): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Founder]);
        $user->founderProfile()->create([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(string $name = 'Sara Professional', string $email = 'sara@prof.com'): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
            'headline' => 'Senior Growth & Marketing Lead',
            'bio' => '10+ years scaling fintech products in SEA.',
            'location' => 'Dhaka, Bangladesh',
            'verification_tier' => VerificationTier::Tier2,
        ]);
        $user->roles()->create(['role' => ParticipantRole::Professional]);
        $profProfile = $user->professionalProfile()->create([
            'experience_level' => 'senior',
            'availability' => 'full_time',
            'location' => 'Dhaka, Bangladesh',
            'compensation_preferences' => ['equity', 'salary'],
        ]);
        $skill = Skill::firstOrCreate(['normalized_name' => 'growth marketing'], ['name' => 'Growth Marketing']);
        $profProfile->skills()->syncWithoutDetaching([$skill->id]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, string $name = 'Vault FinTech', string $status = 'published'): Business
    {
        $founderProfile = FounderProfile::where('user_id', $founder->id)->firstOrFail();
        $business = new Business();
        $business->founder_profile_id = $founderProfile->id;
        $business->name = $name;
        $business->description = 'A cutting-edge financial platform.';
        $business->industry = 'FinTech';
        $business->business_stage = 'Seed';
        $business->location = 'Dhaka';
        $business->status = $status;
        $business->save();

        $business->requirements()->create([
            'funding_amount' => 5000000,
            'expected_involvement' => 'Full-time',
        ]);

        return $business;
    }

    public function test_professional_can_submit_application_to_published_business(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        $response = $this->actingAs($prof, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", [
                'role_title' => 'Strategic Growth Advisor',
                'note' => 'I would love to help expand user acquisition.',
                'skills' => ['Growth Marketing', 'Product Strategy'],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.role_title', 'Strategic Growth Advisor');

        $this->assertDatabaseHas('business_applications', [
            'business_id' => $business->id,
            'professional_user_id' => $prof->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'Strategic Growth Advisor',
        ]);
    }

    public function test_cannot_apply_without_professional_role(): void
    {
        $founder = $this->createFounder();
        $otherUser = User::factory()->create(['email' => 'other@user.com']);
        UserRole::forceCreate(['user_id' => $otherUser->id, 'role' => ParticipantRole::Investor]);
        $business = $this->createBusiness($founder);

        $response = $this->actingAs($otherUser, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", [
                'role_title' => 'Advisor',
            ]);

        $response->assertStatus(403);
    }

    public function test_founder_cannot_apply_to_own_business(): void
    {
        $founder = $this->createFounder();
        UserRole::forceCreate(['user_id' => $founder->id, 'role' => ParticipantRole::Professional]);
        $business = $this->createBusiness($founder);

        $response = $this->actingAs($founder, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", [
                'role_title' => 'Advisor',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'CANNOT_APPLY_TO_OWN_BUSINESS');
    }

    public function test_duplicate_active_applications_are_prevented(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        $this->actingAs($prof, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", ['role_title' => 'First'])
            ->assertStatus(201);

        $response = $this->actingAs($prof, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", ['role_title' => 'Second']);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'DUPLICATE_APPLICATION');

        $this->assertDatabaseCount('business_applications', 1);
    }

    public function test_professional_can_check_application_status_for_business(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        // Before applying
        $res = $this->actingAs($prof, 'web')
            ->getJson("/api/me/businesses/{$business->id}/application-status");
        $res->assertOk()
            ->assertJsonPath('data.has_applied', false)
            ->assertJsonPath('data.status', 'none');

        // Apply
        $this->actingAs($prof, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", ['role_title' => 'Advisor'])
            ->assertStatus(201);

        // After applying
        $res = $this->actingAs($prof, 'web')
            ->getJson("/api/me/businesses/{$business->id}/application-status");
        $res->assertOk()
            ->assertJsonPath('data.has_applied', true)
            ->assertJsonPath('data.status', 'submitted');
    }

    public function test_professional_can_list_applications_and_withdraw(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        $this->actingAs($prof, 'web')
            ->postJson("/api/me/businesses/{$business->id}/apply", ['role_title' => 'Lead Dev'])
            ->assertStatus(201);

        $listRes = $this->actingAs($prof, 'web')
            ->getJson('/api/me/professional/applications');

        $listRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.business', $business->name)
            ->assertJsonPath('data.0.status', 'submitted');

        $appId = $listRes->json('data.0.id');

        // Withdraw
        $withdrawRes = $this->actingAs($prof, 'web')
            ->postJson("/api/me/professional/applications/{$appId}/withdraw");

        $withdrawRes->assertOk()
            ->assertJsonPath('data.status', 'withdrawn');

        $this->assertDatabaseHas('business_applications', [
            'id' => $appId,
            'status' => 'withdrawn',
        ]);
    }

    public function test_founder_can_list_incoming_applications_for_their_business(): void
    {
        $founder = $this->createFounder();
        $prof1 = $this->createProfessional('Sara Prof', 'sara@prof.com');
        $prof2 = $this->createProfessional('Zubair Prof', 'zubair@prof.com');
        $business = $this->createBusiness($founder);

        BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof1->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'Advisor',
        ]);
        BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof2->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'CTO',
        ]);

        $response = $this->actingAs($founder, 'web')
            ->getJson('/api/me/founder/applications');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.business_name', $business->name)
            ->assertJsonPath('data.0.status', 'submitted');
    }

    public function test_unrelated_founder_cannot_see_or_manage_other_founders_applications(): void
    {
        $founder1 = $this->createFounder('Founder One', 'f1@founder.com');
        $founder2 = $this->createFounder('Founder Two', 'f2@founder.com');
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder1);

        $app = BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof->id,
            'founder_user_id' => $founder1->id,
            'status' => 'submitted',
            'role_title' => 'Advisor',
        ]);

        // Founder 2 list should be empty
        $listRes = $this->actingAs($founder2, 'web')
            ->getJson('/api/me/founder/applications');
        $listRes->assertOk()->assertJsonCount(0, 'data');

        // Founder 2 cannot view single application
        $this->actingAs($founder2, 'web')
            ->getJson("/api/me/founder/applications/{$app->id}")
            ->assertStatus(403);

        // Founder 2 cannot accept application
        $this->actingAs($founder2, 'web')
            ->postJson("/api/me/founder/applications/{$app->id}/accept")
            ->assertStatus(403);
    }

    public function test_founder_can_view_professional_applicant_profile(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'Advisor',
        ]);

        $response = $this->actingAs($founder, 'web')
            ->getJson("/api/users/{$prof->id}/profile");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $prof->id)
            ->assertJsonPath('data.user.headline', 'Senior Growth & Marketing Lead')
            ->assertJsonPath('data.profiles.professional.skills.0', 'Growth Marketing');
    }

    public function test_founder_can_mark_under_review_accept_and_reject_application(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        $app = BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'Advisor',
        ]);

        // Mark under review
        $reviewRes = $this->actingAs($founder, 'web')
            ->postJson("/api/me/founder/applications/{$app->id}/review");
        $reviewRes->assertOk()
            ->assertJsonPath('data.status', 'under_review')
            ->assertJsonPath('data.reviewed_at', fn ($val) => ! empty($val));

        // Accept
        $acceptRes = $this->actingAs($founder, 'web')
            ->postJson("/api/me/founder/applications/{$app->id}/accept");
        $acceptRes->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.responded_at', fn ($val) => ! empty($val));

        $this->assertDatabaseHas('business_applications', [
            'id' => $app->id,
            'status' => 'accepted',
        ]);
    }

    public function test_founder_can_reject_application_with_reason(): void
    {
        $founder = $this->createFounder();
        $prof = $this->createProfessional();
        $business = $this->createBusiness($founder);

        $app = BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $prof->id,
            'founder_user_id' => $founder->id,
            'status' => 'submitted',
            'role_title' => 'Advisor',
        ]);

        // Reject with reason
        $rejectRes = $this->actingAs($founder, 'web')
            ->postJson("/api/me/founder/applications/{$app->id}/reject", [
                'reason' => 'Looking for someone with 15+ years experience.',
            ]);

        $rejectRes->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Looking for someone with 15+ years experience.');

        $this->assertDatabaseHas('business_applications', [
            'id' => $app->id,
            'status' => 'rejected',
            'rejection_reason' => 'Looking for someone with 15+ years experience.',
        ]);
    }
}
