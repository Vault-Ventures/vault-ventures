<?php

namespace App\Services\Deal;

use App\Models\Deal;
use App\Models\DealMessage;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class DealMessageService
{
    public function __construct(
        private readonly DealAccessService $dealAccessService
    ) {}

    /**
     * List all messages for a deal if the user is an authorized participant or admin with oversight.
     */
    public function listMessages(Deal $deal, User $user, ?string $roleParam = null): array
    {
        $this->dealAccessService->view($deal, $user, $roleParam);

        $messages = $deal->messages()
            ->with('sender:id,name,email,avatar_url')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return $messages->map(fn (DealMessage $msg) => $this->formatMessage($msg))->all();
    }

    /**
     * Send a real persisted message in the deal room.
     * Only authorized participants (founder, counterparty) can send messages.
     */
    public function sendMessage(Deal $deal, User $user, string $body, ?string $roleParam = null): array
    {
        $this->dealAccessService->participant($deal, $user, $roleParam);

        $trimmed = trim($body);
        if ($trimmed === '') {
            throw ValidationException::withMessages([
                'body' => ['Message body is required and cannot be empty.'],
            ]);
        }

        if (mb_strlen($trimmed) > 5000) {
            throw ValidationException::withMessages([
                'body' => ['Message body must not exceed 5000 characters.'],
            ]);
        }

        $message = $deal->messages()->create([
            'sender_user_id' => $user->id,
            'body' => $trimmed,
        ]);

        $message->load('sender:id,name,email,avatar_url');

        return $this->formatMessage($message);
    }

    /**
     * Format a DealMessage entity safely for API responses.
     */
    public function formatMessage(DealMessage $message): array
    {
        return [
            'id' => $message->id,
            'deal_id' => $message->deal_id,
            'sender_user_id' => $message->sender_user_id,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'email' => $message->sender->email,
                'avatar_url' => $message->sender->avatar_url,
            ] : null,
            'body' => $message->body,
            'created_at' => $message->created_at?->toISOString(),
            'updated_at' => $message->updated_at?->toISOString(),
        ];
    }
}
