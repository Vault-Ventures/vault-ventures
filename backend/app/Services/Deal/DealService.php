<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Models\BusinessConnection;
use App\Models\BusinessInterest;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealStateHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealService
{
    /**
     * Create a Deal from an existing accepted BusinessConnection.
     * Always creates a new independent Deal instance.
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
            $deal = Deal::create([
                'connection_id' => $connection->id,
                'business_id' => $connection->business_id,
                'founder_user_id' => $connection->founder_user_id,
                'counterparty_user_id' => $connection->counterparty_user_id,
                'counterparty_role' => $connection->counterparty_role,
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
        $this->enforceDealParticipant($deal, $user, $roleParam);

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
        $this->enforceDealParticipant($deal, $user, $roleParam);

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
            $hasAcceptedProposal = \App\Models\DealTermProposal::where('deal_id', $deal->id)
                ->where('status', 'accepted')
                ->exists();

            if (! $hasAcceptedProposal) {
                throw ValidationException::withMessages([
                    'target_state' => ['An accepted term proposal is required to advance to Agreement stage.'],
                ]);
            }

            $hasGeneratedAgreement = \App\Models\DealAgreement::where('deal_id', $deal->id)->exists();
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
        $isFounder = $connection->founder_user_id === $user->id;
        $isCounterparty = $connection->counterparty_user_id === $user->id;

        if (! $isFounder && ! $isCounterparty) {
            throw new HttpException(403, 'Only connection participants can create a deal.');
        }

        if ($isCounterparty) {
            $this->validateCounterpartyRole($user, $connection->counterparty_role, $roleParam);
        }
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
        $isFounder = $deal->founder_user_id === $user->id;
        $isCounterparty = $deal->counterparty_user_id === $user->id;

        if (! $isFounder && ! $isCounterparty) {
            throw new HttpException(403, 'Only deal participants may access this deal.');
        }

        if ($isCounterparty) {
            $this->validateCounterpartyRole($user, $deal->counterparty_role, $roleParam);
        }
    }

    /**
     * Validate counterparty role and multi-role parameters.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function validateCounterpartyRole(
        User $user,
        ParticipantRole $expectedRole,
        ?string $roleParam
    ): void {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'User does not possess the required participant role.');
        }

        if ($hasInvestor && $hasProfessional) {
            if ($roleParam === null || trim($roleParam) === '') {
                throw ValidationException::withMessages([
                    'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
                ]);
            }

            $normalized = strtolower(trim($roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            if ($normalized !== $expectedRole->value) {
                throw new HttpException(403, 'User role does not match deal counterparty role.');
            }

            return;
        }

        if ($roleParam !== null && trim($roleParam) !== '') {
            $normalized = strtolower(trim($roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            if ($normalized !== $expectedRole->value) {
                throw new HttpException(403, 'User role does not match deal counterparty role.');
            }
        }

        if (! $user->hasRole($expectedRole)) {
            throw new HttpException(403, 'User does not possess the required role for this deal.');
        }
    }
}
