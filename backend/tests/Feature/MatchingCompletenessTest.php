<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Skill;
use App\Models\User;
use App\Services\Matching\MatchingCompletenessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchingCompletenessTest extends TestCase
{
    use RefreshDatabase;

    private MatchingCompletenessService $completenessService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->completenessService = new MatchingCompletenessService;
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

    public function test_complete_investor_matching_data(): void
    {
        $investor = $this->createInvestorUser();
        $result = $this->completenessService->evaluateInvestor($investor->investorProfile->preferences);

        $this->assertTrue($result['is_complete']);
        $this->assertEmpty($result['missing_fields']);
        $this->assertEmpty($result['guidance_messages']);
        $this->assertCount(3, $result);
        $this->assertArrayHasKey('is_complete', $result);
        $this->assertArrayHasKey('missing_fields', $result);
        $this->assertArrayHasKey('guidance_messages', $result);
    }

    public function test_incomplete_investor_data(): void
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $profile = $user->investorProfile()->firstOrCreate([]);
        $pref = $profile->preferences()->firstOrCreate([
            'industry' => null,
            'business_stage' => '',
            'risk_level' => null,
            'location' => null,
            'involvement' => null,
            'available_investment' => null,
            'minimum_investment' => null,
            'maximum_investment' => null,
        ]);

        $result = $this->completenessService->evaluateInvestor($pref);

        $this->assertFalse($result['is_complete']);
        $this->assertSame([
            'industry',
            'investment_range',
            'business_stage',
            'risk_level',
            'location',
            'involvement',
        ], $result['missing_fields']);

        $this->assertCount(6, $result['guidance_messages']);
        $this->assertSame('Set your preferred industry to improve match accuracy.', $result['guidance_messages'][0]);
        $this->assertSame('Configure your investment range or available capital to improve match accuracy.', $result['guidance_messages'][1]);
        $this->assertSame('Specify your preferred business stage to improve match accuracy.', $result['guidance_messages'][2]);
        $this->assertSame('Set your risk tolerance to improve match accuracy.', $result['guidance_messages'][3]);
        $this->assertSame('Specify your preferred location to improve match accuracy.', $result['guidance_messages'][4]);
        $this->assertSame('Specify your expected involvement level to improve match accuracy.', $result['guidance_messages'][5]);
    }

    public function test_complete_professional_matching_data(): void
    {
        $prof = $this->createProfessionalUser([], ['Laravel', 'React']);
        $result = $this->completenessService->evaluateProfessional($prof->professionalProfile);

        $this->assertTrue($result['is_complete']);
        $this->assertEmpty($result['missing_fields']);
        $this->assertEmpty($result['guidance_messages']);
    }

    public function test_incomplete_professional_data(): void
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $profile = $user->professionalProfile()->firstOrCreate([
            'industry_experience' => [],
            'experience_level' => null,
            'availability' => null,
            'location' => null,
            'compensation_preferences' => [],
        ]);

        $result = $this->completenessService->evaluateProfessional($profile);

        $this->assertFalse($result['is_complete']);
        $this->assertSame([
            'skills',
            'industry_experience',
            'experience_level',
            'availability',
            'location',
            'compensation_preferences',
        ], $result['missing_fields']);

        $this->assertCount(6, $result['guidance_messages']);
        $this->assertSame('Add relevant skills to improve professional matching.', $result['guidance_messages'][0]);
        $this->assertSame('Specify your industry experience to improve match accuracy.', $result['guidance_messages'][1]);
        $this->assertSame('Set your experience level to improve match accuracy.', $result['guidance_messages'][2]);
        $this->assertSame('Specify your availability to improve match accuracy.', $result['guidance_messages'][3]);
        $this->assertSame('Specify your location or remote preference to improve match accuracy.', $result['guidance_messages'][4]);
        $this->assertSame('Specify your compensation preferences to improve match accuracy.', $result['guidance_messages'][5]);
    }

    public function test_complete_business_matching_data(): void
    {
        $businessData = [
            'industry' => 'FinTech',
            'stage' => 'Early stage',
            'location' => 'Dhaka',
            'investment_amount' => '500000.00',
        ];

        $requirementData = [
            'risk_level' => 'Moderate',
            'involvement_level' => 'Advisory',
            'investment_amount' => '500000.00',
            'location_preference' => 'Dhaka',
            'minimum_experience_level' => 'Senior',
            'commitment_type' => 'Full time',
            'equity_offered' => '5.00',
            'skills' => ['PHP', 'Laravel', 'React'],
        ];

        $investorResult = $this->completenessService->evaluateBusinessForInvestor($businessData, $requirementData);
        $this->assertTrue($investorResult['is_complete']);
        $this->assertEmpty($investorResult['missing_fields']);
        $this->assertEmpty($investorResult['guidance_messages']);

        $profResult = $this->completenessService->evaluateBusinessForProfessional($businessData, $requirementData);
        $this->assertTrue($profResult['is_complete']);
        $this->assertEmpty($profResult['missing_fields']);
        $this->assertEmpty($profResult['guidance_messages']);

        $generalResult = $this->completenessService->evaluateBusiness($businessData, $requirementData);
        $this->assertTrue($generalResult['is_complete']);
        $this->assertEmpty($generalResult['missing_fields']);
    }

    public function test_incomplete_business_matching_data(): void
    {
        $businessData = [
            'industry' => '',
            'stage' => null,
            'location' => null,
            'investment_amount' => null,
        ];

        $requirementData = [
            'risk_level' => null,
            'involvement_level' => null,
            'investment_amount' => null,
            'location_preference' => null,
            'minimum_experience_level' => null,
            'commitment_type' => null,
            'skills' => [],
        ];

        $investorResult = $this->completenessService->evaluateBusinessForInvestor($businessData, $requirementData);
        $this->assertFalse($investorResult['is_complete']);
        $this->assertSame([
            'industry',
            'investment_amount',
            'stage',
            'risk_level',
            'location',
            'involvement_level',
        ], $investorResult['missing_fields']);
        $this->assertCount(6, $investorResult['guidance_messages']);

        $profResult = $this->completenessService->evaluateBusinessForProfessional($businessData, $requirementData);
        $this->assertFalse($profResult['is_complete']);
        $this->assertSame([
            'industry',
            'skills',
            'minimum_experience_level',
            'commitment_type',
            'location',
            'compensation_offered',
        ], $profResult['missing_fields']);
        $this->assertCount(6, $profResult['guidance_messages']);
    }

    public function test_unsupported_fallback_fields_do_not_falsely_mark_factors_as_complete(): void
    {
        // 1. Professional: experience_sectors or hours_per_week should NOT mark industry_experience or availability as complete
        $unsupportedProfData = [
            'experience_sectors' => ['Software', 'Fintech'], // invalid fallback
            'hours_per_week' => 40, // invalid fallback
            'industry_experience' => [], // actual matcher input is empty
            'availability' => null, // actual matcher input is null
            'experience_level' => 'Senior',
            'location' => 'Dhaka',
            'compensation_preferences' => ['salary'],
            'skills' => ['PHP'],
        ];

        $profResult = $this->completenessService->evaluateProfessional($unsupportedProfData);
        $this->assertFalse($profResult['is_complete']);
        $this->assertContains('industry_experience', $profResult['missing_fields']);
        $this->assertContains('availability', $profResult['missing_fields']);

        // 2. Business: headquarters_location or business_stage (when matcher expects stage) should NOT mark factors
        $unsupportedBusinessData = [
            'industry' => 'Technology',
            'headquarters_location' => 'Dhaka', // unsupported fallback
            'business_stage' => 'Growth', // matcher reads 'stage'
            'location' => null,
            'stage' => null,
        ];
        $unsupportedReqData = [
            'funding_amount' => 1000000, // matcher reads 'investment_amount'
            'required_experience_level' => 'Senior', // matcher reads 'minimum_experience_level'
            'required_availability' => 'Full-time', // matcher reads 'commitment_type'
            'investment_amount' => null,
            'minimum_experience_level' => null,
            'commitment_type' => null,
            'risk_level' => null,
            'involvement_level' => null,
            'skills' => [],
        ];

        $bizInvResult = $this->completenessService->evaluateBusinessForInvestor($unsupportedBusinessData, $unsupportedReqData);
        $this->assertFalse($bizInvResult['is_complete']);
        $this->assertContains('investment_amount', $bizInvResult['missing_fields']);
        $this->assertContains('stage', $bizInvResult['missing_fields']);
        $this->assertContains('risk_level', $bizInvResult['missing_fields']);
        $this->assertContains('location', $bizInvResult['missing_fields']);
        $this->assertContains('involvement_level', $bizInvResult['missing_fields']);

        $bizProfResult = $this->completenessService->evaluateBusinessForProfessional($unsupportedBusinessData, $unsupportedReqData);
        $this->assertFalse($bizProfResult['is_complete']);
        $this->assertContains('minimum_experience_level', $bizProfResult['missing_fields']);
        $this->assertContains('commitment_type', $bizProfResult['missing_fields']);
        $this->assertContains('location', $bizProfResult['missing_fields']);
    }

    public function test_valid_zero_and_low_values_are_not_treated_as_missing(): void
    {
        // 0.00 investment amount or 0 minimum investment is a valid numeric value
        $investorData = [
            'industry' => 'Fintech',
            'business_stage' => 'Early Stage',
            'risk_level' => 'Low',
            'location' => 'Dhaka',
            'involvement' => 'Hands-on',
            'minimum_investment' => 0,
            'maximum_investment' => 100000,
            'available_investment' => 100000,
        ];

        $result = $this->completenessService->evaluateInvestor($investorData);
        $this->assertTrue($result['is_complete']);
        $this->assertEmpty($result['missing_fields']);

        $businessData = [
            'industry' => 'Agriculture',
            'stage' => 'Seed',
            'location' => 'Sylhet',
            'investment_amount' => '0.00',
        ];
        $reqData = [
            'risk_level' => 'Conservative',
            'involvement_level' => 'Flexible',
            'investment_amount' => 0.00,
        ];

        $resBiz = $this->completenessService->evaluateBusinessForInvestor($businessData, $reqData);
        $this->assertTrue($resBiz['is_complete']);
        $this->assertEmpty($resBiz['missing_fields']);
    }

    public function test_deterministic_guidance_ordering_and_english_only(): void
    {
        $result = $this->completenessService->evaluateInvestor(null);

        // Deterministic sequence
        $this->assertSame('industry', $result['missing_fields'][0]);
        $this->assertSame('investment_range', $result['missing_fields'][1]);
        $this->assertSame('business_stage', $result['missing_fields'][2]);
        $this->assertSame('risk_level', $result['missing_fields'][3]);
        $this->assertSame('location', $result['missing_fields'][4]);
        $this->assertSame('involvement', $result['missing_fields'][5]);

        // English only ASCII verification
        foreach ($result['guidance_messages'] as $msg) {
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9\s\.,\-\'\(\)]+$/', $msg);
        }
    }

    public function test_no_unsupported_fields_returned(): void
    {
        $result = $this->completenessService->evaluateInvestor([]);

        $keys = array_keys($result);
        sort($keys);
        $this->assertSame(['guidance_messages', 'is_complete', 'missing_fields'], $keys);
        $this->assertArrayNotHasKey('completion_percentage', $result);
        $this->assertArrayNotHasKey('score', $result);
        $this->assertArrayNotHasKey('confidence', $result);
    }

    public function test_recommendation_endpoints_include_data_completeness_in_meta(): void
    {
        $founder = $this->createFounderUser();
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Demo Biz',
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'risk_level' => 'Moderate',
            'location' => 'Dhaka',
            'expected_involvement' => 'Advisory',
        ]);
        $business->requirements()->create([
            'funding_amount' => 1000000.00,
        ]);

        $this->createInvestorUser(['industry' => 'Fintech']);

        $res = $this->actingAs($founder, 'web')
            ->getJson("/api/me/businesses/{$business->id}/recommendations/investors")
            ->assertOk();

        $meta = $res->json('meta');
        $this->assertNotNull($meta);
        $this->assertArrayHasKey('data_completeness', $meta);

        // Incomplete investor querying businesses
        $tier1User = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $tier1User->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $tier1User->investorProfile()->firstOrCreate([]); // unconfigured preferences

        $this->app['auth']->forgetGuards();
        $resInvestor = $this->actingAs($tier1User, 'web')
            ->getJson('/api/me/recommendations/businesses')
            ->assertOk();

        $metaInv = $resInvestor->json('meta');
        $this->assertNotNull($metaInv);
        $this->assertFalse($metaInv['data_completeness']['is_complete']);
        $this->assertContains('industry', $metaInv['data_completeness']['missing_fields']);
        $this->assertContains('investment_range', $metaInv['data_completeness']['missing_fields']);
    }
}
