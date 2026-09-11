<?php

namespace App\Enums;

enum NdaStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Declined = 'declined';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Acceptance',
            self::Active => 'Active',
            self::Declined => 'Declined',
        };
    }
}
