<?php

namespace App\Http\Requests\Verification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RejectVerificationRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
            'participant_message' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $recordId = $this->route('verification_request');
            if ($recordId) {
                $record = $recordId instanceof \App\Models\VerificationRequest ? $recordId : \App\Models\VerificationRequest::find($recordId);
                if ($record && in_array($record->status, [
                    \App\Enums\VerificationRequestStatus::Approved,
                    \App\Enums\VerificationRequestStatus::Rejected,
                    \App\Enums\VerificationRequestStatus::Cancelled,
                ], true)) {
                    $validator->errors()->add('verification_request', 'Verification request is already finalized and cannot be modified.');
                    return;
                }
            }

            $hasReason = filled($this->input('rejection_reason'))
                || filled($this->input('reason'))
                || filled($this->input('admin_notes'))
                || filled($this->input('notes'));

            if (! $hasReason) {
                $validator->errors()->add('rejection_reason', 'A rejection reason is required when rejecting a verification request.');
            }
        });
    }
}

