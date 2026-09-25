<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchingInsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'candidate_id' => $this->candidate_id,
            'counterparty_role' => $this->counterparty_role,
            'version' => $this->version,
            'formula_version' => $this->formula_version,
            'output_contract_version' => $this->output_contract_version,
            'summary' => $this->summary,
            'match_strengths' => $this->strengths,
            'potential_gaps' => $this->weaknesses,
            'discussion_points' => $this->opportunities,
            'cautions' => $this->risks,
            'factor_explanations' => $this->factor_explanations,
            'confidence' => (float) $this->confidence,
            'recommendations' => $this->recommendations,
            'generated_at' => $this->generated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}