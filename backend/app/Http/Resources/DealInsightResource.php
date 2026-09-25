<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DealInsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'deal_id' => $this->deal_id,
            'version' => $this->version,
            'source_schema_version' => $this->source_schema_version,
            'output_contract_version' => $this->output_contract_version,
            'summary' => $this->summary,
            'current_stage_summary' => $this->current_stage_summary,
            'key_points' => $this->key_points,
            'open_items' => $this->open_items,
            'discussion_points' => $this->discussion_points,
            'cautions' => $this->cautions,
            'generated_at' => $this->generated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
