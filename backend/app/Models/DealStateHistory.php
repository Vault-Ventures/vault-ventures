<?php

namespace App\Models;

use App\Enums\DealStage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealStateHistory extends Model
{
    protected $fillable = [
        'deal_id',
        'previous_state',
        'new_state',
        'changed_by_user_id',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'previous_state' => DealStage::class,
            'new_state' => DealStage::class,
            'changed_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
