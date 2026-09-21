<?php

namespace App\Services;

use App\Contracts\OtpGeneratorInterface;
use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use App\Models\PhoneVerificationCode;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class PhoneVerificationService
{
    public const CODE_EXPIRATION_MINUTES = 10;
    public const MAX_ATTEMPTS = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;

    public function __construct(
        private readonly OtpGeneratorInterface $otpGenerator,
        private readonly PhoneVerificationCodeDeliveryInterface $delivery,
    ) {}

    public function sendCode(User $user, string $phone): PhoneVerificationCode
    {
        $phone = $this->normalizePhone($phone);
        [$record, $plainCode] = DB::transaction(function () use ($user, $phone) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->assertPhoneAvailable($phone, $user->id);
            $latest = PhoneVerificationCode::where('user_id', $user->id)->latest('id')->lockForUpdate()->first();
            if ($latest && $latest->created_at->gt(now()->subSeconds(self::RESEND_COOLDOWN_SECONDS))) {
                throw ValidationException::withMessages(['phone' => ['Please wait 60 seconds between code requests.']]);
            }
            PhoneVerificationCode::where('user_id', $user->id)->whereNull('verified_at')
                ->where('expires_at', '>', now())->update(['expires_at' => now()]);
            $code = $this->otpGenerator->generate();
            $record = PhoneVerificationCode::create([
                'user_id' => $user->id, 'phone' => $phone, 'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(self::CODE_EXPIRATION_MINUTES), 'attempts' => 0,
            ]);
            return [$record, $code];
        });

        // No network / file delivery while holding database locks. An undelivered
        // challenge is never usable, including after a process crash.
        try {
            $this->delivery->deliver($phone, $plainCode, $record->id, $record->expires_at);
        } catch (Throwable) {
            PhoneVerificationCode::whereKey($record->id)->whereNull('verified_at')->update(['expires_at' => now()]);
            // Do not propagate provider exceptions: they may contain OTPs or credentials.
            throw new HttpException(503, 'Phone verification delivery is unavailable.');
        } finally {
            unset($plainCode);
        }

        $delivered = DB::transaction(function () use ($user, $record) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $latest = PhoneVerificationCode::where('user_id', $user->id)->latest('id')->lockForUpdate()->first();
            if (! $latest || $latest->id !== $record->id || $latest->verified_at || $latest->expires_at->lte(now())) {
                return false;
            }
            $latest->update(['delivered_at' => now()]);
            return true;
        });
        if (! $delivered) {
            throw ValidationException::withMessages(['phone' => ['This code request expired or was superseded. Request a new code.']]);
        }
        return $record->refresh();
    }

    public function verifyCode(User $user, #[\SensitiveParameter] string $code): bool
    {
        try {
            // Lock order is always user then latest challenge, matching issuance.
            $error = DB::transaction(function () use ($user, $code) {
                $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                // Include used records: never fall back to an older unused challenge.
                $record = PhoneVerificationCode::where('user_id', $lockedUser->id)->latest('id')->lockForUpdate()->first();
                if (! $record || ! $record->delivered_at || $record->verified_at || $record->expires_at->lte(now())) {
                    return 'The verification code is invalid or has expired.';
                }
                if ($record->attempts >= self::MAX_ATTEMPTS) {
                    return 'Too many invalid attempts. Please request a new verification code.';
                }
                if (! Hash::check(trim($code), $record->code_hash)) {
                    $record->increment('attempts');
                    // Throw AFTER commit so failed-attempt accounting is not rolled back.
                    return 'The verification code is incorrect.';
                }
                $phone = $this->normalizePhone($record->phone);
                $this->assertPhoneAvailable($phone, $lockedUser->id);
                $record->update(['verified_at' => now()]);
                $lockedUser->phone = $phone;
                $lockedUser->phone_verified_at = now();
                $lockedUser->save();
                return null;
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['phone' => ['This phone number is already assigned to another account.']]);
        }
        if ($error !== null) {
            throw ValidationException::withMessages(['code' => [$error]]);
        }
        return true;
    }

    private function assertPhoneAvailable(string $phone, int $userId): void
    {
        // Also recognize legacy formatting without rewriting existing live users.
        if (User::where('id', '!=', $userId)->whereNotNull('phone')
            ->whereRaw("REGEXP_REPLACE(phone, '[^0-9]', '') = ?", [substr($phone, 1)])->exists()) {
            throw ValidationException::withMessages(['phone' => ['This phone number is already assigned to another account.']]);
        }
    }

    public function normalizePhone(string $phone): string
    {
        // International country code required; no country inference or 00-prefix conversion.
        $cleaned = preg_replace('/[\s().-]/', '', trim($phone));
        if (! preg_match('/^\+?[1-9][0-9]{7,14}$/D', $cleaned)) {
            throw ValidationException::withMessages(['phone' => ['Use an international number with country code (8 to 15 digits).']]);
        }
        return '+'.ltrim($cleaned, '+');
    }
}
