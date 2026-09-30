<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\DealPayment;
use App\Services\Deal\PlatformRevenueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    /**
     * List all platform payments with administrative filters.
     */
    public function index(Request $request, PlatformRevenueService $service): JsonResponse
    {
        $user = $request->user();

        $paginator = $service->listPayments($user, $request->only([
            'status',
            'payment_method',
            'deal_id',
            'per_page',
        ]));

        return ApiResponse::success([
            'payments' => collect($paginator->items())->map(fn (DealPayment $p) => [
                'id' => $p->id,
                'deal_id' => $p->deal_id,
                'business_name' => $p->deal?->business?->name,
                'payer' => $p->payer ? [
                    'id' => $p->payer->id,
                    'name' => $p->payer->name,
                    'email' => $p->payer->email,
                ] : null,
                'receiver' => $p->receiver ? [
                    'id' => $p->receiver->id,
                    'name' => $p->receiver->name,
                    'email' => $p->receiver->email,
                ] : null,
                'amount' => (float) $p->amount,
                'currency' => $p->currency ?? 'BDT',
                'payment_method' => $p->payment_method->value,
                'payment_method_label' => $p->payment_method->label(),
                'transaction_reference' => $p->transaction_reference,
                'note' => $p->note,
                'status' => $p->status->value,
                'status_label' => $p->status->label(),
                'payment_date' => $p->payment_date?->format('Y-m-d'),
                'completed_at' => $p->completed_at?->toISOString(),
                'commission_rate' => $p->commission_rate !== null ? (float) $p->commission_rate : null,
                'commission_amount' => $p->commission_amount !== null ? (float) $p->commission_amount : null,
                'net_amount' => $p->net_amount !== null ? (float) $p->net_amount : null,
                'created_at' => $p->created_at?->toISOString(),
                'updated_at' => $p->updated_at?->toISOString(),
            ])->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Payments retrieved successfully.');
    }

    /**
     * Retrieve platform-wide revenue & commission overview metrics.
     */
    public function revenue(Request $request, PlatformRevenueService $service): JsonResponse
    {
        $user = $request->user();
        $overview = $service->revenueOverview($user);

        return ApiResponse::success($overview, 'Platform revenue overview retrieved successfully.');
    }
}
