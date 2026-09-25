<?php

namespace Tests\Feature;

use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\AdminAccess;
use App\Models\AdminInsight;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\Admin\AdminInsightResult;
use App\Services\Admin\AdminInsightService;
use App\Services\BusinessAnalysis\AnalysisProvider;
use App\Services\BusinessAnalysis\DisabledAnalysisProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Fixtures\FakeAnalysisProvider;
use Tests\TestCase;

class AdminInsightTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $admin->adminAccess()->create([]);

        return $admin;
    }

    private function createUser(string $role): User
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->create(['role' => $role]);

        if ($role === ParticipantRole::Founder->value) {
            $user->founderProfile()->create();
        } elseif ($role === ParticipantRole::Investor->value) {
            $user->investorProfile()->create();
        } else {
            $user->professionalProfile()->create();
        }

        return $user;
    }

    private function createDealFixture(
        ?User $founder = null,
        ?User $counterparty = null,
        ParticipantRole $counterpartyRole = ParticipantRole::Investor,
        DealStage $stage = DealStage::Negotiation
    ): Deal {
        $founder = $founder ?? $this->createUser('founder');
        $counterparty = $counterparty ?? $this->createUser($counterpartyRole->value);

        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Nexus Analytics',
            'industry' => 'Enterprise Software',
            'business_stage' => 'Seed',
            'location' => 'Dhaka',
        ]);

        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'status' => 'connected',
        ]);

        return Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'stage' => $stage,
        ]);
    }

    private function mockValidProvider(array $overrides = []): FakeAnalysisProvider
    {
        $payload = array_merge([
            'summary' => 'The platform shows steady transaction governance with all audit pipelines operational.',
            'governance_observations' => [
                'All Tier 1 verification queues are being processed within standard turnaround times.',
                'Financial report submissions are actively audited in simulated BDT tender.',
            ],
            'operational_highlights' => [
                'Zero unresolved high-severity platform discrepancies.',
                'Active deal rooms maintain structured milestone progress.',
            ],
            'attention_areas' => [
                'Monitor verification queue influx during high-activity periods.',
            ],
            'suggested_review_points' => [
                'Review financial reports with pending evidence submissions.',
            ],
        ], $overrides);

        $fake = new FakeAnalysisProvider(fn () => json_encode($payload, JSON_THROW_ON_ERROR));
        $this->app->instance(AnalysisProvider::class, $fake);

        return $fake;
    }

    public function test_admin_current_endpoint_allowed_and_returns_null_initially(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->getJson('/api/admin/admin-insight');
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => null,
            ]);
    }

    public function test_admin_history_allowed(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->getJson('/api/admin/admin-insights');
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [],
            ]);
    }

    public function test_admin_explicit_generation_allowed(): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider();

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'version' => 1,
                    'summary' => 'The platform shows steady transaction governance with all audit pipelines operational.',
                    'is_current' => true,
                ],
            ]);

        $this->assertDatabaseHas('admin_insights', [
            'version' => 1,
        ]);
    }

    public function test_normal_founder_denied(): void
    {
        $founder = $this->createUser('founder');

        $this->actingAs($founder)->getJson('/api/admin/admin-insight')->assertForbidden();
        $this->actingAs($founder)->getJson('/api/admin/admin-insights')->assertForbidden();
        $this->actingAs($founder)->postJson('/api/admin/admin-insight')->assertForbidden();
    }

    public function test_investor_denied(): void
    {
        $investor = $this->createUser('investor');

        $this->actingAs($investor)->getJson('/api/admin/admin-insight')->assertForbidden();
        $this->actingAs($investor)->getJson('/api/admin/admin-insights')->assertForbidden();
        $this->actingAs($investor)->postJson('/api/admin/admin-insight')->assertForbidden();
    }

    public function test_professional_denied(): void
    {
        $professional = $this->createUser('professional');

        $this->actingAs($professional)->getJson('/api/admin/admin-insight')->assertForbidden();
        $this->actingAs($professional)->getJson('/api/admin/admin-insights')->assertForbidden();
        $this->actingAs($professional)->postJson('/api/admin/admin-insight')->assertForbidden();
    }

    public function test_guest_denied(): void
    {
        $this->getJson('/api/admin/admin-insight')->assertUnauthorized();
        $this->getJson('/api/admin/admin-insights')->assertUnauthorized();
        $this->postJson('/api/admin/admin-insight')->assertUnauthorized();
    }

    public function test_current_get_does_not_invoke_provider(): void
    {
        $admin = $this->createAdmin();
        $fake = $this->mockValidProvider();

        $this->actingAs($admin)->getJson('/api/admin/admin-insight')->assertOk();
        $this->assertSame(0, $fake->calls);
    }

    public function test_valid_output_persists_and_is_retrieved_via_current_and_history(): void
    {
        $admin = $this->createAdmin();
        $fake = $this->mockValidProvider();

        $postRes = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $postRes->assertStatus(201);
        $this->assertSame(1, $fake->calls);

        $getRes = $this->actingAs($admin)->getJson('/api/admin/admin-insight');
        $getRes->assertOk()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.is_current', true)
            ->assertJsonPath('data.summary', 'The platform shows steady transaction governance with all audit pipelines operational.');

        $historyRes = $this->actingAs($admin)->getJson('/api/admin/admin-insights');
        $historyRes->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.version', 1);
    }

    public function test_same_source_reuses_existing_without_extra_provider_call(): void
    {
        $admin = $this->createAdmin();
        $fake = $this->mockValidProvider();

        // 1st generation -> 201 Created
        $res1 = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $res1->assertStatus(201);
        $this->assertSame(1, $fake->calls);

        // 2nd generation on unchanged state -> 200 OK reused
        $res2 = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $res2->assertStatus(200)
            ->assertJsonPath('data.version', 1);
        $this->assertSame(1, $fake->calls, 'Provider must not be invoked on idempotent reuse');
    }

    public function test_changed_aggregate_source_creates_new_version_and_preserves_old(): void
    {
        $admin = $this->createAdmin();
        $fake = $this->mockValidProvider();

        // Version 1
        $this->actingAs($admin)->postJson('/api/admin/admin-insight')->assertStatus(201);
        $this->assertSame(1, $fake->calls);

        // Mutate aggregate platform state (create a new verified user)
        User::factory()->create(['verification_tier' => VerificationTier::Tier1]);

        // Version 2
        $res2 = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $res2->assertStatus(201)
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.is_current', true);
        $this->assertSame(2, $fake->calls);

        // Verify history contains 2 versions
        $this->assertDatabaseCount('admin_insights', 2);
        $history = $this->actingAs($admin)->getJson('/api/admin/admin-insights')->json('data');
        $this->assertCount(2, $history);
        $this->assertSame(2, $history[0]['version']);
        $this->assertTrue($history[0]['is_current']);
        $this->assertSame(1, $history[1]['version']);
        $this->assertFalse($history[1]['is_current']);
    }

    public function test_stale_and_current_calculated_correctly_when_aggregate_changes(): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider();

        $this->actingAs($admin)->postJson('/api/admin/admin-insight')->assertStatus(201);

        // Initially current
        $resCurrent = $this->actingAs($admin)->getJson('/api/admin/admin-insight');
        $resCurrent->assertOk()->assertJsonPath('data.is_current', true);

        // Change aggregate count (add financial discrepancy report)
        $deal = $this->createDealFixture();
        $report = FinancialReport::create([
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'submitted_by_user_id' => $deal->founder_user_id,
            'reporting_period_start' => '2026-01-01',
            'reporting_period_end' => '2026-01-31',
            'revenue' => 100000,
            'expenses' => 50000,
            'net_profit_loss' => 50000,
            'cash_position' => 200000,
            'status' => FinancialVerificationStatus::SelfReported,
        ]);
        FinancialDiscrepancyReport::create([
            'deal_id' => $deal->id,
            'financial_report_id' => $report->id,
            'reported_by_user_id' => $admin->id,
            'reason' => 'Test mismatch',
            'status' => FinancialDiscrepancyStatus::UnderReview,
        ]);

        // Current endpoint now returns null because active fingerprint changed
        $resStale = $this->actingAs($admin)->getJson('/api/admin/admin-insight');
        $resStale->assertOk()->assertJsonPath('data', null);

        // History shows version 1 marked is_current: false
        $resHist = $this->actingAs($admin)->getJson('/api/admin/admin-insights');
        $resHist->assertOk()->assertJsonPath('data.0.is_current', false);
    }

    public function test_provider_unavailable_returns_safe_503(): void
    {
        $admin = $this->createAdmin();
        $this->app->instance(AnalysisProvider::class, new DisabledAnalysisProvider);

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'PROVIDER_UNAVAILABLE',
                ],
            ]);
    }

    public function test_malformed_json_rejected_with_502(): void
    {
        $admin = $this->createAdmin();
        $fake = new FakeAnalysisProvider(fn () => 'not json');
        $this->app->instance(AnalysisProvider::class, $fake);

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_ANALYSIS_OUTPUT',
                ],
            ]);
        $this->assertDatabaseCount('admin_insights', 0);
    }

    public function test_unknown_field_rejected_with_502(): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider(['unexpected_field' => 'should fail schema']);

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_ANALYSIS_OUTPUT',
                ],
            ]);
        $this->assertDatabaseCount('admin_insights', 0);
    }

    /**
     * @dataProvider forbiddenAuthorityFieldsProvider
     */
    public function test_forbidden_authority_fields_are_rejected_with_502(string $field): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider([$field => 'forbidden_value']);

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(502);
        $this->assertDatabaseCount('admin_insights', 0);
    }

    public static function forbiddenAuthorityFieldsProvider(): array
    {
        return [
            ['approve_verification'],
            ['reject_verification'],
            ['verification_decision'],
            ['ban_user'],
            ['suspend_user'],
            ['change_role'],
            ['grant_admin'],
            ['revoke_admin'],
            ['advance_deal'],
            ['cancel_deal'],
            ['approve_deal'],
            ['release_funds'],
            ['resolve_discrepancy'],
            ['readiness_score'],
            ['match_score'],
            ['reputation_tier'],
            ['score'],
            ['confidence'],
        ];
    }

    public function test_sensitive_verification_and_user_data_absent_from_snapshot(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'email' => 'founder@secret.com',
            'phone' => '+8801700000000',
        ]);
        VerificationRequest::create([
            'user_id' => $user->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'rejection_reason' => 'Confidential background check detail',
            'admin_notes' => 'Secret passport scan notes',
            'submitted_at' => now(),
        ]);

        $service = app(AdminInsightService::class);
        $snapshot = $service->snapshot();
        $rawJson = json_encode($snapshot);

        $this->assertStringNotContainsString('founder@secret.com', $rawJson);
        $this->assertStringNotContainsString('+8801700000000', $rawJson);
        $this->assertStringNotContainsString('Confidential background check detail', $rawJson);
        $this->assertStringNotContainsString('Secret passport scan notes', $rawJson);
        $this->assertArrayHasKey('verification_operations', $snapshot);
        $this->assertSame(1, $snapshot['verification_operations']['pending_count']);
    }

    public function test_source_snapshot_and_fingerprint_never_exposed_in_api_resource(): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider();

        $res = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $res->assertStatus(201);
        $res->assertJsonMissingPath('data.source_snapshot');
        $res->assertJsonMissingPath('data.source_fingerprint');

        $getRes = $this->actingAs($admin)->getJson('/api/admin/admin-insight');
        $getRes->assertJsonMissingPath('data.source_snapshot');
        $getRes->assertJsonMissingPath('data.source_fingerprint');
    }

    public function test_same_snapshot_yields_same_fingerprint_and_aggregate_change_yields_different(): void
    {
        $service = app(AdminInsightService::class);

        $snap1 = $service->snapshot();
        $fp1 = $service->fingerprint($snap1);

        $snap2 = $service->snapshot();
        $fp2 = $service->fingerprint($snap2);

        $this->assertSame($fp1, $fp2);

        User::factory()->create();
        $snap3 = $service->snapshot();
        $fp3 = $service->fingerprint($snap3);

        $this->assertNotSame($fp1, $fp3);
    }

    public function test_source_change_during_provider_call_aborts_without_persistence(): void
    {
        $admin = $this->createAdmin();

        $fake = new FakeAnalysisProvider(function () {
            // Simulate background mutation during remote provider execution
            User::factory()->create(['verification_tier' => VerificationTier::Tier1]);

            return json_encode([
                'summary' => 'Snapshot generated with stale metrics.',
                'governance_observations' => ['Obs 1'],
                'operational_highlights' => ['High 1'],
                'attention_areas' => ['Attn 1'],
                'suggested_review_points' => ['Rev 1'],
            ], JSON_THROW_ON_ERROR);
        });
        $this->app->instance(AnalysisProvider::class, $fake);

        $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'SOURCE_CHANGED',
                ],
            ]);

        $this->assertDatabaseCount('admin_insights', 0);
    }

    public function test_concurrent_generation_is_protected(): void
    {
        $admin = $this->createAdmin();
        $lock = Cache::store('database')->lock('admin-insight:generate', 60);
        $this->assertTrue($lock->get());

        $this->mockValidProvider();

        try {
            $response = $this->actingAs($admin)->postJson('/api/admin/admin-insight');
            $response->assertStatus(409)
                ->assertJson([
                    'success' => false,
                    'error' => [
                        'code' => 'GENERATION_IN_PROGRESS',
                    ],
                ]);
        } finally {
            $lock->release();
        }
    }

    public function test_previous_success_survives_failed_regeneration(): void
    {
        $admin = $this->createAdmin();
        $this->mockValidProvider();

        $this->actingAs($admin)->postJson('/api/admin/admin-insight')->assertStatus(201);
        $this->assertDatabaseCount('admin_insights', 1);

        // State changes
        User::factory()->create();

        // Remote provider fails
        $this->app->instance(AnalysisProvider::class, new DisabledAnalysisProvider);
        $this->actingAs($admin)->postJson('/api/admin/admin-insight')->assertStatus(503);

        // Previous insight row is still intact
        $this->assertDatabaseCount('admin_insights', 1);
        $this->assertDatabaseHas('admin_insights', ['version' => 1]);
    }

    public function test_ai_generation_does_not_alter_deterministic_admin_metrics_or_states(): void
    {
        $admin = $this->createAdmin();
        $founder = $this->createUser('founder');
        $investor = $this->createUser('investor');

        $deal = $this->createDealFixture(
            founder: $founder,
            counterparty: $investor,
            stage: DealStage::Negotiation,
        );

        $vr = VerificationRequest::create([
            'user_id' => $founder->id,
            'requested_tier' => VerificationTier::Tier1,
            'status' => VerificationRequestStatus::Pending,
            'submitted_at' => now(),
        ]);

        $service = app(AdminInsightService::class);
        $beforeSnapshot = $service->snapshot();

        $this->mockValidProvider();
        $this->actingAs($admin)->postJson('/api/admin/admin-insight')->assertStatus(201);

        $afterSnapshot = $service->snapshot();
        $this->assertSame($beforeSnapshot, $afterSnapshot, 'AI generation must not alter deterministic metrics');

        $this->assertSame(VerificationRequestStatus::Pending, $vr->fresh()->status);
        $this->assertSame(DealStage::Negotiation, $deal->fresh()->stage);
        $this->assertTrue($admin->fresh()->hasAdminAccess());
        $this->assertFalse($founder->fresh()->hasAdminAccess());
    }
}
