<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessInterest;
use App\Models\Skill;
use App\Models\User;
use App\Services\Deal\DealService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class DealServiceTest extends TestCase
{
    use RefreshDatabase;

    private DealService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(DealService::class);
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

    private function createBusiness(User $founder): Business
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
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 50000.00,
            'accepted_investment_types' => ['equity', 'safe'],
            'micro_proposed_terms' => 'Micro terms.',
            'large_standard_proposed_terms' => 'Standard terms.',
            'required_experience_level' => 'Senior',
            'required_availability' => 'Part-time',
            'compensation_preferences' => ['equity'],
        ]);

        $skill = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $req->skills()->sync([$skill->id]);

        return $business;
    }

    private function createConnection(Business $business, User $founder, User $counterparty): BusinessConnection
    {
        return BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => ParticipantRole::Investor,
        ]);
    }

    public function test_service_create_deal_establishes_matched_state_and_history(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        $deal = $this->service->createDealFromConnection($connection, $founder);

        $this->assertSame(DealStage::Matched, $deal->stage);
        $this->assertDatabaseHas('deal_state_histories', [
            'deal_id' => $deal->id,
            'previous_state' => null,
            'new_state' => 'matched',
            'changed_by_user_id' => $founder->id,
        ]);
    }

    public function test_service_unauthorized_user_is_forbidden_to_access_deal(): void
    {
        $founder = $this->createFounder('f1@example.com');
        $investor = $this->createInvestor('inv@example.com');
        $unrelated = $this->createInvestor('unrelated@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        $deal = $this->service->createDealFromConnection($connection, $founder);

        $this->expectException(HttpException::class);
        $this->service->getDealRoom($deal, $unrelated);
    }

    public function test_service_transition_advances_and_records_history(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        BusinessInterest::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'expressed_by_user_id' => $founder->id,
            'status' => 'active',
        ]);
        BusinessInterest::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'expressed_by_user_id' => $investor->id,
            'status' => 'active',
        ]);

        $deal = $this->service->createDealFromConnection($connection, $founder);

        $updatedDeal = $this->service->transitionDeal($deal, $founder, 'interest_confirmed');

        $this->assertSame(DealStage::InterestConfirmed, $updatedDeal->stage);

        $histories = $this->service->getDealHistory($updatedDeal, $founder);
        $this->assertCount(2, $histories);
        $this->assertSame(DealStage::InterestConfirmed, $histories[1]->new_state);
        $this->assertSame(DealStage::Matched, $histories[1]->previous_state);
    }

    public function test_service_invalid_transition_throws_validation_exception(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        $deal = $this->service->createDealFromConnection($connection, $founder);

        $this->expectException(ValidationException::class);
        $this->service->transitionDeal($deal, $founder, 'completed');
    }

    public function test_service_cannot_create_duplicate_active_deal_for_same_connection(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor);

        // First creation succeeds
        $deal = $this->service->createDealFromConnection($connection, $founder);
        $this->assertNotNull($deal->id);

        // Second creation from same connection throws ValidationException
        $this->expectException(ValidationException::class);
        $this->service->createDealFromConnection($connection, $founder);
    }
}
