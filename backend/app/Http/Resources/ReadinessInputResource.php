<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadinessInputResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'version' => $this->version, 'schema_version' => $this->schema_version,
            'answers' => (object) $this->answers, 'created_at' => $this->created_at?->toISOString()];
    }
}
