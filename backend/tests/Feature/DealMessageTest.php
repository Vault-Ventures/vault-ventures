<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Models\AdminAccess;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials()->withHeaders([
            'Origin' => 'http://localhost:8443',
            'Accept' => 'application/json',
        ]);
    }

    private function createFounderWithBusiness(string $businessName = 'Test Enterprise'): array
    {
        $founder = User::factory()->create();
        $founder->roles()->create(['role' => 'founder']);
        $profile = $founder->founderProfile()->create([]);

        $business = new Business;
        $business->forceFill([
            'founder_profile_id' => $profile->id,
            'name' => $businessName,
            'industry' => 'Fintech',
            'business_stage' => 'early_traction',
            'location' => 'Dhaka, Bangladesh',
            'status' => 'published',
        ])->save();

        return [$founder, $business];
    }

    private function createParticipant(string $role = 'investor'): User
    {
        $user = User::factory()->create();
        $user->roles()->create(['role' => $role]);
        if ($role === 'investor') {
            $user->investorProfile()->create([]);
        } elseif ($role === 'professional') {
            $user->professionalProfile()->create([]);
        }

        return $user;
    }

    private function createDeal(
        User $founder,
        Business $business,
        User $counterparty,
        string $counterpartyRole = 'investor'
    ): Deal {
        $connection = BusinessConnection::create([
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'status' => 'accepted',
            'connected_at' => now(),
        ]);

        return Deal::create([
            'connection_id' => $connection->id,
            'business_id' => $business->id,
            'founder_user_id' => $founder->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $counterpartyRole,
            'stage' => \App\Enums\DealStage::DealRoomOpened,
        ]);
    }

    public function test_authorized_founder_can_list_deal_messages(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $investor->id,
            'body' => 'Hello Founder!',
        ]);

        $response = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/messages");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Hello Founder!')
            ->assertJsonPath('data.messages.0.sender_user_id', $investor->id)
            ->assertJsonPath('data.messages.0.sender.name', $investor->name);
    }

    public function test_authorized_counterparty_can_list_deal_messages(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'Welcome to the Deal Room!',
        ]);

        $response = $this->actingAs($investor)->getJson("/api/me/deals/{$deal->id}/messages?role=investor");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Welcome to the Deal Room!')
            ->assertJsonPath('data.messages.0.sender_user_id', $founder->id);
    }

    public function test_authorized_founder_can_send_message(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'Here are the draft terms for review.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.sender_user_id', $founder->id)
            ->assertJsonPath('data.body', 'Here are the draft terms for review.')
            ->assertJsonPath('data.sender.name', $founder->name);

        $this->assertDatabaseHas('deal_messages', [
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'Here are the draft terms for review.',
        ]);
    }

    public function test_authorized_counterparty_can_send_message(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        $response = $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'Counter-proposal submitted.',
            'role' => 'investor',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deal_id', $deal->id)
            ->assertJsonPath('data.sender_user_id', $investor->id)
            ->assertJsonPath('data.body', 'Counter-proposal submitted.');

        $this->assertDatabaseHas('deal_messages', [
            'deal_id' => $deal->id,
            'sender_user_id' => $investor->id,
            'body' => 'Counter-proposal submitted.',
        ]);
    }

    public function test_message_persists_and_remains_available_on_later_get_request(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        // Send message
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'Persistent message 1',
        ])->assertCreated();

        $this->actingAs($investor)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'Persistent response 2',
            'role' => 'investor',
        ])->assertCreated();

        // Query later as founder
        $res = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/messages");
        $res->assertOk()
            ->assertJsonCount(2, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Persistent message 1')
            ->assertJsonPath('data.messages.1.body', 'Persistent response 2');
    }

    public function test_outsider_cannot_read_or_send_deal_messages(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        $outsider = $this->createParticipant('investor');

        // Read attempt
        $this->actingAs($outsider)
            ->getJson("/api/me/deals/{$deal->id}/messages")
            ->assertForbidden();

        // Write attempt
        $this->actingAs($outsider)
            ->postJson("/api/me/deals/{$deal->id}/messages", [
                'body' => 'Intruder message',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('deal_messages', [
            'body' => 'Intruder message',
        ]);
    }

    public function test_participant_of_deal_a_cannot_access_deal_b_messages(): void
    {
        [$founder1, $business1] = $this->createFounderWithBusiness('Enterprise 1');
        $investor1 = $this->createParticipant('investor');
        $deal1 = $this->createDeal($founder1, $business1, $investor1, 'investor');

        [$founder2, $business2] = $this->createFounderWithBusiness('Enterprise 2');
        $investor2 = $this->createParticipant('investor');
        $deal2 = $this->createDeal($founder2, $business2, $investor2, 'investor');

        DealMessage::create([
            'deal_id' => $deal2->id,
            'sender_user_id' => $founder2->id,
            'body' => 'Confidential Deal 2 Discussion',
        ]);

        // Investor 1 tries to read Deal 2
        $this->actingAs($investor1)
            ->getJson("/api/me/deals/{$deal2->id}/messages")
            ->assertForbidden();

        // Investor 1 tries to post into Deal 2
        $this->actingAs($investor1)
            ->postJson("/api/me/deals/{$deal2->id}/messages", [
                'body' => 'Cross-deal message',
            ])
            ->assertForbidden();
    }

    public function test_sender_cannot_be_spoofed(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        // Founder attempts to spoof sender_user_id as investor
        $response = $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'I am pretending to be the investor',
            'sender_user_id' => $investor->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.sender_user_id', $founder->id);

        $this->assertDatabaseHas('deal_messages', [
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'I am pretending to be the investor',
        ]);
        $this->assertDatabaseMissing('deal_messages', [
            'deal_id' => $deal->id,
            'sender_user_id' => $investor->id,
            'body' => 'I am pretending to be the investor',
        ]);
    }

    public function test_empty_and_whitespace_only_messages_are_rejected(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        // Empty body
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => '',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors('body', 'error.details');

        // Whitespace body
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => "   \n\t  ",
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors('body', 'error.details');

        // Missing body
        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors('body', 'error.details');
    }

    public function test_oversized_message_is_rejected(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        $hugeBody = str_repeat('A', 5001);

        $this->actingAs($founder)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => $hugeBody,
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors('body', 'error.details');
    }

    public function test_messages_are_ordered_predictably(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        $m1 = DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'First message',
            'created_at' => now()->subMinutes(10),
        ]);

        $m2 = DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $investor->id,
            'body' => 'Second message',
            'created_at' => now()->subMinutes(5),
        ]);

        $m3 = DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'Third message',
            'created_at' => now()->subMinutes(1),
        ]);

        $response = $this->actingAs($founder)->getJson("/api/me/deals/{$deal->id}/messages");
        $response->assertOk()
            ->assertJsonPath('data.messages.0.id', $m1->id)
            ->assertJsonPath('data.messages.1.id', $m2->id)
            ->assertJsonPath('data.messages.2.id', $m3->id);
    }

    public function test_multi_business_founder_deal_isolation(): void
    {
        [$founder, $businessA] = $this->createFounderWithBusiness('Business A');

        $profile = $founder->founderProfile;
        $businessB = new Business;
        $businessB->forceFill([
            'founder_profile_id' => $profile->id,
            'name' => 'Business B',
            'industry' => 'Agritech',
            'business_stage' => 'growth',
            'location' => 'Chittagong, Bangladesh',
            'status' => 'published',
        ])->save();

        $investor1 = $this->createParticipant('investor');
        $professional = $this->createParticipant('professional');

        $deal1 = $this->createDeal($founder, $businessA, $investor1, 'investor');
        $deal2 = $this->createDeal($founder, $businessB, $professional, 'professional');

        // Send messages in Deal 1
        DealMessage::create([
            'deal_id' => $deal1->id,
            'sender_user_id' => $founder->id,
            'body' => 'Message for Business A Deal 1',
        ]);

        // Send messages in Deal 2
        DealMessage::create([
            'deal_id' => $deal2->id,
            'sender_user_id' => $founder->id,
            'body' => 'Message for Business B Deal 2',
        ]);

        // Check Deal 1 from founder
        $res1 = $this->actingAs($founder)->getJson("/api/me/deals/{$deal1->id}/messages");
        $res1->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Message for Business A Deal 1');

        // Check Deal 2 from founder
        $res2 = $this->actingAs($founder)->getJson("/api/me/deals/{$deal2->id}/messages");
        $res2->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Message for Business B Deal 2');

        // Investor in Deal 1 cannot see Deal 2
        $this->actingAs($investor1)->getJson("/api/me/deals/{$deal2->id}/messages")->assertForbidden();

        // Professional in Deal 2 cannot see Deal 1
        $this->actingAs($professional)->getJson("/api/me/deals/{$deal1->id}/messages")->assertForbidden();
    }

    public function test_admin_has_read_oversight_but_cannot_send_messages(): void
    {
        [$founder, $business] = $this->createFounderWithBusiness();
        $investor = $this->createParticipant('investor');
        $deal = $this->createDeal($founder, $business, $investor, 'investor');

        DealMessage::create([
            'deal_id' => $deal->id,
            'sender_user_id' => $founder->id,
            'body' => 'Participant discussion',
        ]);

        $admin = User::factory()->create();
        AdminAccess::forceCreate([
            'user_id' => $admin->id,
        ]);

        // Admin can read chat via oversight
        $response = $this->actingAs($admin)->getJson("/api/me/deals/{$deal->id}/messages");
        $response->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Participant discussion');

        // Admin cannot send participant messages
        $postResponse = $this->actingAs($admin)->postJson("/api/me/deals/{$deal->id}/messages", [
            'body' => 'Admin trying to chat as participant',
        ]);
        $postResponse->assertForbidden();
    }
}
