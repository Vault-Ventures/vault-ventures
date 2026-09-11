<?php

namespace App\Enums;

enum VerificationTier: int
{
    case Tier0 = 0;
    case Tier1 = 1;
    case Tier2 = 2;

    public function label(): string
    {
        return match ($this) {
            self::Tier0 => 'Email & Phone Verified',
            self::Tier1 => 'Identity Verified',
            self::Tier2 => 'Track-Record Verified',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Tier0 => 'Email and phone verification only.',
            self::Tier1 => 'Identity Verified.',
            self::Tier2 => 'Track-Record Verified (deferred to future on-platform modules).',
        };
    }
}
