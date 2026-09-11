<?php

namespace App\Models;

use App\Policies\ReadinessInputPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[UsePolicy(ReadinessInputPolicy::class)]
class ReadinessInputVersion extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['answers' => 'array', 'version' => 'integer'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Readiness input history is append-only.'));
        static::deleting(fn () => throw new LogicException('Readiness input history is append-only.'));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
