<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\User;
use App\Services\Disclosure\NdaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessNdaApiTest extends TestCase
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

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor,
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

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->getJson("/api/me/businesses/{$business->id}/nda")->assertUnauthorized();
        $this->postJson("/api/me/businesses/{$business->id}/nda/request")->assertUnauthorized();
        $this->postJson("/api/me/businesses/{$business->id}/nda/accept")->assertUnauthorized();
        $this->postJson("/api/me/businesses/{$business->id}/nda/decline")->assertUnauthorized();
    }

    public function test_founder_first_professional_acceptance_requires_admin_tier_1_approval(): void
    {
        $founder = $this->createFounder();
        $professional = $this->createProfessional('unverified-professional@example.test', VerificationTier::Tier0);
        // Contact verification is test fixture setup, never live data.
        $professional->forceFill(['phone' => '+15551234567', 'phone_verified_at' => now()])->save();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $professional, ParticipantRole::Professional, DisclosureStage::Extended);
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/request", [
            'counterparty_user_id' => $professional->id, 'role' => 'professional',
        ])->assertOk()->assertJsonPath('data.founder_accepted', true)->assertJsonPath('data.counterparty_accepted', false);
        $this->actingAs($professional)->postJson("/api/me/businesses/{$business->id}/nda/accept", ['role' => 'professional'])->assertForbidden();
        $created = $this->postJson('/api/me/verification-requests')->assertCreated();
        $admin = User::factory()->create();
        \App\Models\AdminAccess::forceCreate(['user_id' => $admin->id]);
        $this->actingAs($admin)->postJson('/api/admin/verification-requests/'.$created->json('data.id').'/approve')->assertOk();
        $this->actingAs($professional->fresh())->postJson("/api/me/businesses/{$business->id}/nda/accept", ['role' => 'professional'])
            ->assertOk()->assertJsonPath('data.status', 'active')->assertJsonPath('data.founder_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', true)->assertJsonPath('data.stage_3_unlocked', true);
    }

    public function test_get_nda_when_not_yet_requested_returns_safe_default(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/nda")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.status', null)
            ->assertJsonPath('data.status_label', 'Not Requested')
            ->assertJsonPath('data.nda_version', 'v1.0')
            ->assertJsonPath('data.agreement_hash', NdaService::DEFAULT_AGREEMENT_HASH)
            ->assertJsonPath('data.current_stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.stage_3_unlocked', false)
            ->assertJsonPath('data.current_user_accepted', false)
            ->assertJsonPath('data.founder_accepted', false)
            ->assertJsonPath('data.counterparty_accepted', false)
            ->assertJsonMissingPath('data.declined_by_user_id')
            ->assertJsonMissingPath('data.counterparty_user_id');
    }

    public function test_valid_tier_1_investor_can_request_nda(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.status_label', 'Pending Acceptance')
            ->assertJsonPath('data.current_user_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', true)
            ->assertJsonPath('data.founder_accepted', false)
            ->assertJsonPath('data.stage_3_unlocked', false)
            ->assertJsonMissingPath('data.declined_by_user_id')
            ->assertJsonMissingPath('data.counterparty_user_id');
    }

    public function test_valid_tier_1_professional_can_request_nda(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Extended);

        $this->actingAs($pro)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.current_user_accepted', true);
    }

    public function test_valid_tier_1_founder_can_request_nda_for_stage_2_counterparty(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.founder_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', false)
            ->assertJsonPath('data.current_user_accepted', true);
    }

    public function test_tier_0_cannot_request_nda(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertForbidden();
    }

    public function test_tier_0_cannot_accept_nda(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Founder creates NDA
        (new NdaService)->requestNda($business, $founder, $investor);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/accept")
            ->assertForbidden();
    }

    public function test_tier_0_cannot_decline_nda(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        (new NdaService)->requestNda($business, $founder, $investor);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/decline")
            ->assertForbidden();
    }

    public function test_request_on_stage_1_rejected(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // Stage 1 Teaser only
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Teaser);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertForbidden();
    }

    public function test_one_sided_acceptance_remains_pending_and_stage_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor requests NDA (requester accepted, founder not yet accepted)
        $res = $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk();

        $res->assertJsonPath('data.status', NdaStatus::Pending->value);
        $res->assertJsonPath('data.current_stage', DisclosureStage::Extended->value);
        $res->assertJsonPath('data.stage_3_unlocked', false);
        $res->assertJsonPath('data.founder_accepted', false);
        $res->assertJsonPath('data.counterparty_accepted', true);

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Extended, $relationship->stage);
    }

    public function test_bilateral_acceptance_activates_nda_and_advances_stage_to_3(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // 1. Investor requests NDA
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.stage_3_unlocked', false);

        // 2. Founder accepts NDA
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/accept", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Active->value)
            ->assertJsonPath('data.current_stage', DisclosureStage::Nda->value)
            ->assertJsonPath('data.stage_3_unlocked', true)
            ->assertJsonPath('data.founder_accepted', true)
            ->assertJsonPath('data.counterparty_accepted', true);

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Nda, $relationship->stage);
    }

    public function test_decline_nda_sets_status_declined_and_keeps_stage_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor requests
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk();

        // Founder declines
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/decline", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Declined->value)
            ->assertJsonPath('data.current_stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.stage_3_unlocked', false)
            ->assertJsonMissingPath('data.declined_by_user_id');

        $relationship->refresh();
        $this->assertSame(DisclosureStage::Extended, $relationship->stage);
    }

    public function test_declined_nda_can_be_requested_again(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // 1. Request -> Decline
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/request")->assertOk();
        $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/decline", ['counterparty_user_id' => $investor->id])->assertOk();

        $this->assertDatabaseCount('business_ndas', 1);

        // 2. Re-request by investor
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.current_user_accepted', true);

        $this->assertDatabaseCount('business_ndas', 1);
    }

    public function test_duplicate_active_or_pending_nda_cannot_be_requested(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // First request -> 200
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertOk();

        // Second request -> 409 Conflict
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertStatus(409);
    }

    public function test_unrelated_user_cannot_access_or_manipulate_nda(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor1, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor 1 requests NDA
        $this->actingAs($investor1)->postJson("/api/me/businesses/{$business->id}/nda/request")->assertOk();

        // Investor 2 (unrelated, no relationship) views NDA: gets their own safe default, NOT Investor 1's NDA
        $this->actingAs($investor2)
            ->getJson("/api/me/businesses/{$business->id}/nda")
            ->assertOk()
            ->assertJsonPath('data.status', null)
            ->assertJsonPath('data.current_stage', DisclosureStage::Teaser->value)
            ->assertJsonPath('data.stage_3_unlocked', false);

        // Investor 2 tries to request without Stage 2 relationship -> 403
        $this->actingAs($investor2)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertForbidden();

        // Investor 2 tries to accept -> 404
        $this->actingAs($investor2)
            ->postJson("/api/me/businesses/{$business->id}/nda/accept")
            ->assertNotFound();

        // Investor 2 tries to decline -> 404
        $this->actingAs($investor2)
            ->postJson("/api/me/businesses/{$business->id}/nda/decline")
            ->assertNotFound();
    }

    public function test_founder_cannot_forge_invalid_counterparty_identity(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('valid@example.com');
        $unrelatedUser = $this->createInvestor('unrelated@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // 1. Missing counterparty_user_id for founder request -> 422
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['counterparty_user_id'], 'error.details');

        // 2. Non-existent user ID -> 422
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", ['counterparty_user_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['counterparty_user_id'], 'error.details');

        // 3. Founder specifying their own user ID -> 422
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", ['counterparty_user_id' => $founder->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['counterparty_user_id'], 'error.details');

        // 4. User without existing Stage 2 relationship -> 403 Forbidden
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", ['counterparty_user_id' => $unrelatedUser->id])
            ->assertForbidden();
    }

    public function test_investor_counterparty_identity_cannot_be_forged(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor1, ParticipantRole::Investor, DisclosureStage::Extended);
        $this->createRelationship($business, $investor2, ParticipantRole::Investor, DisclosureStage::Extended);

        // Investor 1 sends request supplying investor 2's ID in body:
        // Server MUST bind strictly to authenticated user (investor 1)
        $this->actingAs($investor1)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", [
                'counterparty_user_id' => $investor2->id,
            ])
            ->assertOk();

        // Verify NDA was created for investor1, not investor2
        $this->assertDatabaseHas('business_ndas', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor1->id,
            'status' => NdaStatus::Pending->value,
        ]);
        $this->assertDatabaseMissing('business_ndas', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor2->id,
        ]);
    }

    public function test_draft_business_isolation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder, BusinessStatus::Draft);

        $this->actingAs($investor)->getJson("/api/me/businesses/{$business->id}/nda")->assertNotFound();
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/request")->assertNotFound();
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/accept")->assertNotFound();
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/decline")->assertNotFound();
    }

    public function test_client_cannot_manipulate_status_or_stage_or_timestamps(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Send malicious payload attempting to force status=active and stage=4
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/nda/request", [
                'status' => 'active',
                'stage' => 4,
                'founder_accepted_at' => now()->toIso8601String(),
                'activated_at' => now()->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Pending->value)
            ->assertJsonPath('data.current_stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.stage_3_unlocked', false)
            ->assertJsonPath('data.founder_accepted', false);
    }

    public function test_multi_role_user_requires_explicit_role_where_applicable(): void
    {
        $founder = $this->createFounder();
        $user = User::factory()->create(['email' => 'multi@example.com', 'verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $user, ParticipantRole::Investor, DisclosureStage::Extended);

        // Missing role -> 422
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/nda/request")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Invalid role -> 422
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/nda/request?role=admin")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Valid role -> 200
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/nda/request?role=investor")
            ->assertOk()
            ->assertJsonPath('data.status', NdaStatus::Pending->value);
    }

    public function test_response_does_not_expose_confidential_data_or_documents_or_private_ids(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $res = $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/request");

        $res->assertOk();
        $res->assertJsonMissingPath('data.documents');
        $res->assertJsonMissingPath('data.financials');
        $res->assertJsonMissingPath('data.full_proposal');
        $res->assertJsonMissingPath('data.pitch_deck');
        $res->assertJsonMissingPath('data.password');
        $res->assertJsonMissingPath('data.declined_by_user_id');
        $res->assertJsonMissingPath('data.counterparty_user_id');
    }

    public function test_stage_4_cannot_be_reached_in_phase_6b(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        // Complete bilateral NDA
        $this->actingAs($investor)->postJson("/api/me/businesses/{$business->id}/nda/request")->assertOk();
        $res = $this->actingAs($founder)->postJson("/api/me/businesses/{$business->id}/nda/accept", ['counterparty_user_id' => $investor->id]);

        $res->assertOk()
            ->assertJsonPath('data.current_stage', DisclosureStage::Nda->value);

        $this->assertNotEquals(DisclosureStage::FullProposal->value, $res->json('data.current_stage'));
    }
}
