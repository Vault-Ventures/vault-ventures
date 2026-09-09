<?php

namespace Tests\Fixtures;

use Illuminate\Foundation\Http\FormRequest;

final class FoundationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['label' => ['required', 'string', 'max:40']];
    }
}
