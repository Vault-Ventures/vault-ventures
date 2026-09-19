<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Enums\ParticipantRole;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessApplication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BusinessApplicationController extends Controller
{
    /**
     * Professional applies to a business.
     */
    public function apply(Request $request, string $businessId): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasRole(ParticipantRole::Professional)) {
            return ApiResponse::error(
                'Only users with the Professional role can submit applications.',
                'FORBIDDEN_ROLE',
                403
            );
        }

        $business = Business::with(['founderProfile.user'])->findOrFail($businessId);

        // Check if business is eligible (published, approved, or submitted)
        if ($business->status !== BusinessStatus::Published && $business->status !== BusinessStatus::Approved && $business->status !== BusinessStatus::Submitted) {
            return ApiResponse::error(
                'This business is not currently accepting applications.',
                'BUSINESS_NOT_ELIGIBLE',
                422
            );
        }

        $founderUserId = $business->founderProfile?->user_id;
        if ($founderUserId === $user->id) {
            return ApiResponse::error(
                'You cannot apply to your own business.',
                'CANNOT_APPLY_TO_OWN_BUSINESS',
                422
            );
        }

        // Check for existing active application
        $existing = BusinessApplication::where('business_id', $business->id)
            ->where('professional_user_id', $user->id)
            ->whereIn('status', ['submitted', 'under_review', 'accepted'])
            ->first();

        if ($existing) {
            return ApiResponse::error(
                'You already have an active application for this business.',
                'DUPLICATE_APPLICATION',
                422,
                ['existing_status' => $existing->status]
            );
        }

        $validated = $request->validate([
            'role_title' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:3000'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:100'],
        ]);

        $application = BusinessApplication::create([
            'business_id' => $business->id,
            'professional_user_id' => $user->id,
            'founder_user_id' => $founderUserId,
            'status' => 'submitted',
            'role_title' => $validated['role_title'] ?? 'Professional Advisor',
            'note' => $validated['note'] ?? null,
            'skills' => $validated['skills'] ?? null,
        ]);

        $application->load(['business', 'founder']);

        return ApiResponse::success([
            'id' => $application->id,
            'business_id' => $business->id,
            'business_name' => $business->name,
            'status' => $application->status,
            'role_title' => $application->role_title,
            'note' => $application->note,
            'skills' => $application->skills,
            'created_at' => $application->created_at->toISOString(),
        ], 'Application submitted successfully.', 201);
    }

    /**
     * Check if current user has an application for this business.
     */
    public function statusForBusiness(Request $request, string $businessId): JsonResponse
    {
        $user = $request->user();
        $business = Business::findOrFail($businessId);

        $application = BusinessApplication::where('business_id', $business->id)
            ->where('professional_user_id', $user->id)
            ->latest('id')
            ->first();

        return ApiResponse::success([
            'has_applied' => $application !== null,
            'status' => $application?->status ?? 'none',
            'application' => $application ? [
                'id' => $application->id,
                'status' => $application->status,
                'role_title' => $application->role_title,
                'applied_at' => $application->created_at->toISOString(),
                'reviewed_at' => $application->reviewed_at?->toISOString(),
                'responded_at' => $application->responded_at?->toISOString(),
            ] : null,
        ]);
    }

    /**
     * Professional lists their submitted applications.
     */
    public function listProfessionalApplications(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasRole(ParticipantRole::Professional)) {
            return ApiResponse::error(
                'Only professionals can access application tracker.',
                'FORBIDDEN_ROLE',
                403
            );
        }

        $query = BusinessApplication::query()
            ->where('professional_user_id', $user->id)
            ->with(['business.founderProfile.user', 'founder']);

        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($search = trim((string) $request->input('search', ''))) {
            $query->whereHas('business', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $applications = $query->orderBy('created_at', 'desc')->get();

        $items = $applications->map(function (BusinessApplication $app) {
            $business = $app->business;

            $timeline = [
                ['action' => 'Application submitted', 'ts' => $app->created_at->toISOString()],
            ];

            if ($app->reviewed_at) {
                $timeline[] = ['action' => 'Under review by founder', 'ts' => $app->reviewed_at->toISOString()];
            }

            if ($app->responded_at) {
                if ($app->status === 'accepted') {
                    $timeline[] = ['action' => 'Application accepted', 'ts' => $app->responded_at->toISOString()];
                } elseif ($app->status === 'rejected') {
                    $timeline[] = ['action' => 'Application not selected', 'ts' => $app->responded_at->toISOString()];
                }
            }

            return [
                'id' => $app->id,
                'business_id' => $business->id,
                'business' => $business->name,
                'business_logo_url' => $business->logo_url,
                'business_initials' => strtoupper(substr($business->name, 0, 2)),
                'industry' => $business->industry ?? 'Technology',
                'opportunity' => $app->role_title ?? 'Professional Advisor',
                'role' => $app->role_title ?? 'Professional Advisor',
                'applied_date' => $app->created_at->toISOString(),
                'last_updated' => $app->updated_at->toISOString(),
                'status' => $app->status,
                'timeline' => $timeline,
                'note' => $app->note,
                'skills' => $app->skills ?? [],
                'rejection_reason' => $app->rejection_reason,
            ];
        });

        return ApiResponse::success($items);
    }

    /**
     * Professional withdraws a submitted or under-review application.
     */
    public function withdraw(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $application = BusinessApplication::where('id', $id)
            ->where('professional_user_id', $user->id)
            ->firstOrFail();

        if (! in_array($application->status, ['submitted', 'under_review'], true)) {
            return ApiResponse::error(
                "Cannot withdraw an application that is already {$application->status}.",
                'INVALID_STATE_TRANSITION',
                422
            );
        }

        $application->status = 'withdrawn';
        $application->save();

        return ApiResponse::success([
            'id' => $application->id,
            'status' => $application->status,
        ], 'Application withdrawn successfully.');
    }

    /**
     * Founder lists incoming applications for businesses they own.
     */
    public function listFounderApplications(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasRole(ParticipantRole::Founder)) {
            return ApiResponse::error(
                'Only founders can access application inbox.',
                'FORBIDDEN_ROLE',
                403
            );
        }

        // Get founder's business IDs
        $businessIds = Business::whereHas('founderProfile', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->pluck('id')->all();

        if (empty($businessIds)) {
            return ApiResponse::success([]);
        }

        $query = BusinessApplication::query()
            ->whereIn('business_id', $businessIds)
            ->with([
                'business',
                'professional.roles',
                'professional.professionalProfile.skills',
            ]);

        if ($businessId = $request->input('business_id')) {
            $query->where('business_id', $businessId);
        }

        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('professional', function ($userQ) use ($search) {
                    $userQ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('business', function ($bizQ) use ($search) {
                    $bizQ->where('name', 'like', "%{$search}%");
                })->orWhere('role_title', 'like', "%{$search}%");
            });
        }

        $applications = $query->orderBy('created_at', 'desc')->get();

        $items = $applications->map(function (BusinessApplication $app) {
            $prof = $app->professional;
            $profProfile = $prof?->professionalProfile;
            $skills = $profProfile?->skills?->pluck('name')->all() ?? ($app->skills ?? []);

            $timeline = [
                ['action' => 'Application submitted', 'ts' => $app->created_at->toISOString()],
            ];
            if ($app->reviewed_at) {
                $timeline[] = ['action' => 'Marked under review', 'ts' => $app->reviewed_at->toISOString()];
            }
            if ($app->responded_at) {
                if ($app->status === 'accepted') {
                    $timeline[] = ['action' => 'Accepted', 'ts' => $app->responded_at->toISOString()];
                } elseif ($app->status === 'rejected') {
                    $timeline[] = ['action' => 'Rejected', 'ts' => $app->responded_at->toISOString()];
                }
            }

            return [
                'id' => $app->id,
                'business_id' => $app->business_id,
                'business_name' => $app->business?->name,
                'business_logo_url' => $app->business?->logo_url,
                'professional' => [
                    'id' => $prof->id,
                    'name' => $prof->name,
                    'email' => $prof->email,
                    'avatar_url' => $prof->avatar_url,
                    'initials' => strtoupper(substr($prof->name, 0, 2)),
                    'verification_tier' => $prof->verification_tier instanceof \App\Enums\VerificationTier
                        ? $prof->verification_tier->value
                        : (int) ($prof->verification_tier ?? 0),
                    'headline' => $prof->headline ?? $profProfile?->title ?? 'Skilled Professional',
                    'bio' => $prof->bio ?? $profProfile?->bio,
                    'location' => $prof->location ?? $profProfile?->location,
                    'experience_years' => $profProfile?->experience_years ?? 0,
                    'skills' => $skills,
                    'hourly_rate' => $profProfile?->hourly_rate,
                ],
                'status' => $app->status,
                'role_title' => $app->role_title ?? 'Professional Advisor',
                'note' => $app->note,
                'applied_at' => $app->created_at->toISOString(),
                'reviewed_at' => $app->reviewed_at?->toISOString(),
                'responded_at' => $app->responded_at?->toISOString(),
                'rejection_reason' => $app->rejection_reason,
                'timeline' => $timeline,
            ];
        });

        return ApiResponse::success($items);
    }

    /**
     * Founder views a single application detail.
     */
    public function showFounderApplication(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $application = BusinessApplication::with([
            'business.founderProfile',
            'professional.roles',
            'professional.professionalProfile.skills',
        ])->findOrFail($id);

        $this->authorizeFounderAccess($application, $user);

        $prof = $application->professional;
        $profProfile = $prof?->professionalProfile;
        $skills = $profProfile?->skills?->pluck('name')->all() ?? ($application->skills ?? []);

        return ApiResponse::success([
            'id' => $application->id,
            'business_id' => $application->business_id,
            'business_name' => $application->business?->name,
            'business_logo_url' => $application->business?->logo_url,
            'professional' => [
                'id' => $prof->id,
                'name' => $prof->name,
                'email' => $prof->email,
                'avatar_url' => $prof->avatar_url,
                'initials' => strtoupper(substr($prof->name, 0, 2)),
                'verification_tier' => $prof->verification_tier instanceof \App\Enums\VerificationTier
                    ? $prof->verification_tier->value
                    : (int) ($prof->verification_tier ?? 0),
                'headline' => $prof->headline ?? $profProfile?->title ?? 'Skilled Professional',
                'bio' => $prof->bio ?? $profProfile?->bio,
                'location' => $prof->location ?? $profProfile?->location,
                'experience_years' => $profProfile?->experience_years ?? 0,
                'skills' => $skills,
                'hourly_rate' => $profProfile?->hourly_rate,
            ],
            'status' => $application->status,
            'role_title' => $application->role_title,
            'note' => $application->note,
            'applied_at' => $application->created_at->toISOString(),
            'reviewed_at' => $application->reviewed_at?->toISOString(),
            'responded_at' => $application->responded_at?->toISOString(),
            'rejection_reason' => $application->rejection_reason,
        ]);
    }

    /**
     * Founder marks application as under review.
     */
    public function markUnderReview(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $application = BusinessApplication::with('business.founderProfile')->findOrFail($id);
        $this->authorizeFounderAccess($application, $user);

        if ($application->status !== 'submitted') {
            return ApiResponse::error(
                "Cannot mark application as under review from {$application->status}.",
                'INVALID_STATE_TRANSITION',
                422
            );
        }

        $application->status = 'under_review';
        $application->reviewed_at = now();
        $application->save();

        return ApiResponse::success([
            'id' => $application->id,
            'status' => $application->status,
            'reviewed_at' => $application->reviewed_at->toISOString(),
        ], 'Application marked under review.');
    }

    /**
     * Founder accepts application.
     */
    public function accept(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $application = BusinessApplication::with('business.founderProfile')->findOrFail($id);
        $this->authorizeFounderAccess($application, $user);

        if (! in_array($application->status, ['submitted', 'under_review'], true)) {
            return ApiResponse::error(
                "Cannot accept application in {$application->status} status.",
                'INVALID_STATE_TRANSITION',
                422
            );
        }

        $application->status = 'accepted';
        $application->responded_at = now();
        $application->save();

        return ApiResponse::success([
            'id' => $application->id,
            'status' => $application->status,
            'responded_at' => $application->responded_at->toISOString(),
        ], 'Application accepted.');
    }

    /**
     * Founder rejects application.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $application = BusinessApplication::with('business.founderProfile')->findOrFail($id);
        $this->authorizeFounderAccess($application, $user);

        if (! in_array($application->status, ['submitted', 'under_review'], true)) {
            return ApiResponse::error(
                "Cannot reject application in {$application->status} status.",
                'INVALID_STATE_TRANSITION',
                422
            );
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $application->status = 'rejected';
        $application->responded_at = now();
        $application->rejection_reason = $validated['reason'] ?? null;
        $application->save();

        return ApiResponse::success([
            'id' => $application->id,
            'status' => $application->status,
            'responded_at' => $application->responded_at->toISOString(),
            'rejection_reason' => $application->rejection_reason,
        ], 'Application rejected.');
    }

    /**
     * Ensure the user owns the business associated with this application.
     */
    protected function authorizeFounderAccess(BusinessApplication $application, User $user): void
    {
        if ($user->hasAdminAccess()) {
            return;
        }

        $ownerUserId = $application->founder_user_id ?? $application->business?->founderProfile?->user_id;

        if ($ownerUserId !== $user->id) {
            abort(403, 'You are not authorized to manage applications for this business.');
        }
    }
}
