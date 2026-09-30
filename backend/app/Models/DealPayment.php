<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealPayment extends Model
{
    use HasFactory;

    protected $table = 'deal_payments';

    protected $fillable = [
        'deal_id',
        'payer_user_id',
        'receiver_user_id',
        'amount',
        'currency',
        'payment_method',
        'transaction_reference',
        'note',
        'status',
        'payment_date',
        'completed_at',
        'commission_rate',
        'commission_amount',
        'net_amount',
        'status_updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'payment_date' => 'date',
            'completed_at' => 'datetime',
            'payment_method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_user_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_user_id');
    }

    public function statusUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'status_updated_by_user_id');
    }
}
