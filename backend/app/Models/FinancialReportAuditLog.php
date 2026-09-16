<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialReportAuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'financial_report_audit_logs';

    protected $fillable = [
        'financial_report_id',
        'actor_user_id',
        'actor_role',
        'action',
        'old_state',
        'new_state',
        'ip_address',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_state' => 'array',
            'new_state' => 'array',
            'created_at' => 'datetime',
        ];
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
