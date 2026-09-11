<?php

namespace App\Services;

use App\Contracts\OtpGeneratorInterface;
use App\Models\PhoneVerificationCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PhoneVerificationService
{
    public const CODE_EXPIRATION_MINUTES = 10;

    public const MAX_ATTEMPTS = 5;

    public const RESEND_COOLDOWN_SECONDS = 60;

    public function __construct(
        private readonly OtpGeneratorInterface $otpGenerator,
    ) {}

    public function sendCode(User $user, string $phone): PhoneVerificationCode
    {
        $normalizedPhone = $this->normalizePhone($phone);

        return DB::transaction(function () use ($user, $normalizedPhone) {
            // Lock the user record to serialize concurrent OTP requests for this user
            User::where('id', $user->id)->lockForUpdate()->first();

            // Check if phone is already verified by another user
            $existing = User::where('phone', $normalizedPhone)
                ->whereNotNull('phone_verified_at')
                ->where('id', '!=', $user->id)
                ->exists();

            if ($existing) {
                throw ValidationException::withMessages([
                    'phone' => ['This phone number is already verified on another account.'],
                ]);
            }

            // Check resend cooldown under lock
            $recentCode = PhoneVerificationCode::where('user_id', $user->id)
                ->where('created_at', '>=', now()->subSeconds(self::RESEND_COOLDOWN_SECONDS))
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if ($recentCode !== null) {
                $secondsRemaining = max(1, self::RESEND_COOLDOWN_SECONDS - now()->diffInSeconds($recentCode->created_at));
                throw ValidationException::withMessages([
                    'phone' => ["Please wait {$secondsRemaining} seconds before requesting a new code."],
                ]);
            }

            // Expire any existing active codes for this user
            PhoneVerificationCode::where('user_id', $user->id)
                ->whereNull('verified_at')
                ->where('expires_at', '>', now())
                ->update(['expires_at' => now()]);

            // Generate 6-digit numeric OTP via injected generator
            $plainCode = $this->otpGenerator->generate();

            return PhoneVerificationCode::create([
                'user_id' => $user->id,
                'phone' => $normalizedPhone,
                'code_hash' => Hash::make($plainCode),
                'expires_at' => now()->addMinutes(self::CODE_EXPIRATION_MINUTES),
                'attempts' => 0,
            ]);
        });
    }

    public function verifyCode(User $user, string $code): bool
    {
        $cleanCode = trim($code);

        $record = PhoneVerificationCode::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if ($record === null || $record->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or has expired.'],
            ]);
        }

        if ($record->attempts >= self::MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'code' => ['Too many invalid attempts. Please request a new verification code.'],
            ]);
        }

        if (! Hash::check($cleanCode, $record->code_hash)) {
            $record->increment('attempts');
            throw ValidationException::withMessages([
                'code' => ['The verification code is incorrect.'],
            ]);
        }

        // Successfully verified
        DB::transaction(function () use ($user, $record) {
            $lockedRecord = PhoneVerificationCode::where('id', $record->id)
                ->lockForUpdate()
                ->first();

            if ($lockedRecord !== null) {
                $lockedRecord->update(['verified_at' => now()]);
            }

            $lockedUser = User::where('id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($lockedUser !== null) {
                $lockedUser->phone = $record->phone;
                $lockedUser->phone_verified_at = now();
                $lockedUser->save();
            }
        });

        return true;
    }

    public function normalizePhone(string $phone): string
    {
        $cleaned = preg_replace('/[^\d+]/', '', trim($phone));

        if (! preg_match('/^\+?[1-9]\d{7,14}$/', $cleaned)) {
            throw ValidationException::withMessages([
                'phone' => ['The phone number must be a valid international format (8 to 15 digits).'],
            ]);
        }

        return $cleaned;
    }
}
