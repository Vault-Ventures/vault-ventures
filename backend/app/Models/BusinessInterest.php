<?php

namespace App\Models;

use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessInterest extends Model
{
    protected $fillable = [
        'business_id',
        'founder_user_id',
        'counterparty_user_id',
        'counterparty_role',
        'expressed_by_user_id',
        'status',
        'expressed_at',
    ];

    protected function casts(): array
    {
        return [
            'counterparty_role' => ParticipantRole::class,
            'expressed_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function founderUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'founder_user_id');
    }

    public function counterpartyUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counterparty_user_id');
    }

    public function expressedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'expressed_by_user_id');
    }
}
