<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Models\BusinessConnection;
use App\Models\BusinessInterest;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealStateHistory;
use App\Models\DealTermProposal;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealService
{
    /**
     * List deals accessible to the authenticated user with multi-business and multi-role filtering.
     *
     * @return array{items: array<int, mixed>, pagination: array<string, int>}
     *
     * @throws ValidationException
     */
    public function listForParticipant(
        User $user,
        ?string $roleParam = null,
        ?int $businessId = null,
        int $page = 1,
        int $perPage = 25
    ): array {
        $roles = $user->roles()->pluck('role')->map(fn ($r) => $r instanceof ParticipantRole ? $r->value : (string) $r)->all();
        $isAdmin = $user->hasAdminAccess();

        $query = Deal::query()->with([
            'business:id,name,industry,business_stage,location,logo_url',
            'founderUser:id,name,email,avatar_url',
            'counterpartyUser:id,name,email,avatar_url',
            'agreement:id,deal_id,status,finalized_at',
            'milestones:id,deal_id,status,target_amount,sequence_order',
        ]);

        if (! $isAdmin) {
            $role = $roleParam ? strtolower(trim($roleParam)) : null;

            if ($role !== null && trim($role) !== '') {
                if (! in_array($role, ['founder', 'investor', 'professional'], true)) {
                    throw ValidationException::withMessages(['role' => ['Invalid participant role.']]);
                }
                if (! in_array($role, $roles, true)) {
                    abort(403, 'User does not possess the requested participant role.');
                }

                if ($role === 'founder') {
                    $query->where('founder_user_id', $user->id);
                } else {
                    $query->where('counterparty_user_id', $user->id)->where('counterparty_role', $role);
                }
            } else {
                if (count($roles) === 1 && in_array('founder', $roles, true)) {
                    $query->where('founder_user_id', $user->id);
                } elseif (count($roles) === 1) {
                    $query->where('counterparty_user_id', $user->id)->where('counterparty_role', $roles[0]);
                } else {
                    $query->where(function ($q) use ($user, $roles) {
                        if (in_array('founder', $roles, true)) {
                            $q->orWhere('founder_user_id', $user->id);
                        }
                        $counterpartyRoles = array_values(array_intersect($roles, ['investor', 'professional']));
                        if (! empty($counterpartyRoles)) {
                            $q->orWhere(function ($sub) use ($user, $counterpartyRoles) {
                                $sub->where('counterparty_user_id', $user->id)
                                    ->whereIn('counterparty_role', $counterpartyRoles);
                            });
                        }
                    });
                }
            }
        }

        if ($businessId !== null) {
            if (! $isAdmin) {
                $isOwner = $user->founderProfile?->businesses()->where('id', $businessId)->exists();
                if (! $isOwner) {
                    $isParticipant = BusinessConnection::where('business_id', $businessId)
                        ->where('counterparty_user_id', $user->id)
                        ->exists();

                    if (! $isParticipant) {
                        abort(403, 'User does not have access to deals for this business.');
                    }
                }
            }
            $query->where('business_id', $businessId);
        }

        $paginator = $query->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        $items = $paginator->getCollection()->map(function (Deal $deal) {
            $milestones = $deal->milestones;
            $fundedCount = $milestones->where('status', 'funded')->count();

            return [
                'id' => $deal->id,
                'connection_id' => $deal->connection_id,
                'business_id' => $deal->business_id,
                'business' => $deal->business ? [
                    'id' => $deal->business->id,
                    'name' => $deal->business->name,
                    'industry' => $deal->business->industry,
                    'business_stage' => $deal->business->business_stage,
                    'location' => $deal->business->location,
                    'logo_url' => $deal->business->logo_url,
                ] : null,
                'founder_user_id' => $deal->founder_user_id,
                'founder' => $deal->founderUser ? [
                    'id' => $deal->founderUser->id,
                    'name' => $deal->founderUser->name,
                    'email' => $deal->founderUser->email,
                    'avatar_url' => $deal->founderUser->avatar_url,
                ] : null,
                'counterparty_user_id' => $deal->counterparty_user_id,
                'counterparty' => $deal->counterpartyUser ? [
                    'id' => $deal->counterpartyUser->id,
                    'name' => $deal->counterpartyUser->name,
                    'email' => $deal->counterpartyUser->email,
                    'avatar_url' => $deal->counterpartyUser->avatar_url,
                ] : null,
                'counterparty_role' => $deal->counterparty_role->value,
                'stage' => $deal->stage->value,
                'stage_label' => $deal->stage->label(),
                'stage_order' => $deal->stage->order(),
                'agreement_status' => $deal->agreement?->status,
                'milestones_count' => $milestones->count(),
                'funded_milestones_count' => $fundedCount,
                'created_at' => $deal->created_at?->toISOString(),
                'updated_at' => $deal->updated_at?->toISOString(),
            ];
        })->all();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }

    /**
     * Create a Deal from an existing accepted BusinessConnection.
     * Prevents duplicate active Deals for the same connection.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function createDealFromConnection(
        BusinessConnection $connection,
        User $user,
        ?string $roleParam = null
    ): Deal {
        $this->enforceConnectionParticipant($connection, $user, $roleParam);

        return DB::transaction(function () use ($connection, $user) {
            $lockedConnection = BusinessConnection::with('business.founderProfile')
                ->where('id', $connection->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedConnection->business === null
                || $lockedConnection->business->founderProfile === null
                || $lockedConnection->business->founderProfile->user_id !== $lockedConnection->founder_user_id
            ) {
                throw ValidationException::withMessages([
                    'connection' => ['Connection data is inconsistent with business ownership.'],
                ]);
            }

            $existingDeal = Deal::where('connection_id', $lockedConnection->id)
                ->lockForUpdate()
                ->first();

            if ($existingDeal !== null) {
                if ($existingDeal->stage === DealStage::Completed) {
                    throw ValidationException::withMessages([
                        'connection' => ['A completed deal already exists for this business connection.'],
                    ]);
                }

                throw ValidationException::withMessages([
                    'connection' => ['An active deal already exists for this business connection.'],
                ]);
            }

            $deal = Deal::create([
                'connection_id' => $lockedConnection->id,
                'business_id' => $lockedConnection->business_id,
                'founder_user_id' => $lockedConnection->founder_user_id,
                'counterparty_user_id' => $lockedConnection->counterparty_user_id,
                'counterparty_role' => $lockedConnection->counterparty_role,
                'stage' => DealStage::Matched,
            ]);

            DealStateHistory::create([
                'deal_id' => $deal->id,
                'previous_state' => null,
                'new_state' => DealStage::Matched,
                'changed_by_user_id' => $user->id,
                'changed_at' => now(),
            ]);

            return $deal;
        });
    }

    /**
     * Retrieve Deal Room data for an authorized participant.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getDealRoom(Deal $deal, User $user, ?string $roleParam = null): Deal
    {
        app(DealAccessService::class)->view($deal, $user, $roleParam);

        return $deal;
    }

    /**
     * Retrieve Deal lifecycle state history for an authorized participant.
     *
     * @return Collection<int, DealStateHistory>
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getDealHistory(Deal $deal, User $user, ?string $roleParam = null): Collection
    {
        app(DealAccessService::class)->view($deal, $user, $roleParam);

        return $deal->histories()->orderBy('id')->get();
    }

    /**
     * Transition the Deal to the next valid lifecycle state.
     * Enforces prerequisite gates and prevents advancing to future unreleased phases.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function transitionDeal(
        Deal $deal,
        User $user,
        ?string $targetStateParam = null,
        ?string $roleParam = null
    ): Deal {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        $targetStage = null;
        if ($targetStateParam !== null && trim($targetStateParam) !== '') {
            $targetStage = DealStage::tryNormalize($targetStateParam);
            if ($targetStage === null) {
                throw ValidationException::withMessages([
                    'target_state' => ['Invalid deal stage specified.'],
                ]);
            }
        } else {
            $targetStage = $deal->stage->next();
            if ($targetStage === null) {
                throw ValidationException::withMessages([
                    'target_state' => ['Deal is already in completed state.'],
                ]);
            }
        }

        if ($deal->stage === $targetStage) {
            throw ValidationException::withMessages([
                'target_state' => ['Deal is already in state: '.$targetStage->label().'.'],
            ]);
        }

        if ($targetStage->order() < $deal->stage->order()) {
            throw ValidationException::withMessages([
                'target_state' => ['Backward transitions are not permitted.'],
            ]);
        }

        if ($targetStage->order() > $deal->stage->order() + 1) {
            $nextAllowed = $deal->stage->next()?->label() ?? 'none';
            throw ValidationException::withMessages([
                'target_state' => ['Cannot skip lifecycle states. Next valid state is: '.$nextAllowed.'.'],
            ]);
        }

        // Validate state-specific transition rules
        $this->validateStateTransitionPrerequisites($deal, $targetStage);

        return DB::transaction(function () use ($deal, $user, $targetStage) {
            $lockedDeal = Deal::where('id', $deal->id)
                ->lockForUpdate()
                ->firstOrFail();

            $previousState = $lockedDeal->stage;
            $lockedDeal->stage = $targetStage;
            $lockedDeal->save();

            DealStateHistory::create([
                'deal_id' => $lockedDeal->id,
                'previous_state' => $previousState,
                'new_state' => $targetStage,
                'changed_by_user_id' => $user->id,
                'changed_at' => now(),
            ]);

            return $lockedDeal;
        });
    }

    /**
     * Validate prerequisites for entering the target lifecycle state.
     *
     * @throws ValidationException
     */
    private function validateStateTransitionPrerequisites(Deal $deal, DealStage $targetStage): void
    {
        // Matched -> Interest Confirmed: requires mutual interest on the underlying connection
        if ($deal->stage === DealStage::Matched && $targetStage === DealStage::InterestConfirmed) {
            $hasFounderInterest = BusinessInterest::where('business_id', $deal->business_id)
                ->where('counterparty_user_id', $deal->counterparty_user_id)
                ->where('counterparty_role', $deal->counterparty_role->value)
                ->where('expressed_by_user_id', $deal->founder_user_id)
                ->where('status', 'active')
                ->exists();

            $hasCounterpartyInterest = BusinessInterest::where('business_id', $deal->business_id)
                ->where('counterparty_user_id', $deal->counterparty_user_id)
                ->where('counterparty_role', $deal->counterparty_role->value)
                ->where('expressed_by_user_id', $deal->counterparty_user_id)
                ->where('status', 'active')
                ->exists();

            if (! $hasFounderInterest || ! $hasCounterpartyInterest) {
                throw ValidationException::withMessages([
                    'target_state' => ['Mutual interest expression is required to advance to Interest Confirmed.'],
                ]);
            }
        }

        // Deal Room Opened -> NDA Signed: requires an actual active Phase 6 NDA
        if ($deal->stage === DealStage::DealRoomOpened && $targetStage === DealStage::NdaSigned) {
            $hasActiveNda = BusinessNda::where('business_id', $deal->business_id)
                ->where('counterparty_user_id', $deal->counterparty_user_id)
                ->where('status', NdaStatus::Active)
                ->exists();

            if (! $hasActiveNda) {
                throw ValidationException::withMessages([
                    'target_state' => ['An active bilateral NDA is required to advance to NDA Signed.'],
                ]);
            }
        }

        // NDA Signed -> Negotiation: Requires an active bilateral NDA
        if ($deal->stage === DealStage::NdaSigned && $targetStage === DealStage::Negotiation) {
            $hasActiveNda = BusinessNda::where('business_id', $deal->business_id)
                ->where('counterparty_user_id', $deal->counterparty_user_id)
                ->where('status', NdaStatus::Active)
                ->exists();

            if (! $hasActiveNda) {
                throw ValidationException::withMessages([
                    'target_state' => ['An active bilateral NDA is required to enter Negotiation.'],
                ]);
            }
        }

        // Negotiation -> Agreement: Requires accepted proposal and generated agreement
        if ($deal->stage === DealStage::Negotiation && $targetStage === DealStage::Agreement) {
            $hasAcceptedProposal = DealTermProposal::where('deal_id', $deal->id)
                ->where('status', 'accepted')
                ->exists();

            if (! $hasAcceptedProposal) {
                throw ValidationException::withMessages([
                    'target_state' => ['An accepted term proposal is required to advance to Agreement stage.'],
                ]);
            }

            $hasGeneratedAgreement = DealAgreement::where('deal_id', $deal->id)->exists();
            if (! $hasGeneratedAgreement) {
                throw ValidationException::withMessages([
                    'target_state' => ['An agreement draft must be generated from the accepted proposal before advancing to Agreement stage.'],
                ]);
            }
        }

        // Agreement -> Milestone Funding Active: Blocked via generic transition endpoint
        if ($deal->stage === DealStage::Agreement && $targetStage === DealStage::MilestoneFundingActive) {
            throw ValidationException::withMessages([
                'target_state' => ['Milestone funding must be activated via the dedicated activation endpoint (/api/me/deals/{deal}/activate-milestones).'],
            ]);
        }

        // Milestone Funding Active -> Completed: Blocked via generic transition endpoint
        if ($deal->stage === DealStage::MilestoneFundingActive && $targetStage === DealStage::Completed) {
            throw ValidationException::withMessages([
                'target_state' => ['Deal completion must be executed via the dedicated completion endpoint (/api/me/deals/{deal}/complete).'],
            ]);
        }
    }

    /**
     * Enforce participant authorization on a connection.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceConnectionParticipant(
        BusinessConnection $connection,
        User $user,
        ?string $roleParam
    ): void {
        app(DealAccessService::class)->participant($connection, $user, $roleParam);
    }

    /**
     * Enforce participant authorization on a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealParticipant(
        Deal $deal,
        User $user,
        ?string $roleParam
    ): void {
        app(DealAccessService::class)->participant($deal, $user, $roleParam);
    }

}
