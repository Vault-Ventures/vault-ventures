<?php

namespace Tests\Support;

use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use DateTimeInterface;

final class RecordingPhoneCodeDelivery implements PhoneVerificationCodeDeliveryInterface
{
    public array $deliveries = [];

    public function deliver(string $phone, #[\SensitiveParameter] string $code, int $challengeId, DateTimeInterface $expiresAt): void
    {
        $this->deliveries[] = compact('phone', 'code', 'challengeId');
    }
}
