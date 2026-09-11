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

class MatchingRecommendationTest extends TestCase
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
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestorUser(array $preferences = []): User
    {
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);
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
        $user = User::factory()->create([
            'verification_tier' => VerificationTier::Tier1,
        ]);
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

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/me/businesses/1/recommendations/investors')->assertUnauthorized();
        $this->getJson('/api/me/businesses/1/recommendations/professionals')->assertUnauthorized();
        $this->getJson('/api/me/recommendations/businesses')->assertUnauthorized();
        $this->getJson('/api/me/matches/businesses/1/investors/1')->assertUnauthorized();
        $this->getJson('/api/me/matches/businesses/1/professionals/1')->assertUnauthorized();
    }

    public function test_founder_role_and_business_ownership_authorization(): void
    {
        $founder1 = $this->createFounderUser();
        $founder2 = $this->createFounderUser();
        $investor = $this->createInvestorUser();

        $business1 = $founder1->founderProfile->businesses()->create([
            'name' => 'Founder 1 Business',
            'industry' => 'Fintech',
        ]);

        // Non-founder gets forbidden
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/businesses/{$business1->id}/recommendations/investors")
            ->assertForbidden();

        // Founder 2 trying to access Founder 1's business gets 403 (does not own business)
        $this->app['auth']->forgetGuards();
        $this->actingAs($founder2, 'web')
            ->getJson("/api/me/businesses/{$business1->id}/recommendations/investors")
            ->assertForbidden();

        // Founder 1 accessing their own business succeeds
        $this->app['auth']->forgetGuards();
        $this->actingAs($founder1, 'web')
            ->getJson("/api/me/businesses/{$business1->id}/recommendations/investors")
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_investor_and_professional_role_authorization_on_recommendations(): void
    {
        $founder = $this->createFounderUser();
        $investor = $this->createInvestorUser();
        $prof = $this->createProfessionalUser([], ['PHP']);

        // Founder only -> forbidden on /api/me/recommendations/businesses
        $this->app['auth']->forgetGuards();
        $this->actingAs($founder, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertForbidden();

        // Investor -> 200 OK
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        // Professional -> 200 OK
        $this->app['auth']->forgetGuards();
        $this->actingAs($prof, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        // Investor requesting ?role=professional -> 403 Forbidden
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses?role=professional')
            ->assertForbidden();

        // Professional requesting ?role=investor -> 403 Forbidden
        $this->app['auth']->forgetGuards();
        $this->actingAs($prof, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertForbidden();

        // Dual-role user
        $dualUser = $this->createInvestorUser();
        $dualUser->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $dualUser->professionalProfile()->firstOrCreate(['experience_level' => 'Senior', 'location' => 'Dhaka']);
        $dualUser->unsetRelations();

        $this->app['auth']->forgetGuards();
        $this->actingAs($dualUser, 'web')
            ->getJson('/api/me/recommendations/businesses?role=investor')
            ->assertOk();

        $this->app['auth']->forgetGuards();
        $this->actingAs($dualUser, 'web')
            ->getJson('/api/me/recommendations/businesses?role=professional')
            ->assertOk();
    }

    public function test_founder_recommended_investors_top_10_sorting_and_deterministic_tie_breaking(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Tech Platform',
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'expected_involvement' => 'Advisory',
            'location' => 'Dhaka',
        ]);
        $business->requirements()->create([
            'funding_amount' => 1000000.00,
            'accepted_investment_types' => ['Equity'],
        ]);

        // Create 15 investors with distinct profile setups
        for ($i = 1; $i <= 15; $i++) {
            $this->createInvestorUser([
                'industry' => $i <= 5 ? 'Fintech' : ($i <= 10 ? 'Healthcare' : 'Agriculture'),
                'business_stage' => $i <= 3 ? 'Growth' : 'Early Stage',
                'risk_level' => 'Moderate',
                'location' => 'Dhaka',
                'available_investment' => 2000000.00,
                'minimum_investment' => 500000.00,
                'maximum_investment' => 1500000.00,
            ]);
        }

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/investors")
            ->assertOk();

        $data = $res->json('data');
        $this->assertCount(10, $data, 'Must return exactly top 10 candidates');

        // Check descending score ordering
        for ($k = 0; $k < count($data) - 1; $k++) {
            $currentScore = $data[$k]['match']['overall_score'];
            $nextScore = $data[$k + 1]['match']['overall_score'];
            $this->assertGreaterThanOrEqual($nextScore, $currentScore);

            if ($currentScore === $nextScore) {
                // Tie-breaking check: candidate ID ascending
                $this->assertLessThan($data[$k + 1]['id'], $data[$k]['id']);
            }
        }
    }

    public function test_founder_recommended_professionals_top_10_sorting(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Alpha App',
            'industry' => 'Software',
            'location' => 'Dhaka',
        ]);
        $req = $business->requirements()->create([
            'required_experience_level' => 'Senior',
            'required_availability' => 'Full-Time',
            'compensation_preferences' => ['Equity'],
        ]);
        $skill1 = Skill::create(['name' => 'Laravel', 'normalized_name' => 'laravel']);
        $skill2 = Skill::create(['name' => 'React', 'normalized_name' => 'react']);
        $req->skills()->attach([$skill1->id, $skill2->id]);

        // Create 12 professionals
        for ($i = 1; $i <= 12; $i++) {
            $skills = ($i <= 4) ? ['Laravel', 'React'] : (($i <= 8) ? ['Laravel'] : ['Python']);
            $this->createProfessionalUser([
                'industry_experience' => ['Software'],
                'experience_level' => ($i <= 6) ? 'Senior' : 'Junior',
                'availability' => 'Full-Time',
                'location' => 'Dhaka',
            ], $skills);
        }

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/professionals")
            ->assertOk();

        $data = $res->json('data');
        $this->assertCount(10, $data);

        // Check descending scores
        for ($k = 0; $k < count($data) - 1; $k++) {
            $this->assertGreaterThanOrEqual($data[$k + 1]['match']['overall_score'], $data[$k]['match']['overall_score']);
        }
    }

    public function test_investor_recommended_businesses_excludes_drafts_and_own_businesses(): void
    {
        $investorUser = $this->createInvestorUser(['industry' => 'Fintech', 'location' => 'Dhaka']);

        // Create published businesses from another founder
        $otherFounder = $this->createFounderUser();
        $b1 = $otherFounder->founderProfile->businesses()->create([
            'name' => 'Published Business 1',
            'industry' => 'Fintech',
            'location' => 'Dhaka',
        ]);
        $b1->forceFill(['status' => BusinessStatus::Submitted])->save();
        $b1->requirements()->create(['funding_amount' => 1000000.00]);

        $b2 = $otherFounder->founderProfile->businesses()->create([
            'name' => 'Draft Business (Should be excluded)',
            'industry' => 'Fintech',
            'location' => 'Dhaka',
        ]);
        $b2->requirements()->create(['funding_amount' => 1000000.00]);

        // Create a published business owned by the investor themselves
        $investorUser->roles()->create(['role' => ParticipantRole::Founder->value]);
        $investorFounderProfile = $investorUser->founderProfile()->create();
        $b3 = $investorFounderProfile->businesses()->create([
            'name' => 'Investor Own Business (Should be excluded)',
            'industry' => 'Fintech',
            'location' => 'Dhaka',
        ]);
        $b3->forceFill(['status' => BusinessStatus::Submitted])->save();
        $b3->requirements()->create(['funding_amount' => 1000000.00]);

        $res = $this->actingAs($investorUser, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        $data = $res->json('data');
        $ids = array_column($data, 'id');

        $this->assertContains($b1->id, $ids);
        $this->assertNotContains($b2->id, $ids, 'Draft business must not be recommended to investor');
        $this->assertNotContains($b3->id, $ids, 'Own business must not be recommended to investor');
    }

    public function test_professional_recommended_businesses_excludes_drafts_and_own_businesses(): void
    {
        $profUser = $this->createProfessionalUser(['industry_experience' => ['Software'], 'location' => 'Dhaka'], ['Laravel']);

        // Create published businesses from another founder
        $otherFounder = $this->createFounderUser();
        $b1 = $otherFounder->founderProfile->businesses()->create([
            'name' => 'Published Business 1',
            'industry' => 'Software',
            'location' => 'Dhaka',
        ]);
        $b1->forceFill(['status' => BusinessStatus::Submitted])->save();
        $b1->requirements()->create(['required_experience_level' => 'Senior']);

        $b2 = $otherFounder->founderProfile->businesses()->create([
            'name' => 'Draft Business (Should be excluded)',
            'industry' => 'Software',
            'location' => 'Dhaka',
        ]);
        $b2->requirements()->create(['required_experience_level' => 'Senior']);

        // Create a published business owned by the professional themselves
        $profUser->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $profFounderProfile = $profUser->founderProfile()->firstOrCreate([]);
        $b3 = $profFounderProfile->businesses()->create([
            'name' => 'Professional Own Business (Should be excluded)',
            'industry' => 'Software',
            'location' => 'Dhaka',
        ]);
        $b3->forceFill(['status' => BusinessStatus::Submitted])->save();
        $b3->requirements()->create(['required_experience_level' => 'Senior']);

        $res = $this->actingAs($profUser, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        $data = $res->json('data');
        $ids = array_column($data, 'id');

        $this->assertContains($b1->id, $ids);
        $this->assertNotContains($b2->id, $ids, 'Draft business must not be recommended to professional');
        $this->assertNotContains($b3->id, $ids, 'Own business must not be recommended to professional');
    }

    public function test_tier_0_candidates_are_excluded_from_recommendation_pools(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Fintech Hub',
            'industry' => 'Fintech',
        ]);
        $business->requirements()->create([
            'funding_amount' => 500000.00,
            'required_experience_level' => 'Senior',
        ]);

        // 1. Tier 0 Investor vs Tier 1 Investor
        $tier0Investor = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);
        $tier0Investor->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $p0 = $tier0Investor->investorProfile()->firstOrCreate([]);
        $p0->preferences()->firstOrCreate(['industry' => 'Fintech']);

        $tier1Investor = $this->createInvestorUser(['industry' => 'Fintech']);

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/investors")
            ->assertOk();

        $investorIds = array_column($res->json('data'), 'id');
        $this->assertContains($tier1Investor->investorProfile->id, $investorIds);
        $this->assertNotContains($p0->id, $investorIds, 'Tier 0 investor must be excluded from recommendations');

        // 2. Tier 0 Professional vs Tier 1 Professional
        $tier0Prof = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);
        $tier0Prof->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $prof0 = $tier0Prof->professionalProfile()->firstOrCreate(['experience_level' => 'Senior', 'location' => 'Dhaka']);

        $tier1Prof = $this->createProfessionalUser(['experience_level' => 'Senior', 'location' => 'Dhaka']);

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/professionals")
            ->assertOk();

        $profIds = array_column($res->json('data'), 'id');
        $this->assertContains($tier1Prof->professionalProfile->id, $profIds);
        $this->assertNotContains($prof0->id, $profIds, 'Tier 0 professional must be excluded from recommendations');

        // 3. Business owned by Tier 0 Founder vs Tier 1 Founder
        $tier0Founder = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);
        $tier0Founder->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $f0Profile = $tier0Founder->founderProfile()->firstOrCreate([]);
        $tier0Business = $f0Profile->businesses()->create(['name' => 'Tier 0 Business', 'industry' => 'Fintech']);
        $tier0Business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $tier0Business->requirements()->create([
            'funding_amount' => 500000.00,
            'required_experience_level' => 'Senior',
        ]);

        $tier1Founder = $this->createFounderUser();
        $tier1Business = $tier1Founder->founderProfile->businesses()->create(['name' => 'Tier 1 Business', 'industry' => 'Fintech']);
        $tier1Business->forceFill(['status' => BusinessStatus::Submitted])->save();
        $tier1Business->requirements()->create([
            'funding_amount' => 500000.00,
            'required_experience_level' => 'Senior',
        ]);

        $this->app['auth']->forgetGuards();
        $res = $this->actingAs($tier1Investor, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        $bIds = array_column($res->json('data'), 'id');
        $this->assertContains($tier1Business->id, $bIds);
        $this->assertNotContains($tier0Business->id, $bIds, 'Business of Tier 0 founder must not be recommended to investor');
    }

    public function test_business_opportunity_filtering_for_investors_and_professionals(): void
    {
        $founder = $this->createFounderUser();

        // Business A: Seeking funding only (funding_amount > 0), no professional skills/roles
        $bizFundingOnly = $founder->founderProfile->businesses()->create([
            'name' => 'Funding Only Business',
            'industry' => 'Fintech',
        ]);
        $bizFundingOnly->forceFill(['status' => BusinessStatus::Submitted])->save();
        $bizFundingOnly->requirements()->create([
            'funding_amount' => 1500000.00,
            'required_experience_level' => null,
            'required_availability' => null,
        ]);

        // Business B: Seeking professional only (required_experience_level set, skills set), no funding
        $bizProfOnly = $founder->founderProfile->businesses()->create([
            'name' => 'Professional Only Business',
            'industry' => 'Software',
        ]);
        $bizProfOnly->forceFill(['status' => BusinessStatus::Submitted])->save();
        $reqB = $bizProfOnly->requirements()->create([
            'funding_amount' => null,
            'required_experience_level' => 'Senior',
            'required_availability' => 'Full-Time',
        ]);
        $skill = Skill::create(['name' => 'Laravel', 'normalized_name' => 'laravel']);
        $reqB->skills()->attach($skill->id);

        $investor = $this->createInvestorUser(['industry' => 'Fintech']);
        $prof = $this->createProfessionalUser(['experience_level' => 'Senior'], ['Laravel']);

        // Investor query: includes Business A, excludes Business B
        $resInvestor = $this->actingAs($investor, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();
        $investorBIds = array_column($resInvestor->json('data'), 'id');
        $this->assertContains($bizFundingOnly->id, $investorBIds);
        $this->assertNotContains($bizProfOnly->id, $investorBIds, 'Business not seeking funding must be excluded for investors');

        // Professional query: includes Business B, excludes Business A
        $this->app['auth']->forgetGuards();
        $resProf = $this->actingAs($prof, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();
        $profBIds = array_column($resProf->json('data'), 'id');
        $this->assertContains($bizProfOnly->id, $profBIds);
        $this->assertNotContains($bizFundingOnly->id, $profBIds, 'Business not seeking professionals must be excluded for professionals');
    }

    public function test_safe_candidate_payload_fields_and_no_sensitive_leakage(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Fintech Core',
            'industry' => 'Fintech',
        ]);
        $business->requirements()->create(['funding_amount' => 500000.00]);

        $investor = $this->createInvestorUser();

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/investors")
            ->assertOk();

        $item = $res->json('data.0');
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('user_id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('verification_tier', $item);
        $this->assertArrayHasKey('verification_tier_label', $item);
        $this->assertArrayHasKey('industry', $item);
        $this->assertArrayHasKey('match', $item);

        // Security check: ensure NO sensitive fields exist
        $this->assertArrayNotHasKey('password', $item);
        $this->assertArrayNotHasKey('remember_token', $item);
        $this->assertArrayNotHasKey('two_factor_secret', $item);
        $this->assertArrayNotHasKey('email_verified_at', $item);
        $this->assertArrayNotHasKey('verification_evidence', $item);
    }

    public function test_full_match_result_explainability_structure(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Dhaka Health',
            'industry' => 'Healthcare',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'expected_involvement' => 'Advisory',
            'location' => 'Dhaka',
        ]);
        $business->requirements()->create(['funding_amount' => 1000000.00]);

        $investor = $this->createInvestorUser([
            'industry' => 'Healthcare',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'location' => 'Dhaka',
            'involvement' => 'Advisory',
            'available_investment' => 2000000.00,
            'minimum_investment' => 500000.00,
            'maximum_investment' => 1500000.00,
        ]);

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/investors")
            ->assertOk();

        $match = $res->json('data.0.match');
        $this->assertIsInt($match['overall_score']);
        $this->assertIsString($match['match_grade']);
        $this->assertIsString($match['summary_explanation']);
        $this->assertCount(6, $match['factors']);
        $this->assertIsArray($match['strongest_alignments']);
        $this->assertIsArray($match['potential_gaps']);
        $this->assertSame(
            'Match scores are recommendations, not guarantees. Review the underlying information before making decisions.',
            $match['disclaimer']
        );

        $factor = $match['factors'][0];
        $this->assertArrayHasKey('factor_key', $factor);
        $this->assertArrayHasKey('factor_name', $factor);
        $this->assertArrayHasKey('weight', $factor);
        $this->assertArrayHasKey('score', $factor);
        $this->assertArrayHasKey('weighted_score', $factor);
        $this->assertArrayHasKey('strength', $factor);
        $this->assertArrayHasKey('explanation', $factor);
    }

    public function test_match_detail_endpoint_access_and_draft_protection(): void
    {
        $founder = $this->createFounderUser();
        $investor = $this->createInvestorUser();
        $prof = $this->createProfessionalUser([], ['PHP']);
        $otherUser = $this->createFounderUser();

        $draftBusiness = $founder->founderProfile->businesses()->create([
            'name' => 'Draft Business',
            'industry' => 'Fintech',
        ]);
        $draftBusiness->requirements()->create(['funding_amount' => 1000000.00]);

        $publishedBusiness = $founder->founderProfile->businesses()->create([
            'name' => 'Published Business',
            'industry' => 'Fintech',
        ]);
        $publishedBusiness->forceFill(['status' => BusinessStatus::Submitted])->save();
        $publishedBusiness->requirements()->create(['funding_amount' => 1000000.00]);

        $investorProfileId = $investor->investorProfile->id;
        $profProfileId = $prof->professionalProfile->id;

        // 1. Founder can view detail for their own draft business ↔ investor
        $this->app['auth']->forgetGuards();
        $this->actingAs($founder, 'web')
            ->getJson("/api/me/matches/businesses/{$draftBusiness->id}/investors/{$investorProfileId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business.name', 'Draft Business');

        // 2. Investor cannot view detail for draft business (404 protection)
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$draftBusiness->id}/investors/{$investorProfileId}")
            ->assertNotFound();

        // 3. Investor CAN view detail for published business
        $this->app['auth']->forgetGuards();
        $this->actingAs($investor, 'web')
            ->getJson("/api/me/matches/businesses/{$publishedBusiness->id}/investors/{$investorProfileId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business.name', 'Published Business')
            ->assertJsonPath('data.investor.id', $investorProfileId);

        // 4. Professional can view detail for published business
        $this->app['auth']->forgetGuards();
        $this->actingAs($prof, 'web')
            ->getJson("/api/me/matches/businesses/{$publishedBusiness->id}/professionals/{$profProfileId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business.name', 'Published Business')
            ->assertJsonPath('data.professional.id', $profProfileId);

        // 5. Unrelated user gets 403 Forbidden
        $this->app['auth']->forgetGuards();
        $this->actingAs($otherUser, 'web')
            ->getJson("/api/me/matches/businesses/{$publishedBusiness->id}/investors/{$investorProfileId}")
            ->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->actingAs($otherUser, 'web')
            ->getJson("/api/me/matches/businesses/{$publishedBusiness->id}/professionals/{$profProfileId}")
            ->assertForbidden();
    }
}
