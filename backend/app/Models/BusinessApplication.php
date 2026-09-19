<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessApplication extends Model
{
    protected $fillable = [
        'business_id',
        'professional_user_id',
        'founder_user_id',
        'status',
        'role_title',
        'note',
        'skills',
        'reviewed_at',
        'responded_at',
        'rejection_reason',
    ];

    protected $casts = [
        'skills' => 'array',
        'reviewed_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_user_id');
    }

    public function founder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'founder_user_id');
    }
}
