<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealStateHistory;
use App\Models\Skill;
use App\Models\User;
use App\Services\Deal\DealService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessNdaDealLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createFounder(string $email = 'founder@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(string $email = 'investor@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(string $email = 'pro@example.com', VerificationTier $tier = VerificationTier::Tier1): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
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

    private function createConnection(
        Business $business,
        User $founder,
        User $counterparty,
        ParticipantRole $role
    ): BusinessConnection {
        return BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
        ]);
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role,
        DisclosureStage $stage = DisclosureStage::Extended
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => now(),
        ]);
    }

    private function createDealAtStage(
        BusinessConnection $connection,
        DealStage $stage = DealStage::DealRoomOpened
    ): Deal {
        $deal = Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $connection->business_id,
            'founder_user_id' => $connection->founder_user_id,
            'counterparty_user_id' => $connection->counterparty_user_id,
            'counterparty_role' => $connection->counterparty_role,
            'stage' => $stage,
        ]);

        DealStateHistory::create([
            'deal_id' => $deal->id,
            'previous_state' => null,
            'new_state' => $stage,
            'changed_by_user_id' => $connection->founder_user_id,
            'changed_at' => now(),
        ]);

        return $deal;
    }

    public function test_founder_requests_first_professional_accepts_second_advances_deal_to_nda_signed(): void
    {
        $founder = $this->createFounder('founder1@example.com');
        $pro = $this->createProfessional('pro1@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        $initialHistoriesCount = DealStateHistory::where('deal_id', $deal->id)->count();

        // 1. Founder requests NDA (founder automatically accepts)
        $reqRes = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ]);
        $reqRes->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.founder_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', false);

        // Deal is still at deal_room_opened
        $deal->refresh();
        $this->assertSame(DealStage::DealRoomOpened, $deal->stage);
        $this->assertSame($initialHistoriesCount, DealStateHistory::where('deal_id', $deal->id)->count());

        // 2. Professional accepts NDA second
        $acceptRes = $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'professional',
        ]);
        $acceptRes->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.founder_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', true)
            ->assertJsonPath('data.stage_3_unlocked', true);

        // Deal automatically advanced to nda_signed
        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);

        // Exactly one new DealStateHistory record is created
        $histories = DealStateHistory::where('deal_id', $deal->id)->orderBy('id')->get();
        $this->assertCount($initialHistoriesCount + 1, $histories);
        $latestHistory = $histories->last();
        $this->assertSame(DealStage::DealRoomOpened, $latestHistory->previous_state);
        $this->assertSame(DealStage::NdaSigned, $latestHistory->new_state);
        $this->assertSame($pro->id, $latestHistory->changed_by_user_id);
    }

    public function test_founder_requests_first_investor_accepts_second_advances_deal_to_nda_signed(): void
    {
        $founder = $this->createFounder('founder2@example.com');
        $investor = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        $initialHistoriesCount = DealStateHistory::where('deal_id', $deal->id)->count();

        // 1. Founder requests NDA
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // 2. Investor accepts NDA
        $acceptRes = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'investor',
        ]);
        $acceptRes->assertOk()->assertJsonPath('data.status', 'active');

        // Deal automatically advanced to nda_signed
        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);

        $histories = DealStateHistory::where('deal_id', $deal->id)->orderBy('id')->get();
        $this->assertCount($initialHistoriesCount + 1, $histories);
        $latestHistory = $histories->last();
        $this->assertSame(DealStage::DealRoomOpened, $latestHistory->previous_state);
        $this->assertSame(DealStage::NdaSigned, $latestHistory->new_state);
        $this->assertSame($investor->id, $latestHistory->changed_by_user_id);
    }

    public function test_investor_requests_first_founder_accepts_second_advances_deal_to_nda_signed(): void
    {
        $founder = $this->createFounder('founder3@example.com');
        $investor = $this->createInvestor('inv3@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        // 1. Investor requests NDA (investor accepted, founder pending)
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'role' => 'investor',
        ])->assertOk()->assertJsonPath('data.status', 'pending');

        $deal->refresh();
        $this->assertSame(DealStage::DealRoomOpened, $deal->stage);

        // 2. Founder accepts NDA
        $acceptRes = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'counterparty_user_id' => $investor->id,
        ]);
        $acceptRes->assertOk()->assertJsonPath('data.status', 'active');

        // Deal automatically advanced
        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);

        $latestHistory = DealStateHistory::where('deal_id', $deal->id)->orderByDesc('id')->first();
        $this->assertSame(DealStage::DealRoomOpened, $latestHistory->previous_state);
        $this->assertSame(DealStage::NdaSigned, $latestHistory->new_state);
        $this->assertSame($founder->id, $latestHistory->changed_by_user_id);
    }

    public function test_tier_0_participant_cannot_activate_and_does_not_advance_deal(): void
    {
        $founder = $this->createFounder('founder4@example.com');
        $pro = $this->createProfessional('pro4@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        // Founder requests NDA
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $pro->id,
            'role' => 'professional',
        ])->assertOk();

        // Unverified professional attempts to accept
        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'professional',
        ])->assertForbidden();

        $deal->refresh();
        $this->assertSame(DealStage::DealRoomOpened, $deal->stage);
    }

    public function test_later_stage_deal_is_not_regressed_when_nda_is_activated(): void
    {
        $founder = $this->createFounder('founder5@example.com');
        $investor = $this->createInvestor('inv5@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::Negotiation);

        $historiesCountBefore = DealStateHistory::where('deal_id', $deal->id)->count();

        // 1. Founder requests NDA
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        // 2. Investor accepts NDA
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'investor',
        ])->assertOk();

        $deal->refresh();
        $this->assertSame(DealStage::Negotiation, $deal->stage);
        $this->assertSame($historiesCountBefore, DealStateHistory::where('deal_id', $deal->id)->count());
    }

    public function test_unrelated_deal_is_untouched(): void
    {
        $founder = $this->createFounder('founder6@example.com');
        $targetPro = $this->createProfessional('target_pro@example.com');
        $unrelatedInvestor = $this->createInvestor('unrelated_inv@example.com');

        $business = $this->createBusiness($founder);

        $targetConnection = $this->createConnection($business, $founder, $targetPro, ParticipantRole::Professional);
        $this->createRelationship($business, $targetPro, ParticipantRole::Professional, DisclosureStage::Extended);
        $targetDeal = $this->createDealAtStage($targetConnection, DealStage::DealRoomOpened);

        $unrelatedConnection = $this->createConnection($business, $founder, $unrelatedInvestor, ParticipantRole::Investor);
        $this->createRelationship($business, $unrelatedInvestor, ParticipantRole::Investor, DisclosureStage::Extended);
        $unrelatedDeal = $this->createDealAtStage($unrelatedConnection, DealStage::DealRoomOpened);

        // Founder requests and targetPro accepts NDA
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $targetPro->id,
            'role' => 'professional',
        ])->assertOk();

        $this->actingAs($targetPro)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'professional',
        ])->assertOk();

        $targetDeal->refresh();
        $unrelatedDeal->refresh();

        $this->assertSame(DealStage::NdaSigned, $targetDeal->stage);
        $this->assertSame(DealStage::DealRoomOpened, $unrelatedDeal->stage);
    }

    public function test_domain_reconciliation_safely_advances_historical_inconsistent_deal(): void
    {
        $founder = $this->createFounder('founder7@example.com');
        $pro = $this->createProfessional('pro7@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        // Create an active NDA directly simulating historical state
        BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => ParticipantRole::Professional,
            'status' => NdaStatus::Active,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $founder->id,
            'requested_at' => now(),
            'founder_accepted_at' => now(),
            'counterparty_accepted_at' => now(),
            'activated_at' => now(),
        ]);

        $dealService = app(DealService::class);
        $reconciledDeal = $dealService->reconcileNdaSignedStage($deal, $pro);

        $this->assertSame(DealStage::NdaSigned, $reconciledDeal->stage);
        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);

        $latestHistory = DealStateHistory::where('deal_id', $deal->id)->orderByDesc('id')->first();
        $this->assertSame(DealStage::DealRoomOpened, $latestHistory->previous_state);
        $this->assertSame(DealStage::NdaSigned, $latestHistory->new_state);
        $this->assertSame($pro->id, $latestHistory->changed_by_user_id);
    }

    public function test_professional_requests_first_founder_accepts_second_advances_deal_to_nda_signed(): void
    {
        $founder = $this->createFounder('founder8@example.com');
        $pro = $this->createProfessional('pro8@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        // 1. Professional requests NDA (pro accepted, founder pending)
        $this->actingAs($pro)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'role' => 'professional',
        ])->assertOk()->assertJsonPath('data.status', 'pending');

        $deal->refresh();
        $this->assertSame(DealStage::DealRoomOpened, $deal->stage);

        // 2. Founder accepts NDA
        $acceptRes = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'counterparty_user_id' => $pro->id,
        ]);
        $acceptRes->assertOk()->assertJsonPath('data.status', 'active');

        // Deal automatically advanced
        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);

        $latestHistory = DealStateHistory::where('deal_id', $deal->id)->orderByDesc('id')->first();
        $this->assertSame(DealStage::DealRoomOpened, $latestHistory->previous_state);
        $this->assertSame(DealStage::NdaSigned, $latestHistory->new_state);
        $this->assertSame($founder->id, $latestHistory->changed_by_user_id);
    }

    public function test_already_nda_signed_deal_does_not_duplicate_history(): void
    {
        $founder = $this->createFounder('founder9@example.com');
        $investor = $this->createInvestor('inv9@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $investor, ParticipantRole::Investor);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::NdaSigned);

        $historiesCountBefore = DealStateHistory::where('deal_id', $deal->id)->count();

        // Founder requests NDA and Investor accepts
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $investor->id,
            'role' => 'investor',
        ])->assertOk();

        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/accept", [
            'role' => 'investor',
        ])->assertOk();

        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);
        $this->assertSame($historiesCountBefore, DealStateHistory::where('deal_id', $deal->id)->count());
    }

    public function test_artisan_command_reconciles_deal_lifecycle(): void
    {
        $founder = $this->createFounder('founder10@example.com');
        $pro = $this->createProfessional('pro10@example.com');
        $business = $this->createBusiness($founder);
        $connection = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);
        $deal = $this->createDealAtStage($connection, DealStage::DealRoomOpened);

        BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => ParticipantRole::Professional,
            'status' => NdaStatus::Active,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $founder->id,
            'requested_at' => now(),
            'founder_accepted_at' => now(),
            'counterparty_accepted_at' => now(),
            'activated_at' => now(),
        ]);

        $this->artisan('deals:reconcile-nda-lifecycle', ['deal_id' => $deal->id])
            ->expectsOutput("Deal #{$deal->id} reconciled: deal_room_opened -> nda_signed")
            ->assertSuccessful();

        $deal->refresh();
        $this->assertSame(DealStage::NdaSigned, $deal->stage);
    }
}
