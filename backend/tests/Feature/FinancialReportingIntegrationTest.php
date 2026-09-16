<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealMilestone;
use App\Models\DealTermProposal;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\FinancialReportEvidence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FinancialReportingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        Storage::fake('financial_evidence');
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

    private function createAdmin(string $email = 'admin@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => VerificationTier::Tier1]);
        $user->adminAccess()->create([]);
        $user->unsetRelations();

        return $user;
    }

    private function createBusiness(User $founder, string $name = 'Fintech Corp Bangladesh'): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = $name;
        $business->description = 'Financial transparency platform in Dhaka.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Dhaka, Bangladesh';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        return $business;
    }

    private function createDeal(
        User $founder,
        User $counterparty,
        ParticipantRole $counterpartyRole = ParticipantRole::Investor,
        DealStage $stage = DealStage::MilestoneFundingActive
    ): Deal {
        $business = $this->createBusiness($founder);
        $conn = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'status' => 'accepted',
        ]);

        return Deal::create([
            'connection_id' => $conn->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'stage' => $stage,
        ]);
    }

    public function test_deal_financial_overview_returns_accurate_terms_milestones_and_operational_aggregates(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        $proposal = DealTermProposal::create([
            'deal_id' => $deal->id,
            'proposed_by_user_id' => $investor->id,
            'proposed_by_role' => ParticipantRole::Investor->value,
            'version' => 1,
            'investment_type' => 'equity',
            'amount' => 150000.00,
            'equity_percentage' => 12.50,
            'status' => 'accepted',
        ]);

        // Agreed terms
        DealAgreement::create([
            'deal_id' => $deal->id,
            'proposal_id' => $proposal->id,
            'agreement_type' => 'investment',
            'title' => 'Investment Agreement',
            'status' => 'fully_signed',
            'agreement_text' => 'Standard micro-investment terms',
            'terms_snapshot' => [
                'amount' => 150000.00,
                'investment_type' => 'equity',
                'equity_percentage' => 12.50,
                'profit_sharing_percentage' => null,
                'loss_sharing_terms' => null,
            ],
            'founder_signed_at' => now(),
            'counterparty_signed_at' => now(),
        ]);

        // Milestones: 1 funded, 1 submitted, 1 pending
        DealMilestone::create([
            'deal_id' => $deal->id,
            'title' => 'Tranche 1 - MVP',
            'description' => 'Initial deployment',
            'target_amount' => 50000.00,
            'sequence_order' => 1,
            'status' => 'funded',
            'confirmed_at' => now(),
        ]);
        DealMilestone::create([
            'deal_id' => $deal->id,
            'title' => 'Tranche 2 - Beta',
            'description' => 'User onboarding',
            'target_amount' => 50000.00,
            'sequence_order' => 2,
            'status' => 'submitted',
        ]);
        DealMilestone::create([
            'deal_id' => $deal->id,
            'title' => 'Tranche 3 - Scale',
            'description' => 'Revenue expansion',
            'target_amount' => 50000.00,
            'sequence_order' => 3,
            'status' => 'pending',
        ]);

        // Operational Financial Reports (2 periods)
        $r1 = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 60000.00,
            'net_profit_loss' => 40000.00,
            'cash_position' => 120000.00,
            'notes' => 'Q1 Month 1 operations',
            'status' => FinancialVerificationStatus::Verified,
        ]);

        FinancialReportEvidence::create([
            'financial_report_id' => $r1->id,
            'uploaded_by_user_id' => $founder->id,
            'disk' => 'financial_evidence',
            'path' => 'reports/1/evidence_1.pdf',
            'original_filename' => 'bank_statement_jan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'evidence_type' => 'bank_statement',
        ]);

        $r2 = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-02-01',
            'reporting_period_end' => '2026-02-28',
            'revenue' => 150000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 70000.00,
            'cash_position' => 190000.00,
            'notes' => 'Q1 Month 2 operations',
            'status' => FinancialVerificationStatus::UnderReview,
        ]);

        FinancialDiscrepancyReport::create([
            'financial_report_id' => $r2->id,
            'deal_id' => $deal->id,
            'reported_by_user_id' => $investor->id,
            'reason' => 'Expense under-reported by 5000 BDT',
            'status' => FinancialDiscrepancyStatus::UnderReview,
        ]);

        // Founder accesses overview
        $responseFounder = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/financial-overview");
        $responseFounder->assertOk()
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.agreed_terms.committed_amount_bdt', 150000)
            ->assertJsonPath('data.agreed_terms.investment_type', 'equity')
            ->assertJsonPath('data.agreed_terms.equity_percentage', 12.5)
            ->assertJsonPath('data.milestone_funding.currency', 'BDT')
            ->assertJsonPath('data.milestone_funding.total_committed_bdt', 150000)
            ->assertJsonMissingPath('data.milestone_funding.total_allocated_bdt')
            ->assertJsonPath('data.milestone_funding.total_released_bdt', 50000)
            ->assertJsonPath('data.milestone_funding.remaining_locked_bdt', 100000)
            ->assertJsonPath('data.milestone_funding.funded_milestones_count', 1)
            ->assertJsonPath('data.milestone_funding.pending_tranches_count', 2)
            ->assertJsonPath('data.operational_performance.reports_count', 2)
            ->assertJsonPath('data.operational_performance.cumulative_revenue_bdt', 250000)
            ->assertJsonPath('data.operational_performance.cumulative_expenses_bdt', 140000)
            ->assertJsonPath('data.operational_performance.cumulative_net_profit_loss_bdt', 110000)
            ->assertJsonPath('data.operational_performance.latest_cash_position_bdt', 190000)
            ->assertJsonPath('data.operational_performance.verification_breakdown.verified', 1)
            ->assertJsonPath('data.operational_performance.verification_breakdown.under_review', 1)
            ->assertJsonPath('data.operational_performance.total_evidence_files_count', 1)
            ->assertJsonPath('data.operational_performance.total_discrepancies_count', 1)
            ->assertJsonCount(2, 'data.historical_periods');

        // Investor counterparty accesses overview
        $responseInvestor = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}/financial-overview");
        $responseInvestor->assertOk()
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.milestone_funding.total_released_bdt', 50000);
    }

    public function test_investor_stage_gating_on_financial_overview(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        // 1. Negotiation stage -> 403
        $dealNegotiation = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::Negotiation);
        $this->actingAs($investor)->getJson("/api/me/deals/{$dealNegotiation->id}/financial-overview")
            ->assertStatus(403);

        // 2. Agreement -> 403
        $dealAgreement = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::Agreement);
        $this->actingAs($investor)->getJson("/api/me/deals/{$dealAgreement->id}/financial-overview")
            ->assertStatus(403);

        // 3. MilestoneFundingActive -> 200
        $dealActive = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);
        $this->actingAs($investor)->getJson("/api/me/deals/{$dealActive->id}/financial-overview")
            ->assertOk();

        // 4. Completed -> 200
        $dealCompleted = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::Completed);
        $this->actingAs($investor)->getJson("/api/me/deals/{$dealCompleted->id}/financial-overview")
            ->assertOk();
    }

    public function test_professional_counterparty_is_denied_financial_overview(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $deal = $this->createDeal($founder, $pro, ParticipantRole::Professional, DealStage::MilestoneFundingActive);

        $this->actingAs($pro)->getJson("/api/me/deals/{$deal->id}/financial-overview")
            ->assertStatus(403);
    }

    public function test_cross_deal_isolation_and_unauthorized_user_denial(): void
    {
        $founder = $this->createFounder('founder1@example.com');
        $investor = $this->createInvestor('investor1@example.com');
        $outsider = $this->createInvestor('outsider@example.com');

        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        $this->actingAs($outsider)->getJson("/api/me/deals/{$deal->id}/financial-overview")
            ->assertStatus(403);
    }

    public function test_founder_reputation_includes_financial_transparency_summary(): void
    {
        $founder = $this->createFounder('founder_rep@example.com');
        $investor = $this->createInvestor('investor_rep@example.com');
        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        // 3 Reports: 1 verified with evidence, 1 under review with discrepancy and evidence, 1 self-reported
        $r1 = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
            'net_profit_loss' => 50000.00,
            'status' => FinancialVerificationStatus::Verified,
        ]);
        FinancialReportEvidence::create([
            'financial_report_id' => $r1->id,
            'uploaded_by_user_id' => $founder->id,
            'disk' => 'financial_evidence',
            'path' => 'reports/1/ev1.pdf',
            'original_filename' => 'ev1.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'evidence_type' => 'bank_statement',
        ]);

        $r2 = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-02-01',
            'reporting_period_end' => '2026-02-28',
            'revenue' => 120000.00,
            'expenses' => 60000.00,
            'net_profit_loss' => 60000.00,
            'status' => FinancialVerificationStatus::UnderReview,
        ]);
        FinancialReportEvidence::create([
            'financial_report_id' => $r2->id,
            'uploaded_by_user_id' => $founder->id,
            'disk' => 'financial_evidence',
            'path' => 'reports/2/ev2.pdf',
            'original_filename' => 'ev2.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'evidence_type' => 'invoice',
        ]);
        FinancialDiscrepancyReport::create([
            'financial_report_id' => $r2->id,
            'deal_id' => $deal->id,
            'reported_by_user_id' => $investor->id,
            'reason' => 'Disputed invoice numbers',
            'status' => FinancialDiscrepancyStatus::UnderReview,
        ]);

        FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-03-01',
            'reporting_period_end' => '2026-03-31',
            'revenue' => 140000.00,
            'expenses' => 70000.00,
            'net_profit_loss' => 70000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        // 1. Founder views own reputation (/api/me/reputation)
        $resFounder = $this->actingAs($founder)->getJson('/api/me/reputation?role=founder');
        $resFounder->assertOk()
            ->assertJsonPath('data.financial_transparency.submitted_reports_count', 3)
            ->assertJsonPath('data.financial_transparency.verified_reports_count', 1)
            ->assertJsonPath('data.financial_transparency.evidence_backed_reports_count', 2)
            ->assertJsonPath('data.financial_transparency.active_discrepancies_count', 1);

        // 2. Other user views founder reputation (/api/users/{user}/reputation)
        $resPublic = $this->actingAs($investor)->getJson("/api/users/{$founder->id}/reputation?role=founder");
        $resPublic->assertOk()
            ->assertJsonPath('data.financial_transparency.submitted_reports_count', 3)
            ->assertJsonPath('data.financial_transparency.verified_reports_count', 1)
            ->assertJsonPath('data.financial_transparency.evidence_backed_reports_count', 2)
            ->assertJsonPath('data.financial_transparency.active_discrepancies_count', 1);

        // 3. Investor reputation does not include financial_transparency
        $resInvestor = $this->actingAs($investor)->getJson('/api/me/reputation?role=investor');
        $resInvestor->assertOk()
            ->assertJsonMissingPath('data.financial_transparency');
    }

    public function test_admin_financial_governance_overview_metrics(): void
    {
        $founder = $this->createFounder('founder_gov@example.com');
        $investor = $this->createInvestor('investor_gov@example.com');
        $admin = $this->createAdmin('admin_gov@example.com');

        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 40000.00,
            'net_profit_loss' => 60000.00,
            'status' => FinancialVerificationStatus::Verified,
        ]);

        $r2 = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-02-01',
            'reporting_period_end' => '2026-02-28',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::UnderReview,
        ]);

        FinancialDiscrepancyReport::create([
            'financial_report_id' => $r2->id,
            'deal_id' => $deal->id,
            'reported_by_user_id' => $investor->id,
            'reason' => 'Discrepancy test',
            'status' => FinancialDiscrepancyStatus::UnderReview,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/financial-governance');
        $response->assertOk()
            ->assertJsonPath('data.overview.total_financial_reports_count', 2)
            ->assertJsonPath('data.overview.total_deals_with_reporting', 1)
            ->assertJsonMissingPath('data.overview.total_businesses_with_reporting')
            ->assertJsonPath('data.overview.total_discrepancies_count', 1)
            ->assertJsonPath('data.verification_pipeline.verified_count', 1)
            ->assertJsonPath('data.verification_pipeline.under_review_count', 1)
            ->assertJsonPath('data.discrepancy_queue.pending_under_review_count', 1)
            ->assertJsonPath('data.financial_totals_bdt.currency', 'BDT')
            ->assertJsonPath('data.financial_totals_bdt.total_reported_revenue', 300000)
            ->assertJsonPath('data.financial_totals_bdt.total_reported_expenses', 120000)
            ->assertJsonPath('data.financial_totals_bdt.total_calculated_profit_loss', 180000);
    }

    public function test_non_admin_cannot_access_financial_governance_overview(): void
    {
        $founder = $this->createFounder('f_user@example.com');
        $investor = $this->createInvestor('inv_user@example.com');
        $pro = $this->createProfessional('pro_user@example.com');

        $this->actingAs($founder)->getJson('/api/admin/financial-governance')->assertStatus(403);
        $this->actingAs($investor)->getJson('/api/admin/financial-governance')->assertStatus(403);
        $this->actingAs($pro)->getJson('/api/admin/financial-governance')->assertStatus(403);
    }
}
