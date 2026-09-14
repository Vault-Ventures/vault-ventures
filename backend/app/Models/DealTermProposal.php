<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DealTermProposal extends Model
{
    use HasFactory;

    protected $table = 'deal_term_proposals';

    protected $fillable = [
        'deal_id',
        'version',
        'proposed_by_user_id',
        'proposed_by_role',
        'investment_type',
        'amount',
        'equity_percentage',
        'profit_sharing_percentage',
        'loss_sharing_terms',
        'proposed_terms',
        'note',
        'status',
        'responded_by_user_id',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'amount' => 'decimal:2',
            'equity_percentage' => 'decimal:2',
            'profit_sharing_percentage' => 'decimal:2',
            'responded_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function proposedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by_user_id');
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by_user_id');
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(DealAgreement::class, 'proposal_id');
    }
}
