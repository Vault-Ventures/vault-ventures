import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconBarChart, IconFileText, IconTrendingUp, IconAlertTriangle } from '../../components/layout/Icons';
import { api, AdminFinancialGovernanceOverviewData } from '../../services/api';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [gov, setGov] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadMetrics() {
      try {
        setLoading(true);
        setError(false);
        const data = await api.admin.financialReports.getGovernance();
        if (mounted) setGov(data);
      } catch {
        if (mounted) { setGov(null); setError(true); }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Platform Analytics</h1>
            <Badge variant="neutral">Financial Governance Metrics</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Administrative metrics from persisted financial submissions. Use Refresh to load the latest figures.
          </p>
        </div>
        <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        <Button size="sm" onClick={() => navigate('/app/admin/financial-governance')}>
          Detailed Governance
        </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      {error && <div role="alert" className="p-4 rounded-[14px] border border-red-800/60 text-red-300 text-sm">
        Unable to load analytics. <Button size="sm" variant="secondary" onClick={() => setRefresh(v => v + 1)}>Retry</Button>
      </div>}
      {!error && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Total Submissions</p>
          <p className="font-mono text-2xl font-bold text-[color:var(--vv-text)]">
            {loading ? '—' : gov?.overview?.total_financial_reports_count ?? 0}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Platform financial reports</p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Verified Reports</p>
          <p className="font-mono text-2xl font-bold text-[#22C55E]">
            {loading ? '—' : gov?.verification_pipeline?.verified_count ?? 0}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Passed audit inspection</p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Unresolved Flags</p>
          <p className="font-mono text-2xl font-bold text-[#F04438]">
            {loading ? '—' : gov?.discrepancy_queue?.pending_under_review_count ?? 0}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Open audit discrepancies</p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Active Reporting Deals</p>
          <p className="font-mono text-2xl font-bold text-[#C67A4E]">
            {loading ? '—' : gov?.overview?.active_reporting_deals_count ?? '—'}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Deals submitting disclosures</p>
        </div>
      </div>

      {/* Information Banner */}
      </>}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-8 text-center">
        <IconBarChart s={32} className="mx-auto mb-3 text-[#C67A4E]" />
        <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
          Authoritative Aggregated Telemetry
        </h2>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-4">
          Statistics reflect persisted financial reports and audit states as of the latest refresh.
        </p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/app/admin/financial-reports')}>
          Inspect Individual Reports
        </Button>
      </div>
    </div>
  );
}
