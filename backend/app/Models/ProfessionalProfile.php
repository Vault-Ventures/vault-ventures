<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProfessionalProfile extends Model
{
    protected $fillable = [
        'industry_experience', 'experience_level', 'availability', 'location', 'compensation_preferences',
    ];

    protected $attributes = ['compensation_preferences' => '[]'];

    protected function casts(): array
    {
        return ['industry_experience' => 'array', 'compensation_preferences' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class)->orderBy('skills.normalized_name');
    }
}
