<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class DealInsight extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'source_snapshot' => 'array',
            'key_points' => 'array',
            'open_items' => 'array',
            'discussion_points' => 'array',
            'cautions' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Deal insight history is append-only.'));
        static::deleting(fn () => throw new LogicException('Deal insight history is append-only.'));
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}
