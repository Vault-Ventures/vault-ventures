<?php

namespace App\Enums;

enum VerificationRequestStatus: string
{
    case Pending = 'pending';
    case UnderReview = 'under_review';
    case NeedsInformation = 'needs_information';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
