<?php

namespace App\Enums;

enum FinancialDiscrepancyStatus: string
{
    case UnderReview = 'under_review';
    case Resolved = 'resolved';
    case Disputed = 'disputed';

    public function label(): string
    {
        return match ($this) {
            self::UnderReview => 'Under Review',
            self::Resolved => 'Resolved',
            self::Disputed => 'Disputed',
        };
    }
}
