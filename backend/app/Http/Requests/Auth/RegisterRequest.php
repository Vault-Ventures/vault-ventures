<?php

namespace App\Http\Requests\Auth;

use App\Rules\BcryptPasswordInput;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends EmailRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [...parent::rules()['email'], 'unique:users,email'],
            'password' => ['required', 'string', new BcryptPasswordInput, 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ];
    }
}
