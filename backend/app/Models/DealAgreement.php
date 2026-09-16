<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealAgreement extends Model
{
    use HasFactory;

    protected $table = 'deal_agreements';

    protected $fillable = [
        'deal_id',
        'proposal_id',
        'agreement_type',
        'title',
        'agreement_text',
        'terms_snapshot',
        'status',
        'founder_signed_at',
        'founder_signed_user_id',
        'counterparty_signed_at',
        'counterparty_signed_user_id',
        'finalized_at',
    ];

    protected function casts(): array
    {
        return [
            'terms_snapshot' => 'array',
            'founder_signed_at' => 'datetime',
            'counterparty_signed_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(DealTermProposal::class, 'proposal_id');
    }

    public function founderSigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'founder_signed_user_id');
    }

    public function counterpartySigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counterparty_signed_user_id');
    }

    public function isFinalized(): bool
    {
        return $this->status === 'accepted' && $this->finalized_at !== null;
    }
}
