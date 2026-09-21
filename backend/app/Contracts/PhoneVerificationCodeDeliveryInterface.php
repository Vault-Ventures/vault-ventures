<?php

namespace App\Contracts;

use DateTimeInterface;

interface PhoneVerificationCodeDeliveryInterface
{
    public function deliver(string $phone, #[\SensitiveParameter] string $code, int $challengeId, DateTimeInterface $expiresAt): void;
}
