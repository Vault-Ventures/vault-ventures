<?php

namespace Tests\Feature;

use App\Enums\BusinessStatus;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Models\Business;
use App\Models\BusinessNda;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessNdaFoundationTest extends TestCase
{
    use RefreshDatabase;

    private function createFounder(): User
    {
        $user = User::factory()->create([
            'email' => 'founder@example.com',
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Founder->value]);
        $user->founderProfile()->firstOrCreate([]);
        $user->unsetRelations();

        return $user;
    }

    private function createInvestor(): User
    {
        $user = User::factory()->create([
            'email' => 'investor@example.com',
            'verification_tier' => VerificationTier::Tier1,
        ]);
        $user->roles()->firstOrCreate(['role' => ParticipantRole::Investor->value]);
        $user->investorProfile()->firstOrCreate([]);

        return $user;
    }

    private function createBusiness(User $founder): Business
    {
        $business = new Business;
        $business->founder_profile_id = $founder->founderProfile->id;
        $business->name = 'Secure Tech Ltd';
        $business->description = 'Encrypted data solutions for finance.';
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

    public function test_business_nda_model_creation_and_enum_casting(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        $hash = hash('sha256', 'Standard Vault Ventures NDA v1.0 Template Text');

        $nda = BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Pending,
            'nda_version' => 'v1.0',
            'agreement_hash' => $hash,
            'requested_by_user_id' => $investor->id,
            'requested_at' => now(),
            'founder_accepted_at' => null,
            'counterparty_accepted_at' => now(),
            'activated_at' => null,
            'declined_at' => null,
            'declined_by_user_id' => null,
        ]);

        $this->assertDatabaseHas('business_ndas', [
            'id' => $nda->id,
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => 'investor',
            'status' => 'pending',
            'nda_version' => 'v1.0',
            'agreement_hash' => $hash,
        ]);

        $retrieved = BusinessNda::findOrFail($nda->id);
        $this->assertInstanceOf(NdaStatus::class, $retrieved->status);
        $this->assertSame(NdaStatus::Pending, $retrieved->status);
        $this->assertInstanceOf(ParticipantRole::class, $retrieved->counterparty_role);
        $this->assertSame(ParticipantRole::Investor, $retrieved->counterparty_role);
        $this->assertNotNull($retrieved->requested_at);
        $this->assertNotNull($retrieved->counterparty_accepted_at);
        $this->assertNull($retrieved->founder_accepted_at);
        $this->assertNull($retrieved->activated_at);
    }

    public function test_business_and_nda_relationships(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        $nda = BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Active,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'NDA Text'),
            'requested_by_user_id' => $founder->id,
            'requested_at' => now()->subMinutes(10),
            'founder_accepted_at' => now()->subMinutes(10),
            'counterparty_accepted_at' => now(),
            'activated_at' => now(),
        ]);

        $this->assertSame($business->id, $nda->business->id);
        $this->assertSame($investor->id, $nda->counterpartyUser->id);
        $this->assertSame($founder->id, $nda->requestedByUser->id);
        $this->assertNull($nda->declinedByUser);

        $this->assertTrue($business->ndas->contains('id', $nda->id));
    }

    public function test_unique_constraint_on_business_and_counterparty(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Pending,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'NDA Text'),
            'requested_by_user_id' => $investor->id,
            'requested_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Pending,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'NDA Text 2'),
            'requested_by_user_id' => $investor->id,
            'requested_at' => now(),
        ]);
    }

    public function test_declined_state_and_declined_by_relationship(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        $nda = BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Declined,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'NDA Text'),
            'requested_by_user_id' => $investor->id,
            'requested_at' => now()->subHour(),
            'declined_at' => now(),
            'declined_by_user_id' => $founder->id,
        ]);

        $this->assertSame(NdaStatus::Declined, $nda->status);
        $this->assertSame($founder->id, $nda->declinedByUser->id);
    }

    public function test_foreign_key_cascades_on_business_and_user_deletion(): void
    {
        $founder = $this->createFounder();
        $investor = $this->createInvestor();
        $business = $this->createBusiness($founder);

        $nda = BusinessNda::create([
            'business_id' => $business->id,
            'counterparty_user_id' => $investor->id,
            'counterparty_role' => ParticipantRole::Investor,
            'status' => NdaStatus::Pending,
            'nda_version' => 'v1.0',
            'agreement_hash' => hash('sha256', 'NDA Text'),
            'requested_by_user_id' => $investor->id,
            'requested_at' => now(),
            'declined_by_user_id' => $founder->id,
        ]);

        // When business is deleted, NDA is cascade deleted
        $business->delete();
        $this->assertDatabaseMissing('business_ndas', ['id' => $nda->id]);
    }
}
