import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconFileText,
  IconCheck,
  IconEye,
  IconX,
  IconShield,
} from '../../components/layout/Icons';
import {
  api,
  ApiError,
  FinancialReportItem,
  AdminFinancialGovernanceOverviewData,
} from '../../services/api';

function fmtBDT(n: number): string {
  return '৳ ' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

type TabKey = 'reports' | 'governance' | 'discrepancies';

const STATUS_BADGE_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger' }> = {
  verified: { label: 'Verified', variant: 'success' },
  under_review: { label: 'Under Review', variant: 'warning' },
  evidence_submitted: { label: 'Evidence Attached', variant: 'info' },
  self_reported: { label: 'Self Reported', variant: 'neutral' },
  disputed: { label: 'Disputed', variant: 'danger' },
};

export default function AdminFinancialReports({ initialTab }: { initialTab?: TabKey }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');

  const defaultTab: TabKey = initialTab ?? (location.pathname.includes('financial-governance') ? 'governance' : 'reports');
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [governanceError, setGovernanceError] = useState(false);
  const [governanceLoading, setGovernanceLoading] = useState(true);
  const reportRequest = useRef(0);
  const governanceRequest = useRef(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Single report inspection state
  const [inspectingReport, setInspectingReport] = useState<FinancialReportItem | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyingInModal, setVerifyingInModal] = useState(false);

  const fetchGovernance = useCallback(async () => {
    const request = ++governanceRequest.current;
    setGovernanceLoading(true);
    setGovernanceError(false);
    try {
      const result = await api.admin.financialReports.getGovernance();
      if (request === governanceRequest.current) setGovernance(result);
    } catch {
      if (request === governanceRequest.current) { setGovernance(null); setGovernanceError(true); }
    } finally {
      if (request === governanceRequest.current) setGovernanceLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const request = ++reportRequest.current;
    setLoading(true);
    setError(null);
    try {
      const reportsRes = await api.admin.financialReports.list({ page, q: search.trim() || undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
      if (request !== reportRequest.current) return;
      setReports(reportsRes.reports || []);
      setPagination(reportsRes.pagination);
      if (page > reportsRes.pagination.last_page) setPage(Math.max(1, reportsRes.pagination.last_page));
    } catch (err: any) {
      if (request !== reportRequest.current) return;
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load financial reports.');
      } else {
        setError('Unable to load administrative financial data.');
      }
    } finally {
      if (request === reportRequest.current) setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchData();
    return () => { reportRequest.current++; };
  }, [fetchData]);

  useEffect(() => {
    fetchGovernance();
    return () => { governanceRequest.current++; };
  }, [fetchGovernance]);

  // Handle report inspection when reportId URL param is present
  useEffect(() => {
    if (!reportIdParam) {
      setInspectingReport(null);
      setInspectError(null);
      setInspectLoading(false);
      return;
    }

    let isMounted = true;
    async function loadReportDetails(id: string) {
      setInspectLoading(true);
      setInspectError(null);
      try {
        const [reportData, auditLogsRes] = await Promise.all([
          api.admin.financialReports.get(id),
          api.admin.financialReports.getAuditLogs(id).catch(() => null),
        ]);

        if (isMounted) {
          const mergedReport: FinancialReportItem = {
            ...reportData,
            audit_logs: auditLogsRes?.audit_logs || reportData.audit_logs || [],
          };
          setInspectingReport(mergedReport);
          setVerifyNotes('');
        }
      } catch (err: any) {
        if (isMounted) {
          setInspectError(err?.message || `Financial report #${id} could not be loaded or was not found.`);
          setInspectingReport(null);
        }
      } finally {
        if (isMounted) {
          setInspectLoading(false);
        }
      }
    }

    loadReportDetails(reportIdParam);

    return () => {
      isMounted = false;
    };
  }, [reportIdParam]);

  const handleOpenInspect = (id: number | string) => {
    const next = new URLSearchParams(searchParams);
    next.set('reportId', String(id));
    setSearchParams(next);
  };

  const handleCloseInspect = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('reportId');
    setSearchParams(next);
    setInspectingReport(null);
    setInspectError(null);
  };

  async function handleVerifyReport(reportId: number, customNotes?: string) {
    setActionLoading(reportId);
    setError(null);
    try {
      const notes = customNotes || 'Admin verified periodic financial performance figures against supporting evidence.';
      await api.admin.financialReports.review(reportId, {
        status: 'verified',
        notes,
      });
      setActionSuccess(`Report #${reportId} marked as verified.`);
      setTimeout(() => setActionSuccess(null), 3000);

      // If currently inspecting this report in modal, update its local state
      if (inspectingReport && inspectingReport.id === reportId) {
        setInspectingReport(prev => prev ? {
          ...prev,
          status: 'verified',
          status_label: 'Verified',
          reviewed_at: new Date().toISOString(),
          admin_review_notes: notes,
        } : null);
      }

      fetchData();
      fetchGovernance();
    } catch (err: any) {
      const msg = err?.message || 'Failed to verify report.';
      setError(msg);
      if (inspectingReport) {
        setInspectError(msg);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerifyFromModal() {
    if (!inspectingReport) return;
    setVerifyingInModal(true);
    await handleVerifyReport(inspectingReport.id, verifyNotes.trim() || undefined);
    setVerifyingInModal(false);
  }

  const filteredReports = reports;

  const discrepancyReports = reports.filter(r => (r.discrepancy_count || 0) > 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight">
              Financial Reports & Governance
            </h1>
            <Badge variant="accent">Admin Oversight</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Audit operational P&L reporting, evidence verification pipelines, and flag discrepancies across all deals.
          </p>
        </div>

        {/* Global Governance Summary Cards */}
        {governance && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-[10px] bg-[#121A2B] border border-[color:var(--vv-border)] text-right">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Total Revenue</p>
              <p className="text-[14px] font-bold text-[#22C55E] font-mono">
                {fmtBDT(governance.financial_totals_bdt.total_reported_revenue)}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-[10px] bg-[#121A2B] border border-[color:var(--vv-border)] text-right">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Net P/L</p>
              <p className="text-[14px] font-bold text-[#C67A4E] font-mono">
                {fmtBDT(governance.financial_totals_bdt.total_calculated_profit_loss)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action / Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-[10px] bg-green-950/40 border border-green-800/60 text-green-300 text-[12.5px] flex items-center gap-2">
          <IconCheck className="w-4 h-4 text-green-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
          {error}
        </div>
      )}

      {/* Simulation Notice */}
      {governanceError && <div role="alert" className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
        Unable to load governance metrics. <Button size="sm" variant="secondary" onClick={fetchGovernance}>Retry governance</Button>
      </div>}
      {activeTab === 'governance' && governanceLoading && <p role="status">Loading governance metrics...</p>}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] text-[11.5px]"
        style={{ background: 'rgba(53,68,106,0.12)', border: '1px solid rgba(53,68,106,0.25)', color: '#93A1BF' }}
      >
        <IconAlertTriangle className="w-4 h-4 text-[#C67A4E] shrink-0 mt-0.5" />
        <span>
          {governance?.disclaimer ||
            'All financial reporting figures are recorded in Bangladeshi Taka (BDT / ৳) for platform governance and verifiable simulation purposes.'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[color:var(--vv-border)] pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-[color:var(--vv-raised)] text-[color:var(--vv-text)] border border-[color:var(--vv-border-strong)]'
              : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]'
          }`}
        >
          Operational Reports ({pagination.total})
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all ${
            activeTab === 'governance'
              ? 'bg-[color:var(--vv-raised)] text-[color:var(--vv-text)] border border-[color:var(--vv-border-strong)]'
              : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]'
          }`}
        >
          Governance & Pipeline
        </button>
        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all ${
            activeTab === 'discrepancies'
              ? 'bg-[color:var(--vv-raised)] text-[color:var(--vv-text)] border border-[color:var(--vv-border-strong)]'
              : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]'
          }`}
        >
          Discrepancies Queue ({discrepancyReports.length})
        </button>
      </div>

      {/* Tab: Operational Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <IconSearch className="w-4 h-4 text-[#5E6D8F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Filter by business or Deal ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-[8px] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] bg-[#121A2B] border border-[color:var(--vv-border)] focus:outline-none focus:ring-1 focus:ring-[#C67A4E]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1">
                <IconFilter className="w-3.5 h-3.5" /> Status:
              </span>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] text-[color:var(--vv-text)] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="self_reported">Self Reported</option>
                <option value="evidence_submitted">Evidence Attached</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading financial reports from ledger...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <IconFileText className="w-10 h-10 text-[#5E6D8F] mx-auto mb-2 opacity-60" />
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">No financial reports found</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                Reports submitted by founders on completed or active deals will appear here for admin audit.
              </p>
            </div>
          ) : (
            <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="border-b border-[color:var(--vv-border)] bg-[#1A2338]/60 text-[10.5px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Report & Deal</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3 text-right">Revenue (BDT)</th>
                      <th className="px-4 py-3 text-right">Expenses (BDT)</th>
                      <th className="px-4 py-3 text-right">Net P/L (BDT)</th>
                      <th className="px-4 py-3 text-center">Evidence</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--vv-border)]">
                    {filteredReports.map(report => {
                      const badgeCfg = STATUS_BADGE_MAP[report.status] || {
                        label: report.status_label || report.status,
                        variant: 'neutral',
                      };
                      return (
                        <tr key={report.id} className="hover:bg-[#1A2338]/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[color:var(--vv-text)]">
                              {report.business?.name || report.business_name || `Business #${report.business_id || 'N/A'}`}
                            </p>
                            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">
                              Report #{report.id} • Deal #{report.deal_id}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-secondary)]">
                            {report.reporting_period_start} to {report.reporting_period_end}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-[color:var(--vv-text)]">
                            {fmtBDT(report.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-[color:var(--vv-text-tertiary)]">
                            {fmtBDT(report.expenses)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold ${
                              report.net_profit_loss >= 0 ? 'text-[#22C55E]' : 'text-red-400'
                            }`}
                          >
                            {fmtBDT(report.net_profit_loss)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] bg-[#1A2338] text-[color:var(--vv-text-secondary)] border border-[color:var(--vv-border)]">
                              <IconFileText className="w-3 h-3 text-[#C67A4E]" />
                              {report.evidence_count || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badgeCfg.variant}>{badgeCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<IconEye s={12} />}
                                onClick={() => handleOpenInspect(report.id)}
                              >
                                Inspect
                              </Button>
                              {report.status !== 'verified' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={actionLoading === report.id}
                                  onClick={() => handleVerifyReport(report.id)}
                                >
                                  {actionLoading === report.id ? 'Verifying...' : 'Verify'}
                                </Button>
                              ) : (
                                <span className="text-[11px] text-[#22C55E] font-medium flex items-center gap-1">
                                  <IconCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                              )}
                            </div>
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
      )}

      {/* Tab: Governance Overview */}
      {activeTab !== 'governance' && <nav aria-label="Report pagination" className="flex items-center justify-between gap-3 text-xs">
        <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span>Page {pagination.current_page} of {pagination.last_page} · {pagination.total} reports</span>
        <Button size="sm" variant="secondary" disabled={loading || page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
      </nav>}
      {activeTab === 'governance' && governance && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Total Reports</p>
              <p className="text-[22px] font-bold text-[color:var(--vv-text)] font-mono mt-1">
                {governance.overview.total_financial_reports_count}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                Across {governance.overview.total_deals_with_reporting} deals
              </p>
            </div>
            <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Verified Reports</p>
              <p className="text-[22px] font-bold text-[#22C55E] font-mono mt-1">
                {governance.verification_pipeline.verified_count}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                {governance.verification_pipeline.under_review_count} currently under review
              </p>
            </div>
            <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Open Discrepancies</p>
              <p className="text-[22px] font-bold text-[#C67A4E] font-mono mt-1">
                {governance.discrepancy_queue.pending_under_review_count}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                {governance.discrepancy_queue.resolved_count} resolved
              </p>
            </div>
          </div>

          <div className="rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] p-5 space-y-4">
            <h2 className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
              Verification Pipeline Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
              <div className="p-3 rounded-[8px] bg-[#1A2338]">
                <p className="text-[color:var(--vv-text-tertiary)]">Self-Reported</p>
                <p className="text-[16px] font-bold text-[color:var(--vv-text)] font-mono mt-0.5">
                  {governance.verification_pipeline.self_reported_count}
                </p>
              </div>
              <div className="p-3 rounded-[8px] bg-[#1A2338]">
                <p className="text-[color:var(--vv-text-tertiary)]">Evidence Attached</p>
                <p className="text-[16px] font-bold text-[#3B82F6] font-mono mt-0.5">
                  {governance.verification_pipeline.evidence_submitted_count}
                </p>
              </div>
              <div className="p-3 rounded-[8px] bg-[#1A2338]">
                <p className="text-[color:var(--vv-text-tertiary)]">Under Review</p>
                <p className="text-[16px] font-bold text-[#F59E0B] font-mono mt-0.5">
                  {governance.verification_pipeline.under_review_count}
                </p>
              </div>
              <div className="p-3 rounded-[8px] bg-[#1A2338]">
                <p className="text-[color:var(--vv-text-tertiary)]">Verified Clean</p>
                <p className="text-[16px] font-bold text-[#22C55E] font-mono mt-0.5">
                  {governance.verification_pipeline.verified_count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Discrepancies Queue */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          {discrepancyReports.length === 0 ? (
            <div className="py-16 text-center rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <IconCheck className="w-10 h-10 text-[#22C55E] mx-auto mb-2 opacity-80" />
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">Zero Discrepancies Flagged</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                All periodic reports across active and completed deals are currently reconciled without counterparty disputes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {discrepancyReports.map(r => (
                <div
                  key={r.id}
                  className="p-4 rounded-[12px] bg-[#121A2B] border border-amber-800/40 space-y-2 text-[12.5px]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[color:var(--vv-text)]">
                        {r.business?.name || r.business_name || `Business #${r.business_id}`}
                      </span>
                      <span className="text-[color:var(--vv-text-tertiary)] text-[11px] ml-2">
                        Deal #{r.deal_id} • Report #{r.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{r.discrepancy_count} Discrepanc{r.discrepancy_count === 1 ? 'y' : 'ies'}</Badge>
                      <Button size="sm" variant="ghost" icon={<IconEye s={12} />} onClick={() => handleOpenInspect(r.id)}>
                        Inspect
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded bg-[#1A2338] font-mono text-[11.5px]">
                    <div>Revenue: <strong>{fmtBDT(r.revenue)}</strong></div>
                    <div>Expenses: <strong>{fmtBDT(r.expenses)}</strong></div>
                    <div>Net: <strong>{fmtBDT(r.net_profit_loss)}</strong></div>
                  </div>
                  {r.notes && (
                    <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">
                      Notes: {r.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Inspection Modal / View ────────────────────────────────────────── */}
      {reportIdParam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-report-modal-title"
        >
          <div className="relative w-full max-w-3xl bg-[#121A2B] border border-[color:var(--vv-border-strong)] rounded-[16px] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[color:var(--vv-border)] flex items-center justify-between bg-[#1A2338]/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C67A4E]/15 border border-[#C67A4E]/30 flex items-center justify-center text-[#C67A4E]">
                  <IconFileText s={16} />
                </div>
                <div>
                  <h2 id="inspect-report-modal-title" className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">
                    Financial Report #{reportIdParam}
                  </h2>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                    Audit and administrative governance inspection
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseInspect}
                className="p-1.5 rounded-lg text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors"
                aria-label="Close inspection modal"
              >
                <IconX s={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {inspectLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-9 h-9 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
                  <p className="text-[13px] text-[color:var(--vv-text-secondary)]">Loading report #{reportIdParam} details from ledger...</p>
                </div>
              ) : inspectError ? (
                <div className="p-6 rounded-[12px] bg-red-950/40 border border-red-800/60 text-center space-y-3">
                  <IconAlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-[14px] font-semibold text-red-300">Report Inspection Failed</p>
                  <p className="text-[12.5px] text-red-200/80 max-w-md mx-auto">{inspectError}</p>
                  <Button size="sm" variant="secondary" onClick={handleCloseInspect}>
                    Back to Financial Reports
                  </Button>
                </div>
              ) : inspectingReport ? (
                <>
                  {/* Top Status & Overview Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[12px] bg-[#1A2338]/50 border border-[color:var(--vv-border)]">
                    <div>
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Current Audit Status:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={
                            STATUS_BADGE_MAP[inspectingReport.status]?.variant ||
                            (inspectingReport.status === 'verified' ? 'success' : 'warning')
                          }
                        >
                          {inspectingReport.status_label || inspectingReport.status}
                        </Badge>
                        {inspectingReport.status === 'verified' && (
                          <span className="text-[11.5px] text-[#22C55E] flex items-center gap-1 font-medium">
                            <IconShield s={13} /> Verified Clean
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Reporting Period</span>
                      <p className="text-[12.5px] font-mono text-[color:var(--vv-text)] font-medium mt-0.5">
                        {inspectingReport.reporting_period_start} → {inspectingReport.reporting_period_end}
                      </p>
                    </div>
                  </div>

                  {/* Financial Figures Grid (BDT) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-[12px] bg-[#1A2338] border border-[color:var(--vv-border)]">
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Revenue</p>
                      <p className="text-[15px] font-bold text-[#22C55E] font-mono mt-1">
                        {fmtBDT(inspectingReport.revenue)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-[12px] bg-[#1A2338] border border-[color:var(--vv-border)]">
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Expenses</p>
                      <p className="text-[15px] font-bold text-rose-400 font-mono mt-1">
                        {fmtBDT(inspectingReport.expenses)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-[12px] bg-[#1A2338] border border-[color:var(--vv-border)]">
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Net P/L</p>
                      <p
                        className={`text-[15px] font-bold font-mono mt-1 ${
                          inspectingReport.net_profit_loss >= 0 ? 'text-[#22C55E]' : 'text-red-400'
                        }`}
                      >
                        {fmtBDT(inspectingReport.net_profit_loss)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-[12px] bg-[#1A2338] border border-[color:var(--vv-border)]">
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Cash Position</p>
                      <p className="text-[14px] font-bold text-[#C67A4E] font-mono mt-1 truncate">
                        {inspectingReport.cash_position !== null && inspectingReport.cash_position !== undefined
                          ? fmtBDT(inspectingReport.cash_position)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Business & Deal Details */}
                  <div className="p-4 rounded-[12px] bg-[#1A2338]/40 border border-[color:var(--vv-border)] space-y-3">
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">
                      Deal & Stakeholder Identification
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[12px]">
                      <div className="flex justify-between py-1 border-b border-[color:var(--vv-border)]">
                        <span className="text-[color:var(--vv-text-tertiary)]">Business:</span>
                        <span className="font-semibold text-[color:var(--vv-text)]">
                          {inspectingReport.business?.name || inspectingReport.business_name || `Business #${inspectingReport.business_id || 'N/A'}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[color:var(--vv-border)]">
                        <span className="text-[color:var(--vv-text-tertiary)]">Deal ID:</span>
                        <span className="font-mono font-medium text-[color:var(--vv-text)]">
                          #{inspectingReport.deal_id || inspectingReport.deal?.id}
                          {inspectingReport.deal?.stage ? ` (${inspectingReport.deal.stage.replace(/_/g, ' ')})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[color:var(--vv-border)]">
                        <span className="text-[color:var(--vv-text-tertiary)]">Submitted By:</span>
                        <span className="font-medium text-[color:var(--vv-text)]">
                          {inspectingReport.submitted_by?.name || inspectingReport.deal?.founder?.name || `User #${inspectingReport.submitted_by_user_id || 'N/A'}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[color:var(--vv-border)]">
                        <span className="text-[color:var(--vv-text-tertiary)]">Counterparty:</span>
                        <span className="font-medium text-[color:var(--vv-text)]">
                          {inspectingReport.deal?.counterparty?.name
                            ? `${inspectingReport.deal.counterparty.name} (${inspectingReport.deal.counterparty.role || 'counterparty'})`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[color:var(--vv-text-tertiary)]">Created At:</span>
                        <span className="text-[color:var(--vv-text-secondary)]">
                          {inspectingReport.created_at ? new Date(inspectingReport.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[color:var(--vv-text-tertiary)]">Last Reviewed:</span>
                        <span className="text-[color:var(--vv-text-secondary)]">
                          {inspectingReport.reviewed_at ? new Date(inspectingReport.reviewed_at).toLocaleString() : 'Not reviewed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Founder Comments */}
                  <div>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider mb-1.5">
                      Founder Operational Notes
                    </p>
                    <div className="p-3.5 rounded-[10px] bg-[#1A2338]/60 border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)]">
                      {inspectingReport.notes || <span className="text-[color:var(--vv-text-tertiary)] italic">No operational notes supplied with this report.</span>}
                    </div>
                  </div>

                  {/* Evidence Files Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">
                        Cryptographic Evidence & Documents ({inspectingReport.evidences?.length || inspectingReport.evidence_count || 0})
                      </p>
                    </div>
                    {inspectingReport.evidences && inspectingReport.evidences.length > 0 ? (
                      <div className="space-y-2">
                        {inspectingReport.evidences.map(ev => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between p-3 rounded-[10px] bg-[#1A2338]/60 border border-[color:var(--vv-border)]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#C67A4E]/15 border border-[#C67A4E]/30 flex items-center justify-center text-[#C67A4E] shrink-0">
                                <IconFileText s={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">
                                  {ev.original_filename}
                                </p>
                                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                                  {ev.evidence_type?.replace(/_/g, ' ') || 'Supporting Document'} • {formatBytes(ev.file_size)} • {ev.mime_type}
                                  {ev.uploaded_by?.name ? ` • Uploaded by ${ev.uploaded_by.name}` : ''}
                                </p>
                              </div>
                            </div>
                            <a
                              href={api.admin.financialReports.downloadEvidenceUrl(inspectingReport.id, ev.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-[8px] bg-[color:var(--vv-raised)] hover:bg-[#1f2b44] text-[11.5px] font-semibold text-[color:var(--vv-text)] border border-[color:var(--vv-border)] shrink-0 transition-colors"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-[10px] bg-[#1A2338]/30 border border-[color:var(--vv-border)] text-center text-[12px] text-[color:var(--vv-text-tertiary)]">
                        No verification evidence files are attached to this report.
                      </div>
                    )}
                  </div>

                  {/* Discrepancies if any */}
                  {inspectingReport.discrepancies && inspectingReport.discrepancies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] text-amber-400 uppercase font-semibold tracking-wider">
                        Associated Discrepancies ({inspectingReport.discrepancies.length})
                      </p>
                      {inspectingReport.discrepancies.map(disc => (
                        <div
                          key={disc.id}
                          className="p-3.5 rounded-[10px] bg-amber-950/20 border border-amber-800/40 space-y-1.5 text-[12px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-200">Discrepancy #{disc.id}</span>
                            <Badge variant={disc.status === 'resolved' ? 'success' : 'warning'}>
                              {disc.status}
                            </Badge>
                          </div>
                          <p className="text-[color:var(--vv-text)]">{disc.reason}</p>
                          {disc.admin_resolution_notes && (
                            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                              Admin Notes: {disc.admin_resolution_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audit Logs Trail */}
                  {inspectingReport.audit_logs && inspectingReport.audit_logs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">
                        Audit Trail & Governance History ({inspectingReport.audit_logs.length})
                      </p>
                      <div className="divide-y divide-[color:var(--vv-border)] rounded-[10px] border border-[color:var(--vv-border)] bg-[#1A2338]/40 overflow-hidden text-[11.5px]">
                        {inspectingReport.audit_logs.map(log => (
                          <div key={log.id} className="p-2.5 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-[color:var(--vv-text)] uppercase tracking-wide text-[10.5px]">
                                {log.action?.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[color:var(--vv-text-tertiary)] ml-2">
                                by {log.actor?.name || log.actor_role || 'System'}
                              </span>
                            </div>
                            <span className="text-[10.5px] font-mono text-[color:var(--vv-text-secondary)]">
                              {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Workflow Panel */}
                  <div className="p-4 rounded-[12px] bg-[#1A2338]/70 border border-[color:var(--vv-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">
                        Administrative Audit Decision
                      </p>
                      {inspectingReport.status === 'verified' && (
                        <span className="text-[11.5px] text-[#22C55E] font-medium flex items-center gap-1">
                          <IconCheck className="w-3.5 h-3.5" /> Report is Verified
                        </span>
                      )}
                    </div>

                    {inspectingReport.status !== 'verified' ? (
                      <div className="space-y-3">
                        <textarea
                          value={verifyNotes}
                          onChange={e => setVerifyNotes(e.target.value)}
                          placeholder="Optional audit review notes (e.g., Verified bank statements and invoices)..."
                          className="w-full px-3 py-2 rounded-[8px] bg-[#121A2B] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:ring-1 focus:ring-[#C67A4E] resize-none h-18"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCloseInspect}
                          >
                            Close
                          </Button>
                          <Button
                            size="sm"
                            disabled={verifyingInModal}
                            onClick={handleVerifyFromModal}
                          >
                            {verifyingInModal ? 'Verifying...' : 'Verify Report'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] space-y-1">
                        {inspectingReport.admin_review_notes && (
                          <p className="text-[color:var(--vv-text-secondary)]">
                            <strong className="text-[color:var(--vv-text)]">Review Notes:</strong> {inspectingReport.admin_review_notes}
                          </p>
                        )}
                        {inspectingReport.reviewed_by && (
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                            Reviewed by {inspectingReport.reviewed_by.name}
                            {inspectingReport.reviewed_at ? ` on ${new Date(inspectingReport.reviewed_at).toLocaleString()}` : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[color:var(--vv-border)] bg-[#1A2338]/60 flex items-center justify-end shrink-0">
              <Button size="sm" variant="secondary" onClick={handleCloseInspect}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

