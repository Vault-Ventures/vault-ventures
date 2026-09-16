<?php

namespace App\Notifications;

use App\Models\Business;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ConnectionEstablishedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Business $business,
        public readonly User $otherParty,
        public readonly string $role,
    ) {}

    /**
     * Store in the database via the standard Laravel notifications table.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Data stored in the notifications.data column.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type'             => 'connection_established',
            'title'            => 'New Connection',
            'body'             => "{$this->otherParty->name} is now connected with you on {$this->business->name}.",
            'business_id'      => $this->business->id,
            'business_name'    => $this->business->name,
            'other_party_id'   => $this->otherParty->id,
            'other_party_name' => $this->otherParty->name,
            'role'             => $this->role,
        ];
    }
}
