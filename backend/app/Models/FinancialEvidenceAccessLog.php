<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialEvidenceAccessLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'financial_evidence_access_logs';

    protected $fillable = [
        'financial_report_evidence_id',
        'financial_report_id',
        'actor_user_id',
        'actor_role',
        'action',
        'ip_address',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(FinancialReportEvidence::class, 'financial_report_evidence_id');
    }

    public function financialReport(): BelongsTo
    {
        return $this->belongsTo(FinancialReport::class, 'financial_report_id');
    }

    public function actorUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
