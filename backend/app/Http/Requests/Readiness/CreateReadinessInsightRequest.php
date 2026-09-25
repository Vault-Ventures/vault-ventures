<?php

namespace App\Http\Requests\Readiness;

use App\Models\Business;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class CreateReadinessInsightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user())->allows('viewAny', Business::class);
    }

    public function rules(): array
    {
        return [];
    }
}
