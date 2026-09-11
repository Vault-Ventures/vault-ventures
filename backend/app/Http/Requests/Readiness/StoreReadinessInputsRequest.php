<?php

namespace App\Http\Requests\Readiness;

use App\Http\Requests\Businesses\BusinessRequest;
use App\Services\Readiness\ReadinessInputSchema;
use Illuminate\Validation\Validator;

final class StoreReadinessInputsRequest extends BusinessRequest
{
    protected function prepareForValidation(): void
    {
        // Preserve exact JSON answer types/options: an empty string is not an explicit null.
        if ($this->isJson()) {
            $payload = json_decode($this->getContent(), true);
            if (is_array($payload) && array_key_exists('answers', $payload)) {
                $this->merge(['answers' => $payload['answers']]);
            }
        }
    }

    public function rules(): array
    {
        return ReadinessInputSchema::rules();
    }

    public function after(): array
    {
        return [...parent::after(), function (Validator $validator) {
            // Laravel skips ordinary rules for empty strings; the approved contract does not.
            foreach (is_array($this->input('answers')) ? $this->input('answers') : [] as $key => $value) {
                if (is_string($value) && trim($value) === '') {
                    $validator->errors()->add('answers.'.$key, 'Use an approved answer or explicit null, not an empty string.');
                }
            }
        }];
    }
}
