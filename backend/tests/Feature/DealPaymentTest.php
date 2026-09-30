<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealMilestone;
use App\Models\DealPayment;
use App\Models\DealTermProposal;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
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

    private function createBusiness(User $founder): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'NovaTech AI Ltd';
        $business->description = 'Healthtech AI in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 100000.00,
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

    private function createConnection(
        Business $business,
        User $founder,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor
    ): BusinessConnection {
        return BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'status' => 'connected',
            'connected_at' => now(),
        ]);
    }

    private function createDeal(
        BusinessConnection $connection,
        DealStage $stage = DealStage::Agreement
    ): Deal {
        return Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $connection->business_id,
            'founder_user_id' => $connection->founder_user_id,
            'counterparty_user_id' => $connection->counterparty_user_id,
            'counterparty_role' => $connection->counterparty_role,
            'stage' => $stage,
        ]);
    }

    private function setupAgreement(Deal $deal, float $amount = 100000.00): DealAgreement
    {
        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $deal->founder_user_id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => $amount,
            'profit_sharing_percentage' => 10.00,
            'status' => 'accepted',
        ]);

        return DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'profit_sharing_agreement',
            'title' => 'Micro Investment Profit Sharing Agreement',
            'agreement_text' => 'Standard agreement text...',
            'terms_snapshot' => [
                'proposal_id' => $proposal->id,
                'amount' => $amount,
                'currency' => 'BDT',
                'investment_type' => 'micro_profit_sharing',
                'profit_sharing_percentage' => 10.00,
            ],
            'status' => 'accepted',
            'founder_signed_at' => now()->subDay(),
            'founder_signed_user_id' => $deal->founder_user_id,
            'counterparty_signed_at' => now()->subDay(),
            'counterparty_signed_user_id' => $deal->counterparty_user_id,
            'finalized_at' => now()->subDay(),
        ]);
    }

    public function test_investor_can_create_pending_payment_at_finalized_agreement_stage(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 50000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-TRX-12345',
            'note' => 'First tranche payment via bKash',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.payer_user_id', $investor->id)
            ->assertJsonPath('data.receiver_user_id', $founder->id)
            ->assertJsonPath('data.amount', 50000)
            ->assertJsonPath('data.payment_method', 'bkash')
            ->assertJsonPath('data.payment_method_label', 'bKash')
            ->assertJsonPath('data.transaction_reference', 'BK-TRX-12345')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.status_label', 'Pending')
            ->assertJsonPath('data.commission_rate', null)
            ->assertJsonPath('data.commission_amount', null)
            ->assertJsonPath('data.net_amount', null);

        $this->assertDatabaseHas('deal_payments', [
            'deal_id' => $deal->id,
            'amount' => 50000.00,
            'status' => 'pending',
            'transaction_reference' => 'BK-TRX-12345',
        ]);
    }

    public function test_investor_can_create_pending_payment_at_milestone_funding_active_stage(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::MilestoneFundingActive);
        $this->setupAgreement($deal, 80000.00);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 80000.00,
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'EBL-FT-998877',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', 80000);
    }

    public function test_blocked_before_agreement_stage(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Negotiation);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.stage'));
    }

    public function test_blocked_if_agreement_not_finalized(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);

        // Agreement with pending signatures (not finalized)
        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => 50000.00,
            'status' => 'accepted',
        ]);

        DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'profit_sharing_agreement',
            'title' => 'Agreement draft',
            'agreement_text' => 'Draft...',
            'terms_snapshot' => ['amount' => 50000.00],
            'status' => 'pending_signatures',
            'founder_signed_at' => null,
            'counterparty_signed_at' => null,
            'finalized_at' => null,
        ]);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.agreement'));
    }

    public function test_blocked_at_completed_stage(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Completed);
        $this->setupAgreement($deal, 100000.00);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.stage'));
    }

    public function test_blocked_for_professional_deal(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $pro, ParticipantRole::Professional);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 50000.00);

        $response = $this->actingAs($pro)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'professional',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.deal'));
    }

    public function test_blocked_if_agreed_amount_is_zero_or_missing(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing',
            'amount' => 0.00,
            'status' => 'accepted',
        ]);

        DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'profit_sharing_agreement',
            'title' => 'Agreement',
            'agreement_text' => 'Agreement text',
            'terms_snapshot' => ['amount' => 0.00],
            'status' => 'accepted',
            'founder_signed_at' => now()->subDay(),
            'founder_signed_user_id' => $founder->id,
            'counterparty_signed_at' => now()->subDay(),
            'counterparty_signed_user_id' => $investor->id,
            'finalized_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 1000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.agreement'));
    }

    public function test_founder_cannot_create_payment(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'founder',
        ]);

        $response->assertStatus(403);
    }

    public function test_unrelated_user_gets_403(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $unrelated = $this->createInvestor('unrelated@example.com');
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $response = $this->actingAs($unrelated)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-123',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(403);
    }

    public function test_overpayment_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 50000.00);

        // 1. Single payment exceeding total
        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 50000.01,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-OVER-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);
        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.amount'));

        // 2. Cumulative pending + completed exceeding total
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 30000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-VALID-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $response2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 25000.00,
            'payment_method' => 'nagad',
            'transaction_reference' => 'NG-OVER-2',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);
        $response2->assertStatus(422);
        $this->assertNotEmpty($response2->json('error.details.amount'));
    }

    public function test_card_number_looking_reference_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // 16-digit card format with dashes
        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'card',
            'transaction_reference' => '4532-1234-5678-9012',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.details.transaction_reference.0', 'Do not enter card numbers. Enter a receipt or reference ID only.');
    }

    public function test_missing_reference_rejected_for_digital_methods_and_allowed_for_cash_other(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // Missing reference for nagad => rejected
        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'nagad',
            'transaction_reference' => '',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);
        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.transaction_reference'));

        // Missing reference for cash_other => allowed
        $response2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'cash_other',
            'transaction_reference' => null,
            'note' => 'Handover in cash at office',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);
        $response2->assertCreated()
            ->assertJsonPath('data.payment_method', 'cash_other')
            ->assertJsonPath('data.payment_method_label', 'Cash / Other');
    }

    public function test_duplicate_reference_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-UNIQUE-99',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-UNIQUE-99',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.transaction_reference'));
    }

    public function test_future_payment_date_and_pre_agreement_date_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // Future date
        $responseFuture = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-FUTURE',
            'payment_date' => now()->addDay()->toDateString(),
            'role' => 'investor',
        ]);
        $responseFuture->assertStatus(422);
        $this->assertNotEmpty($responseFuture->json('error.details.payment_date'));

        // Date before finalized agreement date (agreement was finalized 1 day ago)
        $responsePast = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-PAST',
            'payment_date' => now()->subDays(5)->toDateString(),
            'role' => 'investor',
        ]);
        $responsePast->assertStatus(422);
        $this->assertNotEmpty($responsePast->json('error.details.payment_date'));
    }

    public function test_founder_confirms_pending_payment_to_completed_with_commission(): void
    {
        config(['platform.commission_rate' => 5.00]);

        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $createRes = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 50000.00,
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'TXN-BANK-555',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $paymentId = $createRes->json('data.id');

        // Founder confirms
        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'completed',
            'role' => 'founder',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $paymentId)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.status_label', 'Completed')
            ->assertJsonPath('data.commission_rate', 5)
            ->assertJsonPath('data.commission_amount', 2500)
            ->assertJsonPath('data.net_amount', 47500);

        $this->assertDatabaseHas('deal_payments', [
            'id' => $paymentId,
            'status' => 'completed',
            'commission_rate' => 5.00,
            'commission_amount' => 2500.00,
            'net_amount' => 47500.00,
            'status_updated_by_user_id' => $founder->id,
        ]);
    }

    public function test_founder_marks_pending_payment_as_failed(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $createRes = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 20000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-FAIL-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $paymentId = $createRes->json('data.id');

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'failed',
            'role' => 'founder',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.commission_rate', null)
            ->assertJsonPath('data.commission_amount', null)
            ->assertJsonPath('data.net_amount', null);
    }

    public function test_investor_cancels_own_pending_payment_and_cannot_confirm(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $createRes = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 20000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-CANCEL-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $paymentId = $createRes->json('data.id');

        // Investor attempts to confirm => forbidden
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'completed',
            'role' => 'investor',
        ])->assertStatus(403);

        // Investor cancels own pending => success
        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'cancelled',
            'role' => 'investor',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.status_label', 'Cancelled');
    }

    public function test_final_states_cannot_change_again(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        $createRes = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 10000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-FINAL-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $paymentId = $createRes->json('data.id');

        // Confirm to completed
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'completed',
            'role' => 'founder',
        ])->assertOk();

        // Try to modify completed payment => validation error
        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'failed',
            'role' => 'founder',
        ]);

        $response->assertStatus(422);
        $this->assertNotEmpty($response->json('error.details.status'));
    }

    public function test_milestone_deal_stage_and_funding_summary_remain_unchanged(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::MilestoneFundingActive);
        $agreement = $this->setupAgreement($deal, 100000.00);

        // Create milestone
        $milestone = DealMilestone::create([
            'deal_id' => $deal->id,
            'agreement_id' => $agreement->id,
            'sequence_order' => 1,
            'title' => 'Alpha MVP Release',
            'target_amount' => 100000.00,
            'status' => 'active',
            'progress_percentage' => 50,
        ]);

        // Create payment
        $createRes = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 50000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-ISOLATE-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $paymentId = $createRes->json('data.id');

        // Confirm payment
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$paymentId}/status", [
            'status' => 'completed',
            'role' => 'founder',
        ])->assertOk();

        // Verify deal stage has NOT changed
        $this->assertSame(DealStage::MilestoneFundingActive, $deal->fresh()->stage);

        // Verify milestone status and progress have NOT changed
        $milestoneFresh = $milestone->fresh();
        $this->assertSame('active', $milestoneFresh->status);
        $this->assertSame(50, $milestoneFresh->progress_percentage);
        $this->assertNull($milestoneFresh->funded_at);

        // Verify funding summary endpoint remains linked solely to milestone progress
        $summaryRes = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}/funding-summary?role=investor");
        $summaryRes->assertOk()
            ->assertJsonPath('data.total_committed_bdt', 100000)
            ->assertJsonPath('data.total_released_bdt', 0) // Milestones not yet confirmed/funded
            ->assertJsonPath('data.funding_progress_percentage', 0);
    }

    public function test_get_payments_returns_list_summary_and_eligibility(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $conn = $this->createConnection($business, $founder, $investor);
        $deal = $this->createDeal($conn, DealStage::Agreement);
        $this->setupAgreement($deal, 100000.00);

        // Create 2 payments
        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 40000.00,
            'payment_method' => 'bkash',
            'transaction_reference' => 'BK-LIST-1',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        $res2 = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/payments", [
            'amount' => 30000.00,
            'payment_method' => 'nagad',
            'transaction_reference' => 'NG-LIST-2',
            'payment_date' => now()->toDateString(),
            'role' => 'investor',
        ])->assertCreated();

        // Confirm second payment
        $payment2Id = $res2->json('data.id');
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/payments/{$payment2Id}/status", [
            'status' => 'completed',
            'role' => 'founder',
        ])->assertOk();

        $listRes = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}/payments?role=investor");
        $listRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.summary.agreed_amount_bdt', 100000)
            ->assertJsonPath('data.summary.total_pending_bdt', 40000)
            ->assertJsonPath('data.summary.total_completed_bdt', 30000)
            ->assertJsonPath('data.summary.remaining_payable_bdt', 30000)
            ->assertJsonPath('data.summary.total_commission_bdt', 1500)
            ->assertJsonPath('data.summary.total_net_founder_bdt', 28500)
            ->assertJsonPath('data.eligibility.is_eligible', true)
            ->assertJsonPath('data.eligibility.can_create', true)
            ->assertJsonCount(2, 'data.payments');
    }
}
