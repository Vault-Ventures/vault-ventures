import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api, AdminFinancialGovernanceOverviewData } from '../../services/api';

const SURFACE = '#121A2B';
const C1 = '#C67A4E';
const C2 = '#C9A24B';
const C4 = '#22C55E';

function formatBDT(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '৳0';
  const val = Number(amount);
  return `৳${val.toLocaleString('en-BD')}`;
}

export default function AdminAdvancedAnalytics() {
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.financialReports.getGovernance();
      setGovernance(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live platform governance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Advanced Analytics & Governance</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Live platform capital distribution, governance metrics, and analytical telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Authoritative Backend Data</Badge>
          <Button size="sm" variant="secondary" onClick={fetchAnalytics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="underline text-red-200">Retry</button>
        </div>
      )}

      {/* Live Financial Metrics */}
      <section>
        <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">Capital & Governance Summary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Reported Revenue</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]">
              {loading ? '...' : formatBDT(governance?.financial_totals_bdt?.total_reported_revenue)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">All reporting entities</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Reported Expenses</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: C2 }}>
              {loading ? '...' : formatBDT(governance?.financial_totals_bdt?.total_reported_expenses)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">Operating disclosures</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Net Calculated Profit/Loss</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: (governance?.financial_totals_bdt?.total_calculated_profit_loss ?? 0) >= 0 ? C4 : '#F04438' }}>
              {loading ? '...' : formatBDT(governance?.financial_totals_bdt?.total_calculated_profit_loss)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">Cumulative audited net</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Governance Reports</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: C1 }}>
              {loading ? '...' : (governance?.overview?.total_financial_reports_count ?? 0)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">
              {governance?.verification_pipeline?.verified_count ?? 0} verified
            </p>
          </div>
        </div>
      </section>

      {/* Verification Pipeline Breakdown */}
      <section>
        <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">Financial Verification Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Self Reported</p>
            <p className="font-mono text-xl font-bold text-[color:var(--vv-text)]">{loading ? '...' : governance?.verification_pipeline?.self_reported_count ?? 0}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Evidence Submitted</p>
            <p className="font-mono text-xl font-bold text-[#C67A4E]">{loading ? '...' : governance?.verification_pipeline?.evidence_submitted_count ?? 0}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Under Review</p>
            <p className="font-mono text-xl font-bold text-[#F59E0B]">{loading ? '...' : governance?.verification_pipeline?.under_review_count ?? 0}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Verified Audit</p>
            <p className="font-mono text-xl font-bold text-[#22C55E]">{loading ? '...' : governance?.verification_pipeline?.verified_count ?? 0}</p>
          </div>
        </div>
      </section>

      {/* Unavailable Time-Series Analytics notice */}
      <section className="space-y-4">
        <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)]">Predictive & Historical Analytics</p>
        <div className="rounded-[12px] border border-[color:var(--vv-border)] p-6 text-center space-y-3" style={{ background: SURFACE }}>
          <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-[color:var(--vv-text)]">Time-Series Aggregation Jobs Not Exposed</h3>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-lg mx-auto">
            Rolling weekly readiness distributions, multi-week match score trends, and commission prediction charts are computed via asynchronous analytics worker tasks. Real-time platform governance and capital telemetry are displayed above from authoritative backend endpoints.
          </p>
        </div>
      </section>
    </div>
  );
}