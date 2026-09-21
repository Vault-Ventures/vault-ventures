<?php

namespace App\Services\Verification;

use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use LogicException;

final class LocalPhoneCodeDelivery implements PhoneVerificationCodeDeliveryInterface
{
    public function deliver(string $phone, #[\SensitiveParameter] string $code, int $challengeId, DateTimeInterface $expiresAt): void
    {
        if (! app()->environment('local') || config('verification.phone_delivery') !== 'local_capture') {
            throw new LogicException('Local phone delivery is not enabled in this environment.');
        }

        // Dedicated, non-served disk OUTSIDE storage/app/private (the default served disk).
        // One overwritten capture bounds retention and makes the latest delivery discoverable.
        $stored = Storage::disk('development_phone_verification')->put('latest.json', json_encode([
            'destination' => '***'.substr($phone, -4),
            'code' => $code,
            'challenge_id' => $challengeId,
            'created_at' => now()->toISOString(),
            'expires_at' => $expiresAt->format(DATE_ATOM),
        ], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));
        if (! $stored) {
            throw new \RuntimeException('Local phone delivery capture failed.');
        }
    }
}
