<?php

namespace App\Models;

use App\Policies\ReadinessAssessmentPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[UsePolicy(ReadinessAssessmentPolicy::class)]
class ReadinessAssessment extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'input_version' => 'integer', 'source_snapshot' => 'array',
            'factor_results' => 'array', 'overall_score' => 'decimal:2', 'weak_areas' => 'array',
            'suggestions' => 'array', 'is_incomplete' => 'boolean', 'calculation' => 'array', 'evaluated_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Assessment history is append-only.'));
        static::deleting(fn () => throw new LogicException('Assessment history is append-only.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function input(): BelongsTo
    {
        return $this->belongsTo(ReadinessInputVersion::class, 'readiness_input_version_id');
    }
}
