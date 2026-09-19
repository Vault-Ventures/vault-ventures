<?php

namespace App\Models;

use App\Enums\BusinessStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Business extends Model
{
    protected $fillable = [
        'name',
        'description',
        'industry',
        'business_stage',
        'risk_level',
        'expected_involvement',
        'location',
        'logo_url',
        'cover_photo_url',
    ];

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

    public function interests(): HasMany
    {
        return $this->hasMany(BusinessInterest::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(BusinessConnection::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function financialReports(): HasMany
    {
        return $this->hasMany(FinancialReport::class)->orderBy('reporting_period_start', 'desc');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(BusinessApplication::class);
    }

    protected function casts(): array
    {
        return [
            'status' => BusinessStatus::class,
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function founderProfile(): BelongsTo
    {
        return $this->belongsTo(FounderProfile::class);
    }

    public function founderUser(): HasOneThrough
    {
        return $this->hasOneThrough(User::class, FounderProfile::class, 'id', 'id', 'founder_profile_id', 'user_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function rejectedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }

    public function requirements(): HasOne
    {
        return $this->hasOne(BusinessRequirement::class);
    }
}
