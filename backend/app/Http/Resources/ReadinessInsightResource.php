<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadinessInsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'readiness_assessment_id' => $this->readiness_assessment_id,
            'version' => $this->version,
            'summary' => $this->summary,
            'strengths' => $this->strengths,
            'weaknesses' => $this->weaknesses,
            'opportunities' => $this->opportunities,
            'risks' => $this->risks,
            'recommendations' => $this->recommendations,
            'source_fingerprint' => $this->source_fingerprint,
            'generated_at' => $this->generated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'basis' => 'Deterministic readiness scoring remains authoritative; AI guidance explains the score and recommends next steps without creating a second score.',
        ];
    }
}
