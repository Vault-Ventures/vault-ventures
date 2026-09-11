<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadinessAssessmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'version' => $this->version,
            'readiness_input_version_id' => $this->readiness_input_version_id,
            'input_version' => $this->input_version, 'input_schema_version' => $this->input_schema_version,
            'rubric_version' => $this->rubric_version, 'source_snapshot' => $this->source_snapshot,
            'source_fingerprint' => $this->source_fingerprint,
            'factor_results' => $this->factor_results, 'overall_score' => $this->overall_score,
            'weak_areas' => $this->weak_areas, 'suggestions' => $this->suggestions,
            'is_incomplete' => $this->is_incomplete, 'calculation' => $this->calculation,
            'evaluated_at' => $this->evaluated_at->toISOString(), 'created_at' => $this->created_at->toISOString(),
            'basis' => 'Rule-based assessment using founder-reported inputs; not independent verification, investment advice, or a prediction of returns.',
        ];
    }
}
