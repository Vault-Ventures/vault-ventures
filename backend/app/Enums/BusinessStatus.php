<?php

namespace App\Enums;

enum BusinessStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Published = 'published';
    case Rejected = 'rejected';
    case Submitted = 'submitted'; // Backward compatibility with legacy fixtures
}
