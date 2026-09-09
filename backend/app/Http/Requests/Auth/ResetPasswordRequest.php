<?php

namespace App\Http\Requests\Auth;

use App\Rules\BcryptPasswordInput;
use Illuminate\Validation\Rules\Password;

final class ResetPasswordRequest extends EmailRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            'token' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', new BcryptPasswordInput, 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ];
    }
}
