<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BusinessRequirement extends Model
{
    protected $fillable = [
        'funding_amount', 'accepted_investment_types', 'micro_proposed_terms',
        'large_standard_proposed_terms', 'required_experience_level',
        'required_availability', 'compensation_preferences',
    ];

    protected function casts(): array
    {
        return [
            'funding_amount' => 'decimal:2',
            'accepted_investment_types' => 'array',
            'compensation_preferences' => 'array',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class)->orderBy('skills.normalized_name');
    }
}
