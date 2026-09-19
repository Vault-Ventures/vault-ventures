<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'roles',
            'adminAccess',
            'suspendedBy',
            'latestVerificationRequest',
            'founderProfile',
            'investorProfile',
            'professionalProfile',
        ]);

        // Search query (name, email, phone)
        $search = trim((string) ($request->query('search') ?? $request->query('q') ?? ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Role filter
        $role = $request->query('role');
        if ($role && $role !== 'all') {
            if ($role === 'admin') {
                $query->whereHas('adminAccess');
            } else {
                $roleEnum = ParticipantRole::tryFrom($role);
                $roleVal = $roleEnum ? $roleEnum->value : $role;
                $query->whereHas('roles', fn ($q) => $q->where('role', $roleVal));
            }
        }

        // Verification tier filter
        $tier = $request->query('verification_tier') ?? $request->query('tier');
        if ($tier !== null && $tier !== '' && $tier !== 'all') {
            if (is_numeric($tier)) {
                $query->where('verification_tier', (int) $tier);
            } elseif (str_starts_with((string) $tier, 'tier_')) {
                $tierNum = (int) str_replace('tier_', '', (string) $tier);
                $query->where('verification_tier', $tierNum);
            }
        }

        // Account status filter
        $status = $request->query('status');
        if ($status === 'active') {
            $query->whereNull('suspended_at');
        } elseif ($status === 'suspended') {
            $query->whereNotNull('suspended_at');
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = strtolower((string) $request->query('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'email', 'verification_tier', 'created_at', 'suspended_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(fn (User $user) => $this->formatUserListItem($user))->values()->all();

        return ApiResponse::success([
            'users' => $items,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Admin users retrieved successfully.');
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $user->load([
            'roles',
            'adminAccess',
            'suspendedBy',
            'founderProfile',
            'investorProfile',
            'professionalProfile',
            'verificationRequests',
        ]);

        return ApiResponse::success($this->formatUserDetail($user), 'User details retrieved successfully.');
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return ApiResponse::error('Administrators cannot suspend their own account.', 'FORBIDDEN', 403);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
            'suspension_reason' => 'nullable|string|max:1000',
        ]);

        $reason = $validated['reason'] ?? $validated['suspension_reason'] ?? null;

        $user->suspended_at = now();
        $user->suspension_reason = $reason;
        $user->suspended_by_user_id = $request->user()->id;
        $user->save();

        $user->load(['roles', 'adminAccess', 'suspendedBy', 'founderProfile', 'investorProfile', 'professionalProfile', 'verificationRequests']);

        return ApiResponse::success($this->formatUserDetail($user), 'User account suspended successfully.');
    }

    public function restore(Request $request, User $user): JsonResponse
    {
        $user->suspended_at = null;
        $user->suspension_reason = null;
        $user->suspended_by_user_id = null;
        $user->save();

        $user->load(['roles', 'adminAccess', 'suspendedBy', 'founderProfile', 'investorProfile', 'professionalProfile', 'verificationRequests']);

        return ApiResponse::success($this->formatUserDetail($user), 'User account restored successfully.');
    }

    private function formatUserListItem(User $user): array
    {
        $tierVal = $user->verification_tier instanceof VerificationTier
            ? $user->verification_tier->value
            : (int) $user->verification_tier;

        $roles = $user->roles->pluck('role')->all();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'phone_verified_at' => $user->phone_verified_at?->toIso8601String(),
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'avatar_url' => $user->avatar_url,
            'headline' => $user->headline,
            'location' => $user->location,
            'verification_tier' => $tierVal,
            'is_suspended' => $user->isSuspended(),
            'suspended_at' => $user->suspended_at?->toIso8601String(),
            'suspension_reason' => $user->suspension_reason,
            'suspended_by' => $user->suspendedBy ? [
                'id' => $user->suspendedBy->id,
                'name' => $user->suspendedBy->name,
                'email' => $user->suspendedBy->email,
            ] : null,
            'roles' => $roles,
            'is_admin' => $user->hasAdminAccess(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'latest_verification_request' => $user->latestVerificationRequest ? [
                'id' => $user->latestVerificationRequest->id,
                'requested_tier' => $user->latestVerificationRequest->requested_tier instanceof VerificationTier
                    ? $user->latestVerificationRequest->requested_tier->value
                    : (int) $user->latestVerificationRequest->requested_tier,
                'status' => $user->latestVerificationRequest->status instanceof \BackedEnum
                    ? $user->latestVerificationRequest->status->value
                    : (string) $user->latestVerificationRequest->status,
                'submitted_at' => $user->latestVerificationRequest->submitted_at?->toIso8601String(),
            ] : null,
        ];
    }

    private function formatUserDetail(User $user): array
    {
        $base = $this->formatUserListItem($user);

        $base['bio'] = $user->bio;
        $base['cover_photo_url'] = $user->cover_photo_url;
        $base['experience'] = $user->experience ?? [];
        $base['portfolio'] = $user->portfolio ?? [];
        $base['preferences'] = $user->preferences ?? (object) [];

        $base['profiles'] = [
            'founder' => $user->founderProfile ? [
                'id' => $user->founderProfile->id,
                'bio' => $user->founderProfile->bio ?? null,
            ] : null,
            'investor' => $user->investorProfile ? [
                'id' => $user->investorProfile->id,
                'investment_capacity' => $user->investorProfile->investment_capacity ?? null,
            ] : null,
            'professional' => $user->professionalProfile ? [
                'id' => $user->professionalProfile->id,
                'skills' => $user->professionalProfile->skills ?? [],
                'experience_level' => $user->professionalProfile->experience_level ?? null,
                'location' => $user->professionalProfile->location ?? null,
                'availability' => $user->professionalProfile->availability ?? null,
            ] : null,
        ];

        $base['verification_requests'] = $user->verificationRequests
            ? $user->verificationRequests->sortByDesc('created_at')->map(fn ($vr) => [
                'id' => $vr->id,
                'requested_tier' => $vr->requested_tier instanceof VerificationTier ? $vr->requested_tier->value : (int) $vr->requested_tier,
                'status' => $vr->status instanceof \BackedEnum ? $vr->status->value : (string) $vr->status,
                'submitted_at' => $vr->submitted_at?->toIso8601String(),
                'reviewed_at' => $vr->reviewed_at?->toIso8601String(),
                'rejection_reason' => $vr->rejection_reason,
            ])->values()->all()
            : [];

        return $base;
    }
}
