<?php

namespace App\Models;

use App\Enums\FinancialDiscrepancyStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialDiscrepancyReport extends Model
{
    use HasFactory;

    protected $table = 'financial_discrepancy_reports';

    protected $fillable = [
        'deal_id',
        'financial_report_id',
        'reported_by_user_id',
        'reason',
        'status',
        'admin_resolution_notes',
        'resolved_by_user_id',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => FinancialDiscrepancyStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function financialReport(): BelongsTo
    {
        return $this->belongsTo(FinancialReport::class, 'financial_report_id');
    }

    public function reportedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
