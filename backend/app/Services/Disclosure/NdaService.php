<?php

namespace App\Services\Disclosure;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessNda;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class NdaService
{
    public const DEFAULT_NDA_VERSION = 'v1.0';

    public const DEFAULT_AGREEMENT_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    /**
     * Retrieve the NDA for a business and user/counterparty context.
     *
     * @throws ModelNotFoundException
     */
    public function getNda(Business $business, User $user, ?User $targetCounterparty = null): ?BusinessNda
    {
        $this->validateBusinessVisibility($business, $user);

        $isOwner = $this->isBusinessOwner($business, $user);
        $counterpartyUser = $isOwner ? $targetCounterparty : $user;

        if ($counterpartyUser === null) {
            return null;
        }

        return BusinessNda::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterpartyUser->id)
            ->first();
    }

    /**
     * Request an NDA between a business founder and a counterparty.
     *
     * @throws HttpException
     * @throws ModelNotFoundException
     */
    public function requestNda(
        Business $business,
        User $user,
        ?User $targetCounterparty = null
    ): BusinessNda {
        $this->validateBusinessVisibility($business, $user);

        if (! $user->isIdentityVerified()) {
            throw new HttpException(403, 'Tier 1 identity verification is required to initiate an NDA.');
        }

        $isOwner = $this->isBusinessOwner($business, $user);
        $counterpartyUser = $isOwner ? $targetCounterparty : $user;

        if ($counterpartyUser === null || ($isOwner && $counterpartyUser->id === $user->id)) {
            throw new HttpException(422, 'A valid counterparty must be specified for NDA requests.');
        }

        if (! $isOwner) {
            $hasInvestor = $user->hasRole(ParticipantRole::Investor);
            $hasProfessional = $user->hasRole(ParticipantRole::Professional);
            if (! $hasInvestor && ! $hasProfessional) {
                throw new HttpException(403, 'Only Investors and Skilled Professionals can participate in NDAs.');
            }
        }

        return DB::transaction(function () use ($business, $user, $counterpartyUser, $isOwner) {
            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterpartyUser->id)
                ->lockForUpdate()
                ->first();

            if ($relationship === null || $relationship->stage !== DisclosureStage::Extended) {
                throw new HttpException(403, 'NDA can only be initiated for relationships currently at Stage 2 (Extended Information).');
            }

            $nda = BusinessNda::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterpartyUser->id)
                ->lockForUpdate()
                ->first();

            if ($nda !== null) {
                if ($nda->status === NdaStatus::Active) {
                    throw new HttpException(409, 'An active NDA already exists for this business relationship.');
                }

                if ($nda->status === NdaStatus::Pending) {
                    throw new HttpException(409, 'An NDA request is already pending for this business relationship.');
                }

                // If declined, safely reset the existing record for a fresh request
                $nda->status = NdaStatus::Pending;
                $nda->nda_version = self::DEFAULT_NDA_VERSION;
                $nda->agreement_hash = self::DEFAULT_AGREEMENT_HASH;
                $nda->requested_by_user_id = $user->id;
                $nda->requested_at = now();
                $nda->founder_accepted_at = $isOwner ? now() : null;
                $nda->counterparty_accepted_at = ! $isOwner ? now() : null;
                $nda->activated_at = null;
                $nda->declined_at = null;
                $nda->declined_by_user_id = null;
                $nda->save();

                return $nda;
            }

            return BusinessNda::create([
                'business_id' => $business->id,
                'counterparty_user_id' => $counterpartyUser->id,
                'counterparty_role' => $relationship->counterparty_role,
                'status' => NdaStatus::Pending,
                'nda_version' => self::DEFAULT_NDA_VERSION,
                'agreement_hash' => self::DEFAULT_AGREEMENT_HASH,
                'requested_by_user_id' => $user->id,
                'requested_at' => now(),
                'founder_accepted_at' => $isOwner ? now() : null,
                'counterparty_accepted_at' => ! $isOwner ? now() : null,
                'activated_at' => null,
                'declined_at' => null,
                'declined_by_user_id' => null,
            ]);
        });
    }

    /**
     * Accept a pending NDA. If both parties have accepted and both are Tier 1, activates the NDA and advances Stage 2 -> Stage 3.
     *
     * @throws HttpException
     * @throws ModelNotFoundException
     */
    public function acceptNda(
        Business $business,
        User $user,
        ?User $targetCounterparty = null
    ): BusinessNda {
        $this->validateBusinessVisibility($business, $user);

        if (! $user->isIdentityVerified()) {
            throw new HttpException(403, 'Tier 1 identity verification is required to accept an NDA.');
        }

        $isOwner = $this->isBusinessOwner($business, $user);
        $counterpartyUser = $isOwner ? $targetCounterparty : $user;

        if ($counterpartyUser === null) {
            throw new HttpException(422, 'A valid counterparty must be specified.');
        }

        return DB::transaction(function () use ($business, $counterpartyUser, $isOwner) {
            $nda = BusinessNda::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterpartyUser->id)
                ->lockForUpdate()
                ->first();

            if ($nda === null || $nda->status !== NdaStatus::Pending) {
                throw new HttpException(404, 'No pending NDA found for this business relationship.');
            }

            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterpartyUser->id)
                ->lockForUpdate()
                ->first();

            if ($relationship === null || $relationship->stage === DisclosureStage::Teaser) {
                throw new HttpException(403, 'Invalid disclosure relationship state for NDA acceptance.');
            }

            // Record authenticated user's acceptance
            if ($isOwner) {
                $nda->founder_accepted_at = now();
            } else {
                $nda->counterparty_accepted_at = now();
            }

            // If BOTH parties have now accepted, check mutual Tier 1 and activate
            if ($nda->founder_accepted_at !== null && $nda->counterparty_accepted_at !== null) {
                $founderUser = $business->founderProfile?->user;
                $counterparty = $nda->counterpartyUser;

                if (! $founderUser?->isIdentityVerified()) {
                    throw new HttpException(403, 'Founder must possess Tier 1 identity verification before the NDA can be activated.');
                }

                if (! $counterparty?->isIdentityVerified()) {
                    throw new HttpException(403, 'Counterparty must possess Tier 1 identity verification before the NDA can be activated.');
                }

                $nda->status = NdaStatus::Active;
                $nda->activated_at = now();

                // Advance relationship to Stage 3 (NDA Protected)
                $relationship->stage = DisclosureStage::Nda;
                $relationship->save();
            }

            $nda->save();

            return $nda;
        });
    }

    /**
     * Decline a pending NDA.
     *
     * @throws HttpException
     * @throws ModelNotFoundException
     */
    public function declineNda(
        Business $business,
        User $user,
        ?User $targetCounterparty = null
    ): BusinessNda {
        $this->validateBusinessVisibility($business, $user);

        if (! $user->isIdentityVerified()) {
            throw new HttpException(403, 'Tier 1 identity verification is required to decline an NDA.');
        }

        $isOwner = $this->isBusinessOwner($business, $user);
        $counterpartyUser = $isOwner ? $targetCounterparty : $user;

        if ($counterpartyUser === null) {
            throw new HttpException(422, 'A valid counterparty must be specified.');
        }

        return DB::transaction(function () use ($business, $user, $counterpartyUser) {
            $nda = BusinessNda::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterpartyUser->id)
                ->lockForUpdate()
                ->first();

            if ($nda === null || $nda->status !== NdaStatus::Pending) {
                throw new HttpException(404, 'No pending NDA found to decline.');
            }

            $nda->status = NdaStatus::Declined;
            $nda->declined_at = now();
            $nda->declined_by_user_id = $user->id;
            $nda->save();

            return $nda;
        });
    }

    /**
     * Ensure business visibility adheres to the draft isolation boundary.
     *
     * @throws ModelNotFoundException
     */
    private function validateBusinessVisibility(Business $business, User $user): void
    {
        $isOwner = $this->isBusinessOwner($business, $user);

        if (! $isOwner && $business->status !== BusinessStatus::Submitted) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }
    }

    /**
     * Determine if a user is the founder owner of a business.
     */
    private function isBusinessOwner(Business $business, User $user): bool
    {
        return $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
    }
}
