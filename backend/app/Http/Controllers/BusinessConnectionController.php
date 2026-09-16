<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\User;
use App\Services\Connection\ConnectionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BusinessConnectionController extends Controller
{
    public function index(Request $request, ConnectionService $service): JsonResponse
    {
        $data = $request->validate(['role' => ['nullable', 'string'], 'page' => ['sometimes', 'integer', 'min:1']]);
        return ApiResponse::success($service->listForParticipant($request->user(), $data['role'] ?? null, $data['page'] ?? 1));
    }

    /**
     * Express interest in a business relationship (Founder expresses to counterparty, or Counterparty reciprocates).
     */
    public function expressInterest(Request $request, string $business, ConnectionService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;

        if ($isOwner) {
            $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id') ?? $request->input('user_id');
            if ($targetId === null || trim((string) $targetId) === '') {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Target counterparty user ID is required.'],
                ]);
            }

            $counterparty = User::find($targetId);
            if ($counterparty === null) {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Invalid counterparty user specified.'],
                ]);
            }

            $roleParam = $request->input('role') ?? $request->query('role') ?? $request->input('counterparty_role');
            $result = $service->expressFounderInterest($businessModel, $user, $counterparty, is_string($roleParam) ? $roleParam : null);

            return ApiResponse::success(
                $this->formatConnectionResponse($result),
                'Interest expressed successfully.'
            );
        }

        $roleParam = $request->input('role') ?? $request->query('role');
        $result = $service->expressReciprocalInterest($businessModel, $user, is_string($roleParam) ? $roleParam : null);

        return ApiResponse::success(
            $this->formatConnectionResponse($result),
            'Reciprocal interest expressed successfully.'
        );
    }

    /**
     * Express founder interest toward a target counterparty.
     */
    public function expressFounderInterest(Request $request, string $business, ConnectionService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id') ?? $request->input('user_id');
        if ($targetId === null || trim((string) $targetId) === '') {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Target counterparty user ID is required.'],
            ]);
        }

        $counterparty = User::find($targetId);
        if ($counterparty === null) {
            throw ValidationException::withMessages([
                'counterparty_user_id' => ['Invalid counterparty user specified.'],
            ]);
        }

        $roleParam = $request->input('role') ?? $request->query('role') ?? $request->input('counterparty_role');
        $result = $service->expressFounderInterest($businessModel, $user, $counterparty, is_string($roleParam) ? $roleParam : null);

        return ApiResponse::success(
            $this->formatConnectionResponse($result),
            'Interest expressed successfully.'
        );
    }

    /**
     * Express counterparty reciprocal interest for a business.
     */
    public function expressReciprocalInterest(Request $request, string $business, ConnectionService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $roleParam = $request->input('role') ?? $request->query('role');
        $result = $service->expressReciprocalInterest($businessModel, $user, is_string($roleParam) ? $roleParam : null);

        return ApiResponse::success(
            $this->formatConnectionResponse($result),
            'Reciprocal interest expressed successfully.'
        );
    }

    /**
     * Get the connection and interest status for the business relationship.
     */
    public function status(Request $request, string $business, ConnectionService $service): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner && $businessModel->status !== BusinessStatus::Submitted) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business]);
        }

        $targetCounterparty = null;
        if ($isOwner) {
            $targetId = $request->input('counterparty_user_id') ?? $request->query('counterparty_user_id') ?? $request->input('user_id');
            if ($targetId === null || trim((string) $targetId) === '') {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Target counterparty user ID is required for founder requests.'],
                ]);
            }

            $targetCounterparty = User::find($targetId);
            if ($targetCounterparty === null) {
                throw ValidationException::withMessages([
                    'counterparty_user_id' => ['Invalid counterparty user specified.'],
                ]);
            }
        }

        $roleParam = $request->input('role') ?? $request->query('role');
        $result = $service->getStatus(
            $businessModel,
            $user,
            $targetCounterparty,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatConnectionResponse($result)
        );
    }

    /**
     * Format deterministic and safe connection/interest response.
     */
    private function formatConnectionResponse(array $result): array
    {
        $founderInterest = $result['founder_interest'] ?? null;
        $counterpartyInterest = $result['counterparty_interest'] ?? null;
        $connection = $result['connection'] ?? null;

        return [
            'business_id' => (int) $result['business_id'],
            'founder_user_id' => $result['founder_user_id'] ?? null,
            'counterparty_user_id' => $result['counterparty_user_id'] ?? null,
            'counterparty_role' => $result['counterparty_role']?->value ?? (string) $result['counterparty_role'],
            'has_founder_interest' => $founderInterest !== null,
            'founder_interest_expressed_at' => $founderInterest?->expressed_at?->toISOString(),
            'has_counterparty_interest' => $counterpartyInterest !== null,
            'counterparty_interest_expressed_at' => $counterpartyInterest?->expressed_at?->toISOString(),
            'is_mutual' => (bool) ($result['is_mutual'] ?? false),
            'is_connected' => $connection !== null,
            'connection_id' => $connection?->id,
            'connected_at' => $connection?->created_at?->toISOString(),
        ];
    }
}
