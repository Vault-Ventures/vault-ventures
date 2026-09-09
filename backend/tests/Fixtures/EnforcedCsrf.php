<?php

namespace Tests\Fixtures;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

final class EnforcedCsrf extends ValidateCsrfToken
{
    protected function runningUnitTests()
    {
        return false;
    }
}
