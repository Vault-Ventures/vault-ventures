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
use App\Models\DealPayment;
use App\Models\DealTermProposal;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPlatformRevenueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdmin(string $email = 'admin@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->adminAccess()->create([]);
        $user->unsetRelations();

        return $user;
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
        $business->name = 'GreenDelta Agri Ltd';
        $business->description = 'AgriTech automation.';
        $business->industry = 'technology';
        $business->business_stage = 'growth';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        $req = $business->requirements()->create([
            'funding_amount' => 500000.00,
            'accepted_investment_types' => ['equity'],
            'required_experience_level' => 'Senior',
            'required_availability' => 'Full-time',
        ]);

        $skill = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $req->skills()->sync([$skill->id]);

        return $business;
    }

    private function createDeal(User $founder, User $investor): Deal
    {
        $business = $this->createBusiness($founder);
        $conn = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'connected',
            'connected_at' => now(),
        ]);

        $deal = Deal::create([
            'connection_id' => $conn->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::MilestoneFundingActive,
        ]);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'version' => 1,
            'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder',
            'investment_type' => 'standard_equity',
            'amount' => 500000.00,
            'status' => 'accepted',
        ]);

        DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'deal_agreement',
            'title' => 'Investment Agreement',
            'agreement_text' => 'Agreement text...',
            'terms_snapshot' => [
                'amount' => 500000.00,
                'currency' => 'BDT',
            ],
            'status' => 'accepted',
            'founder_signed_at' => now()->subDays(10),
            'founder_signed_user_id' => $founder->id,
            'counterparty_signed_at' => now()->subDays(10),
            'counterparty_signed_user_id' => $investor->id,
            'finalized_at' => now()->subDays(10),
        ]);

        return $deal;
    }

    public function test_admin_can_read_platform_revenue(): void
    {
        $admin = $this->createAdmin();
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        // 1. Completed payment: 100,000 with 5% commission = 5,000 commission, 95,000 net
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 100000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::BankTransfer,
            'transaction_reference' => 'TX-ADM-1',
            'status' => PaymentStatus::Completed,
            'payment_date' => now()->subDays(2)->toDateString(),
            'completed_at' => now()->subDays(2),
            'commission_rate' => 5.00,
            'commission_amount' => 5000.00,
            'net_amount' => 95000.00,
            'status_updated_by_user_id' => $founder->id,
        ]);

        // 2. Pending payment: 50,000
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 50000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Bkash,
            'transaction_reference' => 'BK-ADM-PENDING',
            'status' => PaymentStatus::Pending,
            'payment_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/platform-revenue');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.currency', 'BDT')
            ->assertJsonPath('data.commission_rate', 5)
            ->assertJsonPath('data.completed_payments_count', 1)
            ->assertJsonPath('data.total_completed_volume', 100000)
            ->assertJsonPath('data.total_commission', 5000)
            ->assertJsonPath('data.total_net_to_receivers', 95000)
            ->assertJsonPath('data.pending_payments_count', 1)
            ->assertJsonPath('data.pending_volume', 50000)
            ->assertJsonCount(6, 'data.monthly');
    }

    public function test_admin_can_list_payments_with_filters(): void
    {
        $admin = $this->createAdmin();
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        // Create 2 payments
        $p1 = DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 10000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Bkash,
            'transaction_reference' => 'BK-1',
            'status' => PaymentStatus::Completed,
            'payment_date' => now()->toDateString(),
            'completed_at' => now(),
            'commission_rate' => 5.00,
            'commission_amount' => 500.00,
            'net_amount' => 9500.00,
        ]);

        $p2 = DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 20000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Nagad,
            'transaction_reference' => 'NG-1',
            'status' => PaymentStatus::Pending,
            'payment_date' => now()->toDateString(),
        ]);

        // General list
        $response = $this->actingAs($admin)->getJson('/api/admin/payments');
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.payments')
            ->assertJsonPath('data.pagination.total', 2);

        // Filter by status=completed
        $resCompleted = $this->actingAs($admin)->getJson('/api/admin/payments?status=completed');
        $resCompleted->assertOk()
            ->assertJsonCount(1, 'data.payments')
            ->assertJsonPath('data.payments.0.id', $p1->id);

        // Filter by payment_method=nagad
        $resNagad = $this->actingAs($admin)->getJson('/api/admin/payments?payment_method=nagad');
        $resNagad->assertOk()
            ->assertJsonCount(1, 'data.payments')
            ->assertJsonPath('data.payments.0.id', $p2->id);

        // Filter by deal_id
        $resDeal = $this->actingAs($admin)->getJson("/api/admin/payments?deal_id={$deal->id}");
        $resDeal->assertOk()
            ->assertJsonCount(2, 'data.payments');
    }

    public function test_non_admin_gets_403_on_admin_routes(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        $this->actingAs($founder)->getJson('/api/admin/platform-revenue')->assertStatus(403);
        $this->actingAs($founder)->getJson('/api/admin/payments')->assertStatus(403);

        $this->actingAs($investor)->getJson('/api/admin/platform-revenue')->assertStatus(403);
        $this->actingAs($investor)->getJson('/api/admin/payments')->assertStatus(403);
    }

    public function test_failed_and_cancelled_payments_are_excluded_from_revenue_totals(): void
    {
        $admin = $this->createAdmin();
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        // Completed: 50,000 (Commission 2,500)
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 50000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Card,
            'transaction_reference' => 'REC-1',
            'status' => PaymentStatus::Completed,
            'payment_date' => now()->toDateString(),
            'completed_at' => now(),
            'commission_rate' => 5.00,
            'commission_amount' => 2500.00,
            'net_amount' => 47500.00,
        ]);

        // Failed: 30,000
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 30000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Bkash,
            'transaction_reference' => 'FAIL-1',
            'status' => PaymentStatus::Failed,
            'payment_date' => now()->toDateString(),
        ]);

        // Cancelled: 20,000
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 20000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::Nagad,
            'transaction_reference' => 'CANCEL-1',
            'status' => PaymentStatus::Cancelled,
            'payment_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/platform-revenue');

        $response->assertOk()
            ->assertJsonPath('data.completed_payments_count', 1)
            ->assertJsonPath('data.total_completed_volume', 50000)
            ->assertJsonPath('data.total_commission', 2500)
            ->assertJsonPath('data.total_net_to_receivers', 47500)
            ->assertJsonPath('data.pending_payments_count', 0)
            ->assertJsonPath('data.pending_volume', 0);
    }

    public function test_commission_uses_stored_amount_and_not_recalculated_live(): void
    {
        $admin = $this->createAdmin();
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        // Historical payment created with custom stored commission (e.g. promotional 3% = 3,000 on 100,000)
        DealPayment::create([
            'deal_id' => $deal->id,
            'payer_user_id' => $investor->id,
            'receiver_user_id' => $founder->id,
            'amount' => 100000.00,
            'currency' => 'BDT',
            'payment_method' => PaymentMethod::BankTransfer,
            'transaction_reference' => 'HIST-PROMO-1',
            'status' => PaymentStatus::Completed,
            'payment_date' => now()->toDateString(),
            'completed_at' => now(),
            'commission_rate' => 3.00,
            'commission_amount' => 3000.00,
            'net_amount' => 97000.00,
        ]);

        // Even though current config is 5.00, the revenue sum must use the stored 3,000.00 commission
        config(['platform.commission_rate' => 10.00]);

        $response = $this->actingAs($admin)->getJson('/api/admin/platform-revenue');

        $response->assertOk()
            ->assertJsonPath('data.total_completed_volume', 100000)
            ->assertJsonPath('data.total_commission', 3000)
            ->assertJsonPath('data.total_net_to_receivers', 97000);
    }

    public function test_per_page_max_capped_at_fifty(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->getJson('/api/admin/payments?per_page=999');

        $response->assertOk()
            ->assertJsonPath('data.pagination.per_page', 50);
    }

    public function test_no_admin_create_or_update_payment_route_allowed(): void
    {
        $admin = $this->createAdmin();

        // Ensure POST to admin payments is not defined
        $this->actingAs($admin)->postJson('/api/admin/payments', [
            'amount' => 1000.00,
        ])->assertStatus(405);

        // Ensure DELETE to admin payments is not defined
        $this->actingAs($admin)->deleteJson('/api/admin/payments/1')->assertStatus(404);
    }
}
