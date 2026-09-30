<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Deal;
use App\Models\DealPayment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealPaymentService
{
    public function __construct(
        private readonly DealAccessService $accessService
    ) {}

    /**
     * List all payments, summary, and eligibility for a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function listPayments(Deal $deal, User $user, ?string $role = null): array
    {
        $this->accessService->view($deal, $user, $role);

        $payments = $deal->payments()
            ->with(['payer', 'receiver', 'statusUpdatedBy'])
            ->orderBy('id', 'desc')
            ->get();

        return [
            'deal_id' => $deal->id,
            'eligibility' => $this->eligibility($deal, $user, $role),
            'summary' => $this->summary($deal),
            'payments' => $payments,
        ];
    }

    /**
     * Create a new pending payment record (Investor only).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function createPayment(Deal $deal, User $user, array $data, ?string $role = null): DealPayment
    {
        // 1. Participant Authorization: Must be the counterparty with Investor role
        $this->accessService->counterparty($deal, $user, $role);

        // 2. Deal Type Validation: Only investor deals support simulated payment records
        if ($deal->counterparty_role !== ParticipantRole::Investor) {
            throw ValidationException::withMessages([
                'deal' => ['Simulated payment records are only supported for investor deals.'],
            ]);
        }

        // 3. Stage Validation: Allowed only at Agreement or MilestoneFundingActive stage
        if ($deal->stage === DealStage::Completed) {
            throw ValidationException::withMessages([
                'stage' => ['Payments cannot be created once the deal is completed.'],
            ]);
        }

        if (! in_array($deal->stage, [DealStage::Agreement, DealStage::MilestoneFundingActive], true)) {
            throw ValidationException::withMessages([
                'stage' => ['Payments can only be created at agreement or milestone funding active stage. Current stage: '.$deal->stage->label().'.'],
            ]);
        }

        // 4. Agreement Validation: Must have an accepted and finalized bilateral agreement
        $agreement = $deal->agreement;
        if (! $agreement || ! $agreement->isFinalized()) {
            throw ValidationException::withMessages([
                'agreement' => ['An accepted and finalized agreement is required before creating payment records.'],
            ]);
        }

        // 5. Agreed Amount Validation: terms_snapshot['amount'] must be > 0
        $agreedAmount = isset($agreement->terms_snapshot['amount']) && is_numeric($agreement->terms_snapshot['amount'])
            ? (float) $agreement->terms_snapshot['amount']
            : 0.00;

        if ($agreedAmount <= 0) {
            throw ValidationException::withMessages([
                'agreement' => ['Agreed investment amount must be greater than zero.'],
            ]);
        }

        // 6. Payment Amount Validation
        if (! array_key_exists('amount', $data) || ! is_numeric($data['amount'])) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount must be a valid numeric value.'],
            ]);
        }

        $rawAmountStr = (string) $data['amount'];
        if (preg_match('/\.\d{3,}$/', $rawAmountStr)) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount cannot have more than 2 decimal places.'],
            ]);
        }

        $amount = round((float) $data['amount'], 2);
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount must be greater than zero.'],
            ]);
        }

        if ($amount > 999999999999.99 || ! is_finite($amount)) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount exceeds maximum allowed value (BDT 999,999,999,999.99).'],
            ]);
        }

        // 7. Payment Method Validation
        $methodStr = is_string($data['payment_method'] ?? null) ? trim($data['payment_method']) : '';
        $paymentMethod = PaymentMethod::tryFrom($methodStr);
        if (! $paymentMethod) {
            throw ValidationException::withMessages([
                'payment_method' => ['Invalid payment method. Allowed values: card, bkash, nagad, bank_transfer, cash_other.'],
            ]);
        }

        // 8. Transaction Reference Validation
        $ref = isset($data['transaction_reference']) && is_string($data['transaction_reference'])
            ? trim($data['transaction_reference'])
            : null;
        if ($ref === '') {
            $ref = null;
        }

        if ($paymentMethod !== PaymentMethod::CashOther && empty($ref)) {
            throw ValidationException::withMessages([
                'transaction_reference' => ['Transaction reference is required for '.$paymentMethod->label().'.'],
            ]);
        }

        if ($ref !== null) {
            if (mb_strlen($ref) > 100) {
                throw ValidationException::withMessages([
                    'transaction_reference' => ['Transaction reference cannot exceed 100 characters.'],
                ]);
            }

            if (! preg_match('/^[a-zA-Z0-9\s\-_\/\.]+$/u', $ref)) {
                throw ValidationException::withMessages([
                    'transaction_reference' => ['Transaction reference contains invalid characters. Allowed: letters, digits, spaces, dashes, underscores, slashes, and dots.'],
                ]);
            }

            // Anti-card-number heuristic: If stripped is 13 to 19 pure digits, reject
            $stripped = preg_replace('/[\s\-]/', '', $ref);
            if (ctype_digit($stripped) && strlen($stripped) >= 13 && strlen($stripped) <= 19) {
                throw ValidationException::withMessages([
                    'transaction_reference' => ['Do not enter card numbers. Enter a receipt or reference ID only.'],
                ]);
            }
        }

        // 9. Note Validation (optional, max 1000)
        $note = isset($data['note']) && is_string($data['note']) ? trim($data['note']) : null;
        if ($note !== null && $note !== '' && mb_strlen($note) > 1000) {
            throw ValidationException::withMessages([
                'note' => ['Note cannot exceed 1000 characters.'],
            ]);
        }
        if ($note === '') {
            $note = null;
        }

        // 10. Payment Date Validation
        $paymentDateStr = $data['payment_date'] ?? null;
        if (! is_string($paymentDateStr) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/D', $paymentDateStr)) {
            throw ValidationException::withMessages([
                'payment_date' => ['Payment date must be a valid YYYY-MM-DD calendar date.'],
            ]);
        }

        [$y, $m, $d] = array_map('intval', explode('-', $paymentDateStr));
        if (! checkdate($m, $d, $y)) {
            throw ValidationException::withMessages([
                'payment_date' => ['Payment date must be a valid calendar date.'],
            ]);
        }

        $today = now()->toDateString();
        if ($paymentDateStr > $today) {
            throw ValidationException::withMessages([
                'payment_date' => ['Payment date cannot be in the future.'],
            ]);
        }

        $finalizedDate = Carbon::parse($agreement->finalized_at)->toDateString();
        if ($paymentDateStr < $finalizedDate) {
            throw ValidationException::withMessages([
                'payment_date' => ['Payment date cannot be before agreement finalized date ('.$finalizedDate.').'],
            ]);
        }

        // 11. Atomic Overpayment & Duplicate Reference Check
        return DB::transaction(function () use ($deal, $user, $amount, $paymentMethod, $ref, $note, $paymentDateStr, $agreedAmount) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            if ($ref !== null) {
                $exists = DealPayment::where('deal_id', $lockedDeal->id)
                    ->where('payment_method', $paymentMethod->value)
                    ->where('transaction_reference', $ref)
                    ->lockForUpdate()
                    ->exists();

                if ($exists) {
                    throw ValidationException::withMessages([
                        'transaction_reference' => ['A payment with this payment method and transaction reference already exists for this deal.'],
                    ]);
                }
            }

            // Calculate existing pending + completed payments
            $existingSum = (float) DealPayment::where('deal_id', $lockedDeal->id)
                ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Completed->value])
                ->lockForUpdate()
                ->sum('amount');

            $newTotal = round($existingSum + $amount, 2);
            if ($newTotal > round($agreedAmount, 2)) {
                $remaining = max(0.00, round($agreedAmount - $existingSum, 2));
                throw ValidationException::withMessages([
                    'amount' => ['Total payments (pending + completed: BDT '.sprintf('%.2f', $newTotal).') cannot exceed agreed investment amount (BDT '.sprintf('%.2f', $agreedAmount).'). Remaining payable limit: BDT '.sprintf('%.2f', $remaining).'.'],
                ]);
            }

            return DealPayment::create([
                'deal_id' => $lockedDeal->id,
                'payer_user_id' => $user->id,
                'receiver_user_id' => $lockedDeal->founder_user_id,
                'amount' => $amount,
                'currency' => 'BDT',
                'payment_method' => $paymentMethod,
                'transaction_reference' => $ref,
                'note' => $note,
                'status' => PaymentStatus::Pending,
                'payment_date' => $paymentDateStr,
                'completed_at' => null,
                'commission_rate' => null,
                'commission_amount' => null,
                'net_amount' => null,
                'status_updated_by_user_id' => null,
            ]);
        });
    }

    /**
     * Update status of a payment record.
     * - Founder can mark pending -> completed or failed.
     * - Investor can mark own pending -> cancelled.
     * - Final states (completed, failed, cancelled) cannot be modified.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function updateStatus(
        Deal $deal,
        DealPayment $payment,
        User $user,
        array $data,
        ?string $role = null
    ): DealPayment {
        $this->enforcePaymentBelongsToDeal($deal, $payment);

        $targetStatusStr = is_string($data['status'] ?? null) ? trim($data['status']) : '';
        $targetStatus = PaymentStatus::tryFrom($targetStatusStr);
        if (! $targetStatus) {
            throw ValidationException::withMessages([
                'status' => ['Invalid payment status. Allowed targets: completed, failed, cancelled.'],
            ]);
        }

        if ($payment->status->isFinal()) {
            throw ValidationException::withMessages([
                'status' => ['Payment is already in final status ('.$payment->status->label().') and cannot be updated.'],
            ]);
        }

        if ($targetStatus === PaymentStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Cannot transition payment status back to pending.'],
            ]);
        }

        // Authorization checks based on target status
        if (in_array($targetStatus, [PaymentStatus::Completed, PaymentStatus::Failed], true)) {
            // Founder only
            $this->accessService->founder($deal, $user);
        } elseif ($targetStatus === PaymentStatus::Cancelled) {
            // Counterparty payer only
            $this->accessService->counterparty($deal, $user, $role);
            if ($payment->payer_user_id !== $user->id) {
                abort(403, 'Only the payer may cancel this payment.');
            }
        }

        return DB::transaction(function () use ($payment, $user, $targetStatus) {
            $lockedPayment = DealPayment::where('id', $payment->id)->lockForUpdate()->firstOrFail();

            if ($lockedPayment->status->isFinal()) {
                throw ValidationException::withMessages([
                    'status' => ['Payment is already in final status ('.$lockedPayment->status->label().') and cannot be updated.'],
                ]);
            }

            if ($targetStatus === PaymentStatus::Completed) {
                $rawRate = (float) config('platform.commission_rate', 5.00);
                $commissionRate = min(100.00, max(0.00, round($rawRate, 2)));
                $amount = (float) $lockedPayment->amount;
                $commissionAmount = round(($amount * $commissionRate) / 100, 2);
                $netAmount = round($amount - $commissionAmount, 2);

                $lockedPayment->status = PaymentStatus::Completed;
                $lockedPayment->commission_rate = $commissionRate;
                $lockedPayment->commission_amount = $commissionAmount;
                $lockedPayment->net_amount = $netAmount;
                $lockedPayment->completed_at = now();
                $lockedPayment->status_updated_by_user_id = $user->id;
            } elseif ($targetStatus === PaymentStatus::Failed) {
                $lockedPayment->status = PaymentStatus::Failed;
                $lockedPayment->status_updated_by_user_id = $user->id;
            } elseif ($targetStatus === PaymentStatus::Cancelled) {
                $lockedPayment->status = PaymentStatus::Cancelled;
                $lockedPayment->status_updated_by_user_id = $user->id;
            }

            $lockedPayment->save();

            return $lockedPayment;
        });
    }

    /**
     * Compute deterministic payment summary for a deal.
     */
    public function summary(Deal $deal): array
    {
        $agreement = $deal->agreement;
        $agreedAmount = isset($agreement->terms_snapshot['amount']) && is_numeric($agreement->terms_snapshot['amount'])
            ? (float) $agreement->terms_snapshot['amount']
            : 0.00;

        $payments = $deal->payments()->get();

        $totalPending = 0.00;
        $totalCompleted = 0.00;
        $totalFailed = 0.00;
        $totalCancelled = 0.00;
        $totalCommission = 0.00;
        $totalNetFounder = 0.00;

        foreach ($payments as $p) {
            $amt = (float) $p->amount;
            if ($p->status === PaymentStatus::Pending) {
                $totalPending += $amt;
            } elseif ($p->status === PaymentStatus::Completed) {
                $totalCompleted += $amt;
                $totalCommission += (float) ($p->commission_amount ?? 0);
                $totalNetFounder += (float) ($p->net_amount ?? ($amt - ($p->commission_amount ?? 0)));
            } elseif ($p->status === PaymentStatus::Failed) {
                $totalFailed += $amt;
            } elseif ($p->status === PaymentStatus::Cancelled) {
                $totalCancelled += $amt;
            }
        }

        $committedOrRecorded = $totalPending + $totalCompleted;
        $remainingPayable = max(0.00, round($agreedAmount - $committedOrRecorded, 2));

        return [
            'currency' => 'BDT',
            'agreed_amount_bdt' => round($agreedAmount, 2),
            'total_pending_bdt' => round($totalPending, 2),
            'total_completed_bdt' => round($totalCompleted, 2),
            'total_failed_bdt' => round($totalFailed, 2),
            'total_cancelled_bdt' => round($totalCancelled, 2),
            'total_recorded_bdt' => round($totalCompleted + $totalPending, 2),
            'total_paid_bdt' => round($totalCompleted, 2),
            'remaining_payable_bdt' => $remainingPayable,
            'total_commission_bdt' => round($totalCommission, 2),
            'total_net_founder_bdt' => round($totalNetFounder, 2),
            'payment_count' => $payments->count(),
            'completed_count' => $payments->where('status', PaymentStatus::Completed)->count(),
            'pending_count' => $payments->where('status', PaymentStatus::Pending)->count(),
        ];
    }

    /**
     * Determine payment creation eligibility and reasons for a user and deal.
     */
    public function eligibility(Deal $deal, User $user, ?string $role = null): array
    {
        $reasons = [];
        $isEligible = true;

        if ($deal->counterparty_role !== ParticipantRole::Investor) {
            $isEligible = false;
            $reasons[] = 'Simulated payment records are only available for investor deals.';
        }

        $agreement = $deal->agreement;
        if (! $agreement || ! $agreement->isFinalized()) {
            $isEligible = false;
            $reasons[] = 'An accepted and finalized agreement is required before payments can be recorded.';
        }

        $agreedAmount = isset($agreement->terms_snapshot['amount']) && is_numeric($agreement->terms_snapshot['amount'])
            ? (float) $agreement->terms_snapshot['amount']
            : 0.00;

        if ($agreement && $agreement->isFinalized() && $agreedAmount <= 0) {
            $isEligible = false;
            $reasons[] = 'Agreed investment amount must be greater than zero.';
        }

        if ($deal->stage === DealStage::Completed) {
            $isEligible = false;
            $reasons[] = 'Deal has been completed. New payments cannot be created.';
        } elseif (! in_array($deal->stage, [DealStage::Agreement, DealStage::MilestoneFundingActive], true)) {
            $isEligible = false;
            $reasons[] = 'Payments are available during Agreement and Milestone Funding Active stages.';
        }

        $canCreate = $isEligible && $deal->counterparty_user_id === $user->id && ! $user->hasAdminAccess();

        return [
            'is_eligible' => $isEligible,
            'can_create' => $canCreate,
            'reasons' => $reasons,
            'agreed_amount' => round($agreedAmount, 2),
            'stage' => $deal->stage->value,
            'stage_label' => $deal->stage->label(),
            'counterparty_role' => $deal->counterparty_role->value,
        ];
    }

    /**
     * Enforce that a payment belongs to the given deal.
     *
     * @throws HttpException
     */
    private function enforcePaymentBelongsToDeal(Deal $deal, DealPayment $payment): void
    {
        if ($payment->deal_id !== $deal->id) {
            throw new HttpException(404, 'Payment not found for this deal.');
        }
    }
}
