<?php

namespace App\Models;

use App\Enums\BusinessStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Business extends Model
{
    protected $fillable = ['name', 'description', 'industry', 'business_stage', 'risk_level', 'expected_involvement', 'location'];

    protected $attributes = ['status' => 'draft'];

    public function readinessAssessments(): HasMany
    {
        return $this->hasMany(ReadinessAssessment::class);
    }

    public function analyses(): HasMany
    {
        return $this->hasMany(BusinessAnalysis::class);
    }

    public function readinessInputs(): HasMany
    {
        return $this->hasMany(ReadinessInputVersion::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(BusinessDocument::class);
    }

    public function disclosureRelationships(): HasMany
    {
        return $this->hasMany(BusinessDisclosureRelationship::class);
    }

    public function ndas(): HasMany
    {
        return $this->hasMany(BusinessNda::class);
    }

    protected function casts(): array
    {
        return ['status' => BusinessStatus::class, 'submitted_at' => 'datetime'];
    }

    public function founderProfile(): BelongsTo
    {
        return $this->belongsTo(FounderProfile::class);
    }

    public function requirements(): HasOne
    {
        return $this->hasOne(BusinessRequirement::class);
    }
}
