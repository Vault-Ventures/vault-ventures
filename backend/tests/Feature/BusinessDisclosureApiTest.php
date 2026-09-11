<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessDocument;
use App\Models\BusinessNda;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessInputVersion;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessDisclosureApiTest extends TestCase
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

        $skill1 = Skill::firstOrCreate(['normalized_name' => 'laravel', 'name' => 'Laravel']);
        $skill2 = Skill::firstOrCreate(['normalized_name' => 'fintech', 'name' => 'Fintech']);
        $req->skills()->sync([$skill1->id, $skill2->id]);

        return $business;
    }

    private function createRelationship(
        Business $business,
        User $counterparty,
        ParticipantRole $role = ParticipantRole::Investor,
        DisclosureStage $stage = DisclosureStage::Nda
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => now(),
            'stage_4_confirmed_at' => $stage === DisclosureStage::FullProposal ? now() : null,
        ]);
    }

    private function createNda(
        Business $business,
        User $counterparty,
        User $founder,
        NdaStatus $status = NdaStatus::Active
    ): BusinessNda {
        return BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => $status,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'v1.0'),
            'requested_by_user_id' => $counterparty->id,
            'requested_at' => now(),
            'founder_accepted_at' => $status === NdaStatus::Active ? now() : null,
            'counterparty_accepted_at' => now(),
            'activated_at' => $status === NdaStatus::Active ? now() : null,
        ]);
    }

    private function createPitchDeck(Business $business): BusinessDocument
    {
        $doc = new BusinessDocument;
        $doc->business_id = $business->id;
        $doc->kind = 'pitch_deck';
        $doc->original_name = 'Pitch_Deck_v1.pdf';
        $doc->disk = 'local';
        $doc->path = "businesses/{$business->id}/pitch_deck.pdf";
        $doc->mime_type = 'application/pdf';
        $doc->size_bytes = 1048576;
        $doc->save();

        return $doc;
    }

    private function createBusinessPlan(Business $business): BusinessDocument
    {
        $doc = new BusinessDocument;
        $doc->business_id = $business->id;
        $doc->kind = 'business_plan';
        $doc->original_name = 'Business_Plan_Confidential.pdf';
        $doc->disk = 'local';
        $doc->path = "businesses/{$business->id}/business_plan.pdf";
        $doc->mime_type = 'application/pdf';
        $doc->size_bytes = 2097152;
        $doc->save();

        return $doc;
    }

    private function createReadinessAssessmentRecord(Business $business): ReadinessAssessment
    {
        $input = new ReadinessInputVersion;
        $input->business_id = $business->id;
        $input->version = 1;
        $input->schema_version = 'v1';
        $input->answers = ['team' => 4, 'product' => 4];
        $input->created_at = now();
        $input->save();

        $assessment = new ReadinessAssessment;
        $assessment->business_id = $business->id;
        $assessment->readiness_input_version_id = $input->id;
        $assessment->version = 1;
        $assessment->input_version = 1;
        $assessment->input_schema_version = 'v1';
        $assessment->rubric_version = 'v1';
        $assessment->source_snapshot = ['team' => 4, 'product' => 4];
        $assessment->source_fingerprint = 'abc123hash';
        $assessment->factor_results = [
            ['factor' => 'team_strength', 'score' => 85, 'status' => 'strong'],
            ['factor' => 'market_traction', 'score' => 70, 'status' => 'moderate'],
        ];
        $assessment->overall_score = 78.50;
        $assessment->weak_areas = ['financial_modeling'];
        $assessment->suggestions = ['Improve 3-year cash flow projections'];
        $assessment->is_incomplete = false;
        $assessment->calculation = ['weights' => ['team' => 0.5, 'market' => 0.5]];
        $assessment->evaluated_at = now();
        $assessment->save();

        return $assessment;
    }

    // ==========================================
    // A. Confirm Stage 4 API Tests
    // ==========================================

    public function test_valid_founder_confirmation_succeeds_and_advances_to_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $res = $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.stage', DisclosureStage::FullProposal->value)
            ->assertJsonPath('data.stage_label', 'Full Proposal')
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertNotNull($res->json('data.stage_4_confirmed_at'));

        $relationship->refresh();
        $this->assertSame(DisclosureStage::FullProposal, $relationship->stage);
        $this->assertNotNull($relationship->stage_4_confirmed_at);
    }

    public function test_founder_tier_0_cannot_confirm_stage_4(): void
    {
        $founder = $this->createFounder('f0@example.com', VerificationTier::Tier0);
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_counterparty_tier_0_prevents_stage_4_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_counterparty_cannot_call_stage_4_confirmation_endpoint(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_stage_1_relationship_cannot_jump_to_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Teaser);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_stage_2_relationship_cannot_jump_to_stage_4(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_missing_active_nda_rejected_for_stage_4_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        // NDA is pending, not active
        $this->createNda($business, $investor, $founder, NdaStatus::Pending);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_wrong_counterparty_pairing_rejected_for_stage_4_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor1, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor1, $founder, NdaStatus::Active);

        // Attempting to confirm investor 2 who has no relationship
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor2->id,
            ])
            ->assertNotFound();
    }

    public function test_non_owner_rejected_from_confirming_stage_4(): void
    {
        $founder1 = $this->createFounder('f1@example.com');
        $founder2 = $this->createFounder('f2@example.com');
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder1);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder1, NdaStatus::Active);

        $this->actingAs($founder2)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertForbidden();
    }

    public function test_already_stage_4_cannot_be_reconfirmed(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        // 1st confirm -> 200
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertOk();

        // 2nd confirm -> 409 Conflict
        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertStatus(409);
    }

    public function test_founder_confirming_for_professional_counterparty_succeeds(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional();
        $business = $this->createBusiness($founder);
        $relationship = $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Nda);
        $this->createNda($business, $pro, $founder, NdaStatus::Active);

        $res = $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $pro->id,
            ]);

        $res->assertOk()
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.stage', DisclosureStage::FullProposal->value);
    }

    public function test_missing_counterparty_user_id_returns_422(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['counterparty_user_id'], 'error.details');
    }

    public function test_founder_cannot_confirm_stage_4_for_themselves(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $founder->id,
            ])
            ->assertStatus(422);
    }

    public function test_draft_business_isolation_for_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder, BusinessStatus::Draft);

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/disclosure/confirm-stage-4", [
                'counterparty_user_id' => $investor->id,
            ])
            ->assertNotFound();
    }

    // ==========================================
    // B. GET Staged Disclosure API Tests
    // ==========================================

    public function test_stage_1_teaser_returns_only_stage_1_fields(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv1@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);
        $this->createReadinessAssessmentRecord($business);

        // No relationship -> Stage 1 Teaser
        $res = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Teaser->value)
            ->assertJsonPath('data.disclosure.stage_label', 'Teaser')
            ->assertJsonPath('data.disclosure.has_expressed_interest', false)
            ->assertJsonPath('data.business.name', 'Secure Pay Ltd')
            ->assertJsonPath('data.business.industry', 'technology')
            ->assertJsonPath('data.business.business_stage', 'early_traction')
            ->assertJsonPath('data.business.location', 'Dhaka, Bangladesh')
            ->assertJsonPath('data.business.description', 'Fintech infrastructure in Dhaka.')
            ->assertJsonMissingPath('data.business.risk_level')
            ->assertJsonMissingPath('data.business.expected_involvement')
            ->assertJsonPath('data.requirements', null)
            ->assertJsonPath('data.readiness', null)
            ->assertJsonPath('data.documents', []);
    }

    public function test_stage_2_extended_returns_stage_1_and_stage_2_fields(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv2@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);
        $this->createReadinessAssessmentRecord($business);

        $res = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.disclosure.stage_label', 'Extended Information')
            ->assertJsonPath('data.disclosure.has_expressed_interest', true)
            ->assertJsonPath('data.business.name', 'Secure Pay Ltd')
            ->assertJsonPath('data.business.risk_level', 'medium')
            ->assertJsonPath('data.business.expected_involvement', 'advisory')
            ->assertJsonPath('data.requirements.funding_amount', '50000.00')
            ->assertJsonPath('data.requirements.accepted_investment_types', ['equity', 'safe'])
            ->assertJsonPath('data.requirements.required_experience_level', 'Senior')
            ->assertJsonPath('data.requirements.required_availability', 'Part-time (10h/week)')
            ->assertJsonPath('data.requirements.skills', ['Fintech', 'Laravel'])
            ->assertJsonMissingPath('data.requirements.micro_proposed_terms')
            ->assertJsonMissingPath('data.requirements.large_standard_proposed_terms')
            ->assertJsonPath('data.readiness', null)
            ->assertJsonPath('data.documents', []);
    }

    public function test_stage_3_nda_protected_returns_stage_3_fields_with_pitch_deck_only(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv3@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);
        $businessPlan = $this->createBusinessPlan($business);
        $this->createReadinessAssessmentRecord($business);

        $res = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Nda->value)
            ->assertJsonPath('data.disclosure.stage_label', 'NDA Protected')
            ->assertJsonPath('data.business.risk_level', 'medium')
            ->assertJsonPath('data.requirements.micro_proposed_terms', 'Micro terms for angel checks up to $10k.')
            ->assertJsonPath('data.requirements.large_standard_proposed_terms', 'Standard SAFE note with $5M valuation cap.')
            ->assertJsonPath('data.readiness.overall_score', '78.50')
            ->assertJsonPath('data.readiness.weak_areas', ['financial_modeling'])
            ->assertJsonPath('data.readiness.suggestions', ['Improve 3-year cash flow projections'])
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonPath('data.documents.0.id', $pitchDeck->id)
            ->assertJsonPath('data.documents.0.kind', 'pitch_deck')
            ->assertJsonPath('data.documents.0.original_name', 'Pitch_Deck_v1.pdf');

        // Verify business plan is NOT present in documents at Stage 3
        $docKinds = collect($res->json('data.documents'))->pluck('kind')->all();
        $this->assertNotContains('business_plan', $docKinds);
    }

    public function test_stage_4_full_proposal_returns_full_data_and_all_documents(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv4@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);
        $businessPlan = $this->createBusinessPlan($business);
        $this->createReadinessAssessmentRecord($business);

        $res = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::FullProposal->value)
            ->assertJsonPath('data.disclosure.stage_label', 'Full Proposal')
            ->assertJsonPath('data.business.status', 'submitted')
            ->assertJsonPath('data.requirements.micro_proposed_terms', 'Micro terms for angel checks up to $10k.')
            ->assertJsonPath('data.readiness.overall_score', '78.50')
            ->assertJsonCount(2, 'data.documents');

        $docKinds = collect($res->json('data.documents'))->pluck('kind')->all();
        $this->assertContains('pitch_deck', $docKinds);
        $this->assertContains('business_plan', $docKinds);
    }

    public function test_tier_0_investor_can_access_stage_1_and_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('t0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);

        // Stage 1 -> 200
        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Teaser->value);

        // Stage 2 -> 200
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Extended->value);
    }

    public function test_tier_0_cannot_access_stage_3_or_stage_4_disclosure(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('t0_stage3@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);

        // Stage 3 with Tier 0 counterparty -> 403
        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertForbidden();

        // Stage 4 with Tier 0 counterparty -> 403
        $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)->where('counterparty_user_id', $investor->id)->first();
        $relationship->update(['stage' => DisclosureStage::FullProposal, 'stage_4_confirmed_at' => now()]);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertForbidden();
    }

    public function test_tier_1_counterparty_blocked_if_nda_is_not_active_at_stage_3(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('t1@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Pending);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertForbidden();
    }

    public function test_unrelated_user_without_roles_cannot_access_disclosure(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $userWithoutRoles = User::factory()->create();

        $this->actingAs($userWithoutRoles)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertForbidden();
    }

    public function test_draft_business_returns_404_for_non_owners_on_disclosure(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $draftBusiness = $this->createBusiness($founder, BusinessStatus::Draft);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$draftBusiness->id}/disclosure")
            ->assertNotFound();
    }

    public function test_multi_role_counterparty_requires_role_parameter(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);

        $multiUser = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $multiUser->investorProfile()->firstOrCreate([]);
        $multiUser->professionalProfile()->firstOrCreate([]);
        $multiUser->unsetRelations();

        // Missing role -> 422
        $this->actingAs($multiUser)
            ->getJson("/api/me/businesses/{$business->id}/disclosure")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Invalid role -> 422
        $this->actingAs($multiUser)
            ->getJson("/api/me/businesses/{$business->id}/disclosure?role=admin")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Valid role -> 200
        $this->actingAs($multiUser)
            ->getJson("/api/me/businesses/{$business->id}/disclosure?role=investor")
            ->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Teaser->value);
    }

    public function test_founder_can_view_own_business_full_disclosure(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);
        $businessPlan = $this->createBusinessPlan($business);
        $this->createReadinessAssessmentRecord($business);

        $res = $this->actingAs($founder)
            ->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::FullProposal->value)
            ->assertJsonPath('data.business.status', 'submitted')
            ->assertJsonPath('data.requirements.micro_proposed_terms', 'Micro terms for angel checks up to $10k.')
            ->assertJsonPath('data.readiness.overall_score', '78.50')
            ->assertJsonCount(2, 'data.documents');
    }

    public function test_founder_can_inspect_specific_counterparty_stage_context(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);

        $res = $this->actingAs($founder)
            ->getJson("/api/me/businesses/{$business->id}/disclosure?counterparty_user_id={$investor->id}");

        $res->assertOk()
            ->assertJsonPath('data.disclosure.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.disclosure.has_expressed_interest', true)
            ->assertJsonPath('data.requirements.funding_amount', '50000.00')
            ->assertJsonPath('data.documents', []);
    }

    public function test_response_does_not_leak_paths_disks_or_sensitive_auth(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $res = $this->actingAs($investor)->getJson("/api/me/businesses/{$business->id}/disclosure");

        $res->assertOk();
        $jsonStr = $res->getContent();

        $this->assertStringNotContainsString('password', $jsonStr);
        $this->assertStringNotContainsString('disk', $jsonStr);
        $this->assertStringNotContainsString('businesses/', $jsonStr);
        $this->assertStringNotContainsString('download', $jsonStr);
    }
}
