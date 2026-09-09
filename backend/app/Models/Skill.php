<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    protected $fillable = ['name', 'normalized_name'];

    public function professionalProfiles(): BelongsToMany
    {
        return $this->belongsToMany(ProfessionalProfile::class);
    }
}
