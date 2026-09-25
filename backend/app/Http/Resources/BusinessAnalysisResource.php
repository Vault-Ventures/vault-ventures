<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessAnalysisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'business_id' => $this->business_id,
            'status' => 'completed', // Only successful validated results are persisted.
            'analysis' => $this->output_contract_version === '2' ? $this->validated_output : null,
            'id' => $this->id, 'version' => $this->version, 'readiness_assessment_id' => $this->readiness_assessment_id,
            'input_contract_version' => $this->input_contract_version, 'output_contract_version' => $this->output_contract_version,
            'instruction_version' => $this->instruction_version, 'renderer_version' => $this->renderer_version,
            'provider_identifier' => $this->provider_identifier, 'model_identifier' => $this->model_identifier,
            'source_fingerprint' => $this->source_fingerprint,
            'validated_output' => $this->validated_output, 'rendered_output' => $this->rendered_output,
            'generated_at' => $this->generated_at->toISOString(), 'created_at' => $this->created_at->toISOString(),
            'test_fixture' => $this->provider_identifier === 'test_fake',
            'basis' => $this->provider_identifier === 'test_fake' ? 'Automated test fixture. No live AI analysis.' : 'AI-assisted analysis based on the business information provided. Use these insights as guidance, not as a platform decision or investment guarantee.',
        ];
    }
}
