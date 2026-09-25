<?php

namespace App\Services\Reputation;

use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\Deal;
use App\Models\DealFeedback;
use App\Models\DealMilestone;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ReputationService
{
    /**
     * Cache TTL for reputation summaries (5 minutes = 300 seconds).
     */
    public const CACHE_TTL_SECONDS = 300;

    /**
     * Generate the cache key for a user and role.
     */
    public function getCacheKey(int $userId, ParticipantRole $role): string
    {
        return "reputation:user:{$userId}:role:{$role->value}";
    }

    /**
     * Invalidate cached reputation for a user across one or all roles.
     */
    public function invalidateReputationCache(int|User $user, ?ParticipantRole $role = null): void
    {
        $userId = $user instanceof User ? $user->id : $user;

        if ($role !== null) {
            Cache::forget($this->getCacheKey($userId, $role));
        } else {
            foreach (ParticipantRole::cases() as $r) {
                Cache::forget($this->getCacheKey($userId, $r));
            }
        }
    }

    /**
     * Retrieve the structured reputation track record summary for a user in a specific role.
     *
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function getReputationSummary(User $user, ParticipantRole|string $role): array
    {
        $roleEnum = $role instanceof ParticipantRole ? $role : ParticipantRole::tryFrom($role);
        if ($roleEnum === null) {
            throw ValidationException::withMessages([
                'role' => ['Invalid or unsupported role for reputation.'],
            ]);
        }

        $cacheKey = $this->getCacheKey($user->id, $roleEnum);

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($user, $roleEnum) {
            return $this->computeReputationSummary($user, $roleEnum);
        });
    }

    /**
     * Canonical reputation computation with optimized query batching.
     *
     * @return array<string, mixed>
     */
    public function computeReputationSummary(User $user, ParticipantRole $roleEnum): array
    {
        $tierValue = $user->verification_tier?->value ?? (int) $user->verification_tier;

        // 1. Deals query scoped to role
        $completedDealsQuery = Deal::where('stage', DealStage::Completed);
        if ($roleEnum === ParticipantRole::Founder) {
            $completedDealsQuery->where('founder_user_id', $user->id);
        } else {
            $completedDealsQuery->where('counterparty_user_id', $user->id)
                ->where('counterparty_role', $roleEnum);
        }

        $completedDealIds = $completedDealsQuery->pluck('id')->all();
        $completedDealsCount = count($completedDealIds);

        // 2. Funded milestones and simulated BDT on completed deals
        $completedMilestonesCount = 0;
        $totalReleasedBdt = 0.0;

        if ($completedDealsCount > 0) {
            $milestoneStats = DealMilestone::whereIn('deal_id', $completedDealIds)
                ->where('status', 'funded')
                ->selectRaw('COUNT(*) as count, COALESCE(SUM(target_amount), 0) as total')
                ->first();

            $completedMilestonesCount = (int) ($milestoneStats?->count ?? 0);
            $totalReleasedBdt = (float) ($milestoneStats?->total ?? 0.0);
        }

        // 3. Feedback aggregations & recent reviews
        $feedbackStats = DealFeedback::where('recipient_user_id', $user->id)
            ->where('recipient_role', $roleEnum->value)
            ->selectRaw('COUNT(*) as count, AVG(rating) as avg_rating')
            ->first();

        $ratingsCount = (int) ($feedbackStats?->count ?? 0);
        $avgRating = $ratingsCount > 0 ? (float) $feedbackStats?->avg_rating : null;

        $recentReviews = [];
        if ($ratingsCount > 0) {
            $recentReviews = DealFeedback::where('recipient_user_id', $user->id)
                ->where('recipient_role', $roleEnum->value)
                ->with(['reviewer', 'deal.business'])
                ->latest()
                ->take(10)
                ->get()
                ->map(function (DealFeedback $fb) {
                    return [
                        'id' => $fb->id,
                        'deal_id' => $fb->deal_id,
                        'reviewer_name' => $fb->reviewer?->name ?? 'Verified Counterparty',
                        'reviewer_role' => $fb->reviewer_role->value,
                        'business_name' => $fb->deal?->business?->name,
                        'rating' => $fb->rating,
                        'comment' => $fb->comment,
                        'submitted_at' => $fb->created_at?->toISOString(),
                    ];
                })
                ->values()
                ->all();
        }

        // 4. Profile evidence per role
        $profileEvidence = $this->resolveProfileEvidence($user, $roleEnum);

        $summary = [
            'user_id' => $user->id,
            'role' => $roleEnum->value,
            'verification' => [
                'tier' => $tierValue,
                'is_identity_verified' => $tierValue >= 1,
                'is_track_record_verified' => $tierValue >= 2,
            ],
            'track_record' => [
                'completed_deals_count' => $completedDealsCount,
                'completed_milestones_count' => $completedMilestonesCount,
                'total_simulated_bdt' => number_format($totalReleasedBdt, 2, '.', ''),
            ],
            'feedback' => [
                'reviews_count' => $ratingsCount,
                'average_rating' => $avgRating !== null ? round($avgRating, 2) : null,
                'reviews' => $recentReviews,
            ],
            'profile_evidence' => $profileEvidence,
        ];

        // 5. Founder financial transparency
        if ($roleEnum === ParticipantRole::Founder) {
            $reportStats = FinancialReport::where('submitted_by_user_id', $user->id)
                ->selectRaw('
                    COUNT(*) as total_count,
                    COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as verified_count,
                    COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM financial_report_evidence WHERE financial_report_evidence.financial_report_id = financial_reports.id) THEN 1 ELSE 0 END), 0) as evidence_count
                ', [FinancialVerificationStatus::Verified->value])
                ->first();

            $submittedCount = (int) ($reportStats?->total_count ?? 0);
            $verifiedCount = (int) ($reportStats?->verified_count ?? 0);
            $evidenceBackedCount = (int) ($reportStats?->evidence_count ?? 0);

            $activeDiscrepanciesCount = 0;
            if ($submittedCount > 0) {
                $activeDiscrepanciesCount = FinancialDiscrepancyReport::whereHas('financialReport', function ($q) use ($user) {
                    $q->where('submitted_by_user_id', $user->id);
                })->where('status', FinancialDiscrepancyStatus::UnderReview)->count();
            }

            $summary['financial_transparency'] = [
                'submitted_reports_count' => $submittedCount,
                'verified_reports_count' => $verifiedCount,
                'evidence_backed_reports_count' => $evidenceBackedCount,
                'active_discrepancies_count' => $activeDiscrepanciesCount,
            ];
        }

        return $summary;
    }

    /**
     * Submit bilateral feedback for a completed deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function submitDealFeedback(
        Deal $deal,
        User $reviewer,
        int $rating,
        ?string $comment = null,
        ?string $roleParam = null
    ): DealFeedback {
        $this->enforceDealParticipant($deal, $reviewer, $roleParam);

        if ($deal->stage !== DealStage::Completed) {
            throw ValidationException::withMessages([
                'deal' => ['Feedback can only be submitted for completed deals. Current stage: '.$deal->stage->label().'.'],
            ]);
        }

        if ($rating < 1 || $rating > 5) {
            throw ValidationException::withMessages([
                'rating' => ['Rating must be an integer between 1 and 5.'],
            ]);
        }

        // Determine reviewer and recipient roles
        if ($reviewer->id === $deal->founder_user_id) {
            $reviewerRole = ParticipantRole::Founder;
            $recipientUserId = $deal->counterparty_user_id;
            $recipientRole = $deal->counterparty_role;
        } else {
            $reviewerRole = $deal->counterparty_role;
            $recipientUserId = $deal->founder_user_id;
            $recipientRole = ParticipantRole::Founder;
        }

        // Check if already submitted
        $existing = DealFeedback::where('deal_id', $deal->id)
            ->where('reviewer_user_id', $reviewer->id)
            ->first();

        if ($existing !== null) {
            throw ValidationException::withMessages([
                'feedback' => ['Feedback has already been submitted for this deal.'],
            ]);
        }

        $feedback = DB::transaction(function () use ($deal, $reviewer, $reviewerRole, $recipientUserId, $recipientRole, $rating, $comment) {
            return DealFeedback::create([
                'deal_id' => $deal->id,
                'reviewer_user_id' => $reviewer->id,
                'reviewer_role' => $reviewerRole,
                'recipient_user_id' => $recipientUserId,
                'recipient_role' => $recipientRole,
                'rating' => $rating,
                'comment' => $comment ? trim($comment) : null,
            ]);
        });

        // Invalidate reputation cache for both parties
        $this->invalidateReputationCache($recipientUserId, $recipientRole);
        $this->invalidateReputationCache($reviewer->id, $reviewerRole);

        return $feedback;
    }

    /**
     * Retrieve feedback status for a deal.
     *
     * @return array<string, mixed>
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getDealFeedbackStatus(Deal $deal, User $user, ?string $roleParam = null): array
    {
        app(\App\Services\Deal\DealAccessService::class)->view($deal, $user, $roleParam);

        $feedbacks = DealFeedback::where('deal_id', $deal->id)->get();

        $founderFeedback = $feedbacks->firstWhere('reviewer_user_id', $deal->founder_user_id);
        $counterpartyFeedback = $feedbacks->firstWhere('reviewer_user_id', $deal->counterparty_user_id);

        $hasSubmitted = $feedbacks->contains('reviewer_user_id', $user->id);

        return [
            'deal_id' => $deal->id,
            'deal_stage' => $deal->stage->value,
            'can_submit_feedback' => ! $user->hasAdminAccess() && $deal->stage === DealStage::Completed && ! $hasSubmitted,
            'has_submitted_feedback' => $hasSubmitted,
            'founder_feedback_submitted' => $founderFeedback !== null,
            'counterparty_feedback_submitted' => $counterpartyFeedback !== null,
            'reviews' => $feedbacks->map(fn (DealFeedback $fb) => [
                'id' => $fb->id,
                'reviewer_user_id' => $fb->reviewer_user_id,
                'reviewer_role' => $fb->reviewer_role->value,
                'recipient_user_id' => $fb->recipient_user_id,
                'recipient_role' => $fb->recipient_role->value,
                'rating' => $fb->rating,
                'comment' => $fb->comment,
                'submitted_at' => $fb->created_at?->toISOString(),
            ])->values()->all(),
        ];
    }

    /**
     * Resolve profile evidence for a given user role.
     *
     * @return array<string, mixed>
     */
    private function resolveProfileEvidence(User $user, ParticipantRole $role): array
    {
        if ($role === ParticipantRole::Founder) {
            $profile = $user->founderProfile;
            $businesses = $profile ? $profile->businesses()->get(['id', 'name', 'industry', 'business_stage', 'location', 'status']) : collect();

            return [
                'businesses_count' => $businesses->count(),
                'businesses' => $businesses->map(fn (Business $b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'industry' => $b->industry,
                    'stage' => $b->business_stage,
                    'location' => $b->location,
                    'status' => $b->status,
                ])->values()->all(),
            ];
        }

        if ($role === ParticipantRole::Investor) {
            $profile = $user->investorProfile;
            $pref = $profile?->preferences;

            return [
                'industry' => $pref?->industry,
                'investment_types' => $pref?->investment_types ?? [],
                'minimum_investment_bdt' => $pref?->minimum_investment,
                'maximum_investment_bdt' => $pref?->maximum_investment,
                'location' => $pref?->location,
            ];
        }

        if ($role === ParticipantRole::Professional) {
            $profile = $user->professionalProfile;

            return [
                'skills' => $profile?->skills()->pluck('name')->all() ?? [],
                'experience_level' => $profile?->experience_level,
                'industry_experience' => $profile?->industry_experience ?? [],
                'availability' => $profile?->availability,
                'location' => $profile?->location,
            ];
        }

        return [];
    }

    /**
     * Enforce participant authorization on a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealParticipant(Deal $deal, User $user, ?string $roleParam = null): void
    {
        app(\App\Services\Deal\DealAccessService::class)->participant($deal, $user, $roleParam);
    }
}

