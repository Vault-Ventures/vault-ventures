<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationEvidenceAccessLog extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }
}
