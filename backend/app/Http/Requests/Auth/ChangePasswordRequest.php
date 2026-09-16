<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password'          => ['required', 'string'],
            'new_password'              => ['required', 'string', Password::min(8), 'confirmed'],
            'new_password_confirmation' => ['required', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $user = $this->user();
            if ($user && !Hash::check($this->input('current_password'), $user->password)) {
                $v->errors()->add('current_password', 'The provided current password is incorrect.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Your current password is required.',
            'new_password.required'     => 'A new password is required.',
            'new_password.confirmed'    => 'The new password confirmation does not match.',
            'new_password.min'          => 'The new password must be at least 8 characters.',
        ];
    }
}
