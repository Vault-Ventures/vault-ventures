<?php

namespace App\Services\Connection;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ConnectionService
{
    /**
     * Founder expresses interest toward an Investor or Skilled Professional for their business.
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function expressFounderInterest(
        Business $business,
        User $founder,
        User $counterparty,
        ?string $roleParam = null
    ): array {
        $this->enforceBusinessOwnership($business, $founder);

        if ($counterparty->id === $founder->id) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Founders cannot express interest toward themselves.'],
            ]);
        }

        $resolvedRole = $this->resolveTargetRole($counterparty, $roleParam);

        // Validate disclosure relationship exists
        $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->where('counterparty_role', $resolvedRole->value)
            ->first();

        if ($relationship === null) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['A valid disclosure relationship is required before expressing interest.'],
            ]);
        }

        return DB::transaction(function () use ($business, $founder, $counterparty, $resolvedRole) {
            $interest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $founder->id)
                ->lockForUpdate()
                ->first();

            if ($interest === null) {
                $interest = BusinessInterest::create([
                    'business_id' => $business->id,
                    'founder_user_id' => $founder->id,
                    'counterparty_user_id' => $counterparty->id,
                    'counterparty_role' => $resolvedRole,
                    'expressed_by_user_id' => $founder->id,
                    'status' => 'active',
                    'expressed_at' => now(),
                ]);
            }

            $counterpartyInterest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $counterparty->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            $connection = null;
            if ($counterpartyInterest !== null) {
                $connection = BusinessConnection::firstOrCreate(
                    [
                        'business_id' => $business->id,
                        'counterparty_user_id' => $counterparty->id,
                        'counterparty_role' => $resolvedRole,
                    ],
                    [
                        'founder_user_id' => $founder->id,
                    ]
                );
            } else {
                $connection = BusinessConnection::where('business_id', $business->id)
                    ->where('counterparty_user_id', $counterparty->id)
                    ->where('counterparty_role', $resolvedRole->value)
                    ->first();
            }

            return [
                'business_id' => $business->id,
                'founder_user_id' => $founder->id,
                'counterparty_user_id' => $counterparty->id,
                'counterparty_role' => $resolvedRole,
                'founder_interest' => $interest,
                'counterparty_interest' => $counterpartyInterest,
                'is_mutual' => $counterpartyInterest !== null,
                'connection' => $connection,
            ];
        });
    }

    /**
     * Investor or Skilled Professional reciprocates interest for a business where a valid Founder interest exists.
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function expressReciprocalInterest(
        Business $business,
        User $counterparty,
        ?string $roleParam = null
    ): array {
        $this->enforceBusinessAccess($business, $counterparty);

        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $counterparty->id;
        if ($isOwner) {
            throw new HttpException(403, 'Founders cannot reciprocate interest in their own business.');
        }

        $resolvedRole = $this->resolveParticipantRole($counterparty, $roleParam);

        $founderUser = $business->founderProfile?->user;
        if ($founderUser === null) {
            throw new HttpException(404, 'Business founder not found.');
        }

        // Validate disclosure relationship exists
        $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->where('counterparty_role', $resolvedRole->value)
            ->first();

        if ($relationship === null) {
            throw ValidationException::withMessages([
                'disclosure' => ['A valid disclosure relationship is required before expressing reciprocal interest.'],
            ]);
        }

        // Validate Founder interest exists
        $founderInterest = BusinessInterest::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->where('counterparty_role', $resolvedRole->value)
            ->where('expressed_by_user_id', $founderUser->id)
            ->where('status', 'active')
            ->first();

        if ($founderInterest === null) {
            throw ValidationException::withMessages([
                'interest' => ['Founder has not expressed interest in this counterparty for this business.'],
            ]);
        }

        return DB::transaction(function () use ($business, $founderUser, $counterparty, $resolvedRole, $founderInterest) {
            $interest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $counterparty->id)
                ->lockForUpdate()
                ->first();

            if ($interest === null) {
                $interest = BusinessInterest::create([
                    'business_id' => $business->id,
                    'founder_user_id' => $founderUser->id,
                    'counterparty_user_id' => $counterparty->id,
                    'counterparty_role' => $resolvedRole,
                    'expressed_by_user_id' => $counterparty->id,
                    'status' => 'active',
                    'expressed_at' => now(),
                ]);
            }

            $connection = BusinessConnection::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'counterparty_user_id' => $counterparty->id,
                    'counterparty_role' => $resolvedRole,
                ],
                [
                    'founder_user_id' => $founderUser->id,
                ]
            );

            return [
                'business_id' => $business->id,
                'founder_user_id' => $founderUser->id,
                'counterparty_user_id' => $counterparty->id,
                'counterparty_role' => $resolvedRole,
                'founder_interest' => $founderInterest,
                'counterparty_interest' => $interest,
                'is_mutual' => true,
                'connection' => $connection,
            ];
        });
    }

    /**
     * Get interest and connection status between business founder and counterparty.
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function getStatus(
        Business $business,
        User $currentUser,
        ?User $targetCounterparty = null,
        ?string $roleParam = null
    ): array {
        $this->enforceBusinessAccess($business, $currentUser);

        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $currentUser->id;

        if ($isOwner) {
            if ($targetCounterparty === null) {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Target counterparty user ID is required for founder requests.'],
                ]);
            }

            if ($targetCounterparty->id === $currentUser->id) {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Invalid counterparty user specified.'],
                ]);
            }

            $counterparty = $targetCounterparty;
            $founderUser = $currentUser;
            $resolvedRole = $this->resolveTargetRole($counterparty, $roleParam);
        } else {
            $counterparty = $currentUser;
            $founderUser = $business->founderProfile?->user;
            $resolvedRole = $this->resolveParticipantRole($counterparty, $roleParam);
        }

        $founderInterest = $founderUser !== null
            ? BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $founderUser->id)
                ->where('status', 'active')
                ->first()
            : null;

        $counterpartyInterest = BusinessInterest::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->where('counterparty_role', $resolvedRole->value)
            ->where('expressed_by_user_id', $counterparty->id)
            ->where('status', 'active')
            ->first();

        $connection = BusinessConnection::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->where('counterparty_role', $resolvedRole->value)
            ->first();

        return [
            'business_id' => $business->id,
            'founder_user_id' => $founderUser?->id,
            'counterparty_user_id' => $counterparty->id,
            'counterparty_role' => $resolvedRole,
            'founder_interest' => $founderInterest,
            'counterparty_interest' => $counterpartyInterest,
            'is_mutual' => $founderInterest !== null && $counterpartyInterest !== null,
            'connection' => $connection,
        ];
    }

    /**
     * Enforce draft business protection for non-owners.
     *
     * @throws ModelNotFoundException
     */
    private function enforceBusinessAccess(Business $business, User $user): void
    {
        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
        if (! $isOwner && $business->status !== BusinessStatus::Submitted) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }
    }

    /**
     * Enforce founder ownership on business actions.
     *
     * @throws HttpException
     */
    private function enforceBusinessOwnership(Business $business, User $user): void
    {
        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
        if (! $isOwner) {
            if ($business->status !== BusinessStatus::Submitted) {
                throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
            }

            throw new HttpException(403, 'Only the business founder can express founder interest.');
        }
    }

    /**
     * Resolve target counterparty role for founder actions.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function resolveTargetRole(User $target, ?string $roleParam): ParticipantRole
    {
        $hasInvestor = $target->hasRole(ParticipantRole::Investor);
        $hasProfessional = $target->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Target user is neither an investor nor a skilled professional.'],
            ]);
        }

        if ($roleParam !== null && trim($roleParam) !== '') {
            $normalized = strtolower(trim($roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            $role = ParticipantRole::from($normalized);
            if (! $target->hasRole($role)) {
                throw ValidationException::withMessages([
                    'role' => ['Target user does not possess the requested role.'],
                ]);
            }

            return $role;
        }

        if ($hasInvestor && $hasProfessional) {
            throw ValidationException::withMessages([
                'role' => ['Role parameter (investor or professional) is required when targeting multi-role users.'],
            ]);
        }

        return $hasInvestor ? ParticipantRole::Investor : ParticipantRole::Professional;
    }

    /**
     * Resolve participant role for counterparty actions following Phase 6 multi-role conventions.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function resolveParticipantRole(User $user, ?string $roleParam): ParticipantRole
    {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'Only Investors and Skilled Professionals can perform this action.');
        }

        if ($roleParam !== null && trim((string) $roleParam) !== '') {
            $normalized = strtolower(trim((string) $roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            $role = ParticipantRole::from($normalized);
            if (! $user->hasRole($role)) {
                throw new HttpException(403, 'User does not possess the requested role.');
            }

            return $role;
        }

        if ($hasInvestor && $hasProfessional) {
            throw ValidationException::withMessages([
                'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
            ]);
        }

        return $hasInvestor ? ParticipantRole::Investor : ParticipantRole::Professional;
    }
}
