<?php

namespace Tests\Feature;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealMilestone;
use App\Models\DealTermProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealAuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function fixture(string $role = 'investor'): array
    {
        $founder = User::factory()->create();
        $founder->roles()->create(['role' => 'founder']);
        $profile = $founder->founderProfile()->create([]);
        $counterparty = User::factory()->create();
        $counterparty->roles()->create(['role' => $role]);
        $business = new Business;
        $business->forceFill(['founder_profile_id' => $profile->id, 'name' => 'Matrix Business', 'status' => 'submitted'])->save();
        $connection = BusinessConnection::create(['business_id' => $business->id, 'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id, 'counterparty_role' => $role]);
        $deal = Deal::create(['connection_id' => $connection->id, 'business_id' => $business->id,
            'founder_user_id' => $founder->id, 'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role, 'stage' => DealStage::Agreement]);
        return [$founder, $counterparty, $deal];
    }

    public function test_all_deal_read_endpoints_authorization_matrix(): void
    {
        $admin = User::factory()->create();
        $admin->adminAccess()->create([]);
        $outsider = User::factory()->create();
        foreach (['investor', 'professional'] as $role) {
            [$founder, $counterparty, $deal] = $this->fixture($role);
            foreach (['', '/history', '/negotiation', '/agreement', '/milestones', '/funding-summary', '/feedback'] as $suffix) {
                $url = "/api/me/deals/{$deal->id}$suffix";
                $this->actingAs($founder)->getJson($url)->assertOk();
                $this->actingAs($counterparty)->getJson($url."?role=$role")->assertOk();
                $this->actingAs($admin)->getJson($url)->assertOk();
                $this->actingAs($outsider)->getJson($url)->assertForbidden();
            }
            $deal->update(['stage' => DealStage::Completed]);
            $this->actingAs($admin)->getJson("/api/me/deals/{$deal->id}/feedback")
                ->assertOk()->assertJsonPath('data.can_submit_feedback', false);
        }
    }

    public function test_admin_and_mixed_admin_cannot_perform_any_participant_write(): void
    {
        [$founder, $counterparty, $deal] = $this->fixture();
        $admin = User::factory()->create();
        $admin->adminAccess()->create([]);
        $milestone = DealMilestone::create(['deal_id' => $deal->id, 'sequence_order' => 1, 'title' => 'Protected']);
        $proposal = DealTermProposal::create(['deal_id' => $deal->id, 'version' => 1, 'proposed_by_user_id' => $founder->id,
            'proposed_by_role' => 'founder', 'investment_type' => 'micro_profit_sharing', 'status' => 'proposed']);
        $paths = ['transition', 'negotiation/propose', "negotiation/{$proposal->id}/respond", 'agreement/generate',
            'agreement/sign', 'milestones', "milestones/{$milestone->id}/progress", "milestones/{$milestone->id}/submit",
            "milestones/{$milestone->id}/confirm", "milestones/{$milestone->id}/dispute", 'activate-milestones', 'complete', 'feedback'];
        $founder->adminAccess()->create([]);
        $counterparty->adminAccess()->create([]);
        foreach ([$admin, $founder, $counterparty] as $actor) {
            foreach ($paths as $path) {
                $this->actingAs($actor)->postJson("/api/me/deals/{$deal->id}/$path", ['rating' => 5])->assertForbidden();
            }
            $this->putJson("/api/me/deals/{$deal->id}/milestones/{$milestone->id}", ['title' => 'No'])->assertForbidden();
            $this->postJson("/api/me/connections/{$deal->connection_id}/deal")->assertForbidden();
            $this->getJson("/api/me/deals/{$deal->id}")->assertOk();
        }
        $this->assertDatabaseCount('deals', 1);
        $this->assertDatabaseCount('deal_state_histories', 0);
        $this->assertDatabaseCount('deal_feedback', 0);
        $this->assertDatabaseHas('deal_milestones', ['id' => $milestone->id, 'title' => 'Protected', 'status' => 'pending']);
    }

    public function test_multi_role_and_financial_rules_remain_strict(): void
    {
        [$founder, $investor, $deal] = $this->fixture();
        $investor->roles()->create(['role' => 'professional']);
        foreach (['', '/history', '/negotiation', '/agreement', '/milestones', '/feedback'] as $suffix) {
            $url = "/api/me/deals/{$deal->id}$suffix";
            $this->actingAs($investor)->getJson($url)->assertUnprocessable();
            $this->getJson($url.'?role=professional')->assertForbidden();
            $this->getJson($url.'?role=investor')->assertOk();
        }
        $url = "/api/me/deals/{$deal->id}/financial-reports";
        $this->getJson($url.'?role=investor')->assertForbidden();
        $deal->update(['stage' => DealStage::MilestoneFundingActive]);
        $this->getJson($url)->assertUnprocessable();
        $this->getJson($url.'?role=investor')->assertOk();
        $this->getJson($url.'?role=professional')->assertForbidden();
        [$otherFounder, $professional, $professionalDeal] = $this->fixture('professional');
        $professionalDeal->update(['stage' => DealStage::Completed]);
        $this->actingAs($professional)->getJson("/api/me/deals/{$professionalDeal->id}/financial-reports?role=professional")->assertForbidden();
    }

    public function test_child_resources_cannot_be_used_through_another_deal(): void
    {
        [$founder, $counterparty, $deal] = $this->fixture();
        [, , $otherDeal] = $this->fixture();
        $milestone = DealMilestone::create(['deal_id' => $otherDeal->id, 'sequence_order' => 1, 'title' => 'Other']);
        $proposal = DealTermProposal::create(['deal_id' => $otherDeal->id, 'version' => 1,
            'proposed_by_user_id' => $otherDeal->founder_user_id, 'proposed_by_role' => 'founder',
            'investment_type' => 'micro_profit_sharing', 'status' => 'proposed']);
        $this->actingAs($founder)->putJson("/api/me/deals/{$deal->id}/milestones/{$milestone->id}", ['title' => 'No'])->assertNotFound();
        $this->postJson("/api/me/deals/{$deal->id}/negotiation/{$proposal->id}/respond", ['action' => 'accept'])->assertNotFound();
        $this->assertDatabaseHas('deal_milestones', ['id' => $milestone->id, 'title' => 'Other']);
    }

    public function test_unauthenticated_deal_reads_are_denied(): void
    {
        [, , $deal] = $this->fixture();
        foreach (['', '/history', '/negotiation', '/agreement', '/milestones', '/funding-summary', '/feedback', '/financial-reports', '/financial-overview'] as $suffix) {
            $this->getJson("/api/me/deals/{$deal->id}$suffix")->assertUnauthorized();
        }
    }

    public function test_accept_terms_transitions_with_selected_counterparty_role(): void
    {
        foreach ([['investor', true], ['professional', true], ['investor', false]] as [$role, $multiRole]) {
            [$founder, $counterparty, $deal] = $this->fixture($role);
            if ($multiRole) {
                $counterparty->roles()->create(['role' => $role === 'investor' ? 'professional' : 'investor']);
            }
            $deal->update(['stage' => DealStage::Negotiation]);
            $proposal = DealTermProposal::create([
                'deal_id' => $deal->id, 'version' => 1, 'proposed_by_user_id' => $founder->id,
                'proposed_by_role' => 'founder', 'investment_type' => 'micro_profit_sharing', 'status' => 'accepted',
            ]);
            DealAgreement::create([
                'deal_id' => $deal->id, 'proposal_id' => $proposal->id, 'agreement_type' => 'micro_profit_sharing',
                'title' => 'Accepted terms', 'agreement_text' => 'Agreed terms', 'terms_snapshot' => [],
            ]);
            $url = "/api/me/deals/{$deal->id}";
            $this->actingAs($counterparty)->getJson($url."?role=$role")->assertOk();
            if ($multiRole) {
                $this->postJson($url.'/transition', ['target_state' => 'agreement'])
                    ->assertUnprocessable()->assertJsonValidationErrors('role', 'error.details');
                $this->postJson($url.'/transition', ['target_state' => 'agreement', 'role' => $role === 'investor' ? 'professional' : 'investor'])
                    ->assertForbidden();
                $this->assertSame(DealStage::Negotiation, $deal->fresh()->stage);
            }
            $this->postJson($url.'/transition', ['target_state' => 'agreement', 'role' => $role])
                ->assertOk()->assertJsonPath('data.stage', 'agreement');
            $this->assertSame(DealStage::Agreement, $deal->fresh()->stage);
            $this->assertDatabaseHas('deal_state_histories', [
                'deal_id' => $deal->id, 'previous_state' => 'negotiation', 'new_state' => 'agreement',
                'changed_by_user_id' => $counterparty->id,
            ]);
        }
    }
}
