<?php

namespace App\Enums;

enum DisclosureStage: int
{
    case Teaser = 1;
    case Extended = 2;
    case Nda = 3;
    case FullProposal = 4;

    public function label(): string
    {
        return match ($this) {
            self::Teaser => 'Teaser',
            self::Extended => 'Extended Information',
            self::Nda => 'NDA Protected',
            self::FullProposal => 'Full Proposal',
        };
    }
}
