<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SelfMatchDetailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounderUser(): User
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestorUser(array $preferences = []): User
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $profile = $user->investorProfile()->firstOrCreate([]);
        $profile->preferences()->firstOrCreate(array_merge([
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'location' => 'Dhaka',
            'involvement' => 'Advisory',
            'available_investment' => 5000000.00,
            'minimum_investment' => 500000.00,
            'maximum_investment' => 2000000.00,
            'investment_types' => ['Equity'],
        ], $preferences));
        $user->unsetRelations();

        return $user;
    }

    private function createProfessionalUser(array $attributes = [], array $skills = []): User
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $profile = $user->professionalProfile()->firstOrCreate(array_merge([
            'industry_experience' => ['Fintech', 'Software'],
            'experience_level' => 'Senior',
            'availability' => 'Full-Time',
            'location' => 'Dhaka',
            'compensation_preferences' => ['Equity', 'Salary'],
        ], $attributes));

        foreach ($skills as $skillName) {
            $skill = Skill::firstOrCreate(
                ['normalized_name' => mb_strtolower(trim($skillName))],
                ['name' => trim($skillName)]
            );
            $profile->skills()->syncWithoutDetaching([$skill->id]);
        }
        $user->unsetRelations();

        return $user;
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/me/matches/businesses/1')->assertUnauthorized();
    }

    public function test_investor_only_user_self_match_without_parameter(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Published Fintech Biz',
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'expected_involvement' => 'Advisory',
            'location' => 'Dhaka',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $business->requirements()->create([
            'funding_amount' => 1000000.00,
            'accepted_investment_types' => ['Equity'],
        ]);

        $investor = $this->createInvestorUser([
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'location' => 'Dhaka',
            'involvement' => 'Advisory',
            'minimum_investment' => 500000.00,
            'maximum_investment' => 2000000.00,
        ]);

        $res = $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'investor')
            ->assertJsonPath('data.business.id', $business->id)
            ->assertJsonPath('data.investor.id', $investor->investorProfile->id)
            ->assertJsonPath('data.investor.user_id', $investor->id);

        $this->assertIsInt($res->json('data.match.overall_score'));
        $this->assertArrayHasKey('data_completeness', $res->json('meta'));
        $this->assertTrue($res->json('meta.data_completeness.is_complete'));
    }

    public function test_professional_only_user_self_match_without_parameter(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Published Tech Biz',
            'industry' => 'Software',
            'location' => 'Dhaka',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $req = $business->requirements()->create([
            'required_experience_level' => 'Senior',
            'required_availability' => 'Full-Time',
            'compensation_preferences' => ['Salary'],
        ]);
        $skill = Skill::firstOrCreate(['name' => 'PHP', 'normalized_name' => 'php']);
        $req->skills()->attach($skill->id);

        $prof = $this->createProfessionalUser([
            'industry_experience' => ['Software'],
            'experience_level' => 'Senior',
            'availability' => 'Full-Time',
            'location' => 'Dhaka',
            'compensation_preferences' => ['Salary'],
        ], ['PHP']);

        $res = $this->actingAs($prof, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'professional')
            ->assertJsonPath('data.business.id', $business->id)
            ->assertJsonPath('data.professional.id', $prof->professionalProfile->id)
            ->assertJsonPath('data.professional.user_id', $prof->id);

        $this->assertIsInt($res->json('data.match.overall_score'));
        $this->assertArrayHasKey('data_completeness', $res->json('meta'));
        $this->assertTrue($res->json('meta.data_completeness.is_complete'));
    }

    public function test_explicit_role_parameters_for_single_role_users(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();

        $investor = $this->createInvestorUser();
        $prof = $this->createProfessionalUser([], ['PHP']);

        // Investor with ?role=investor -> 200
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=investor")
            ->assertOk()
            ->assertJsonPath('data.role', 'investor');

        // Investor with ?role=professional -> 403
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=professional")
            ->assertForbidden();

        // Professional with ?role=professional -> 200
        $this->app['auth']->forgetGuards();
        $this->actingAs($prof, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=professional")
            ->assertOk()
            ->assertJsonPath('data.role', 'professional');

        // Professional with ?role=investor -> 403
        $this->app['auth']->forgetGuards();
        $this->actingAs($prof, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=investor")
            ->assertForbidden();
    }

    public function test_multi_role_user_requires_explicit_role_parameter(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();

        $dualUser = $this->createInvestorUser();
        $dualUser->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $dualUser->professionalProfile()->firstOrCreate([
            'industry_experience' => ['Fintech'],
            'experience_level' => 'Senior',
            'location' => 'Dhaka',
        ]);
        $dualUser->unsetRelations();

        // No parameter -> 422
        $this->actingAs($dualUser, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'UNPROCESSABLE_ENTITY');

        // Explicit ?role=investor -> 200
        $this->app['auth']->forgetGuards();
        $this->actingAs($dualUser, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=investor")
            ->assertOk()
            ->assertJsonPath('data.role', 'investor');

        // Explicit ?role=professional -> 200
        $this->app['auth']->forgetGuards();
        $this->actingAs($dualUser, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=professional")
            ->assertOk()
            ->assertJsonPath('data.role', 'professional');
    }

    public function test_invalid_role_parameter_returns_422(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();

        $investor = $this->createInvestorUser();

        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?role=invalid_role")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'UNPROCESSABLE_ENTITY');
    }

    public function test_founder_only_user_is_forbidden(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();

        $this->actingAs($founder, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertForbidden();
    }

    public function test_draft_business_protection_for_non_owners(): void
    {
        $founder = $this->createFounderUser();
        $draftBusiness = $founder->founderProfile->businesses()->create([
            'name' => 'Draft Biz',
            'industry' => 'Fintech',
        ]); // default status is 'draft'

        $investor = $this->createInvestorUser();

        // Non-owner investor gets 404
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$draftBusiness->id}")
            ->assertNotFound();

        // If user is also the founder owner of the draft business, they can view match
        $investor->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $founderProfile = $investor->founderProfile()->firstOrCreate([]);
        $myDraftBiz = $founderProfile->businesses()->create([
            'name' => 'My Draft Biz',
            'industry' => 'Fintech',
        ]);
        $investor->unsetRelations();

        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$myDraftBiz->id}?role=investor")
            ->assertOk();
    }

    public function test_own_profile_resolution_and_no_client_selection(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();

        $investor1 = $this->createInvestorUser();
        $investor2 = $this->createInvestorUser();

        // Investor 1 calling the endpoint resolves Investor 1's profile, ignoring any attempts to pass an id
        $res = $this->actingAs($investor1, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}?investor_id={$investor2->investorProfile->id}")
            ->assertOk();

        $this->assertSame($investor1->investorProfile->id, $res->json('data.investor.id'));
        $this->assertNotSame($investor2->investorProfile->id, $res->json('data.investor.id'));
    }

    public function test_safe_payload_and_no_sensitive_leakage(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Biz 1',
            'industry' => 'Fintech',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $business->requirements()->create(['funding_amount' => 500000.00]);

        $investor = $this->createInvestorUser();

        $res = $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertOk();

        $data = $res->json('data');
        $this->assertArrayHasKey('business', $data);
        $this->assertArrayHasKey('investor', $data);
        $this->assertArrayHasKey('match', $data);

        // Security check
        $this->assertArrayNotHasKey('password', $data['investor']);
        $this->assertArrayNotHasKey('remember_token', $data['investor']);
        $this->assertArrayNotHasKey('two_factor_secret', $data['investor']);
        $this->assertArrayNotHasKey('verification_evidence', $data['investor']);
    }

    public function test_match_result_structure_identical_to_phase_5b(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Fintech Hub',
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'expected_involvement' => 'Advisory',
            'location' => 'Dhaka',
        ]);
        $business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $business->requirements()->create(['funding_amount' => 1000000.00]);

        $investor = $this->createInvestorUser(['industry' => 'Fintech']);

        $res = $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$business->id}")
            ->assertOk();

        $match = $res->json('data.match');
        $this->assertArrayHasKey('overall_score', $match);
        $this->assertArrayHasKey('match_grade', $match);
        $this->assertArrayHasKey('summary_explanation', $match);
        $this->assertArrayHasKey('factors', $match);
        $this->assertArrayHasKey('strongest_alignments', $match);
        $this->assertArrayHasKey('potential_gaps', $match);
        $this->assertArrayHasKey('disclaimer', $match);
        $this->assertCount(6, $match['factors']);

        $factor = $match['factors'][0];
        $this->assertArrayHasKey('factor_key', $factor);
        $this->assertArrayHasKey('factor_name', $factor);
        $this->assertArrayHasKey('weight', $factor);
        $this->assertArrayHasKey('score', $factor);
        $this->assertArrayHasKey('weighted_score', $factor);
        $this->assertArrayHasKey('strength', $factor);
        $this->assertArrayHasKey('explanation', $factor);
    }
}
