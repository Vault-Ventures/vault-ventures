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
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FinancialReportingTest extends TestCase
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

    private function createBusiness(User $founder, string $name = 'Fintech Bangladesh'): Business
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

    public function test_founder_can_create_deal_scoped_financial_report_with_server_calculated_profit(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $payload = [
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 250000.50,
            'expenses' => 120000.25,
            'cash_position' => 500000.00,
            'notes' => 'Q1 expansion in Gulshan branch.',
            // Spoofed profit sent by client should be completely ignored
            'net_profit_loss' => 9999999.99,
        ];

        $response = $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", $payload)
            ->assertStatus(201);

        $data = $response->json('data');

        $this->assertSame($deal->id, $data['deal_id']);
        $this->assertSame($deal->business_id, $data['business_id']);
        $this->assertSame($founder->id, $data['submitted_by_user_id']);
        $this->assertSame('2026-01-01', $data['reporting_period_start']);
        $this->assertSame('2026-01-31', $data['reporting_period_end']);
        $this->assertEquals(250000.50, $data['revenue']);
        $this->assertEquals(120000.25, $data['expenses']);
        // 250000.50 - 120000.25 = 130000.25
        $this->assertEquals(130000.25, $data['net_profit_loss']);
        $this->assertEquals(500000.00, $data['cash_position']);
        $this->assertSame('self_reported', $data['status']);

        // Check database
        $this->assertDatabaseHas('financial_reports', [
            'id' => $data['id'],
            'deal_id' => $deal->id,
            'net_profit_loss' => 130000.25,
            'status' => 'self_reported',
        ]);

        // Check audit log
        $this->assertDatabaseHas('financial_report_audit_logs', [
            'financial_report_id' => $data['id'],
            'actor_user_id' => $founder->id,
            'actor_role' => 'founder',
            'action' => 'report_created',
        ]);
    }

    public function test_financial_report_negative_margin_calculation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $payload = [
            'reporting_period_start' => '2026-02-01',
            'reporting_period_end' => '2026-02-28',
            'revenue' => 50000.00,
            'expenses' => 80000.00,
        ];

        $response = $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", $payload)
            ->assertStatus(201);

        $this->assertEquals(-30000.00, $response->json('data.net_profit_loss'));
    }

    public function test_invalid_reporting_period_start_after_end_is_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $payload = [
            'reporting_period_start' => '2026-03-31',
            'reporting_period_end' => '2026-03-01',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
        ];

        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reporting_period_start'], 'error.details');
    }

    public function test_duplicate_and_overlapping_reporting_periods_are_rejected_for_same_deal(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        // First report: Jan 1 to Jan 31
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", [
                'reporting_period_start' => '2026-01-01',
                'reporting_period_end' => '2026-01-31',
                'revenue' => 100000.00,
                'expenses' => 50000.00,
            ])
            ->assertStatus(201);

        // Duplicate period: Jan 1 to Jan 31 -> Rejected
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", [
                'reporting_period_start' => '2026-01-01',
                'reporting_period_end' => '2026-01-31',
                'revenue' => 120000.00,
                'expenses' => 60000.00,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reporting_period'], 'error.details');

        // Overlapping period: Jan 15 to Feb 15 -> Rejected
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", [
                'reporting_period_start' => '2026-01-15',
                'reporting_period_end' => '2026-02-15',
                'revenue' => 120000.00,
                'expenses' => 60000.00,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reporting_period'], 'error.details');

        // Non-overlapping period: Feb 1 to Feb 28 -> Accepted
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", [
                'reporting_period_start' => '2026-02-01',
                'reporting_period_end' => '2026-02-28',
                'revenue' => 150000.00,
                'expenses' => 70000.00,
            ])
            ->assertStatus(201);
    }

    public function test_overlapping_period_allowed_for_different_deal(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');

        $deal1 = $this->createDeal($founder, $investor1);
        $deal2 = $this->createDeal($founder, $investor2);

        // Deal 1: Jan 1 to Jan 31
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal1->id}/financial-reports", [
                'reporting_period_start' => '2026-01-01',
                'reporting_period_end' => '2026-01-31',
                'revenue' => 100000.00,
                'expenses' => 50000.00,
            ])
            ->assertStatus(201);

        // Deal 2: Jan 1 to Jan 31 -> Allowed because it is a different Deal
        $this->actingAs($founder)
            ->postJson("/api/me/deals/{$deal2->id}/financial-reports", [
                'reporting_period_start' => '2026-01-01',
                'reporting_period_end' => '2026-01-31',
                'revenue' => 200000.00,
                'expenses' => 80000.00,
            ])
            ->assertStatus(201);
    }

    public function test_only_founder_can_create_reports_investor_and_professionals_are_forbidden(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $payload = [
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
        ];

        // Investor attempts creation -> Forbidden (403)
        $this->actingAs($investor)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", $payload)
            ->assertForbidden();

        // Unrelated user -> Forbidden (403)
        $otherUser = $this->createInvestor('other@example.com');
        $this->actingAs($otherUser)
            ->postJson("/api/me/deals/{$deal->id}/financial-reports", $payload)
            ->assertForbidden();
    }

    public function test_investor_access_gated_by_deal_stage(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();

        // Stages before MilestoneFundingActive must be denied
        $preFundingStages = [
            DealStage::Matched,
            DealStage::InterestConfirmed,
            DealStage::DealRoomOpened,
            DealStage::NdaSigned,
            DealStage::Negotiation,
            DealStage::Agreement,
        ];

        foreach ($preFundingStages as $stage) {
            $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, $stage);

            // Founder creates report
            $report = FinancialReport::create([
                'deal_id' => $deal->id,
                'business_id' => $deal->business_id,
                'submitted_by_user_id' => $founder->id,
                'reporting_period_start' => '2026-01-01',
                'reporting_period_end' => '2026-01-31',
                'revenue' => 100000.00,
                'expenses' => 50000.00,
                'net_profit_loss' => 50000.00,
                'status' => FinancialVerificationStatus::SelfReported,
            ]);

            // Investor tries to read -> Forbidden (403)
            $this->actingAs($investor)
                ->getJson("/api/me/deals/{$deal->id}/financial-reports")
                ->assertForbidden();

            $this->actingAs($investor)
                ->getJson("/api/me/financial-reports/{$report->id}")
                ->assertForbidden();
        }

        // MilestoneFundingActive -> Investor Allowed
        $activeDeal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);
        $activeReport = FinancialReport::create([
            'deal_id' => $activeDeal->id,
            'business_id' => $activeDeal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
            'net_profit_loss' => 50000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        $this->actingAs($investor)
            ->getJson("/api/me/deals/{$activeDeal->id}/financial-reports")
            ->assertOk()
            ->assertJsonCount(1, 'data.reports');

        $this->actingAs($investor)
            ->getJson("/api/me/financial-reports/{$activeReport->id}")
            ->assertOk();

        // Completed -> Investor Allowed
        $completedDeal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::Completed);
        $this->actingAs($investor)
            ->getJson("/api/me/deals/{$completedDeal->id}/financial-reports")
            ->assertOk();
    }

    public function test_professionals_never_have_financial_report_access(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $deal = $this->createDeal($founder, $pro, ParticipantRole::Professional, DealStage::MilestoneFundingActive);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
            'net_profit_loss' => 50000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        $this->actingAs($pro)
            ->getJson("/api/me/deals/{$deal->id}/financial-reports")
            ->assertForbidden();

        $this->actingAs($pro)
            ->getJson("/api/me/financial-reports/{$report->id}")
            ->assertForbidden();
    }

    public function test_cross_deal_isolation_prevents_idor(): void
    {
        $founder = $this->createFounder();
        $investorA = $this->createInvestor('invA@example.com');
        $investorB = $this->createInvestor('invB@example.com');

        $dealA = $this->createDeal($founder, $investorA, ParticipantRole::Investor, DealStage::MilestoneFundingActive);
        $dealB = $this->createDeal($founder, $investorB, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        $reportA = FinancialReport::create([
            'deal_id' => $dealA->id,
            'business_id' => $dealA->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000.00,
            'expenses' => 50000.00,
            'net_profit_loss' => 50000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        // Investor B cannot view Report A
        $this->actingAs($investorB)
            ->getJson("/api/me/financial-reports/{$reportA->id}")
            ->assertForbidden();

        $this->actingAs($investorB)
            ->getJson("/api/me/deals/{$dealA->id}/financial-reports")
            ->assertForbidden();
    }

    public function test_founder_can_upload_evidence_and_status_transitions_to_evidence_submitted(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        $file = UploadedFile::fake()->create('bank_statement_jan.pdf', 500, 'application/pdf');

        $response = $this->actingAs($founder)
            ->postJson("/api/me/financial-reports/{$report->id}/evidence", [
                'file' => $file,
                'evidence_type' => 'bank_statement',
            ])
            ->assertStatus(201);

        $evidenceId = $response->json('data.id');
        $this->assertDatabaseHas('financial_report_evidence', [
            'id' => $evidenceId,
            'financial_report_id' => $report->id,
            'original_filename' => 'bank_statement_jan.pdf',
            'evidence_type' => 'bank_statement',
        ]);

        // Report status must have transitioned to evidence_submitted
        $report->refresh();
        $this->assertSame(FinancialVerificationStatus::EvidenceSubmitted, $report->status);

        // Audit log must record upload
        $this->assertDatabaseHas('financial_report_audit_logs', [
            'financial_report_id' => $report->id,
            'action' => 'evidence_uploaded',
        ]);
    }

    public function test_evidence_validation_rejects_invalid_types_and_size_limits(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        // Invalid MIME type (text file)
        $badFile = UploadedFile::fake()->create('notes.txt', 10, 'text/plain');
        $this->actingAs($founder)
            ->postJson("/api/me/financial-reports/{$report->id}/evidence", ['file' => $badFile])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file'], 'error.details');

        // Oversized file (> 10 MiB)
        $bigFile = UploadedFile::fake()->create('large.pdf', 11 * 1024, 'application/pdf');
        $this->actingAs($founder)
            ->postJson("/api/me/financial-reports/{$report->id}/evidence", ['file' => $bigFile])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file'], 'error.details');
    }

    public function test_authorized_actors_can_download_evidence_and_access_is_logged(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);
        $admin = $this->createAdmin();

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');
        $uploadResp = $this->actingAs($founder)
            ->postJson("/api/me/financial-reports/{$report->id}/evidence", ['file' => $file])
            ->assertStatus(201);
        $evidenceId = $uploadResp->json('data.id');

        // Founder download -> 200
        $this->actingAs($founder)
            ->get("/api/me/financial-reports/{$report->id}/evidence/{$evidenceId}/download")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertDatabaseHas('financial_evidence_access_logs', [
            'financial_report_evidence_id' => $evidenceId,
            'actor_user_id' => $founder->id,
            'actor_role' => 'founder',
            'action' => 'downloaded',
        ]);

        // Investor download -> 200
        $this->actingAs($investor)
            ->get("/api/me/financial-reports/{$report->id}/evidence/{$evidenceId}/download")
            ->assertOk();

        $this->assertDatabaseHas('financial_evidence_access_logs', [
            'financial_report_evidence_id' => $evidenceId,
            'actor_user_id' => $investor->id,
            'actor_role' => 'investor',
            'action' => 'downloaded',
        ]);

        // Admin download -> 200
        $this->actingAs($admin)
            ->get("/api/admin/financial-reports/{$report->id}/evidence/{$evidenceId}/download")
            ->assertOk();

        $this->assertDatabaseHas('financial_evidence_access_logs', [
            'financial_report_evidence_id' => $evidenceId,
            'actor_user_id' => $admin->id,
            'actor_role' => 'admin',
            'action' => 'downloaded',
        ]);

        // Unauthorized user download -> Forbidden (403)
        $unrelated = $this->createInvestor('unrelated@example.com');
        $this->actingAs($unrelated)
            ->get("/api/me/financial-reports/{$report->id}/evidence/{$evidenceId}/download")
            ->assertForbidden();
    }

    public function test_verified_report_immutability_prevents_evidence_upload(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::Verified,
        ]);

        $file = UploadedFile::fake()->create('extra.pdf', 100, 'application/pdf');
        $this->actingAs($founder)
            ->postJson("/api/me/financial-reports/{$report->id}/evidence", ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['evidence'], 'error.details');
    }

    public function test_investor_can_flag_discrepancy_and_status_reopens_to_under_review(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::Verified, // Previously verified
        ]);

        $response = $this->actingAs($investor)
            ->postJson("/api/me/financial-reports/{$report->id}/discrepancies", [
                'reason' => 'Bank statement shows only ৳1,20,000 revenue instead of ৳2,00,000 reported.',
            ])
            ->assertStatus(201);

        $discrepancyId = $response->json('data.id');

        $this->assertDatabaseHas('financial_discrepancy_reports', [
            'id' => $discrepancyId,
            'deal_id' => $deal->id,
            'financial_report_id' => $report->id,
            'reported_by_user_id' => $investor->id,
            'status' => 'under_review',
        ]);

        // Report status must have reopened to under_review
        $report->refresh();
        $this->assertSame(FinancialVerificationStatus::UnderReview, $report->status);

        // Audit log records discrepancy
        $this->assertDatabaseHas('financial_report_audit_logs', [
            'financial_report_id' => $report->id,
            'actor_user_id' => $investor->id,
            'actor_role' => 'investor',
            'action' => 'discrepancy_flagged',
        ]);
    }

    public function test_admin_can_review_and_verify_financial_report(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);
        $admin = $this->createAdmin();

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::EvidenceSubmitted,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/admin/financial-reports/{$report->id}/review", [
                'status' => 'verified',
                'notes' => 'Audited bank statements and invoices. All match declared figures.',
            ])
            ->assertOk();

        $this->assertSame('verified', $response->json('data.status'));

        $report->refresh();
        $this->assertSame(FinancialVerificationStatus::Verified, $report->status);
        $this->assertSame($admin->id, $report->reviewed_by_user_id);
        $this->assertNotNull($report->reviewed_at);

        // Audit log records verification
        $this->assertDatabaseHas('financial_report_audit_logs', [
            'financial_report_id' => $report->id,
            'actor_user_id' => $admin->id,
            'actor_role' => 'admin',
            'action' => 'report_verified',
        ]);
    }

    public function test_admin_can_resolve_financial_discrepancy(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor, ParticipantRole::Investor, DealStage::MilestoneFundingActive);
        $admin = $this->createAdmin();

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::UnderReview,
        ]);

        $discrepancy = FinancialDiscrepancyReport::create([
            'deal_id' => $deal->id,
            'financial_report_id' => $report->id,
            'reported_by_user_id' => $investor->id,
            'reason' => 'Mismatch in sales receipts vs bank deposits.',
            'status' => FinancialDiscrepancyStatus::UnderReview,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/admin/financial-discrepancies/{$discrepancy->id}/resolve", [
                'status' => 'resolved',
                'notes' => 'Founder provided secondary merchant gateway settlement statements reconciling the difference.',
            ])
            ->assertOk();

        $this->assertSame('resolved', $response->json('data.status'));

        $discrepancy->refresh();
        $this->assertSame(FinancialDiscrepancyStatus::Resolved, $discrepancy->status);
        $this->assertSame($admin->id, $discrepancy->resolved_by_user_id);
        $this->assertNotNull($discrepancy->resolved_at);

        // Audit log records discrepancy resolution
        $this->assertDatabaseHas('financial_report_audit_logs', [
            'financial_report_id' => $report->id,
            'actor_user_id' => $admin->id,
            'actor_role' => 'admin',
            'action' => 'discrepancy_resolved',
        ]);
    }

    public function test_admin_can_list_and_view_detailed_financial_report(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $deal = $this->createDeal($founder, $investor);
        $admin = $this->createAdmin();

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 200000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 120000.00,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/financial-reports')
            ->assertOk()
            ->assertJsonCount(1, 'data.reports');

        $this->actingAs($admin)
            ->getJson("/api/admin/financial-reports/{$report->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $report->id)
            ->assertJsonPath('data.deal.id', $deal->id);

        // Non-admin cannot access admin endpoints
        $this->actingAs($founder)
            ->getJson('/api/admin/financial-reports')
            ->assertForbidden();

        $this->actingAs($investor)
            ->getJson("/api/admin/financial-reports/{$report->id}")
            ->assertForbidden();
    }
}
