import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../components/ui/Badge';
import {
  IconSearch,
  IconFilter,
  IconAlertTriangle,
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

export default function AdminInvestmentOversight() {
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [govRes, reportsRes] = await Promise.all([
        api.admin.financialReports.getGovernance(),
        api.admin.financialReports.list({ per_page: 50 }).catch(() => ({ reports: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 } })),
      ]);
      setGovernance(govRes);
      setReports(reportsRes.reports || []);
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

  const filteredReports = reports.filter(r => {
    const q = search.toLowerCase();
    return (
      !q ||
      (r.business_name && r.business_name.toLowerCase().includes(q)) ||
      String(r.deal_id).includes(q) ||
      String(r.id).includes(q)
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
            Platform-level oversight of reported deal finances, milestone reporting activity, and discrepancy controls.
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
          {governance?.disclaimer ||
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
          {/* Global Totals Grid */}
          {governance && (
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
                    governance.financial_totals_bdt.total_calculated_profit_loss >= 0
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
          )}

          {/* Verification Pipeline & Discrepancies Overview */}
          {governance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[14px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
                <h2 className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                  Report Verification Pipeline
                </h2>
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
                <h2 className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">
                  Discrepancies & Flagged Audits
                </h2>
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
          )}

          {/* Active Operational Deal Records */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[color:var(--vv-text)]">
                Deal Financial Reporting Ledger ({filteredReports.length})
              </h2>
              <div className="relative w-64">
                <IconSearch className="w-4 h-4 text-[#5E6D8F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                      {filteredReports.map(r => (
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
                              r.net_profit_loss >= 0 ? 'text-[#22C55E]' : 'text-red-400'
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
