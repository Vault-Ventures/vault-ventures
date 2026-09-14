<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\Skill;
use App\Models\User;
use App\Services\Connection\ConnectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class BusinessConnectionServiceTest extends TestCase
{
    use RefreshDatabase;

    private ConnectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ConnectionService::class);
    }

    private function createFounder(string $email = 'founder@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(string $email = 'investor@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(string $email = 'pro@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, BusinessStatus $status = BusinessStatus::Submitted): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'Secure Pay Ltd';
        $business->description = 'Fintech infrastructure in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = $status;
        $business->submitted_at = $status === BusinessStatus::Submitted ? now() : null;
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 50000.00,
            'accepted_investment_types' => ['equity', 'safe'],
            'micro_proposed_terms' => 'Micro terms for angel checks up to $10k.',
            'large_standard_proposed_terms' => 'Standard SAFE note with $5M valuation cap.',
            'required_experience_level' => 'Senior',
            'required_availability' => 'Part-time (10h/week)',
            'compensation_preferences' => ['equity'],
        ]);

        $skill = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $req->skills()->sync([$skill->id]);

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => DisclosureStage::Extended,
            'interest_expressed_at' => now(),
        ]);
    }

    public function test_service_founder_cannot_express_interest_toward_self(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->expectException(ValidationException::class);
        $this->service->expressFounderInterest($business, $founder, $founder, 'investor');
    }

    public function test_service_non_owner_founder_is_forbidden(): void
    {
        $founder1 = $this->createFounder('f1@example.com');
        $founder2 = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder1);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->expectException(HttpException::class);
        $this->service->expressFounderInterest($business, $founder2, $investor, 'investor');
    }

    public function test_service_reciprocal_interest_without_founder_interest_throws_validation_exception(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $this->expectException(ValidationException::class);
        $this->service->expressReciprocalInterest($business, $investor, 'investor');
    }

    public function test_service_connection_is_created_when_reciprocal_interest_is_expressed(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor);

        $founderResult = $this->service->expressFounderInterest($business, $founder, $investor, 'investor');
        $this->assertFalse($founderResult['is_mutual']);
        $this->assertNull($founderResult['connection']);

        $reciprocalResult = $this->service->expressReciprocalInterest($business, $investor, 'investor');
        $this->assertTrue($reciprocalResult['is_mutual']);
        $this->assertInstanceOf(BusinessConnection::class, $reciprocalResult['connection']);
        $this->assertSame($business->id, $reciprocalResult['connection']->business_id);
        $this->assertSame($founder->id, $reciprocalResult['connection']->founder_user_id);
        $this->assertSame($investor->id, $reciprocalResult['connection']->counterparty_user_id);
    }
}
