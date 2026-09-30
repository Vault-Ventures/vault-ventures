import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api, AdminFinancialGovernanceOverviewData } from '../../services/api';
import AdvancedAnalyticsCharts from './AdvancedAnalyticsCharts';

const SURFACE = '#121A2B';
const C1 = '#C67A4E';
const C2 = '#C9A24B';
const C4 = '#22C55E';

function formatBDT(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '—';
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
      setError(err?.message || 'Failed to load platform governance analytics.');
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
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Persisted financial reports and governance metrics. Refresh manually for the latest figures.</p>
          <p role="status" aria-live="polite" className="sr-only">
            {loading ? 'Refreshing governance metrics.' : error ? '' : 'Governance metrics updated.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Authoritative Backend Data</Badge>
          <Button size="sm" variant="secondary" onClick={fetchAnalytics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </Button>
        </div>
      </div>


      {error && (
        <div role="alert" className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>{governance ? 'Stale data: refresh failed. Showing the last successful values. ' : 'Metrics unavailable. '}{error}</span>
          <button disabled={loading} onClick={fetchAnalytics} className="underline text-red-200">Retry</button>
        </div>
      )}

      {/* Persisted Financial Metrics */}
      <section>
        <h2 className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">Capital & Governance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Reported Revenue</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]">
              {loading && !governance ? '...' : formatBDT(governance?.financial_totals_bdt?.total_reported_revenue)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">All reporting entities</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Reported Expenses</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: C2 }}>
              {loading && !governance ? '...' : formatBDT(governance?.financial_totals_bdt?.total_reported_expenses)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">Operating disclosures</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Net Calculated Profit/Loss</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: (governance?.financial_totals_bdt?.total_calculated_profit_loss ?? 0) >= 0 ? C4 : '#F04438' }}>
              {loading && !governance ? '...' : formatBDT(governance?.financial_totals_bdt?.total_calculated_profit_loss)}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">Cumulative reported net</p>
          </div>

          <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">Governance Reports</p>
            <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]" style={{ color: C1 }}>
              {loading && !governance ? '...' : (governance?.overview?.total_financial_reports_count ?? '\u2014')}
            </p>
            <p className="text-[10.5px] mt-0.5 text-[color:var(--vv-text-tertiary)]">
              {loading && !governance ? '...' : governance?.verification_pipeline?.verified_count ?? '\u2014'} verified
            </p>
          </div>
        </div>
      </section>

      {/* Verification Pipeline Breakdown */}
      <section>
        <h2 className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">Financial Verification Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Self Reported</p>
            <p className="font-mono text-xl font-bold text-[color:var(--vv-text)]">{loading && !governance ? '...' : governance?.verification_pipeline?.self_reported_count ?? '\u2014'}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Evidence Submitted</p>
            <p className="font-mono text-xl font-bold text-[#C67A4E]">{loading && !governance ? '...' : governance?.verification_pipeline?.evidence_submitted_count ?? '\u2014'}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Under Review</p>
            <p className="font-mono text-xl font-bold text-[#F59E0B]">{loading && !governance ? '...' : governance?.verification_pipeline?.under_review_count ?? '\u2014'}</p>
          </div>
          <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4" style={{ background: SURFACE }}>
            <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Verified Audit</p>
            <p className="font-mono text-xl font-bold text-[#22C55E]">{loading && !governance ? '...' : governance?.verification_pipeline?.verified_count ?? '\u2014'}</p>
          </div>
        </div>
      </section>

      {/* Unavailable Time-Series Analytics notice */}
      {governance && <AdvancedAnalyticsCharts data={governance} />}
      <section className="space-y-4">
        <h2 className="font-display text-[14px] font-semibold text-[color:var(--vv-text)]">Predictive & Historical Analytics</h2>
        <div className="rounded-[12px] border border-[color:var(--vv-border)] p-6 text-center space-y-3" style={{ background: SURFACE }}>
          <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-[color:var(--vv-text)]">Predictive Analytics Unavailable</h3>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-lg mx-auto">
            Predictive analytics are not implemented. No forecasting service or prediction model is available. Historical comparisons above use only persisted reporting periods, without forecasts or estimated values.
          </p>
        </div>
      </section>
    </div>
  );
}
