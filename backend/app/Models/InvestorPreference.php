<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestorPreference extends Model
{
    protected $fillable = [
        'available_investment', 'minimum_investment', 'maximum_investment',
        'industry', 'risk_level', 'business_stage', 'location', 'involvement', 'investment_types',
    ];

    protected $attributes = ['investment_types' => '[]'];

    protected function casts(): array
    {
        return [
            'available_investment' => 'decimal:2',
            'minimum_investment' => 'decimal:2',
            'maximum_investment' => 'decimal:2',
            'investment_types' => 'array',
        ];
    }

    public function investorProfile(): BelongsTo
    {
        return $this->belongsTo(InvestorProfile::class);
    }
}
