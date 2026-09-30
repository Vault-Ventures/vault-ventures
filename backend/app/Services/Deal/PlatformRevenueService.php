<?php

namespace App\Services\Deal;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\DealPayment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class PlatformRevenueService
{
    /**
     * Ensure user has admin privileges.
     */
    public function assertAdmin(User $user): void
    {
        if (! $user->hasAdminAccess()) {
            abort(403, 'Unauthorized. Admin access is required.');
        }
    }

    /**
     * Platform-wide revenue overview metrics for admin oversight.
     */
    public function revenueOverview(User $admin): array
    {
        $this->assertAdmin($admin);

        $rate = (float) config('platform.commission_rate', 5.00);

        // Completed totals (the only payments contributing to platform revenue)
        $completedQuery = DealPayment::where('status', PaymentStatus::Completed);
        $completedCount = (int) $completedQuery->count();
        $totalCompletedVolume = round((float) $completedQuery->sum('amount'), 2);
        $totalCommission = round((float) $completedQuery->sum('commission_amount'), 2);
        $totalNetToReceivers = round((float) $completedQuery->sum('net_amount'), 2);

        // Pending totals
        $pendingQuery = DealPayment::where('status', PaymentStatus::Pending);
        $pendingCount = (int) $pendingQuery->count();
        $pendingVolume = round((float) $pendingQuery->sum('amount'), 2);

        // Last 6 months monthly breakdown of completed commission
        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $yearMonth = $monthDate->format('Y-m');
            $label = $monthDate->format('M Y');
            $startOfMonth = $monthDate->copy()->startOfMonth();
            $endOfMonth = $monthDate->copy()->endOfMonth();

            $monthQuery = DealPayment::where('status', PaymentStatus::Completed)
                ->whereBetween('completed_at', [$startOfMonth, $endOfMonth]);

            $monthly[] = [
                'month' => $yearMonth,
                'label' => $label,
                'completed_payments_count' => (int) $monthQuery->count(),
                'total_completed_volume' => round((float) $monthQuery->sum('amount'), 2),
                'total_commission' => round((float) $monthQuery->sum('commission_amount'), 2),
                'total_net_to_receivers' => round((float) $monthQuery->sum('net_amount'), 2),
            ];
        }

        return [
            'currency' => 'BDT',
            'commission_rate' => $rate,
            'completed_payments_count' => $completedCount,
            'total_completed_volume' => $totalCompletedVolume,
            'total_commission' => $totalCommission,
            'total_net_to_receivers' => $totalNetToReceivers,
            'pending_payments_count' => $pendingCount,
            'pending_volume' => $pendingVolume,
            'monthly' => $monthly,
        ];
    }

    /**
     * List all payments platform-wide with filtering and eager loading for admin review.
     */
    public function listPayments(User $admin, array $filters = []): LengthAwarePaginator
    {
        $this->assertAdmin($admin);

        $query = DealPayment::query()
            ->with(['deal.business', 'payer', 'receiver', 'statusUpdatedBy'])
            ->orderBy('id', 'desc');

        if (! empty($filters['status'])) {
            $statusEnum = PaymentStatus::tryFrom(trim((string) $filters['status']));
            if ($statusEnum) {
                $query->where('status', $statusEnum->value);
            }
        }

        if (! empty($filters['payment_method'])) {
            $methodEnum = PaymentMethod::tryFrom(trim((string) $filters['payment_method']));
            if ($methodEnum) {
                $query->where('payment_method', $methodEnum->value);
            }
        }

        if (! empty($filters['deal_id']) && is_numeric($filters['deal_id'])) {
            $query->where('deal_id', (int) $filters['deal_id']);
        }

        $perPage = isset($filters['per_page']) && is_numeric($filters['per_page'])
            ? min(50, max(1, (int) $filters['per_page']))
            : 20;

        return $query->paginate($perPage);
    }
}
