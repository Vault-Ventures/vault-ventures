<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealMilestone extends Model
{
    use HasFactory;

    protected $table = 'deal_milestones';

    protected $fillable = [
        'deal_id',
        'agreement_id',
        'sequence_order',
        'title',
        'description',
        'target_amount',
        'target_date',
        'status',
        'progress_percentage',
        'evidence_notes',
        'evidence_urls',
        'submitted_at',
        'submitted_by_user_id',
        'confirmed_at',
        'confirmed_by_user_id',
        'confirmation_notes',
        'funded_at',
        'dispute_reason',
    ];

    protected function casts(): array
    {
        return [
            'sequence_order' => 'integer',
            'target_amount' => 'decimal:2',
            'target_date' => 'date',
            'progress_percentage' => 'integer',
            'evidence_urls' => 'array',
            'submitted_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'funded_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(DealAgreement::class, 'agreement_id');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }
}
