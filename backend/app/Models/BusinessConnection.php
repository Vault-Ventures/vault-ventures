<?php

namespace App\Models;

use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessConnection extends Model
{
    protected $fillable = [
        'business_id',
        'founder_user_id',
        'counterparty_user_id',
        'counterparty_role',
    ];

    protected function casts(): array
    {
        return [
            'counterparty_role' => ParticipantRole::class,
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

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'connection_id');
    }
}
