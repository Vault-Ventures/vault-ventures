import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  api,
  ApiError,
  DealPaymentItem,
  DealPaymentSummary,
  DealPaymentEligibility,
} from '../../services/api';
import {
  IconFileText,
  IconPlus,
  IconCheck,
  IconAlertTriangle,
  IconLock,
  IconX,
  IconShield,
  IconActivity,
  IconArrowRight,
} from '../layout/Icons';

export interface DealPaymentsTabProps {
  deal: {
    id: number;
    business_id: number;
    founder_user_id: number;
    counterparty_user_id: number;
    counterparty_role: 'investor' | 'professional' | string;
    stage: string;
    stage_order: number;
  };
  isFounder: boolean;
  isCounterparty: boolean;
  role?: string;
  user?: { id: number; name?: string; email?: string } | null;
  businessName?: string;
}

function fmtBDT(n: number | string | null | undefined): string {
  const num = typeof n === 'number' ? n : parseFloat(String(n ?? '0'));
  const safeNum = isNaN(num) ? 0 : num;
  return '৳ ' + safeNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_BADGE_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

const PAYMENT_METHODS: { value: string; label: string; requiresRef: boolean }[] = [
  { value: 'card', label: 'Card', requiresRef: true },
  { value: 'bkash', label: 'bKash', requiresRef: true },
  { value: 'nagad', label: 'Nagad', requiresRef: true },
  { value: 'bank_transfer', label: 'Bank Transfer', requiresRef: true },
  { value: 'cash_other', label: 'Cash / Other', requiresRef: false },
];

export default function DealPaymentsTab({
  deal,
  isFounder,
  isCounterparty,
  role,
  user,
  businessName,
}: DealPaymentsTabProps) {
  const [payments, setPayments] = useState<DealPaymentItem[]>([]);
  const [summary, setSummary] = useState<DealPaymentSummary | null>(null);
  const [eligibility, setEligibility] = useState<DealPaymentEligibility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bkash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status Action Confirmation Modal
  const [actionModal, setActionModal] = useState<{
    payment: DealPaymentItem;
    targetStatus: 'completed' | 'failed' | 'cancelled';
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const effectiveRole = isFounder
    ? undefined
    : isCounterparty
    ? deal.counterparty_role
    : role === 'investor' || role === 'professional'
    ? role
    : undefined;

  const isAdmin = role === 'admin' || (user as any)?.is_admin;

  const fetchData = useCallback(async () => {
    if (!deal?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.deals.payments.list(deal.id, effectiveRole);
      setPayments(res.payments || []);
      setSummary(res.summary || null);
      setEligibility(res.eligibility || null);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load payment records for this deal.');
      } else {
        setError('Unable to load payment ledger from server.');
      }
    } finally {
      setLoading(false);
    }
  }, [deal.id, effectiveRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Record Payment Submission
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !eligibility?.can_create) return;
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Payment amount must be a positive number.');
      return;
    }

    const selectedMethod = PAYMENT_METHODS.find((m) => m.value === paymentMethod);
    const trimmedRef = transactionRef.trim();

    if (selectedMethod?.requiresRef && !trimmedRef) {
      setFormError(`Transaction reference ID is required for ${selectedMethod.label}.`);
      return;
    }

    // Anti-card-number heuristic on frontend
    const stripped = trimmedRef.replace(/[\s\-]/g, '');
    if (/^\d{13,19}$/.test(stripped)) {
      setFormError('Do not enter card numbers. Enter a receipt or reference ID only.');
      return;
    }

    if (!paymentDate) {
      setFormError('Payment date is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.deals.payments.create(
        deal.id,
        {
          amount: parsedAmount,
          payment_method: paymentMethod,
          transaction_reference: trimmedRef || undefined,
          payment_date: paymentDate,
          note: note.trim() || undefined,
          role: effectiveRole,
        },
        effectiveRole
      );

      setSuccessMsg(`Simulated payment record for ${fmtBDT(parsedAmount)} created successfully.`);
      setShowRecordModal(false);
      resetForm();
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchData();
    } catch (err: any) {
      let errMsg = err?.message || 'Failed to record payment.';
      if (err?.details && typeof err.details === 'object') {
        const fieldMsgs = Object.values(err.details).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Status Update Confirmation Action
  const handleStatusUpdate = async () => {
    if (!actionModal || updatingStatus) return;
    setActionError(null);
    setUpdatingStatus(true);
    try {
      await api.deals.payments.updateStatus(
        deal.id,
        actionModal.payment.id,
        {
          status: actionModal.targetStatus,
          role: effectiveRole,
        },
        effectiveRole
      );

      const statusLabels: Record<string, string> = {
        completed: 'confirmed as completed',
        failed: 'marked as failed',
        cancelled: 'cancelled',
      };
      setSuccessMsg(`Payment #${actionModal.payment.id} ${statusLabels[actionModal.targetStatus] || 'updated'}.`);
      setActionModal(null);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchData();
    } catch (err: any) {
      let errMsg = err?.message || 'Failed to update payment status.';
      if (err?.details && typeof err.details === 'object') {
        const fieldMsgs = Object.values(err.details).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      }
      setActionError(errMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('bkash');
    setTransactionRef('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setFormError(null);
  };

  // Real-time calculation of commission estimate for investor modal
  const enteredAmountNum = parseFloat(amount) || 0;
  const commissionRate = 5.0; // 5% platform commission
  const estCommission = Math.round(enteredAmountNum * commissionRate) / 100;
  const estNet = Math.max(0, enteredAmountNum - estCommission);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[color:var(--vv-text)] tracking-tight font-display">
              Payment Records Ledger
            </h2>
            <Badge variant="warning" dot>
              Simulated
            </Badge>
          </div>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">
            Simulated capital contribution records, founder confirmations, and platform fee tracking for {businessName || `Deal #${deal.id}`}.
          </p>
        </div>

        {/* Investor Record Payment CTA */}
        {isCounterparty && !isFounder && !isAdmin && (
          <div>
            {eligibility?.can_create ? (
              <Button
                size="sm"
                variant="primary"
                icon={<IconPlus s={14} />}
                onClick={() => {
                  resetForm();
                  setShowRecordModal(true);
                }}
              >
                Record Payment
              </Button>
            ) : (
              eligibility?.reasons && eligibility.reasons.length > 0 && (
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                  {eligibility.reasons[0]}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-green-950/40 border border-green-800/60 text-green-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconCheck s={16} className="text-green-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-400 hover:text-green-200">
            <IconX s={14} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconAlertTriangle s={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={fetchData}>
              Retry
            </Button>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
              <IconX s={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Simulated Record Notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[11.5px]"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}
      >
        <IconAlertTriangle s={16} className="text-amber-400 shrink-0 mt-0.5" />
        <span>
          Prototype record only. No real money is moved or held by Vault Ventures. Payments are recorded for transparent accounting and bilateral milestone release tracking in Bangladeshi Taka (BDT / ৳).
        </span>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
          <p className="text-xs text-[color:var(--vv-text-tertiary)]">Loading payment records...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Agreed Amount
                </p>
                <p className="text-lg font-bold text-[color:var(--vv-text)] font-mono mt-0.5">
                  {fmtBDT(summary.agreed_amount_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Accepted agreement ask
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Completed
                </p>
                <p className="text-lg font-bold text-[#22C55E] font-mono mt-0.5">
                  {fmtBDT(summary.total_completed_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  {summary.completed_count} verified payments
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Pending
                </p>
                <p className="text-lg font-bold text-[#F59E0B] font-mono mt-0.5">
                  {fmtBDT(summary.total_pending_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  {summary.pending_count} awaiting confirmation
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Remaining Limit
                </p>
                <p className="text-lg font-bold text-[color:var(--vv-text-secondary)] font-mono mt-0.5">
                  {fmtBDT(summary.remaining_payable_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Payable under agreement
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Platform Commission
                </p>
                <p className="text-lg font-bold text-[#C67A4E] font-mono mt-0.5">
                  {fmtBDT(summary.total_commission_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  5% platform fee total
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                  Net to Founder
                </p>
                <p className="text-lg font-bold text-[#3B82F6] font-mono mt-0.5">
                  {fmtBDT(summary.total_net_founder_bdt)}
                </p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Net contribution recorded
                </p>
              </div>
            </div>
          )}

          {/* Payment History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-[color:var(--vv-text)]">
                Recorded Payments ({payments.length})
              </h3>
            </div>

            {payments.length === 0 ? (
              <div className="py-14 text-center rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#1C283E] flex items-center justify-center mx-auto text-[#5E6D8F]">
                  <IconFileText s={22} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[color:var(--vv-text)]">
                    No Payments Recorded Yet
                  </h4>
                  <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mt-1">
                    {isCounterparty && !isFounder
                      ? eligibility?.can_create
                        ? 'Click "Record Payment" above to submit a simulated capital contribution record with your receipt reference.'
                        : eligibility?.reasons?.[0] || 'Payment recording will unlock when the agreement is finalized.'
                      : 'The investor has not yet recorded capital contribution payments for this deal.'}
                  </p>
                </div>
                {isCounterparty && !isFounder && eligibility?.can_create && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IconPlus s={14} />}
                    onClick={() => {
                      resetForm();
                      setShowRecordModal(true);
                    }}
                  >
                    Record First Payment
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#1c2a3e] overflow-hidden bg-[#121A2B]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#1c2a3e] bg-[#1A2338]/60 text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Payer / Receiver</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Reference / Note</th>
                        <th className="px-4 py-3 text-right">Amount (BDT)</th>
                        <th className="px-4 py-3 text-right">Commission (5%)</th>
                        <th className="px-4 py-3 text-right">Receiver Net</th>
                        <th className="px-4 py-3">Status</th>
                        {!isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c2a3e]">
                      {payments.map((p) => {
                        const badgeCfg = STATUS_BADGE_MAP[p.status] || {
                          label: p.status_label || p.status,
                          variant: 'neutral' as const,
                        };

                        const isPayerMe = user && Number(user.id) === Number(p.payer_user_id);
                        const isReceiverMe = user && Number(user.id) === Number(p.receiver_user_id);

                        return (
                          <tr key={p.id} className="hover:bg-[#1A2338]/40 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-[11.5px] text-[color:var(--vv-text)]">
                              {p.payment_date}
                              <span className="block text-[9.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                                #{p.id}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <p className="text-[11.5px] font-medium text-[color:var(--vv-text)]">
                                {isPayerMe ? 'You (Investor)' : 'Investor'} → {isReceiverMe ? 'You (Founder)' : 'Founder'}
                              </p>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#1A2338] text-[color:var(--vv-text-secondary)] border border-[#1c2a3e]">
                                {p.payment_method_label}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 max-w-[200px]">
                              {p.transaction_reference ? (
                                <span className="font-mono text-[11px] text-[color:var(--vv-text)] block truncate" title={p.transaction_reference}>
                                  {p.transaction_reference}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">No Ref</span>
                              )}
                              {p.note && (
                                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] line-clamp-1 mt-0.5" title={p.note}>
                                  {p.note}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono font-bold text-[color:var(--vv-text)] text-[12px]">
                              {fmtBDT(p.amount)}
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono text-[11.5px] text-[#C67A4E]">
                              {p.status === 'completed' && p.commission_amount !== null
                                ? fmtBDT(p.commission_amount)
                                : '—'}
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono text-[11.5px] text-[#22C55E] font-medium">
                              {p.status === 'completed' && p.net_amount !== null
                                ? fmtBDT(p.net_amount)
                                : '—'}
                            </td>

                            <td className="px-4 py-3.5">
                              <Badge variant={badgeCfg.variant} dot>
                                {badgeCfg.label}
                              </Badge>
                              {p.completed_at && (
                                <span className="block text-[9.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                                  {new Date(p.completed_at).toLocaleDateString()}
                                </span>
                              )}
                            </td>

                            {!isAdmin && (
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                {p.status === 'pending' && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Founder actions: Confirm / Mark Failed */}
                                    {isFounder && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          className="text-[10.5px] px-2 py-1 bg-green-600 hover:bg-green-500 text-white"
                                          onClick={() =>
                                            setActionModal({ payment: p, targetStatus: 'completed' })
                                          }
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-[10.5px] px-2 py-1 text-red-400 hover:bg-red-500/10"
                                          onClick={() =>
                                            setActionModal({ payment: p, targetStatus: 'failed' })
                                          }
                                        >
                                          Fail
                                        </Button>
                                      </>
                                    )}

                                    {/* Investor action: Cancel own pending */}
                                    {isCounterparty && isPayerMe && !isFounder && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[10.5px] px-2 py-1 text-amber-400 hover:bg-amber-500/10"
                                        onClick={() =>
                                          setActionModal({ payment: p, targetStatus: 'cancelled' })
                                        }
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RECORD PAYMENT (INVESTOR)                                     */}
      {/* ==================================================================== */}
      {showRecordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payment-title"
        >
          <div className="bg-[#121A2B] border border-[#1c2a3e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E]">
                  <IconPlus s={16} />
                </div>
                <div>
                  <h3 id="record-payment-title" className="text-sm font-bold text-[color:var(--vv-text)] font-display">
                    Record Simulated Payment
                  </h3>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                    {businessName || `Deal #${deal.id}`} • Contribution Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] p-1"
                aria-label="Close"
              >
                <IconX s={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordPayment} className="overflow-y-auto p-5 space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <IconAlertTriangle s={14} className="text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label htmlFor="payment-amount" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Payment Amount (BDT / ৳) <span className="text-red-400">*</span>
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 50000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                />
                {summary && summary.remaining_payable_bdt > 0 && (
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1">
                    Remaining payable limit: <strong>{fmtBDT(summary.remaining_payable_bdt)}</strong>
                  </p>
                )}
              </div>

              {/* Method */}
              <div>
                <label htmlFor="payment-method" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Payment Channel / Method <span className="text-red-400">*</span>
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction ID / Reference */}
              <div>
                <label htmlFor="txn-reference" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Transaction ID / Reference {paymentMethod !== 'cash_other' && <span className="text-red-400">*</span>}
                </label>
                <input
                  id="txn-reference"
                  type="text"
                  maxLength={100}
                  required={paymentMethod !== 'cash_other'}
                  placeholder="e.g. TRX-99882244 or Bank Slip ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                />
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1">
                  Enter a receipt or reference ID only. Do not enter card numbers, PINs, or bank account numbers.
                </p>
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="payment-date" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Payment Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="payment-date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                />
              </div>

              {/* Note (Optional) */}
              <div>
                <label htmlFor="payment-note" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Note / Memo <span className="text-[color:var(--vv-text-tertiary)] font-normal">(Optional)</span>
                </label>
                <input
                  id="payment-note"
                  type="text"
                  maxLength={1000}
                  placeholder="e.g. First tranche for product development"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                />
              </div>

              {/* Estimated Breakdown Strip */}
              {enteredAmountNum > 0 && (
                <div className="p-3 rounded-xl bg-[#0D1626] border border-[#1c2a3e] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Estimated Platform Commission (5%):</span>
                    <span className="font-mono text-[#C67A4E]">{fmtBDT(estCommission)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Estimated Net to Founder (95%):</span>
                    <span className="font-mono text-[#22C55E] font-medium">{fmtBDT(estNet)}</span>
                  </div>
                  <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)] italic pt-1 border-t border-[#1c2a3e]">
                    Estimate. Final figures are set when the founder confirms.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRecordModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                >
                  Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: STATUS ACTION CONFIRMATION                                    */}
      {/* ==================================================================== */}
      {actionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121A2B] border border-[#1c2a3e] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  actionModal.targetStatus === 'completed'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : actionModal.targetStatus === 'failed'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {actionModal.targetStatus === 'completed' ? (
                  <IconCheck s={18} />
                ) : (
                  <IconAlertTriangle s={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[color:var(--vv-text)] font-display">
                  {actionModal.targetStatus === 'completed'
                    ? 'Confirm Payment as Completed'
                    : actionModal.targetStatus === 'failed'
                    ? 'Mark Payment as Failed'
                    : 'Cancel Pending Payment'}
                </h3>
                <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1 leading-relaxed">
                  {actionModal.targetStatus === 'completed' &&
                    `Confirming payment #${actionModal.payment.id} of ${fmtBDT(actionModal.payment.amount)} will record it as completed and apply a 5% platform commission (${fmtBDT(actionModal.payment.amount * 0.05)}).`}
                  {actionModal.targetStatus === 'failed' &&
                    `Are you sure you want to mark payment #${actionModal.payment.id} of ${fmtBDT(actionModal.payment.amount)} as failed? This will release the allocated amount back to the payable limit.`}
                  {actionModal.targetStatus === 'cancelled' &&
                    `Are you sure you want to cancel your pending payment record #${actionModal.payment.id} of ${fmtBDT(actionModal.payment.amount)}?`}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => setActionModal(null)}
                disabled={updatingStatus}
              >
                Go Back
              </Button>
              <Button
                variant={
                  actionModal.targetStatus === 'completed'
                    ? 'primary'
                    : actionModal.targetStatus === 'failed'
                    ? 'secondary'
                    : 'ghost'
                }
                loading={updatingStatus}
                onClick={handleStatusUpdate}
              >
                {actionModal.targetStatus === 'completed'
                  ? 'Confirm as Completed'
                  : actionModal.targetStatus === 'failed'
                  ? 'Mark Failed'
                  : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
