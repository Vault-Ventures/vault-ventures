<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DealStage;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\User;
use App\Services\BusinessAnalysis\AnalysisProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Fixtures\FakeAnalysisProvider;
use Tests\TestCase;

class AiPhase6SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function fixture(): array
    {
        $founder = User::factory()->create(); $founder->roles()->create(['role' => 'founder']);
        $business = $founder->founderProfile()->create()->businesses()->create(['name' => 'Phase 6', 'status' => BusinessStatus::Published]);
        $business->forceFill(['status' => BusinessStatus::Published])->save();
        $business->requirements()->create();
        $investor = User::factory()->create(); $investor->roles()->create(['role' => 'investor']);
        $profile = $investor->investorProfile()->create(); $profile->preferences()->create();
        return [$founder, $business, $investor, $profile];
    }

    public function test_matching_rejects_valid_output_for_the_wrong_candidate_role(): void
    {
        [$founder, $business, $investor, $profile] = $this->fixture();
        $this->app->instance(AnalysisProvider::class, new FakeAnalysisProvider(fn () => json_encode([
            'counterparty_role' => 'professional', 'summary' => 'Wrong role.',
            'factor_explanations' => [['factor_key' => 'compensation', 'explanation' => 'Wrong role evidence.', 'confidence' => 0.5]],
            'confidence' => 0.5, 'strengths' => [], 'weaknesses' => [], 'opportunities' => [], 'risks' => [], 'recommendations' => [],
        ])));
        $this->actingAs($investor, 'web')->postJson("/api/me/matches/businesses/{$business->id}/investor/{$profile->id}/matching-insight")
            ->assertStatus(502);
        $this->assertDatabaseCount('matching_insights', 0);
    }

    public function test_admin_access_revoked_during_generation_prevents_persistence(): void
    {
        $admin = User::factory()->create(); $admin->adminAccess()->create();
        $this->app->instance(AnalysisProvider::class, new FakeAnalysisProvider(function () use ($admin) {
            $admin->adminAccess()->delete();
            return json_encode(['summary' => 'Aggregate only.', 'governance_observations' => [], 'operational_highlights' => [], 'attention_areas' => [], 'suggested_review_points' => []]);
        }));
        $this->actingAs($admin, 'web')->postJson('/api/admin/admin-insight')->assertForbidden();
        $this->assertDatabaseCount('admin_insights', 0);
    }

    public function test_deal_role_revoked_during_generation_prevents_persistence(): void
    {
        [$founder, $business, $investor] = $this->fixture();
        $connection = BusinessConnection::create(['business_id' => $business->id, 'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id, 'counterparty_role' => 'investor', 'status' => 'connected']);
        $deal = Deal::create(['connection_id' => $connection->id, 'business_id' => $business->id, 'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id, 'counterparty_role' => 'investor', 'stage' => DealStage::Negotiation]);
        $this->app->instance(AnalysisProvider::class, new FakeAnalysisProvider(function () use ($investor) {
            $investor->roles()->delete();
            return json_encode(['summary' => 'Advisory.', 'current_stage_summary' => 'Negotiation.', 'key_points' => [], 'open_items' => [], 'discussion_points' => [], 'cautions' => []]);
        }));
        $this->actingAs($investor, 'web')->postJson("/api/me/deals/{$deal->id}/deal-insight?role=investor")->assertForbidden();
        $this->assertDatabaseCount('deal_insights', 0);
    }

    public function test_matching_deal_and_admin_generation_leave_all_authoritative_tables_identical(): void
    {
        [$founder, $business, $investor, $profile] = $this->fixture();
        $admin = User::factory()->create(); $admin->adminAccess()->create();
        $connection = BusinessConnection::create(['business_id' => $business->id, 'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id, 'counterparty_role' => 'investor', 'status' => 'connected']);
        $deal = Deal::create(['connection_id' => $connection->id, 'business_id' => $business->id, 'founder_user_id' => $founder->id,
            'counterparty_user_id' => $investor->id, 'counterparty_role' => 'investor', 'stage' => DealStage::Negotiation]);
        $tables = array_values(array_filter(\Illuminate\Support\Facades\Schema::getTableListing(schema: \Illuminate\Support\Facades\DB::getDatabaseName(), schemaQualified: false),
            fn ($table) => ! in_array($table, ['matching_insights', 'deal_insights', 'admin_insights', 'cache', 'cache_locks', 'sessions'])));
        $snapshot = fn () => array_combine($tables, array_map(fn ($table) => hash('sha256', \Illuminate\Support\Facades\DB::table($table)->get()->toJson()), $tables));
        $before = $snapshot();
        $transactionLevel = \Illuminate\Support\Facades\DB::transactionLevel();
        $this->app->instance(AnalysisProvider::class, new FakeAnalysisProvider(function ($source) use ($transactionLevel) {
            $this->assertSame($transactionLevel, \Illuminate\Support\Facades\DB::transactionLevel(), 'No service transaction spans the provider call.');
            if (isset($source['platform'])) return json_encode(['summary' => 'Aggregate only.', 'governance_observations' => [], 'operational_highlights' => [], 'attention_areas' => [], 'suggested_review_points' => []]);
            if (isset($source['deal'])) return json_encode(['summary' => 'Advisory.', 'current_stage_summary' => 'Negotiation.', 'key_points' => [], 'open_items' => [], 'discussion_points' => [], 'cautions' => []]);
            return json_encode(['counterparty_role' => 'investor', 'summary' => 'Advisory.',
                'factor_explanations' => [['factor_key' => 'industry', 'explanation' => 'Unknown.', 'confidence' => 0]],
                'confidence' => 0, 'strengths' => [], 'weaknesses' => [], 'opportunities' => [], 'risks' => [], 'recommendations' => []]);
        }));
        $this->actingAs($investor, 'web')->postJson("/api/me/matches/businesses/{$business->id}/investor/{$profile->id}/matching-insight")->assertCreated();
        $this->assertSame($before, $snapshot());
        $this->postJson("/api/me/deals/{$deal->id}/deal-insight?role=investor")->assertCreated();
        $this->assertSame($before, $snapshot());
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'web')->postJson('/api/admin/admin-insight')->assertCreated();
        $this->assertSame($before, $snapshot());
    }
}
