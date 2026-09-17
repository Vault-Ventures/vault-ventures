<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use App\Models\VerificationAuditLog;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminComplianceAndGovernanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(VerificationEvidenceStorage::DISK);
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdminUser(): User
    {
        $user = User::factory()->create();
        AdminAccess::forceCreate(['user_id' => $user->id]);

        return $user;
    }

    public function test_rejection_without_reason_returns_422_validation_error(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'web');

        // Empty payload
        $response = $this->postJson("/api/admin/verification-requests/{$request->id}/reject", []);
        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.rejection_reason.0', 'A rejection reason is required when rejecting a verification request.');

        // Null / whitespace payload
        $response2 = $this->postJson("/api/admin/verification-requests/{$request->id}/reject", [
            'rejection_reason' => '',
            'notes' => '   ',
        ]);
        $response2->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.details.rejection_reason.0', 'A rejection reason is required when rejecting a verification request.');
    }

    public function test_non_admin_access_to_all_admin_endpoints_returns_403(): void
    {
        $normalUser = User::factory()->create();
        $targetUser = User::factory()->create();

        $vRequest = VerificationRequest::create([
            'user_id' => $targetUser->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($normalUser, 'web');

        // Verification queue
        $this->getJson('/api/admin/verification-requests')->assertForbidden();
        $this->getJson("/api/admin/verification-requests/{$vRequest->id}")->assertForbidden();
        $this->postJson("/api/admin/verification-requests/{$vRequest->id}/approve")->assertForbidden();
        $this->postJson("/api/admin/verification-requests/{$vRequest->id}/reject")->assertForbidden();
        $this->postJson("/api/admin/verification-requests/{$vRequest->id}/request-information")->assertForbidden();

        // Financial reports & governance
        $this->getJson('/api/admin/financial-reports')->assertForbidden();
        $this->getJson('/api/admin/financial-governance')->assertForbidden();

        // User reputation
        $this->getJson("/api/admin/reputation/users/{$targetUser->id}")->assertForbidden();
    }

    public function test_unauthenticated_requests_to_admin_endpoints_are_rejected(): void
    {
        $this->getJson('/api/admin/verification-requests')->assertUnauthorized();
        $this->getJson('/api/admin/financial-reports')->assertUnauthorized();
        $this->getJson('/api/admin/financial-governance')->assertUnauthorized();
    }

    public function test_admin_can_resolve_financial_discrepancy_with_commentary(): void
    {
        $admin = $this->createAdminUser();
        $founder = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $founder->roles()->create(['role' => ParticipantRole::Founder->value]);
        $founder->founderProfile()->create([]);

        $investor = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $investor->roles()->create(['role' => ParticipantRole::Investor->value]);

        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'EcoGrow Technologies';
        $business->description = 'Agtech hydroponics in Bogura.';
        $business->industry = 'technology';
        $business->business_stage = 'early_traction';
        $business->risk_level = 'medium';
        $business->expected_involvement = 'advisory';
        $business->location = 'Bogura, Bangladesh';
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        $conn = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => 'accepted',
        ]);

        $deal = Deal::create([
            'connection_id' => $conn->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'stage' => DealStage::Completed,
        ]);

        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $founder->id,
            'reporting_period_start' => now()->startOfMonth()->toDateString(),
            'reporting_period_end' => now()->endOfMonth()->toDateString(),
            'revenue' => 150000.00,
            'expenses' => 80000.00,
            'net_profit_loss' => 70000.00,
            'cash_position' => 250000.00,
            'status' => 'under_review',
        ]);

        $discrepancy = FinancialDiscrepancyReport::create([
            'deal_id' => $deal->id,
            'financial_report_id' => $report->id,
            'reported_by_user_id' => $investor->id,
            'reason' => 'Expense vouchers do not tally with Q3 reported total.',
            'status' => 'under_review',
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/admin/financial-discrepancies/{$discrepancy->id}/resolve", [
            'status' => 'resolved',
            'notes' => 'Audited receipts and reconciled bank statements; variance accounted for as timing difference.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.admin_resolution_notes', 'Audited receipts and reconciled bank statements; variance accounted for as timing difference.');

        $this->assertSame('resolved', $discrepancy->fresh()->status->value);
        $this->assertSame($admin->id, $discrepancy->fresh()->resolved_by_user_id);
        $this->assertNotNull($discrepancy->fresh()->resolved_at);
    }

    public function test_audit_logs_capture_actor_action_and_are_immutable(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier0]);

        $request = VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/admin/verification-requests/{$request->id}/approve", [
            'admin_notes' => 'Approved after reviewing passport and NID.',
        ])->assertOk();

        // Verify audit log record exists with complete metadata
        $this->assertDatabaseHas('verification_audit_logs', [
            'verification_request_id' => $request->id,
            'actor_user_id' => $admin->id,
            'action' => 'approved',
            'previous_status' => 'pending',
            'new_status' => 'approved',
            'notes' => 'Approved after reviewing passport and NID.',
        ]);

        $auditLog = VerificationAuditLog::where('verification_request_id', $request->id)->first();
        $this->assertNotNull($auditLog);
        $this->assertNotNull($auditLog->occurred_at);

        // Verify that there are NO API routes to delete or modify audit logs
        $routes = collect(Route::getRoutes()->getRoutes());
        $auditModifyingRoutes = $routes->filter(function ($route) {
            $uri = $route->uri();
            $methods = $route->methods();
            $hasAudit = str_contains($uri, 'audit');
            $isModifying = array_intersect($methods, ['POST', 'PUT', 'PATCH', 'DELETE']);

            // Only allow legitimate action routes that write logs internally, no direct audit-log mutation endpoints
            return $hasAudit && ! empty($isModifying) && str_ends_with($uri, 'audit-logs');
        });

        $this->assertCount(0, $auditModifyingRoutes, 'Audit logs must not have direct modification/deletion routes.');
    }

    public function test_admin_reputation_audit_returns_role_summaries(): void
    {
        $admin = $this->createAdminUser();
        $founder = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $founder->roles()->create(['role' => ParticipantRole::Founder->value]);
        $founder->founderProfile()->create([]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson("/api/admin/reputation/users/{$founder->id}");
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $founder->id)
            ->assertJsonPath('data.user.email', $founder->email)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'verification_tier', 'roles'],
                    'reputation_by_role' => [
                        'founder' => [
                            'user_id',
                            'role',
                            'verification' => ['tier'],
                            'track_record' => ['completed_deals_count'],
                            'feedback' => ['reviews_count'],
                        ],
                    ],
                ],
            ]);
    }
}
