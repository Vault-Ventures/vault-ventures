<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessDisclosureTest extends TestCase
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

    private function createInvestor(string $email = 'investor@example.com', VerificationTier $tier = VerificationTier::Tier0): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createProfessional(string $email = 'pro@example.com', VerificationTier $tier = VerificationTier::Tier0): User
    {
        $user = User::factory()->create(['email' => $email, 'verification_tier' => $tier]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->professionalProfile()->firstOrCreate([
            'industry_experience' => ['Healthcare'],
            'experience_level' => 'Senior',
            'availability' => 'Full-time',
            'location' => 'Dhaka',
        ]);
        $user->unsetRelations();

        return $user;
    }

    private function createPublishedBusiness(User $founder): Business
    {
        $business = $founder->founderProfile->businesses()->create([
            'name' => 'Apex Health',
            'industry' => 'Healthcare',
            'business_stage' => 'Seed',
            'location' => 'Dhaka',
        ]);
        $business->status = BusinessStatus::Submitted;
        $business->submitted_at = now();
        $business->save();

        return $business;
    }

    private function createDraftBusiness(User $founder): Business
    {
        return $founder->founderProfile->businesses()->create([
            'name' => 'Secret Draft Co',
            'industry' => 'Defense',
            'business_stage' => 'Concept',
            'location' => 'Dhaka',
        ]);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $founder = $this->createFounder();
        $business = $this->createPublishedBusiness($founder);

        $this->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertUnauthorized();

        $this->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertUnauthorized();
    }

    public function test_new_relationship_defaults_to_stage_1_teaser(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv1@example.com', VerificationTier::Tier0);
        $business = $this->createPublishedBusiness($founder);

        $res = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.stage', DisclosureStage::Teaser->value)
            ->assertJsonPath('data.stage_label', 'Teaser')
            ->assertJsonPath('data.has_expressed_interest', false)
            ->assertJsonPath('data.interest_expressed_at', null);

        $this->assertDatabaseMissing('business_disclosure_relationships', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
        ]);
    }

    public function test_tier_0_investor_can_express_interest_and_transition_to_stage_2(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('tier0inv@example.com', VerificationTier::Tier0);
        $business = $this->createPublishedBusiness($founder);

        $res = $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $investor->id)
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.stage_label', 'Extended Information')
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertNotNull($res->json('data.interest_expressed_at'));

        // Check persistent status
        $statusRes = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertDatabaseHas('business_disclosure_relationships', [
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
            'stage' => DisclosureStage::Extended->value,
        ]);
    }

    public function test_tier_0_professional_can_express_interest_and_transition_to_stage_2(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional('tier0pro@example.com', VerificationTier::Tier0);
        $business = $this->createPublishedBusiness($founder);

        $res = $this->actingAs($pro)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.counterparty_user_id', $pro->id)
            ->assertJsonPath('data.counterparty_role', 'professional')
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.stage_label', 'Extended Information')
            ->assertJsonPath('data.has_expressed_interest', true);

        $this->assertDatabaseHas('business_disclosure_relationships', [
            'business_id' => $business->id,
            'counterparty_user_id' => $pro->id,
            'counterparty_role' => 'professional',
            'stage' => DisclosureStage::Extended->value,
        ]);
    }

    public function test_founder_only_user_cannot_express_interest(): void
    {
        $founder1 = $this->createFounder('f1@example.com');
        $founder2 = $this->createFounder('f2@example.com');
        $business = $this->createPublishedBusiness($founder1);

        $this->actingAs($founder2)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertForbidden();
    }

    public function test_founder_cannot_express_interest_in_own_business(): void
    {
        $founder = $this->createFounder();
        // Even if founder also adds investor role
        $founder->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $founder->investorProfile()->firstOrCreate([]);
        $founder->unsetRelations();

        $business = $this->createPublishedBusiness($founder);

        $this->actingAs($founder)
            ->postJson("/api/me/businesses/{$business->id}/express-interest?role=investor")
            ->assertForbidden();
    }

    public function test_draft_business_returns_404_for_non_owners(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $draftBusiness = $this->createDraftBusiness($founder);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$draftBusiness->id}/disclosure-status")
            ->assertNotFound();

        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$draftBusiness->id}/express-interest")
            ->assertNotFound();
    }

    public function test_duplicate_interest_does_not_create_duplicate_records(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createPublishedBusiness($founder);

        $res1 = $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk();

        $res2 = $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk();

        $count = BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $investor->id)
            ->count();

        $this->assertEquals(1, $count);
    }

    public function test_relationship_is_strictly_scoped_and_isolated_per_user(): void
    {
        $founder = $this->createFounder();
        $investor1 = $this->createInvestor('inv1@example.com');
        $investor2 = $this->createInvestor('inv2@example.com');
        $business = $this->createPublishedBusiness($founder);

        // Investor 1 expresses interest
        $this->actingAs($investor1)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk();

        // Investor 1 is at Stage 2
        $this->actingAs($investor1)
            ->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value)
            ->assertJsonPath('data.counterparty_user_id', $investor1->id);

        // Investor 2 is still at Stage 1
        $this->actingAs($investor2)
            ->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Teaser->value)
            ->assertJsonPath('data.counterparty_user_id', $investor2->id)
            ->assertJsonPath('data.has_expressed_interest', false);
    }

    public function test_multi_role_user_requires_explicit_role_parameter(): void
    {
        $user = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $user->investorProfile()->firstOrCreate([]);
        $user->professionalProfile()->firstOrCreate([]);
        $user->unsetRelations();

        $founder = $this->createFounder();
        $business = $this->createPublishedBusiness($founder);

        // Missing role param -> 422
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Invalid role param -> 422
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/express-interest?role=founder")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');

        // Explicit valid investor role -> 200
        $this->actingAs($user)
            ->postJson("/api/me/businesses/{$business->id}/express-interest?role=investor")
            ->assertOk()
            ->assertJsonPath('data.counterparty_role', 'investor')
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value);
    }

    public function test_stage_3_and_stage_4_cannot_be_reached_in_phase_6a(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv@example.com', VerificationTier::Tier1);
        $business = $this->createPublishedBusiness($founder);

        // Express interest moves to Stage 2
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk();

        // Express interest again remains at Stage 2
        $this->actingAs($investor)
            ->postJson("/api/me/businesses/{$business->id}/express-interest")
            ->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value);

        $status = $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/disclosure-status")
            ->assertOk()
            ->assertJsonPath('data.stage', DisclosureStage::Extended->value);

        $this->assertNotEquals(DisclosureStage::Nda->value, $status->json('data.stage'));
        $this->assertNotEquals(DisclosureStage::FullProposal->value, $status->json('data.stage'));
    }
}
