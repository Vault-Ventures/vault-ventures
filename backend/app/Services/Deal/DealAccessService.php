<?php

namespace App\Services\Deal;

use App\Enums\ParticipantRole;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class DealAccessService
{
    public function view(Deal $deal, User $user, ?string $role = null): void
    {
        if ($user->hasAdminAccess()) {
            return;
        }
        $this->participant($deal, $user, $role);
    }

    public function participant(Deal|BusinessConnection $deal, User $user, ?string $role = null): void
    {
        // Admin accounts are oversight-only, including accounts with participant roles.
        abort_if($user->hasAdminAccess(), 403, 'Admin accounts cannot perform participant actions.');
        if ($deal->founder_user_id === $user->id) {
            if ($role !== null && trim($role) !== '') {
                $resolved = ParticipantRole::tryFrom(strtolower(trim($role)));
                if ($resolved === null) {
                    throw ValidationException::withMessages(['role' => ['Invalid participant role.']]);
                }
                abort_unless($resolved === ParticipantRole::Founder, 403, 'This participant is the deal founder.');
            }
            return;
        }
        abort_unless($deal->counterparty_user_id === $user->id, 403, 'Only recorded participants may access this deal.');
        $this->counterpartyRole($user, $deal->counterparty_role, $role);
    }

    public function founder(Deal $deal, User $user): void
    {
        $this->participant($deal, $user);
        abort_unless($deal->founder_user_id === $user->id, 403, 'Only the deal founder may perform this action.');
    }

    public function counterparty(Deal $deal, User $user, ?string $role = null): void
    {
        $this->participant($deal, $user, $role);
        abort_unless($deal->counterparty_user_id === $user->id, 403, 'Only the deal counterparty may perform this action.');
    }

    public function counterpartyRole(User $user, ParticipantRole $expected, ?string $role): void
    {
        abort_unless($user->hasRole($expected), 403, 'User does not possess the required role for this deal.');
        if ($role === null || trim($role) === '') {
            if ($user->hasRole(ParticipantRole::Investor) && $user->hasRole(ParticipantRole::Professional)) {
                throw ValidationException::withMessages(['role' => ['An explicit investor or professional role is required.']]);
            }
            return;
        }
        $normalized = strtolower(trim($role));
        if (! in_array($normalized, ['investor', 'professional'], true)) {
            throw ValidationException::withMessages(['role' => ['Invalid counterparty role.']]);
        }
        abort_unless($normalized === $expected->value, 403, 'User role does not match the deal counterparty role.');
    }
}
