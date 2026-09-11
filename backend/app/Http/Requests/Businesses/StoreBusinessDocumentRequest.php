<?php

namespace App\Http\Requests\Businesses;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StoreBusinessDocumentRequest extends BusinessRequest
{
    public function rules(): array
    {
        return [
            'kind' => ['required', 'string', Rule::in(['business_plan', 'pitch_deck'])],
            'file' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'extensions:pdf', 'max:2048'],
        ];
    }

    public function after(): array
    {
        return [...parent::after(), function (Validator $validator) {
            $file = $this->file('file');
            if ($file instanceof UploadedFile && $file->isValid()
                && mb_strlen($file->getClientOriginalName()) > 255) {
                $validator->errors()->add('file', 'The filename must not exceed 255 characters.');
            }
        }];
    }
}
