<?php

namespace App\Models;

use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessNda extends Model
{
    protected $fillable = [
        'business_id',
        'counterparty_user_id',
        'counterparty_role',
        'status',
        'nda_version',
        'agreement_hash',
        'requested_by_user_id',
        'requested_at',
        'founder_accepted_at',
        'counterparty_accepted_at',
        'activated_at',
        'declined_at',
        'declined_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => NdaStatus::class,
            'counterparty_role' => ParticipantRole::class,
            'requested_at' => 'datetime',
            'founder_accepted_at' => 'datetime',
            'counterparty_accepted_at' => 'datetime',
            'activated_at' => 'datetime',
            'declined_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function counterpartyUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counterparty_user_id');
    }

    public function requestedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function declinedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'declined_by_user_id');
    }
}
