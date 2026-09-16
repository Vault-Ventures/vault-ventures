import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconFileText,
  IconCheck,
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

type TabKey = 'reports' | 'governance' | 'discrepancies';

const STATUS_BADGE_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  verified: { label: 'Verified', variant: 'success' },
  under_review: { label: 'Under Review', variant: 'warning' },
  evidence_submitted: { label: 'Evidence Attached', variant: 'info' },
  self_reported: { label: 'Self Reported', variant: 'neutral' },
};

export default function AdminFinancialReports({ initialTab }: { initialTab?: TabKey }) {
  const location = useLocation();
  const defaultTab: TabKey = initialTab ?? (location.pathname.includes('financial-governance') ? 'governance' : 'reports');
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, govRes] = await Promise.all([
        api.admin.financialReports.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
        api.admin.financialReports.getGovernance().catch(() => null),
      ]);
      setReports(reportsRes.reports || []);
      setGovernance(govRes);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load financial reports.');
      } else {
        setError('Unable to load administrative financial data.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleVerifyReport(reportId: number) {
    setActionLoading(reportId);
    setError(null);
    try {
      await api.admin.financialReports.review(reportId, {
        status: 'verified',
        notes: 'Admin verified periodic financial performance figures against supporting evidence.',
      });
      setActionSuccess(`Report #${reportId} marked as verified.`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to verify report.');
    } finally {
      setActionLoading(null);
    }
  }

  const filteredReports = reports.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (r.business_name && r.business_name.toLowerCase().includes(q)) ||
      String(r.deal_id).includes(q) ||
      String(r.id).includes(q);
    return matchesSearch;
  });

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
          Operational Reports ({reports.length})
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
                  onChange={e => setSearch(e.target.value)}
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
                onChange={e => setStatusFilter(e.target.value)}
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
                              {report.business_name || `Business #${report.business_id || 'N/A'}`}
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
                              <span className="text-[11px] text-[#22C55E] font-medium flex items-center justify-end gap-1">
                                <IconCheck className="w-3.5 h-3.5" /> Verified
                              </span>
                            )}
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
                        {r.business_name || `Business #${r.business_id}`}
                      </span>
                      <span className="text-[color:var(--vv-text-tertiary)] text-[11px] ml-2">
                        Deal #{r.deal_id} • Report #{r.id}
                      </span>
                    </div>
                    <Badge variant="warning">{r.discrepancy_count} Discrepanc{r.discrepancy_count === 1 ? 'y' : 'ies'}</Badge>
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
    </div>
  );
}
