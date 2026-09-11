<?php

namespace App\Models;

use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessDisclosureRelationship extends Model
{
    protected $fillable = [
        'business_id',
        'counterparty_user_id',
        'counterparty_role',
        'stage',
        'interest_expressed_at',
        'stage_4_confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'stage' => DisclosureStage::class,
            'counterparty_role' => ParticipantRole::class,
            'interest_expressed_at' => 'datetime',
            'stage_4_confirmed_at' => 'datetime',
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
}
