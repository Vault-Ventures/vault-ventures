<?php

namespace App\Models;

use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealFeedback extends Model
{
    protected $table = 'deal_feedback';

    protected $fillable = [
        'deal_id',
        'reviewer_user_id',
        'reviewer_role',
        'recipient_user_id',
        'recipient_role',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'reviewer_role' => ParticipantRole::class,
            'recipient_role' => ParticipantRole::class,
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
