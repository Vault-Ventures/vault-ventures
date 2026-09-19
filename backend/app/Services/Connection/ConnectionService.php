<?php

namespace App\Services\Connection;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\User;
use App\Notifications\ConnectionEstablishedNotification;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ConnectionService
{
    public function listForParticipant(User $user, ?string $roleParam, int $page = 1): array
    {
        $roles = $user->roles()->pluck('role')->map(fn ($role) => $role instanceof ParticipantRole ? $role->value : $role)->all();
        $role = $roleParam ?: (count($roles) === 1 ? $roles[0] : null);
        if ($role === null || ! in_array($role, ['founder', 'investor', 'professional'], true)) {
            throw ValidationException::withMessages(['role' => ['Choose an explicit participant role.']]);
        }
        abort_unless(in_array($role, $roles, true) && ! $user->hasAdminAccess(), 403);

        $columns = ['business_id', 'founder_user_id', 'counterparty_user_id', 'counterparty_role'];
        $scope = function ($query) use ($user, $role) {
            return $role === 'founder'
                ? $query->where('founder_user_id', $user->id)
                : $query->where('counterparty_user_id', $user->id)->where('counterparty_role', $role);
        };
        $pairs = $scope(DB::table('business_interests')->select($columns)->where('status', 'active'))
            ->union($scope(DB::table('business_connections')->select($columns)));
        $query = DB::query()->fromSub($pairs, 'pairs')->join('businesses', 'businesses.id', '=', 'pairs.business_id');
        if ($role !== 'founder') {
            $query->whereIn('businesses.status', [BusinessStatus::Published->value, BusinessStatus::Submitted->value]);
        }
        $page = $query->select('pairs.*')->orderBy('pairs.business_id')->orderBy('pairs.counterparty_user_id')
            ->orderBy('pairs.counterparty_role')->paginate(25, ['*'], 'page', max(1, $page));
        $items = $page->getCollection()->map(function ($pair) {
            $business = Business::findOrFail($pair->business_id);
            $founder = User::findOrFail($pair->founder_user_id);
            $counterparty = User::findOrFail($pair->counterparty_user_id);
            $interests = BusinessInterest::where('business_id', $pair->business_id)
                ->where('counterparty_user_id', $pair->counterparty_user_id)->where('counterparty_role', $pair->counterparty_role)
                ->where('status', 'active')->get();
            $founderInterest = $interests->firstWhere('expressed_by_user_id', $founder->id);
            $counterpartyInterest = $interests->firstWhere('expressed_by_user_id', $counterparty->id);
            $connection = BusinessConnection::where('business_id', $pair->business_id)
                ->where('counterparty_user_id', $pair->counterparty_user_id)->where('counterparty_role', $pair->counterparty_role)->first();
            $deal = $connection?->deals()->latest('id')->first();
            return [
                'connection_id' => $connection?->id,
                'business' => ['id' => $business->id, 'name' => $business->name],
                'founder' => ['id' => $founder->id, 'name' => $founder->name],
                'counterparty' => ['id' => $counterparty->id, 'name' => $counterparty->name],
                'counterparty_role' => $pair->counterparty_role,
                'has_founder_interest' => $founderInterest !== null,
                'has_counterparty_interest' => $counterpartyInterest !== null,
                'is_mutual' => $founderInterest !== null && $counterpartyInterest !== null,
                'is_connected' => $connection !== null,
                'connected_at' => $connection?->created_at?->toISOString(),
                'deal' => $deal ? ['id' => $deal->id, 'stage' => $deal->stage->value] : null,
            ];
        })->all();
        return ['items' => $items, 'pagination' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'per_page' => $page->perPage()]];
    }


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
            Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
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
            } else {
                $interest->update([
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

                // Notify both parties when a mutual connection is established
                if ($connection->wasRecentlyCreated) {
                    $founder->notify(new ConnectionEstablishedNotification($business, $counterparty, $resolvedRole->value));
                    $counterparty->notify(new ConnectionEstablishedNotification($business, $founder, 'founder'));
                }
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
        }, 3);
    }

    /**
     * Investor or Skilled Professional expresses interest for a business.
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function expressCounterpartyInterest(
        Business $business,
        User $counterparty,
        ?string $roleParam = null
    ): array {
        $this->enforceBusinessAccess($business, $counterparty);

        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $counterparty->id;
        if ($isOwner) {
            throw new HttpException(403, 'Founders cannot express interest in their own business as a counterparty.');
        }

        $resolvedRole = $this->resolveParticipantRole($counterparty, $roleParam);

        $founderUser = $business->founderProfile?->user;
        if ($founderUser === null) {
            throw new HttpException(404, 'Business founder not found.');
        }

        return DB::transaction(function () use ($business, $founderUser, $counterparty, $resolvedRole) {
            Business::whereKey($business->id)->lockForUpdate()->firstOrFail();

            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->lockForUpdate()
                ->first();

            if ($relationship === null) {
                $relationship = new BusinessDisclosureRelationship;
                $relationship->business_id = $business->id;
                $relationship->counterparty_user_id = $counterparty->id;
                $relationship->counterparty_role = $resolvedRole;
                $relationship->stage = \App\Enums\DisclosureStage::Extended;
                $relationship->interest_expressed_at = now();
                $relationship->save();
            } else {
                if ($relationship->stage === \App\Enums\DisclosureStage::Teaser) {
                    $relationship->stage = \App\Enums\DisclosureStage::Extended;
                    $relationship->interest_expressed_at = now();
                    $relationship->counterparty_role = $resolvedRole;
                    $relationship->save();
                }
            }

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
            } else {
                $interest->update([
                    'status' => 'active',
                    'expressed_at' => now(),
                ]);
            }

            $founderInterest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $founderUser->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            $connection = null;
            if ($founderInterest !== null) {
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

                if ($connection->wasRecentlyCreated) {
                    $founderUser->notify(new ConnectionEstablishedNotification($business, $counterparty, $resolvedRole->value));
                    $counterparty->notify(new ConnectionEstablishedNotification($business, $founderUser, 'founder'));
                }
            } else {
                $connection = BusinessConnection::where('business_id', $business->id)
                    ->where('counterparty_user_id', $counterparty->id)
                    ->where('counterparty_role', $resolvedRole->value)
                    ->first();
            }

            return [
                'business_id' => $business->id,
                'founder_user_id' => $founderUser->id,
                'counterparty_user_id' => $counterparty->id,
                'counterparty_role' => $resolvedRole,
                'founder_interest' => $founderInterest,
                'counterparty_interest' => $interest,
                'is_mutual' => $founderInterest !== null,
                'connection' => $connection,
            ];
        }, 3);
    }

    /**
     * Investor or Skilled Professional withdraws their pending interest for a business.
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function withdrawCounterpartyInterest(
        Business $business,
        User $counterparty,
        ?string $roleParam = null
    ): array {
        $this->enforceBusinessAccess($business, $counterparty);

        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $counterparty->id;
        if ($isOwner) {
            throw new HttpException(403, 'Founders cannot withdraw interest from their own business as a counterparty.');
        }

        $resolvedRole = $this->resolveParticipantRole($counterparty, $roleParam);

        $founderUser = $business->founderProfile?->user;
        if ($founderUser === null) {
            throw new HttpException(404, 'Business founder not found.');
        }

        return DB::transaction(function () use ($business, $founderUser, $counterparty, $resolvedRole) {
            Business::whereKey($business->id)->lockForUpdate()->firstOrFail();

            // Check if mutual connection exists
            $connection = BusinessConnection::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->lockForUpdate()
                ->first();

            if ($connection !== null) {
                throw ValidationException::withMessages([
                    'interest' => ['Cannot withdraw interest after mutual connection or deal has been established.'],
                ]);
            }

            // Check if founder has active reciprocated interest
            $founderInterest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $founderUser->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if ($founderInterest !== null) {
                throw ValidationException::withMessages([
                    'interest' => ['Cannot withdraw interest after mutual interest has been confirmed.'],
                ]);
            }

            // Find user's active interest
            $interest = BusinessInterest::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->where('counterparty_role', $resolvedRole->value)
                ->where('expressed_by_user_id', $counterparty->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if ($interest === null) {
                throw ValidationException::withMessages([
                    'interest' => ['No active pending interest found to withdraw.'],
                ]);
            }

            // Mark interest as withdrawn
            $interest->update(['status' => 'withdrawn']);

            // Revert disclosure relationship if at Extended/Teaser stage without NDA
            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->lockForUpdate()
                ->first();

            if ($relationship !== null && in_array($relationship->stage, [\App\Enums\DisclosureStage::Teaser, \App\Enums\DisclosureStage::Extended], true)) {
                $relationship->stage = \App\Enums\DisclosureStage::Teaser;
                $relationship->interest_expressed_at = null;
                $relationship->save();
            }

            return [
                'business_id' => $business->id,
                'founder_user_id' => $founderUser->id,
                'counterparty_user_id' => $counterparty->id,
                'counterparty_role' => $resolvedRole,
                'withdrawn' => true,
            ];
        }, 3);
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
            Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
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
            } else {
                $interest->update([
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

            // Notify both parties when a mutual connection is established
            if ($connection->wasRecentlyCreated) {
                $founderUser->notify(new ConnectionEstablishedNotification($business, $counterparty, $resolvedRole->value));
                $counterparty->notify(new ConnectionEstablishedNotification($business, $founderUser, 'founder'));
            }

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
        }, 3);
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
        if (! $isOwner && ! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
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
            if (! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
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
