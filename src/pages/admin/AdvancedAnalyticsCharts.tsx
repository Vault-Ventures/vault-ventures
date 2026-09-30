import React from 'react';
import { AdminFinancialGovernanceOverviewData } from '../../services/api';

type Row = { label: string; value: number; color: string };
const panel = 'rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 sm:p-6 min-w-0';
const money = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const financialRows = (revenue: number, expenses: number, net: number): Row[] => [
  { label: 'Revenue', value: revenue, color: '#C67A4E' },
  { label: 'Expenses', value: expenses, color: '#C9A24B' },
  { label: 'Net P/L', value: net, color: net < 0 ? '#F04438' : '#22C55E' },
];

// Only chart geometry is calculated here. All amounts/counts come from the API.
function Bars({ rows, currency = false, scale, signedScale }: { rows: Row[]; currency?: boolean; scale?: number; signedScale?: boolean }) {
  const extent = scale ?? Math.max(...rows.map(row => Math.abs(row.value)), 0);
  const signed = signedScale ?? rows.some(row => row.value < 0);
  return <><dl className="space-y-3">
    {rows.map(row => <div key={row.label} className="min-w-0">
      <div className="flex flex-wrap justify-between gap-2 text-xs mb-1">
        <dt className="text-[color:var(--vv-text-secondary)]">{row.label}</dt>
        <dd className="font-mono text-[color:var(--vv-text)] [overflow-wrap:anywhere]">{currency ? money(row.value) : row.value.toLocaleString('en-BD')}</dd>
      </div>
      <div aria-hidden="true" className="h-3 relative rounded bg-[#1A2338] overflow-hidden">
        <span className="absolute h-full" style={{ background: row.color,
          width: `${extent ? Math.abs(row.value) / extent * (signed ? 50 : 100) : 0}%`,
          left: `${signed ? (row.value < 0 ? 50 - Math.abs(row.value) / extent * 50 : 50) : 0}%`,
        }} />
        {signed && <span className="absolute left-1/2 inset-y-0 border-l border-white/60" />}
      </div>
    </div>)}
  </dl>{signed && <p className="mt-2 text-[10.5px] text-[color:var(--vv-text-tertiary)]">Zero is at the center; negative values extend left.</p>}</>;
}

export default function AdvancedAnalyticsCharts({ data }: { data: AdminFinancialGovernanceOverviewData }) {
  const totals = data.financial_totals_bdt;
  const pipeline = data.verification_pipeline;
  const periods = data.reporting_periods;
  const countRows: Row[] = [
    { label: 'Self Reported', value: pipeline.self_reported_count, color: '#93A1BF' },
    { label: 'Evidence Submitted', value: pipeline.evidence_submitted_count, color: '#C67A4E' },
    { label: 'Under Review', value: pipeline.under_review_count, color: '#F59E0B' },
    { label: 'Verified', value: pipeline.verified_count, color: '#22C55E' },
  ];
  const periodScale = periods?.length ? Math.max(...periods.flatMap(p => [Math.abs(p.revenue), Math.abs(p.expenses), Math.abs(p.net_profit_loss)])) : 0;
  return <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section aria-labelledby="financial-comparison" className={panel}>
        <h2 id="financial-comparison" className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-2">Financial comparison</h2>
        <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-4">Cumulative reported amounts in BDT across all statuses.</p>
        <Bars currency rows={financialRows(totals.total_reported_revenue, totals.total_reported_expenses, totals.total_calculated_profit_loss)} />
        {data.overview.total_financial_reports_count === 0 && <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-4">No financial reports recorded.</p>}
      </section>
      <section aria-labelledby="verification-distribution" className={panel}>
        <h2 id="verification-distribution" className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-2">Verification distribution</h2>
        <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-4">Current report counts by status; these are not conversion rates.</p>
        <Bars rows={countRows} />
      </section>
    </div>
    <section aria-labelledby="reporting-history" className={panel}>
      <h2 id="reporting-history" className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-2">Historical reporting periods</h2>
      {!periods ? <p className="text-xs text-[color:var(--vv-text-tertiary)]">Historical period data is unavailable from the current response. Refresh to try again.</p>
        : periods.length < 2 ? <div className="py-5 text-center space-y-2">
          <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">More reporting periods required</h3>
          <p className="text-xs text-[color:var(--vv-text-tertiary)]">{periods.length} reporting period{periods.length === 1 ? '' : 's'} recorded. At least two distinct periods are needed for a historical comparison. No trend is inferred.</p>
          {periods[0] && <p className="text-xs text-[color:var(--vv-text-secondary)]">Available period: {date(periods[0].start)} – {date(periods[0].end)}</p>}
        </div> : <>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-4">Oldest first, using a shared amount scale. Totals group identical start/end dates. Period lengths and reporting businesses may differ or overlap; no missing periods are estimated.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[600px] overflow-y-auto" tabIndex={0} aria-label="Historical period comparisons">
            {periods.map(period => <section key={`${period.start}-${period.end}`} className="min-w-0 border border-[color:var(--vv-border)] rounded-lg p-3">
              <h3 className="text-xs text-[color:var(--vv-text)] mb-1">{date(period.start)} – {date(period.end)}</h3>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-3">{period.reports_count} reports</p>
              <Bars currency scale={periodScale} signedScale={periods.some(p => p.revenue < 0 || p.expenses < 0 || p.net_profit_loss < 0)} rows={financialRows(period.revenue, period.expenses, period.net_profit_loss)} />
            </section>)}
          </div>
        </>}
    </section>
  </div>;
}
