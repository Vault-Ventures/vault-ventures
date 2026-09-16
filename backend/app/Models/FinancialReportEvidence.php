<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialReportEvidence extends Model
{
    use HasFactory;

    protected $table = 'financial_report_evidence';

    protected $fillable = [
        'financial_report_id',
        'uploaded_by_user_id',
        'original_filename',
        'disk',
        'path',
        'file_size',
        'mime_type',
        'evidence_type',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function financialReport(): BelongsTo
    {
        return $this->belongsTo(FinancialReport::class, 'financial_report_id');
    }

    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(FinancialEvidenceAccessLog::class, 'financial_report_evidence_id')->orderBy('id', 'desc');
    }
}
