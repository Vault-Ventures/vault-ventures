import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import {
  IconSearch,
  IconFilter,
  IconAlertTriangle,
  IconFileText,
  IconCheck,
  IconArrowRight,
  IconActivity,
  IconDollarSign,
} from '../../components/layout/Icons';
import {
  api,
  ApiError,
  FinancialReportItem,
  AdminFinancialGovernanceOverviewData,
  AdminPlatformRevenueData,
  AdminPaymentItem,
} from '../../services/api';

function fmtBDT(n: number | string | null | undefined): string {
  const num = typeof n === 'number' ? n : parseFloat(String(n ?? '0'));
  const safeNum = isNaN(num) ? 0 : num;
  return '৳ ' + safeNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminInvestmentOversight() {
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [revenue, setRevenue] = useState<AdminPlatformRevenueData | null>(null);
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for financial reports
  const [reportSearch, setReportSearch] = useState('');

  // Filters for payment oversight
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Safe concurrent fetches with independent fallbacks so one failure doesn't block the page
      const [govRes, reportsRes, revRes, payRes] = await Promise.all([
        typeof api?.admin?.financialReports?.getGovernance === 'function'
          ? api.admin.financialReports.getGovernance().catch(() => null)
          : Promise.resolve(null),
        typeof api?.admin?.financialReports?.list === 'function'
          ? api.admin.financialReports.list({ per_page: 50 }).catch(() => ({ reports: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 } }))
          : Promise.resolve({ reports: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 } }),
        typeof api?.admin?.platformRevenue === 'function'
          ? api.admin.platformRevenue().catch(() => null)
          : Promise.resolve(null),
        typeof api?.admin?.payments?.list === 'function'
          ? api.admin.payments.list({ per_page: 50 }).catch(() => ({ payments: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 } }))
          : Promise.resolve({ payments: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 } }),
      ]);

      setGovernance(govRes);
      setReports(reportsRes?.reports || []);
      setRevenue(revRes);
      setPayments(payRes?.payments || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load investment governance data.');
      } else {
        setError('Unable to connect to administrative oversight service.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering for reports
  const filteredReports = reports.filter((r) => {
    const q = reportSearch.toLowerCase();
    return (
      !q ||
      (r.business_name && r.business_name.toLowerCase().includes(q)) ||
      String(r.deal_id).includes(q) ||
      String(r.id).includes(q)
    );
  });

  // Client-side filtering for payments
  const filteredPayments = payments.filter((p) => {
    if (paymentStatusFilter !== 'all' && p.status !== paymentStatusFilter) {
      return false;
    }
    if (paymentMethodFilter !== 'all' && p.payment_method !== paymentMethodFilter) {
      return false;
    }
    const q = paymentSearch.toLowerCase();
    if (!q) return true;
    const payerName = (p.payer?.name || p.payer_name || '').toLowerCase();
    const receiverName = (p.receiver?.name || p.receiver_name || '').toLowerCase();
    const bizName = (p.business_name || '').toLowerCase();
    const ref = (p.transaction_reference || '').toLowerCase();
    return (
      payerName.includes(q) ||
      receiverName.includes(q) ||
      bizName.includes(q) ||
      ref.includes(q) ||
      String(p.deal_id).includes(q) ||
      String(p.id).includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight">
              Investment Oversight & Governance
            </h1>
            <Badge variant="accent">Simulated Ledger</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Platform-level oversight of reported deal finances, simulated revenue, payment records, and discrepancy controls.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
          {error}
        </div>
      )}

      {/* Notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] text-[11.5px]"
        style={{ background: 'rgba(53,68,106,0.12)', border: '1px solid rgba(53,68,106,0.25)', color: '#93A1BF' }}
      >
        <IconAlertTriangle className="w-4 h-4 text-[#C67A4E] shrink-0 mt-0.5" />
        <span>
          {revenue?.simulation_disclaimer ||
            governance?.disclaimer ||
            'All figures are simulated in Bangladeshi Taka (BDT / ৳) for platform governance prototype purposes. No real banking custody or external funds transfer is performed.'}
        </span>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading investment oversight metrics...</p>
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* SECTION: PLATFORM REVENUE & COMMISSION OVERVIEW                   */}
          {/* ================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-[color:var(--vv-text)] font-display">
                  Platform Revenue
                </h2>
                <Badge variant="warning">Simulated</Badge>
              </div>
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                5% platform fee applied to completed payment records
              </span>
            </div>

            {/* Revenue Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Total Platform Commission
                </p>
                <p className="text-[19px] font-bold text-[#C67A4E] font-mono mt-0.5">
                  {fmtBDT(revenue?.total_platform_commission_bdt ?? 0)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Earned on completed deals
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Completed Payment Volume
                </p>
                <p className="text-[19px] font-bold text-[#22C55E] font-mono mt-0.5">
                  {fmtBDT(revenue?.total_completed_volume_bdt ?? 0)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Confirmed by founders
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Completed Payments Count
                </p>
                <p className="text-[19px] font-bold text-[color:var(--vv-text)] font-mono mt-0.5">
                  {revenue?.total_completed_payments_count ?? 0}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Confirmed transactions
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Pending Payment Volume
                </p>
                <p className="text-[19px] font-bold text-[#F59E0B] font-mono mt-0.5">
                  {fmtBDT(revenue?.total_pending_volume_bdt ?? 0)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  {revenue?.total_pending_payments_count ?? 0} records awaiting confirmation
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Current Commission Rate
                </p>
                <p className="text-[19px] font-bold text-[color:var(--vv-text)] font-mono mt-0.5">
                  {revenue?.commission_rate ?? 5}%
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Set in server config
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Net to Founders/Receivers
                </p>
                <p className="text-[19px] font-bold text-[#3B82F6] font-mono mt-0.5">
                  {fmtBDT(revenue?.total_net_to_founders_bdt ?? 0)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  After 5% commission
                </p>
              </div>
            </div>

            {/* Monthly Commission Breakdown (Last 6 Months) */}
            {revenue?.monthly && revenue.monthly.length > 0 && (
              <div className="p-4 rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                    Monthly Platform Revenue Breakdown (Last 6 Months)
                  </h3>
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                    Chronological commission history
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {revenue.monthly.map((m) => (
                    <div key={m.month} className="p-3 rounded-[8px] bg-[#1A2338] space-y-1">
                      <p className="text-[11px] font-mono font-semibold text-[color:var(--vv-text-secondary)]">
                        {m.month}
                      </p>
                      <p className="text-[14px] font-bold text-[#C67A4E] font-mono">
                        {fmtBDT(m.total_commission_bdt)}
                      </p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] truncate">
                        Vol: {fmtBDT(m.total_volume_bdt)} • {m.completed_payments_count} tx
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION: RECENT PAYMENTS / PAYMENT OVERSIGHT LEDGER                */}
          {/* ================================================================= */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[color:var(--vv-text)] font-display">
                  Recent Payments / Payment Oversight ({filteredPayments.length})
                </h2>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                  Administrative oversight of capital contribution payment records across all deal rooms.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[8px] text-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] text-[color:var(--vv-text)] focus:outline-none"
                  aria-label="Filter by payment status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[8px] text-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] text-[color:var(--vv-text)] focus:outline-none"
                  aria-label="Filter by payment method"
                >
                  <option value="all">All Methods</option>
                  <option value="card">Card</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash_other">Cash / Other</option>
                </select>

                <div className="relative w-48 sm:w-56">
                  <IconSearch className="w-3.5 h-3.5 text-[#5E6D8F] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search payments..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-[8px] text-[12px] text-[color:var(--vv-text)] placeholder-[#35446A] bg-[#121A2B] border border-[color:var(--vv-border)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="py-14 text-center rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-2">
                <IconFileText className="w-10 h-10 text-[#5E6D8F] mx-auto opacity-60" />
                <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                  No payment records found
                </p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
                  Payment records submitted by investors across Deal Rooms will be displayed here for administrative auditing.
                </p>
              </div>
            ) : (
              <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b border-[color:var(--vv-border)] bg-[#1A2338]/60 text-[10.5px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3">Deal ID</th>
                        <th className="px-3.5 py-3">Business</th>
                        <th className="px-3.5 py-3">Payer</th>
                        <th className="px-3.5 py-3">Receiver</th>
                        <th className="px-3.5 py-3">Method</th>
                        <th className="px-3.5 py-3 text-right">Amount</th>
                        <th className="px-3.5 py-3 text-right">Commission (5%)</th>
                        <th className="px-3.5 py-3 text-right">Net</th>
                        <th className="px-3.5 py-3">Status</th>
                        <th className="px-3.5 py-3">Payment Date</th>
                        <th className="px-3.5 py-3">Completed At</th>
                        <th className="px-3.5 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--vv-border)]">
                      {filteredPayments.map((p) => {
                        const isCompleted = p.status === 'completed';
                        const payerName = p.payer?.name || p.payer_name || `User #${p.payer?.id || '—'}`;
                        const receiverName = p.receiver?.name || p.receiver_name || `User #${p.receiver?.id || '—'}`;
                        const amountVal = p.amount ?? p.amount_bdt ?? 0;
                        const commissionVal = p.commission_amount ?? p.commission_amount_bdt;
                        const netVal = p.net_amount ?? p.net_to_founder_bdt;

                        return (
                          <tr key={p.id} className="hover:bg-[#1A2338]/40 transition-colors">
                            <td className="px-3.5 py-3 font-mono font-bold text-[#C67A4E]">
                              #{p.deal_id}
                              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] block">
                                Payment #{p.id}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 font-medium text-[color:var(--vv-text)] truncate max-w-[140px]">
                              {p.business_name || `Deal #${p.deal_id}`}
                            </td>
                            <td className="px-3.5 py-3 text-[color:var(--vv-text-secondary)] truncate max-w-[120px]">
                              {payerName}
                            </td>
                            <td className="px-3.5 py-3 text-[color:var(--vv-text-secondary)] truncate max-w-[120px]">
                              {receiverName}
                            </td>
                            <td className="px-3.5 py-3 text-[color:var(--vv-text)]">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1C283E] border border-[#2a3c57] text-[color:var(--vv-text-secondary)]">
                                {p.payment_method_label || p.payment_method}
                              </span>
                              {p.transaction_reference && (
                                <span className="text-[10px] font-mono text-[color:var(--vv-text-tertiary)] block truncate max-w-[110px] mt-0.5">
                                  {p.transaction_reference}
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono font-bold text-[color:var(--vv-text)]">
                              {fmtBDT(amountVal)}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono text-[#C67A4E]">
                              {isCompleted && commissionVal !== null && commissionVal !== undefined
                                ? fmtBDT(commissionVal)
                                : '—'}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono text-[#3B82F6]">
                              {isCompleted && netVal !== null && netVal !== undefined
                                ? fmtBDT(netVal)
                                : '—'}
                            </td>
                            <td className="px-3.5 py-3">
                              <Badge
                                variant={
                                  p.status === 'completed'
                                    ? 'success'
                                    : p.status === 'pending'
                                    ? 'warning'
                                    : p.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                                }
                              >
                                {p.status_label || p.status}
                              </Badge>
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-[color:var(--vv-text-secondary)]">
                              {p.payment_date || '—'}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">
                              {p.completed_at
                                ? new Date(p.completed_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <Link
                                to={`/app/admin/deal-room/${p.deal_id}`}
                                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#C67A4E] hover:underline"
                              >
                                Deal Room <IconArrowRight s={12} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION: FINANCIAL GOVERNANCE TOTALS (EXISTING)                    */}
          {/* ================================================================= */}
          {governance && (
            <div className="space-y-4 pt-2">
              <h2 className="text-[15px] font-semibold text-[color:var(--vv-text)] font-display">
                Deal Financial Statements Governance
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                    Deals with Reporting
                  </p>
                  <p className="text-[22px] font-bold text-[color:var(--vv-text)] font-mono mt-1">
                    {governance.overview.total_deals_with_reporting}
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    {governance.overview.total_financial_reports_count} total report submissions
                  </p>
                </div>

                <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                    Reported Revenue
                  </p>
                  <p className="text-[22px] font-bold text-[#22C55E] font-mono mt-1">
                    {fmtBDT(governance.financial_totals_bdt.total_reported_revenue)}
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Cumulative simulated revenue
                  </p>
                </div>

                <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                    Reported Expenses
                  </p>
                  <p className="text-[22px] font-bold text-[color:var(--vv-text-secondary)] font-mono mt-1">
                    {fmtBDT(governance.financial_totals_bdt.total_reported_expenses)}
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Operating expenses logged
                  </p>
                </div>

                <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                    Net Simulated P/L
                  </p>
                  <p
                    className={`text-[22px] font-bold font-mono mt-1 ${
                      Number(governance.financial_totals_bdt.total_calculated_profit_loss || 0) >= 0
                        ? 'text-[#C67A4E]'
                        : 'text-red-400'
                    }`}
                  >
                    {fmtBDT(governance.financial_totals_bdt.total_calculated_profit_loss)}
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Reconciled net profit/loss
                  </p>
                </div>
              </div>

              {/* Verification Pipeline & Discrepancies Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
                  <h3 className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                    Report Verification Pipeline
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Self-Reported</p>
                      <p className="text-[16px] font-bold text-[color:var(--vv-text)] font-mono">
                        {governance.verification_pipeline.self_reported_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Evidence Attached</p>
                      <p className="text-[16px] font-bold text-[#3B82F6] font-mono">
                        {governance.verification_pipeline.evidence_submitted_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Under Review</p>
                      <p className="text-[16px] font-bold text-[#F59E0B] font-mono">
                        {governance.verification_pipeline.under_review_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Admin Verified</p>
                      <p className="text-[16px] font-bold text-[#22C55E] font-mono">
                        {governance.verification_pipeline.verified_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
                  <h3 className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                    Discrepancies & Flagged Audits
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5 text-[12px]">
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Under Review</p>
                      <p className="text-[16px] font-bold text-[#F59E0B] font-mono">
                        {governance.discrepancy_queue.pending_under_review_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Resolved</p>
                      <p className="text-[16px] font-bold text-[#22C55E] font-mono">
                        {governance.discrepancy_queue.resolved_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[#1A2338]">
                      <p className="text-[color:var(--vv-text-tertiary)]">Disputed</p>
                      <p className="text-[16px] font-bold text-red-400 font-mono">
                        {governance.discrepancy_queue.disputed_count}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                    Discrepancy queue tracks counterparty disputes flagged against operational figures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION: DEAL FINANCIAL REPORTING STATEMENTS                      */}
          {/* ================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[color:var(--vv-text)]">
                Deal Financial Reporting Ledger ({filteredReports.length})
              </h2>
              <div className="relative w-64">
                <IconSearch className="w-4 h-4 text-[#5E6D8F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Filter reports..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-[8px] text-[12px] text-[color:var(--vv-text)] placeholder-[#35446A] bg-[#121A2B] border border-[color:var(--vv-border)] focus:outline-none"
                />
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="py-14 text-center rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <IconFileText className="w-10 h-10 text-[#5E6D8F] mx-auto mb-2 opacity-60" />
                <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                  No reporting deals found
                </p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Deals with submitted financial statements will be listed here.
                </p>
              </div>
            ) : (
              <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b border-[color:var(--vv-border)] bg-[#1A2338]/60 text-[10.5px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Deal & Entity</th>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Expenses</th>
                        <th className="px-4 py-3 text-right">Net P/L</th>
                        <th className="px-4 py-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--vv-border)]">
                      {filteredReports.map((r) => (
                        <tr key={r.id} className="hover:bg-[#1A2338]/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-[color:var(--vv-text)]">
                            {r.business_name || `Business #${r.business_id || 'N/A'}`}
                            <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] block font-mono">
                              Deal #{r.deal_id} • Report #{r.id}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-secondary)]">
                            {r.reporting_period_start} – {r.reporting_period_end}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[color:var(--vv-text)]">
                            {fmtBDT(r.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[color:var(--vv-text-tertiary)]">
                            {fmtBDT(r.expenses)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold ${
                              Number(r.net_profit_loss || 0) >= 0 ? 'text-[#22C55E]' : 'text-red-400'
                            }`}
                          >
                            {fmtBDT(r.net_profit_loss)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                r.status === 'verified'
                                  ? 'success'
                                  : r.status === 'under_review'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {r.status_label || r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
