<?php

namespace App\Http\Requests\Verification;

use Illuminate\Foundation\Http\FormRequest;

class RequestInformationVerificationRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'participant_message' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
