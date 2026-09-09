<?php

namespace App\Http\Requests\Auth;

use App\Rules\BcryptPasswordInput;

final class LoginRequest extends EmailRequest
{
    public function rules(): array
    {
        return parent::rules() + ['password' => ['required', 'string', new BcryptPasswordInput]];
    }
}
