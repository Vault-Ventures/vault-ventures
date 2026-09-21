<?php

namespace App\Services\Verification;

use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use DateTimeInterface;
use RuntimeException;

final class UnavailablePhoneCodeDelivery implements PhoneVerificationCodeDeliveryInterface
{
    public function deliver(string $phone, #[\SensitiveParameter] string $code, int $challengeId, DateTimeInterface $expiresAt): void
    {
        throw new RuntimeException('Phone delivery is not configured.');
    }
}
