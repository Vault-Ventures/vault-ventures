<?php

namespace App\Contracts;

interface OtpGeneratorInterface
{
    public function generate(): string;
}
