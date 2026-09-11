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
use App\Models\DocumentAccessLog;
use App\Models\User;
use App\Services\BusinessDocumentStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StagedDocumentAccessTest extends TestCase
{
    use RefreshDatabase;

    private const PDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(BusinessDocumentStorage::DISK);
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
        DisclosureStage $stage = DisclosureStage::Nda,
        bool $confirmedStage4 = true
    ): BusinessDisclosureRelationship {
        return BusinessDisclosureRelationship::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $role,
            'stage' => $stage,
            'interest_expressed_at' => now(),
            'stage_4_confirmed_at' => ($stage === DisclosureStage::FullProposal && $confirmedStage4) ? now() : null,
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
        $file = UploadedFile::fake()->createWithContent('Pitch_Deck_v1.pdf', self::PDF);
        $storage = app(BusinessDocumentStorage::class);
        $path = $storage->newPath($business->id);
        $storage->put($path, $file);

        $doc = new BusinessDocument;
        $doc->business_id = $business->id;
        $doc->kind = 'pitch_deck';
        $doc->original_name = 'Pitch_Deck_v1.pdf';
        $doc->disk = BusinessDocumentStorage::DISK;
        $doc->path = $path;
        $doc->mime_type = 'application/pdf';
        $doc->size_bytes = strlen(self::PDF);
        $doc->save();

        return $doc;
    }

    private function createBusinessPlan(Business $business): BusinessDocument
    {
        $file = UploadedFile::fake()->createWithContent('Business_Plan_Confidential.pdf', self::PDF);
        $storage = app(BusinessDocumentStorage::class);
        $path = $storage->newPath($business->id);
        $storage->put($path, $file);

        $doc = new BusinessDocument;
        $doc->business_id = $business->id;
        $doc->kind = 'business_plan';
        $doc->original_name = 'Business_Plan_Confidential.pdf';
        $doc->disk = BusinessDocumentStorage::DISK;
        $doc->path = $path;
        $doc->mime_type = 'application/pdf';
        $doc->size_bytes = strlen(self::PDF);
        $doc->save();

        return $doc;
    }

    // ==========================================
    // 1 & 27 & 28. Stage 4 confirmation requirement & anti-bypass
    // ==========================================

    public function test_stage_4_requires_stage_4_confirmed_at_and_actual_stage_4_relationship(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // Stage 4 in enum but unconfirmed timestamp -> 403
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal, false);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertForbidden();
    }

    public function test_active_nda_alone_does_not_bypass_stage_4_confirmation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        // Relationship is Stage 3 with active NDA
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertForbidden();
    }

    public function test_counterparty_cannot_self_grant_stage_4_document_access(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $businessPlan = $this->createBusinessPlan($business);

        // Attempting to pass fake stage=4 query param
        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download?stage=4")
            ->assertForbidden();
    }

    // ==========================================
    // 2. Active NDA + Stage 3 must NOT permit business_plan
    // ==========================================

    public function test_active_nda_and_stage_3_must_not_permit_business_plan(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertForbidden();
    }

    // ==========================================
    // 3 & 26. Tier 0 / Unverified Founder must block protected counterparty document access
    // ==========================================

    public function test_tier_0_founder_must_block_protected_counterparty_document_access(): void
    {
        $founder = $this->createFounder('f0@example.com', VerificationTier::Tier0);
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();
    }

    public function test_unverified_founder_blocks_protected_counterparty_access(): void
    {
        $founder = $this->createFounder('f_unverified@example.com', VerificationTier::Tier0);
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertForbidden();
    }

    // ==========================================
    // 4. Tier 0 Counterparty must block Stage 3/4 documents
    // ==========================================

    public function test_tier_0_counterparty_must_block_stage_3_and_4_documents(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv0@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        // Stage 3 Tier 0 -> 403
        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();

        // Stage 4 Tier 0 -> 403
        $rel = BusinessDisclosureRelationship::where('business_id', $business->id)->where('counterparty_user_id', $investor->id)->first();
        $rel->update(['stage' => DisclosureStage::FullProposal, 'stage_4_confirmed_at' => now()]);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertForbidden();
    }

    // ==========================================
    // 5. Stage 3 Tier 1 counterparty can access pitch_deck
    // ==========================================

    public function test_stage_3_tier_1_counterparty_can_access_pitch_deck(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv3@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        $res = $this->actingAs($investor)->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download");
        $res->assertOk();
        $this->assertSame(self::PDF, $res->getContent());
    }

    // ==========================================
    // 6. Stage 4 Tier 1 counterparty can access pitch_deck and business_plan
    // ==========================================

    public function test_stage_4_tier_1_counterparty_can_access_pitch_deck_and_business_plan(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv4@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertOk();

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertOk();
    }

    // ==========================================
    // 7. Cross-business document IDOR blocked
    // ==========================================

    public function test_cross_business_document_idor_blocked(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business1 = $this->createBusiness($founder);
        $business2 = $this->createBusiness($founder);

        $this->createRelationship($business1, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business1, $investor, $founder, NdaStatus::Active);

        $docBiz2 = $this->createPitchDeck($business2);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business1->id}/documents/{$docBiz2->id}/download")
            ->assertNotFound();
    }

    // ==========================================
    // 8. Cross-user/unrelated document access blocked
    // ==========================================

    public function test_cross_user_and_unrelated_document_access_blocked(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);

        $unrelatedUser = User::factory()->create();

        $this->actingAs($unrelatedUser)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();
    }

    // ==========================================
    // 9. Draft/non-public business non-owner isolation
    // ==========================================

    public function test_draft_non_public_business_non_owner_isolation(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $draftBiz = $this->createBusiness($founder, BusinessStatus::Draft);
        $pitchDeck = $this->createPitchDeck($draftBiz);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$draftBiz->id}/documents")
            ->assertNotFound();

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$draftBiz->id}/documents/{$pitchDeck->id}/download")
            ->assertNotFound();
    }

    // ==========================================
    // 10. Investor-only role resolution
    // ==========================================

    public function test_investor_only_role_resolution(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv_only@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertOk();
    }

    // ==========================================
    // 11. Professional-only role resolution
    // ==========================================

    public function test_professional_only_role_resolution(): void
    {
        $founder = $this->createFounder();
        $pro = $this->createProfessional('pro_only@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $pro, ParticipantRole::Professional, DisclosureStage::Nda);
        $this->createNda($business, $pro, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($pro)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertOk();
    }

    // ==========================================
    // 12. Multi-role without ?role rejected
    // ==========================================

    public function test_multi_role_without_role_parameter_rejected(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);

        $multiUser = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $multiUser->investorProfile()->firstOrCreate([]);
        $multiUser->professionalProfile()->firstOrCreate([]);
        $multiUser->unsetRelations();

        $this->createRelationship($business, $multiUser, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $multiUser, $founder, NdaStatus::Active);

        $this->actingAs($multiUser)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');
    }

    // ==========================================
    // 13. Invalid role rejected
    // ==========================================

    public function test_invalid_role_rejected(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);

        $multiUser = User::factory()->create(['verification_tier' => VerificationTier::Tier1]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $multiUser->roles()->firstOrCreate(['role' => ParticipantRole::Professional->value]);
        $multiUser->investorProfile()->firstOrCreate([]);
        $multiUser->professionalProfile()->firstOrCreate([]);
        $multiUser->unsetRelations();

        $this->createRelationship($business, $multiUser, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $multiUser, $founder, NdaStatus::Active);

        $this->actingAs($multiUser)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download?role=superadmin")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role'], 'error.details');
    }

    // ==========================================
    // 14. Successful authorized download creates exactly one download_initiated audit log
    // ==========================================

    public function test_successful_authorized_download_creates_exactly_one_audit_log(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $pitchDeck = $this->createPitchDeck($business);

        $this->assertDatabaseCount('document_access_logs', 0);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertOk();

        $this->assertDatabaseCount('document_access_logs', 1);
        $this->assertDatabaseHas('document_access_logs', [
            'business_document_id' => $pitchDeck->id,
            'actor_user_id' => $investor->id,
            'action' => 'download_initiated',
        ]);
    }

    // ==========================================
    // 15. Unauthorized download does not create a successful download audit log
    // ==========================================

    public function test_unauthorized_download_does_not_create_audit_log(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv_stage1@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();

        $this->assertDatabaseCount('document_access_logs', 0);
    }

    // ==========================================
    // 16. Audit-log failure prevents document streaming / fails closed
    // ==========================================

    public function test_audit_log_failure_prevents_document_streaming_fails_closed(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);

        config(['logging.default' => 'null']);
        DocumentAccessLog::creating(fn () => throw new \RuntimeException('Audit database failure'));

        try {
            $res = $this->actingAs($founder)
                ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download");
            $res->assertStatus(500);
            $this->assertStringNotContainsString(self::PDF, $res->getContent());
        } finally {
            DocumentAccessLog::flushEventListeners();
        }

        $this->assertDatabaseCount('document_access_logs', 0);
    }

    // ==========================================
    // 17. No storage path/disk/internal filesystem data in metadata response
    // ==========================================

    public function test_no_storage_path_disk_internal_filesystem_data_in_metadata_response(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $this->createPitchDeck($business);

        $res = $this->actingAs($investor)->getJson("/api/me/businesses/{$business->id}/documents");
        $res->assertOk();

        $jsonStr = $res->getContent();
        $this->assertStringNotContainsString('disk', $jsonStr);
        $this->assertStringNotContainsString('path', $jsonStr);
        $this->assertStringNotContainsString('businesses/', $jsonStr);
        $this->assertStringNotContainsString('download_url', $jsonStr);
    }

    // ==========================================
    // 18. Stage 1 document listing returns empty
    // ==========================================

    public function test_stage_1_document_listing_returns_empty(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv1_list@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/documents")
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    // ==========================================
    // 19. Stage 2 document listing returns empty
    // ==========================================

    public function test_stage_2_document_listing_returns_empty(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv2_list@example.com', VerificationTier::Tier0);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Extended);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $this->actingAs($investor)
            ->getJson("/api/me/businesses/{$business->id}/documents")
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    // ==========================================
    // 20. Stage 3 document listing exposes pitch_deck metadata only
    // ==========================================

    public function test_stage_3_document_listing_exposes_pitch_deck_metadata_only(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv3_list@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $res = $this->actingAs($investor)->getJson("/api/me/businesses/{$business->id}/documents");
        $res->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('pitch_deck', $res->json('data.0.kind'));
    }

    // ==========================================
    // 21. Stage 4 document listing exposes both allowed document metadata
    // ==========================================

    public function test_stage_4_document_listing_exposes_both_allowed_document_metadata(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('inv4_list@example.com', VerificationTier::Tier1);
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::FullProposal);
        $this->createNda($business, $investor, $founder, NdaStatus::Active);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $res = $this->actingAs($investor)->getJson("/api/me/businesses/{$business->id}/documents");
        $res->assertOk()->assertJsonCount(2, 'data');
        $kinds = collect($res->json('data'))->pluck('kind')->all();
        $this->assertContains('pitch_deck', $kinds);
        $this->assertContains('business_plan', $kinds);
    }

    // ==========================================
    // 22. Founder owner can list both document types
    // ==========================================

    public function test_founder_owner_can_list_both_document_types(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $this->createPitchDeck($business);
        $this->createBusinessPlan($business);

        $res = $this->actingAs($founder)->getJson("/api/me/businesses/{$business->id}/documents");
        $res->assertOk()->assertJsonCount(2, 'data');
    }

    // ==========================================
    // 23. Founder owner can download both document types
    // ==========================================

    public function test_founder_owner_can_download_both_document_types(): void
    {
        $founder = $this->createFounder();
        $business = $this->createBusiness($founder);
        $pitchDeck = $this->createPitchDeck($business);
        $businessPlan = $this->createBusinessPlan($business);

        $this->actingAs($founder)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertOk();

        $this->actingAs($founder)
            ->get("/api/me/businesses/{$business->id}/documents/{$businessPlan->id}/download")
            ->assertOk();
    }

    // ==========================================
    // 24. Pending NDA blocks Stage 3/4 counterparty access
    // ==========================================

    public function test_pending_nda_blocks_stage_3_and_4_counterparty_access(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('pending_nda@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $this->createNda($business, $investor, $founder, NdaStatus::Pending);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();
    }

    // ==========================================
    // 25. Declined NDA blocks Stage 3/4 counterparty access
    // ==========================================

    public function test_declined_nda_blocks_stage_3_and_4_counterparty_access(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor('declined_nda@example.com');
        $business = $this->createBusiness($founder);
        $this->createRelationship($business, $investor, ParticipantRole::Investor, DisclosureStage::Nda);
        $nda = $this->createNda($business, $investor, $founder, NdaStatus::Declined);
        $pitchDeck = $this->createPitchDeck($business);

        $this->actingAs($investor)
            ->get("/api/me/businesses/{$business->id}/documents/{$pitchDeck->id}/download")
            ->assertForbidden();
    }
}
