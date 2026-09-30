<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Card = 'card';
    case Bkash = 'bkash';
    case Nagad = 'nagad';
    case BankTransfer = 'bank_transfer';
    case CashOther = 'cash_other';

    public function label(): string
    {
        return match ($this) {
            self::Card => 'Card',
            self::Bkash => 'bKash',
            self::Nagad => 'Nagad',
            self::BankTransfer => 'Bank Transfer',
            self::CashOther => 'Cash / Other',
        };
    }
}
