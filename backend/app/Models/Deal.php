<?php

namespace App\Models;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deal extends Model
{
    protected $fillable = [
        'connection_id',
        'business_id',
        'founder_user_id',
        'counterparty_user_id',
        'counterparty_role',
        'stage',
    ];

    protected function casts(): array
    {
        return [
            'counterparty_role' => ParticipantRole::class,
            'stage' => DealStage::class,
        ];
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(BusinessConnection::class, 'connection_id');
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

    public function histories(): HasMany
    {
        return $this->hasMany(DealStateHistory::class)->orderBy('id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(DealTermProposal::class)->orderBy('version');
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(DealAgreement::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(DealMilestone::class)->orderBy('sequence_order');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(DealFeedback::class);
    }

    public function financialReports(): HasMany
    {
        return $this->hasMany(FinancialReport::class)->orderBy('reporting_period_start', 'desc');
    }

    public function financialDiscrepancies(): HasMany
    {
        return $this->hasMany(FinancialDiscrepancyReport::class)->orderBy('id', 'desc');
    }
}
