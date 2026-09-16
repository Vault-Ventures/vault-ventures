<?php

namespace App\Models;

use App\Enums\FinancialVerificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialReport extends Model
{
    use HasFactory;

    protected $table = 'financial_reports';

    protected $fillable = [
        'deal_id',
        'business_id',
        'submitted_by_user_id',
        'reporting_period_start',
        'reporting_period_end',
        'revenue',
        'expenses',
        'net_profit_loss',
        'cash_position',
        'notes',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
        'admin_review_notes',
    ];

    protected function casts(): array
    {
        return [
            'reporting_period_start' => 'date:Y-m-d',
            'reporting_period_end' => 'date:Y-m-d',
            'revenue' => 'decimal:2',
            'expenses' => 'decimal:2',
            'net_profit_loss' => 'decimal:2',
            'cash_position' => 'decimal:2',
            'status' => FinancialVerificationStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(FinancialReportEvidence::class, 'financial_report_id');
    }

    public function discrepancies(): HasMany
    {
        return $this->hasMany(FinancialDiscrepancyReport::class, 'financial_report_id')->orderBy('id', 'desc');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(FinancialReportAuditLog::class, 'financial_report_id')->orderBy('id', 'desc');
    }

    public function evidenceAccessLogs(): HasMany
    {
        return $this->hasMany(FinancialEvidenceAccessLog::class, 'financial_report_id')->orderBy('id', 'desc');
    }

    public function isVerified(): bool
    {
        return $this->status === FinancialVerificationStatus::Verified;
    }

    public function isUnderReview(): bool
    {
        return $this->status === FinancialVerificationStatus::UnderReview;
    }
}
