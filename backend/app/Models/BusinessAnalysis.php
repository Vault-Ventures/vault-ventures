<?php

namespace App\Models;

use App\Policies\BusinessAnalysisPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[UsePolicy(BusinessAnalysisPolicy::class)]
class BusinessAnalysis extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'source_snapshot' => 'array', 'validated_output' => 'array', 'rendered_output' => 'array', 'generated_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Business analysis history is append-only.'));
        static::deleting(fn () => throw new LogicException('Business analysis history is append-only.'));
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
