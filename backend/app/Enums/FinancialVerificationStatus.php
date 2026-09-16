<?php

namespace App\Enums;

enum FinancialVerificationStatus: string
{
    case SelfReported = 'self_reported';
    case EvidenceSubmitted = 'evidence_submitted';
    case UnderReview = 'under_review';
    case Verified = 'verified';

    public function label(): string
    {
        return match ($this) {
            self::SelfReported => 'Self Reported',
            self::EvidenceSubmitted => 'Evidence Submitted',
            self::UnderReview => 'Under Review',
            self::Verified => 'Verified',
        };
    }
}
