<?php

namespace App\Enums;

enum ParticipantRole: string
{
    case Founder = 'founder';
    case Investor = 'investor';
    case Professional = 'professional';
}
