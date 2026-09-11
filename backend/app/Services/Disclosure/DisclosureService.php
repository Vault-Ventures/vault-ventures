<?php

namespace App\Services\Disclosure;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DisclosureService
{
    /**
     * Retrieve the disclosure relationship for a business and user, if one exists.
     */
    public function getRelationship(Business $business, User $user): ?BusinessDisclosureRelationship
    {
        return BusinessDisclosureRelationship::where('business_id', $business->id)
            ->where('counterparty_user_id', $user->id)
            ->first();
    }

    /**
     * Determine the active disclosure stage between a business and a user.
     */
    public function getDisclosureStage(Business $business, ?User $user): DisclosureStage
    {
        if ($user === null) {
            return DisclosureStage::Teaser;
        }

        // The business founder owner has full unrestricted visibility.
        if ($business->founderProfile && $business->founderProfile->user_id === $user->id) {
            return DisclosureStage::FullProposal;
        }

        $relationship = $this->getRelationship($business, $user);

        return $relationship ? $relationship->stage : DisclosureStage::Teaser;
    }

    /**
     * Express interest in a business, creating or updating the relationship to Stage 2 (Extended Information).
     *
     * @throws HttpException
     * @throws ValidationException
     * @throws ModelNotFoundException
     */
    public function expressInterest(Business $business, User $user, ?string $roleParam = null): BusinessDisclosureRelationship
    {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'Only Investors and Skilled Professionals can express interest in businesses.');
        }

        // Multi-role resolution
        $resolvedRole = null;
        if ($hasInvestor && $hasProfessional) {
            if ($roleParam === null || trim($roleParam) === '') {
                throw ValidationException::withMessages([
                    'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
                ]);
            }

            $normalized = strtolower(trim($roleParam));
            if ($normalized === 'investor') {
                $resolvedRole = ParticipantRole::Investor;
            } elseif ($normalized === 'professional') {
                $resolvedRole = ParticipantRole::Professional;
            } else {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }
        } elseif ($hasInvestor) {
            if ($roleParam !== null && strtolower(trim($roleParam)) !== 'investor') {
                throw new HttpException(403, 'User does not possess the requested role.');
            }
            $resolvedRole = ParticipantRole::Investor;
        } else {
            if ($roleParam !== null && strtolower(trim($roleParam)) !== 'professional') {
                throw new HttpException(403, 'User does not possess the requested role.');
            }
            $resolvedRole = ParticipantRole::Professional;
        }

        // Validate business published status
        $isOwner = $business->founderProfile && $business->founderProfile->user_id === $user->id;
        if (! $isOwner && $business->status !== BusinessStatus::Submitted) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }

        // Founders cannot express interest in their own business
        if ($isOwner) {
            throw new HttpException(403, 'Founders cannot express interest in their own business.');
        }

        return DB::transaction(function () use ($business, $user, $resolvedRole) {
            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($relationship === null) {
                $relationship = new BusinessDisclosureRelationship;
                $relationship->business_id = $business->id;
                $relationship->counterparty_user_id = $user->id;
                $relationship->counterparty_role = $resolvedRole;
                $relationship->stage = DisclosureStage::Extended;
                $relationship->interest_expressed_at = now();
                $relationship->save();
            } else {
                // If currently at Teaser stage, advance to Extended
                if ($relationship->stage === DisclosureStage::Teaser) {
                    $relationship->stage = DisclosureStage::Extended;
                    $relationship->interest_expressed_at = now();
                    $relationship->counterparty_role = $resolvedRole;
                    $relationship->save();
                }
            }

            return $relationship;
        });
    }
}
