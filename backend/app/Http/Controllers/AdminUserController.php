<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminUserController extends Controller
{
    /**
     * List all platform users with administrative filters, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'adminAccess']);

        // Search by name or email
        if ($request->filled('q')) {
            $searchTerm = trim((string) $request->query('q'));
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by participant role
        if ($request->filled('role')) {
            $roleInput = trim((string) $request->query('role'));
            $roleEnum = ParticipantRole::tryFrom($roleInput);
            if ($roleEnum !== null) {
                $query->whereHas('roles', function ($q) use ($roleEnum) {
                    $q->where('role', $roleEnum->value);
                });
            }
        }

        // Filter by verification tier
        if ($request->has('verification_tier') && $request->query('verification_tier') !== null && $request->query('verification_tier') !== '') {
            $tierInput = (int) $request->query('verification_tier');
            if (in_array($tierInput, [0, 1, 2], true)) {
                $query->where('verification_tier', $tierInput);
            }
        }

        $hasSuspensionColumn = Schema::hasColumn('users', 'suspended_at');

        // Filter by account status (active vs suspended)
        if ($request->filled('status') && $hasSuspensionColumn) {
            $statusInput = strtolower(trim((string) $request->query('status')));
            if ($statusInput === 'suspended') {
                $query->whereNotNull('suspended_at');
            } elseif ($statusInput === 'active') {
                $query->whereNull('suspended_at');
            }
        }

        // Pagination
        $perPage = (int) $request->query('per_page', 25);
        $perPage = min(100, max(1, $perPage));

        $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

        $items = collect($paginator->items())->map(function (User $user) use ($hasSuspensionColumn) {
            $roles = $user->roles->pluck('role')->map(function ($r) {
                return $r instanceof ParticipantRole ? $r->value : (string) $r;
            })->values()->all();

            $tierEnum = $user->verification_tier instanceof VerificationTier
                ? $user->verification_tier
                : VerificationTier::tryFrom((int) $user->verification_tier) ?? VerificationTier::Tier0;

            $isSuspended = $hasSuspensionColumn && ! is_null($user->suspended_at);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_admin' => $user->hasAdminAccess(),
                'roles' => $roles,
                'verification_tier' => $tierEnum->value,
                'verification_tier_label' => $tierEnum->label(),
                'status' => $isSuspended ? 'suspended' : 'active',
                'status_label' => $isSuspended ? 'Suspended' : 'Active',
                'is_suspended' => $isSuspended,
                'suspended_at' => $hasSuspensionColumn ? $user->suspended_at?->toISOString() : null,
                'suspension_reason' => $hasSuspensionColumn ? $user->suspension_reason : null,
                'email_verified' => ! is_null($user->email_verified_at),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'phone_verified' => ! is_null($user->phone_verified_at),
                'phone_verified_at' => $user->phone_verified_at?->toISOString(),
                'created_at' => $user->created_at?->toISOString(),
            ];
        })->all();

        return ApiResponse::success([
            'users' => $items,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Users retrieved successfully.');
    }
}
