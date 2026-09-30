<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Models\DealPayment;
use App\Services\Deal\DealPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DealPaymentController extends Controller
{
    /**
     * List all payments, summary, and eligibility for a deal.
     */
    public function index(
        Request $request,
        string $deal,
        DealPaymentService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $result = $service->listPayments(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success([
            'deal_id' => $result['deal_id'],
            'eligibility' => $result['eligibility'],
            'summary' => $result['summary'],
            'payments' => $result['payments']->map(fn (DealPayment $p) => $this->formatPayment($p))->all(),
        ], 'Payments retrieved successfully.');
    }

    /**
     * Record a new simulated payment (Investor only).
     */
    public function store(
        Request $request,
        string $deal,
        DealPaymentService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $payment = $service->createPayment(
            $dealModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatPayment($payment),
            'Payment recorded successfully.',
            201
        );
    }

    /**
     * Update status of a payment record.
     */
    public function updateStatus(
        Request $request,
        string $deal,
        string $payment,
        DealPaymentService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $paymentModel = DealPayment::findOrFail($payment);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->updateStatus(
            $dealModel,
            $paymentModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatPayment($updated),
            'Payment status updated successfully.'
        );
    }

    /**
     * Format deterministic payment response.
     */
    private function formatPayment(DealPayment $payment): array
    {
        return [
            'id' => $payment->id,
            'deal_id' => $payment->deal_id,
            'payer_user_id' => $payment->payer_user_id,
            'receiver_user_id' => $payment->receiver_user_id,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency ?? 'BDT',
            'payment_method' => $payment->payment_method->value,
            'payment_method_label' => $payment->payment_method->label(),
            'transaction_reference' => $payment->transaction_reference,
            'note' => $payment->note,
            'status' => $payment->status->value,
            'status_label' => $payment->status->label(),
            'payment_date' => $payment->payment_date?->format('Y-m-d'),
            'completed_at' => $payment->completed_at?->toISOString(),
            'commission_rate' => $payment->commission_rate !== null ? (float) $payment->commission_rate : null,
            'commission_amount' => $payment->commission_amount !== null ? (float) $payment->commission_amount : null,
            'net_amount' => $payment->net_amount !== null ? (float) $payment->net_amount : null,
            'created_at' => $payment->created_at?->toISOString(),
            'updated_at' => $payment->updated_at?->toISOString(),
        ];
    }
}
