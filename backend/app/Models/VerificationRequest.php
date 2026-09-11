<?php

namespace App\Models;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Policies\VerificationRequestPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(VerificationRequestPolicy::class)]
class VerificationRequest extends Model
{
    protected $table = 'verification_requests';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'requested_tier' => VerificationTier::class,
            'status' => VerificationRequestStatus::class,
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(VerificationEvidence::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(VerificationAuditLog::class);
    }
}
