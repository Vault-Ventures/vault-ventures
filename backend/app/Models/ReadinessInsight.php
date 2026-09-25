<?php

namespace App\Models;

use App\Policies\ReadinessInsightPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[UsePolicy(ReadinessInsightPolicy::class)]
class ReadinessInsight extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'source_snapshot' => 'array',
            'strengths' => 'array',
            'weaknesses' => 'array',
            'opportunities' => 'array',
            'risks' => 'array',
            'recommendations' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Readiness insight history is append-only.'));
        static::deleting(fn () => throw new LogicException('Readiness insight history is append-only.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(ReadinessAssessment::class, 'readiness_assessment_id');
    }
}
