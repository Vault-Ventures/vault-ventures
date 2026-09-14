<?php

namespace App\Enums;

enum DealStage: string
{
    case Matched = 'matched';
    case InterestConfirmed = 'interest_confirmed';
    case DealRoomOpened = 'deal_room_opened';
    case NdaSigned = 'nda_signed';
    case Negotiation = 'negotiation';
    case Agreement = 'agreement';
    case MilestoneFundingActive = 'milestone_funding_active';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Matched => 'Matched',
            self::InterestConfirmed => 'Interest Confirmed',
            self::DealRoomOpened => 'Deal Room',
            self::NdaSigned => 'NDA Signed',
            self::Negotiation => 'Negotiation',
            self::Agreement => 'Agreement',
            self::MilestoneFundingActive => 'Milestone Funding Active',
            self::Completed => 'Completed',
        };
    }

    public function order(): int
    {
        return match ($this) {
            self::Matched => 1,
            self::InterestConfirmed => 2,
            self::DealRoomOpened => 3,
            self::NdaSigned => 4,
            self::Negotiation => 5,
            self::Agreement => 6,
            self::MilestoneFundingActive => 7,
            self::Completed => 8,
        };
    }

    public function next(): ?self
    {
        return match ($this) {
            self::Matched => self::InterestConfirmed,
            self::InterestConfirmed => self::DealRoomOpened,
            self::DealRoomOpened => self::NdaSigned,
            self::NdaSigned => self::Negotiation,
            self::Negotiation => self::Agreement,
            self::Agreement => self::MilestoneFundingActive,
            self::MilestoneFundingActive => self::Completed,
            self::Completed => null,
        };
    }

    public static function tryNormalize(string $value): ?self
    {
        $normalized = strtolower(trim(str_replace([' ', '-'], '_', $value)));
        if ($normalized === 'deal_room') {
            return self::DealRoomOpened;
        }
        if ($normalized === 'active') {
            return self::MilestoneFundingActive;
        }

        return self::tryFrom($normalized);
    }
}
