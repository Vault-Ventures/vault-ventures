<?php

namespace App\Http\Resources;

use App\Services\Admin\AdminInsightService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminInsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $freshness = app(AdminInsightService::class)->freshness($this->resource);

        return [
            'id' => $this->id,
            'version' => $this->version,
            'source_schema_version' => $this->source_schema_version,
            'output_contract_version' => $this->output_contract_version,
            'summary' => $this->summary,
            'governance_observations' => $this->governance_observations,
            'operational_highlights' => $this->operational_highlights,
            'attention_areas' => $this->attention_areas,
            'suggested_review_points' => $this->suggested_review_points,
            'generated_at' => $this->generated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'is_current' => $freshness['is_current'] ?? false,
        ];
    }
}
