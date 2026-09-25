<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LogicException;

class AdminInsight extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'source_snapshot' => 'array',
            'governance_observations' => 'array',
            'operational_highlights' => 'array',
            'attention_areas' => 'array',
            'suggested_review_points' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Admin insight history is append-only.'));
        static::deleting(fn () => throw new LogicException('Admin insight history is append-only.'));
    }
}
