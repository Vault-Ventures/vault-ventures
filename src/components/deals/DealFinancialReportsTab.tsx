import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  api,
  ApiError,
  FinancialReportItem,
  DealFinancialOverviewData,
  FinancialReportEvidenceItem,
} from '../../services/api';
import {
  IconFileText,
  IconPlus,
  IconCheck,
  IconAlertTriangle,
  IconLock,
  IconTrendingUp,
  IconShield,
  IconX,
} from '../layout/Icons';

export interface DealFinancialReportsTabProps {
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

const STATUS_BADGE_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  verified: { label: 'Verified', variant: 'success' },
  under_review: { label: 'Under Review', variant: 'warning' },
  evidence_submitted: { label: 'Evidence Attached', variant: 'info' },
  self_reported: { label: 'Self Reported', variant: 'neutral' },
};

export default function DealFinancialReportsTab({
  deal,
  isFounder,
  isCounterparty,
  role,
  user,
  businessName,
}: DealFinancialReportsTabProps) {
  const [overview, setOverview] = useState<DealFinancialOverviewData | null>(null);
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Submit Report Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [cashPosition, setCashPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState('bank_statement');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Attach Evidence Modal State (for existing report)
  const [attachReportId, setAttachReportId] = useState<number | null>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachType, setAttachType] = useState('bank_statement');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const effectiveRole = isFounder
    ? undefined
    : isCounterparty
    ? deal.counterparty_role
    : role === 'investor' || role === 'professional'
    ? role
    : undefined;

  const isStageEligible =
    deal.stage === 'milestone_funding_active' ||
    deal.stage === 'completed' ||
    deal.stage_order >= 7;

  const isProfessional = deal.counterparty_role === 'professional' && !isFounder;

  const fetchData = useCallback(async () => {
    if (!deal?.id) return;
    if (isProfessional) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [ovRes, repRes] = await Promise.all([
        api.deals.financialOverview(deal.id, effectiveRole).catch(() => null),
        api.deals.financialReports.list(deal.id, effectiveRole).catch(() => ({ deal_id: deal.id, reports: [] })),
      ]);
      setOverview(ovRes);
      setReports(repRes.reports || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load deal financial reports.');
      } else {
        setError('Unable to load financial reports for this deal.');
      }
    } finally {
      setLoading(false);
    }
  }, [deal.id, effectiveRole, isProfessional]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live calculation of preview Net P/L
  const revNum = parseFloat(revenue) || 0;
  const expNum = parseFloat(expenses) || 0;
  const previewNetPL = revNum - expNum;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFounder || !isStageEligible || submitting) return;

    setFormError(null);

    // Client-side validations
    if (!periodStart || !periodEnd) {
      setFormError('Reporting period start and end dates are required.');
      return;
    }
    if (periodStart > periodEnd) {
      setFormError('Reporting period start date must be before or equal to the end date.');
      return;
    }
    if (isNaN(parseFloat(revenue)) || parseFloat(revenue) < 0) {
      setFormError('Revenue must be a valid non-negative number.');
      return;
    }
    if (isNaN(parseFloat(expenses)) || parseFloat(expenses) < 0) {
      setFormError('Expenses must be a valid non-negative number.');
      return;
    }
    if (cashPosition && (isNaN(parseFloat(cashPosition)) || parseFloat(cashPosition) < 0)) {
      setFormError('Cash position must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reporting_period_start: periodStart,
        reporting_period_end: periodEnd,
        revenue: parseFloat(revenue),
        expenses: parseFloat(expenses),
        cash_position: cashPosition.trim() ? parseFloat(cashPosition) : null,
        notes: notes.trim() || null,
        role: effectiveRole,
      };

      const createdReport = await api.deals.financialReports.create(deal.id, payload, effectiveRole);

      // If an evidence file was attached, upload it
      if (evidenceFile && createdReport?.id) {
        try {
          await api.deals.financialReports.uploadEvidence(createdReport.id, evidenceFile, evidenceType);
        } catch (evErr: any) {
          // Report was created, show warning for evidence failure
          setSuccessMsg(`Report #${createdReport.id} submitted, but evidence upload failed: ${evErr?.message || 'File upload error'}`);
          setShowSubmitModal(false);
          resetForm();
          await fetchData();
          return;
        }
      }

      setSuccessMsg(`Financial report for ${periodStart} to ${periodEnd} submitted successfully.`);
      setShowSubmitModal(false);
      resetForm();
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchData();
    } catch (err: any) {
      let errMsg = err?.message || 'Failed to submit financial report.';
      if (err?.details && typeof err.details === 'object') {
        const fieldMsgs = Object.values(err.details).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      } else if (err?.errors && typeof err.errors === 'object') {
        const fieldMsgs = Object.values(err.errors).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadAdditionalEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachReportId || !attachFile || uploadingEvidence) return;

    setAttachError(null);
    setUploadingEvidence(true);
    try {
      await api.deals.financialReports.uploadEvidence(attachReportId, attachFile, attachType);
      setSuccessMsg(`Evidence file uploaded for Report #${attachReportId}.`);
      setAttachReportId(null);
      setAttachFile(null);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchData();
    } catch (err: any) {
      let errMsg = err?.message || 'Failed to upload evidence file.';
      if (err?.details && typeof err.details === 'object') {
        const fieldMsgs = Object.values(err.details).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      } else if (err?.errors && typeof err.errors === 'object') {
        const fieldMsgs = Object.values(err.errors).flat().filter(Boolean);
        if (fieldMsgs.length > 0) {
          errMsg = fieldMsgs.join(' ');
        }
      }
      setAttachError(errMsg);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const resetForm = () => {
    setPeriodStart('');
    setPeriodEnd('');
    setRevenue('');
    setExpenses('');
    setCashPosition('');
    setNotes('');
    setEvidenceFile(null);
    setEvidenceType('bank_statement');
    setFormError(null);
  };

  // Professional access guard
  if (isProfessional) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="p-8 rounded-2xl bg-[#121A2B] border border-[#1c2a3e] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <IconLock s={22} />
          </div>
          <h2 className="text-base font-semibold text-[color:var(--vv-text)]">
            Financial Reports Restricted
          </h2>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mx-auto">
            Periodic P&L statements and financial governance verification are restricted to deal founders, investors, and platform administrators.
          </p>
        </div>
      </div>
    );
  }

  // Calculate totals from overview or list
  const totalRev = overview?.operational_performance?.cumulative_revenue_bdt ?? reports.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
  const totalExp = overview?.operational_performance?.cumulative_expenses_bdt ?? reports.reduce((s, r) => s + (Number(r.expenses) || 0), 0);
  const totalNet = overview?.operational_performance?.cumulative_net_profit_loss_bdt ?? (totalRev - totalExp);
  const latestCash = overview?.operational_performance?.latest_cash_position_bdt ?? (reports.length > 0 ? reports[0].cash_position : null);

  const verificationCounts = overview?.operational_performance?.verification_breakdown || {
    self_reported: reports.filter((r) => r.status === 'self_reported').length,
    evidence_submitted: reports.filter((r) => r.status === 'evidence_submitted').length,
    under_review: reports.filter((r) => r.status === 'under_review').length,
    verified: reports.filter((r) => r.status === 'verified').length,
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[color:var(--vv-text)] tracking-tight font-display">
              Periodic Financial Reporting
            </h2>
            <Badge variant="accent">Deal Ledger</Badge>
          </div>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">
            Periodic revenue, expenses, reconciled Net P/L statements, and supporting verification evidence for {businessName || `Deal #${deal.id}`}.
          </p>
        </div>

        {/* Founder Submit Action */}
        {isFounder && (
          <div>
            {isStageEligible ? (
              <Button
                size="sm"
                variant="primary"
                icon={<IconPlus s={14} />}
                onClick={() => {
                  resetForm();
                  setShowSubmitModal(true);
                }}
              >
                Submit Financial Report
              </Button>
            ) : (
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                Reporting unlocks in Milestone Funding stage
              </span>
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
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <IconX s={14} />
          </button>
        </div>
      )}

      {/* Simulation Disclaimer */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[11.5px]"
        style={{ background: 'rgba(53,68,106,0.12)', border: '1px solid rgba(53,68,106,0.25)', color: '#93A1BF' }}
      >
        <IconAlertTriangle s={16} className="text-[#C67A4E] shrink-0 mt-0.5" />
        <span>
          All financial reporting metrics are simulated in Bangladeshi Taka (BDT / ৳) for platform transparency, governance verification, and deal milestone tracking.
        </span>
      </div>

      {/* Stage Focus Notice (if not yet in milestone funding stage) */}
      {!isStageEligible && (
        <div className="p-4 rounded-xl bg-[#121A2B] border border-amber-800/40 text-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <IconLock s={14} />
            <span>Periodic Reporting Pending Milestone Activation</span>
          </div>
          <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">
            Periodic financial reports become active once the bilateral agreement is executed and milestone funding tranches commence (Stage 7).
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
          <p className="text-xs text-[color:var(--vv-text-tertiary)]">Loading deal financial statements...</p>
        </div>
      ) : (
        <>
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                Submitted Reports
              </p>
              <p className="text-xl font-bold text-[color:var(--vv-text)] font-mono mt-1">
                {reports.length}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                {verificationCounts.verified || 0} admin verified
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                Cumulative Revenue
              </p>
              <p className="text-xl font-bold text-[#22C55E] font-mono mt-1">
                {fmtBDT(totalRev)}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                Total reported gross
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                Cumulative Expenses
              </p>
              <p className="text-xl font-bold text-[color:var(--vv-text-secondary)] font-mono mt-1">
                {fmtBDT(totalExp)}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                Operating expenditures
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                Cumulative Net P/L
              </p>
              <p
                className={`text-xl font-bold font-mono mt-1 ${
                  Number(totalNet) >= 0 ? 'text-[#C67A4E]' : 'text-red-400'
                }`}
              >
                {fmtBDT(totalNet)}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                {latestCash !== null && latestCash !== undefined ? `Cash: ${fmtBDT(latestCash)}` : 'Reconciled net'}
              </p>
            </div>
          </div>

          {/* Verification Pipeline Breakdown Strip */}
          <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[color:var(--vv-text-secondary)]">
              <IconShield s={16} className="text-[#C67A4E]" />
              <span className="font-semibold text-[color:var(--vv-text)]">Verification Pipeline:</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A2338] text-[color:var(--vv-text-secondary)] text-[11.5px]">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Self-Reported: <strong className="text-[color:var(--vv-text)] font-mono">{verificationCounts.self_reported || 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A2338] text-[color:var(--vv-text-secondary)] text-[11.5px]">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Evidence Attached: <strong className="text-[#3B82F6] font-mono">{verificationCounts.evidence_submitted || 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A2338] text-[color:var(--vv-text-secondary)] text-[11.5px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Under Review: <strong className="text-[#F59E0B] font-mono">{verificationCounts.under_review || 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A2338] text-[color:var(--vv-text-secondary)] text-[11.5px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Admin Verified: <strong className="text-[#22C55E] font-mono">{verificationCounts.verified || 0}</strong>
              </span>
            </div>
          </div>

          {/* Reporting History Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-[color:var(--vv-text)]">
                Periodic Reporting History ({reports.length})
              </h3>
            </div>

            {reports.length === 0 ? (
              <div className="py-14 text-center rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#1C283E] flex items-center justify-center mx-auto text-[#5E6D8F]">
                  <IconFileText s={22} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[color:var(--vv-text)]">
                    No Financial Reports Submitted Yet
                  </h4>
                  <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mt-1">
                    {isFounder
                      ? isStageEligible
                        ? 'Click "Submit Financial Report" above to log periodic revenue, operating expenses, and attach verification evidence.'
                        : 'Periodic reporting will be enabled when the deal advances to milestone funding execution.'
                      : 'The founder has not yet submitted periodic financial performance statements for this deal.'}
                  </p>
                </div>
                {isFounder && isStageEligible && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IconPlus s={14} />}
                    onClick={() => {
                      resetForm();
                      setShowSubmitModal(true);
                    }}
                  >
                    Submit First Report
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#1c2a3e] overflow-hidden bg-[#121A2B]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#1c2a3e] bg-[#1A2338]/60 text-[10.5px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Reporting Period</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Expenses</th>
                        <th className="px-4 py-3 text-right">Net P/L</th>
                        <th className="px-4 py-3 text-right">Cash Position</th>
                        <th className="px-4 py-3 text-center">Evidence</th>
                        <th className="px-4 py-3">Verification</th>
                        {isFounder && <th className="px-4 py-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c2a3e]">
                      {reports.map((r) => {
                        const badgeCfg = STATUS_BADGE_MAP[r.status] || {
                          label: r.status_label || r.status,
                          variant: 'neutral',
                        };
                        const netVal = Number(r.net_profit_loss || 0);

                        return (
                          <tr key={r.id} className="hover:bg-[#1A2338]/40 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-[color:var(--vv-text)] font-mono text-[11.5px]">
                                {r.reporting_period_start} → {r.reporting_period_end}
                              </p>
                              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] block mt-0.5">
                                Report #{r.id} {r.created_at ? `• ${new Date(r.created_at).toLocaleDateString()}` : ''}
                              </span>
                              {r.notes && (
                                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic mt-1 line-clamp-1">
                                  Notes: {r.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[color:var(--vv-text)] font-medium">
                              {fmtBDT(r.revenue)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[color:var(--vv-text-tertiary)] font-medium">
                              {fmtBDT(r.expenses)}
                            </td>
                            <td
                              className={`px-4 py-3.5 text-right font-mono font-bold ${
                                netVal >= 0 ? 'text-[#22C55E]' : 'text-red-400'
                              }`}
                            >
                              {fmtBDT(r.net_profit_loss)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[color:var(--vv-text-secondary)]">
                              {r.cash_position !== null && r.cash_position !== undefined ? fmtBDT(r.cash_position) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] bg-[#1A2338] text-[color:var(--vv-text-secondary)] border border-[#1c2a3e]">
                                  <IconFileText s={12} className="text-[#C67A4E]" />
                                  {r.evidence_count || 0}
                                </span>
                                {r.evidences && r.evidences.length > 0 && (
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    {r.evidences.map((ev) => (
                                      <a
                                        key={ev.id}
                                        href={api.deals.financialReports.downloadEvidenceUrl(r.id, ev.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-[#C67A4E] hover:underline truncate max-w-[120px]"
                                        title={ev.original_filename}
                                      >
                                        {ev.original_filename}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant={badgeCfg.variant}>{badgeCfg.label}</Badge>
                              {r.admin_review_notes && (
                                <p className="text-[10px] text-[#22C55E] mt-1 max-w-[150px] truncate" title={r.admin_review_notes}>
                                  Admin: {r.admin_review_notes}
                                </p>
                              )}
                            </td>
                            {isFounder && (
                              <td className="px-4 py-3.5 text-right">
                                {r.status !== 'verified' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[11px] text-[#C67A4E] hover:bg-[#C67A4E]/10"
                                    onClick={() => {
                                      setAttachReportId(r.id);
                                      setAttachFile(null);
                                      setAttachError(null);
                                    }}
                                  >
                                    + Evidence
                                  </Button>
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
      {/* MODAL: SUBMIT FINANCIAL REPORT                                       */}
      {/* ==================================================================== */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-report-title"
        >
          <div className="bg-[#121A2B] border border-[#1c2a3e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E]">
                  <IconFileText s={16} />
                </div>
                <div>
                  <h3 id="submit-report-title" className="text-sm font-bold text-[color:var(--vv-text)] font-display">
                    Submit Periodic Financial Report
                  </h3>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                    {businessName || `Deal #${deal.id}`} • Operating Statement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] p-1"
                aria-label="Close"
              >
                <IconX s={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitReport} className="overflow-y-auto p-5 space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <IconAlertTriangle s={14} className="text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Reporting Period Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="period-start" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                    Period Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="period-start"
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                  />
                </div>
                <div>
                  <label htmlFor="period-end" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                    Period End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="period-end"
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                  />
                </div>
              </div>

              {/* Revenue & Expenses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gross-revenue" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                    Gross Revenue (BDT / ৳) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="gross-revenue"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                  />
                </div>
                <div>
                  <label htmlFor="operating-expenses" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                    Operating Expenses (BDT / ৳) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="operating-expenses"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                  />
                </div>
              </div>

              {/* Calculated Net P/L Preview Banner */}
              <div className="p-3.5 rounded-xl bg-[#0D1626] border border-[#1c2a3e] flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] block">
                    Calculated Net Profit / Loss
                  </span>
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                    Net P/L = Revenue − Expenses
                  </span>
                </div>
                <div
                  className={`font-mono text-base font-bold ${
                    previewNetPL >= 0 ? 'text-[#22C55E]' : 'text-red-400'
                  }`}
                >
                  {fmtBDT(previewNetPL)}
                </div>
              </div>

              {/* Optional Cash Position */}
              <div>
                <label htmlFor="cash-position" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Ending Cash Balance / Position (BDT) <span className="text-[color:var(--vv-text-tertiary)] font-normal">(Optional)</span>
                </label>
                <input
                  id="cash-position"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150000.00"
                  value={cashPosition}
                  onChange={(e) => setCashPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="report-notes" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Performance Notes & Commentary <span className="text-[color:var(--vv-text-tertiary)] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="report-notes"
                  rows={2}
                  placeholder="Key milestones achieved, operational context, revenue drivers..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] resize-none"
                />
              </div>

              {/* Supporting Evidence Upload */}
              <div className="p-3.5 rounded-xl bg-[#0D1626] border border-[#1c2a3e] space-y-2.5">
                <label htmlFor="evidence-file" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase">
                  Attach Supporting Verification Evidence <span className="text-[color:var(--vv-text-tertiary)] font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <select
                      id="evidence-type"
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-[#121A2B] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none"
                    >
                      <option value="bank_statement">Bank Statement</option>
                      <option value="audited_statement">Audited Statement</option>
                      <option value="tax_return">Tax Return</option>
                      <option value="invoices">Invoices / Receipts</option>
                      <option value="other">Other Supporting Document</option>
                    </select>
                  </div>
                  <div>
                    <input
                      id="evidence-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-[color:var(--vv-text-secondary)] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-[#1C283E] file:text-[#C67A4E] hover:file:bg-[#253550] cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                  Supported formats: PDF, JPG, JPEG, PNG (max 10MB).
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#1c2a3e]">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Report...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ATTACH EVIDENCE TO EXISTING REPORT                            */}
      {/* ==================================================================== */}
      {attachReportId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attach-evidence-title"
        >
          <div className="bg-[#121A2B] border border-[#1c2a3e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconShield s={16} className="text-[#C67A4E]" />
                <h3 id="attach-evidence-title" className="text-sm font-bold text-[color:var(--vv-text)] font-display">
                  Attach Evidence to Report #{attachReportId}
                </h3>
              </div>
              <button
                onClick={() => setAttachReportId(null)}
                className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] p-1"
                aria-label="Close"
              >
                <IconX s={18} />
              </button>
            </div>

            <form onSubmit={handleUploadAdditionalEvidence} className="p-5 space-y-4">
              {attachError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <IconAlertTriangle s={14} className="text-red-400 shrink-0" />
                  <span>{attachError}</span>
                </div>
              )}

              <div>
                <label htmlFor="attach-doc-type" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Evidence Document Type
                </label>
                <select
                  id="attach-doc-type"
                  value={attachType}
                  onChange={(e) => setAttachType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text)] focus:outline-none"
                >
                  <option value="bank_statement">Bank Statement</option>
                  <option value="audited_statement">Audited Statement</option>
                  <option value="tax_return">Tax Return</option>
                  <option value="invoices">Invoices / Receipts</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label htmlFor="attach-file" className="block text-[11px] font-semibold text-[color:var(--vv-text-secondary)] uppercase mb-1">
                  Select File (PDF, JPG, PNG &le; 10MB) <span className="text-red-400">*</span>
                </label>
                <input
                  id="attach-file"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[color:var(--vv-text-secondary)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#1C283E] file:text-[#C67A4E] hover:file:bg-[#253550] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#1c2a3e]">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setAttachReportId(null)}
                  disabled={uploadingEvidence}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={uploadingEvidence || !attachFile}
                >
                  {uploadingEvidence ? 'Uploading...' : 'Upload Evidence'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
