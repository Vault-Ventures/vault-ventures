<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class MatchingInsight extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'candidate_id' => 'integer',
            'confidence' => 'decimal:4',
            'source_snapshot' => 'array',
            'factor_explanations' => 'array',
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
        static::updating(fn () => throw new LogicException('Matching insight history is append-only.'));
        static::deleting(fn () => throw new LogicException('Matching insight history is append-only.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}