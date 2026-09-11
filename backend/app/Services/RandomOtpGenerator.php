<?php

namespace App\Services;

use App\Contracts\OtpGeneratorInterface;

final class RandomOtpGenerator implements OtpGeneratorInterface
{
    public function generate(): string
    {
        return (string) random_int(100000, 999999);
    }
}
