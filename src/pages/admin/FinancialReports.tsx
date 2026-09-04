import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconAlertTriangle, IconSearch, IconFilter, IconFileText } from '../../components/layout/Icons';

// --- Types --------------------------------------------------------------------

type ReportPeriod = 'Aug 2026' | 'Jul 2026' | 'Jun 2026' | 'May 2026';
type DiscrepancyLevel = 'none' | 'minor' | 'moderate' | 'significant';

interface PLEntry {
  deal: string;
  model: 'large' | 'micro';
  business: string;
  investor: string;
  period: string;
  revenue: number;
  expenses: number;
  plSharePct?: number;
  equityPct?: string;
  discrepancy: DiscrepancyLevel;
  note?: string;
}

interface MilestoneFundingEntry {
  deal: string;
  business: string;
  milestone: string;
  amount: number;
  status: 'completed' | 'active' | 'submitted' | 'upcoming';
  date: string;
  evidenceStatus: 'verified' | 'pending' | 'disputed' | 'not_submitted';
}

interface InvestmentSummary {
  id: string;
  business: string;
  model: 'large' | 'micro';
  totalAmount: number;
  deployed: number;
  pending: number;
  status: 'active' | 'completed' | 'restricted';
  lastActivity: string;
}

// --- Data ---------------------------------------------------------------------

function fmtBDT(n: number): string {
  return 'BDT ' + n.toLocaleString('en-IN');
}

const PERIODS: ReportPeriod[] = ['Aug 2026', 'Jul 2026', 'Jun 2026', 'May 2026'];

const PL_ENTRIES: PLEntry[] = [
  {
    deal: 'INV-003', model: 'micro', business: 'AgriLink BD', investor: 'Priya Mehta',
    period: 'Aug 2026', revenue: 520000, expenses: 340000, plSharePct: 22,
    discrepancy: 'none',
  },
  {
    deal: 'INV-003', model: 'micro', business: 'AgriLink BD', investor: 'Priya Mehta',
    period: 'Jul 2026', revenue: 480000, expenses: 310000, plSharePct: 22,
    discrepancy: 'none',
  },
  {
    deal: 'INV-003', model: 'micro', business: 'AgriLink BD', investor: 'Priya Mehta',
    period: 'Jun 2026', revenue: 420000, expenses: 295000, plSharePct: 22,
    discrepancy: 'minor',
    note: 'Expense figure slightly higher than milestone estimate. Within acceptable range.',
  },
  {
    deal: 'INV-004', model: 'micro', business: 'GreenPath Logistics', investor: 'Marcus Williams',
    period: 'Aug 2026', revenue: 310000, expenses: 420000, plSharePct: 18,
    discrepancy: 'moderate',
    note: 'Net loss reported this period. No returns distributed. Loss is investor-acknowledged per agreement.',
  },
];

const MILESTONE_FUNDING: MilestoneFundingEntry[] = [
  { deal: 'INV-002', business: 'Orbit Analytics', milestone: 'Series A close', amount: 10000000, status: 'completed', date: 'Apr 2026', evidenceStatus: 'verified' },
  { deal: 'INV-002', business: 'Orbit Analytics', milestone: 'Hiring milestone', amount: 5000000, status: 'completed', date: 'Apr 2026', evidenceStatus: 'verified' },
  { deal: 'INV-002', business: 'Orbit Analytics', milestone: 'Revenue milestone', amount: 7500000, status: 'active', date: 'Jul 2026', evidenceStatus: 'pending' },
  { deal: 'INV-001', business: 'NovaTech AI', milestone: 'Initial tranche', amount: 1500000, status: 'completed', date: 'Apr 2026', evidenceStatus: 'verified' },
  { deal: 'INV-001', business: 'NovaTech AI', milestone: 'MVP delivery', amount: 2000000, status: 'active', date: 'Jun 2026', evidenceStatus: 'pending' },
  { deal: 'INV-003', business: 'AgriLink BD', milestone: 'Platform deployment', amount: 400000, status: 'completed', date: 'Mar 2026', evidenceStatus: 'verified' },
  { deal: 'INV-003', business: 'AgriLink BD', milestone: 'First 500 farmers', amount: 400000, status: 'active', date: 'Jun 2026', evidenceStatus: 'not_submitted' },
  { deal: 'INV-005', business: 'Meridian Health', milestone: 'Seed tranche 1', amount: 4000000, status: 'upcoming', date: 'Pending', evidenceStatus: 'not_submitted' },
];

const INVESTMENT_SUMMARY: InvestmentSummary[] = [
  { id: 'INV-001', business: 'NovaTech AI',        model: 'large', totalAmount: 6000000,   deployed: 1500000,  pending: 4500000,  status: 'active',     lastActivity: '2h ago' },
  { id: 'INV-002', business: 'Orbit Analytics',    model: 'large', totalAmount: 25000000,  deployed: 15000000, pending: 10000000, status: 'active',     lastActivity: '1d ago' },
  { id: 'INV-003', business: 'AgriLink BD',         model: 'micro', totalAmount: 1200000,   deployed: 400000,   pending: 800000,   status: 'active',     lastActivity: '3d ago' },
  { id: 'INV-004', business: 'GreenPath Logistics', model: 'micro', totalAmount: 3000000,   deployed: 0,        pending: 3000000,  status: 'active',     lastActivity: '3d ago' },
  { id: 'INV-005', business: 'Meridian Health',     model: 'large', totalAmount: 12000000,  deployed: 0,        pending: 12000000, status: 'restricted', lastActivity: '5d ago' },
];

// --- Config maps ---------------------------------------------------------------

const DISC_CFG: Record<DiscrepancyLevel, { label: string; color: string; variant: 'success' | 'neutral' | 'warning' | 'info' }> = {
  none:        { label: 'Clear',        color: '#22C55E', variant: 'success' },
  minor:       { label: 'Minor',        color: '#C9A24B', variant: 'warning' },
  moderate:    { label: 'Moderate',     color: '#F59E0B', variant: 'warning' },
  significant: { label: 'Significant',  color: '#EF4444', variant: 'info'    },
};

const EV_CFG: Record<MilestoneFundingEntry['evidenceStatus'], { label: string; color: string }> = {
  verified:       { label: 'Verified',       color: '#22C55E' },
  pending:        { label: 'Pending Review', color: '#C67A4E' },
  disputed:       { label: 'Disputed',       color: '#EF4444' },
  not_submitted:  { label: 'Not Submitted',  color: '#5E6D8F' },
};

const MS_STATUS_CFG: Record<MilestoneFundingEntry['status'], { label: string; color: string }> = {
  completed: { label: 'Completed', color: '#22C55E' },
  active:    { label: 'In Progress', color: '#C67A4E' },
  submitted: { label: 'Submitted', color: '#C9A24B' },
  upcoming:  { label: 'Upcoming', color: '#35446A' },
};

function ModelTag({ model }: { model: 'large' | 'micro' }) {
  return (
    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={model === 'micro'
      ? { background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }
      : { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.2)' }}>
      {model === 'micro' ? 'Micro' : 'Equity'}
    </span>
  );
}

// --- P/L Report Table ----------------------------------------------------------

function PLReport({ selectedPeriod }: { selectedPeriod: ReportPeriod }) {
  const periodEntries = PL_ENTRIES.filter(e => e.period === selectedPeriod);
  const totalRevenue  = periodEntries.reduce((s, e) => s + e.revenue, 0);
  const totalExpenses = periodEntries.reduce((s, e) => s + e.expenses, 0);
  const totalNet      = totalRevenue - totalExpenses;

  if (periodEntries.length === 0) {
    return <div className="py-8 text-center text-[13px] text-[color:var(--vv-text-tertiary)]">No P/L activity for this period.</div>;
  }

  return (
    <div className="space-y-3">
      {/* P/L disclaimer */}
      <div className="text-[10.5px] text-[color:var(--vv-text-tertiary)] px-1">
        Net P/L = Revenue - Expenses. This report covers Micro Investment (P/L Sharing) deals only. No returns are guaranteed. All figures are simulated.
      </div>

      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[color:var(--vv-border)]">
                {['Deal', 'Business', 'Investor', 'Revenue', 'Expenses', 'Net P/L', 'Investor Share', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodEntries.map((e, i) => {
                const net = e.revenue - e.expenses;
                const share = e.plSharePct ? Math.round(net * e.plSharePct / 100) : null;
                const disc = DISC_CFG[e.discrepancy];
                return (
                  <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11.5px] font-mono text-[color:var(--vv-text-tertiary)]">{e.deal}</span>
                        <ModelTag model={e.model} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text)] font-medium">{e.business}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-[color:var(--vv-text-secondary)]">{e.investor}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#22C55E]">{fmtBDT(e.revenue)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#C67A4E]">{fmtBDT(e.expenses)}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] font-bold" style={{ color: net >= 0 ? '#22C55E' : '#EF4444' }}>
                      {net >= 0 ? '+' : ''}{fmtBDT(net)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px]" style={{ color: share && share > 0 ? '#C9A24B' : '#5E6D8F' }}>
                      {share !== null ? `${share >= 0 ? '+' : ''}${fmtBDT(share)} (${e.plSharePct}%)` : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={disc.variant}>{disc.label}</Badge>
                        {e.note && <span className="text-[9px] text-[color:var(--vv-text-tertiary)] max-w-[120px] leading-tight">{e.note}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[color:var(--vv-border)]">
                <td colSpan={3} className="px-4 py-3 text-[11px] font-bold text-[color:var(--vv-text)]">Period Total</td>
                <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#22C55E]">{fmtBDT(totalRevenue)}</td>
                <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C67A4E]">{fmtBDT(totalExpenses)}</td>
                <td className="px-4 py-3 font-mono text-[12px] font-bold" style={{ color: totalNet >= 0 ? '#22C55E' : '#EF4444' }}>
                  {totalNet >= 0 ? '+' : ''}{fmtBDT(totalNet)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Milestone funding table ---------------------------------------------------

function MilestoneFundingTable() {
  const totalDeployed = INVESTMENT_SUMMARY.reduce((s, e) => s + e.deployed, 0);
  const totalPending  = INVESTMENT_SUMMARY.reduce((s, e) => s + e.pending, 0);

  return (
    <div className="space-y-3">
      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total Deployed (Simulated)', value: fmtBDT(totalDeployed), color: '#22C55E' },
          { label: 'Pending Deployment',          value: fmtBDT(totalPending),  color: '#C67A4E' },
          { label: 'Milestones Awaiting Evidence',value: MILESTONE_FUNDING.filter(m => m.evidenceStatus === 'not_submitted' && m.status !== 'upcoming').length, color: '#F59E0B' },
        ].map((m, i) => (
          <div key={i} className="px-4 py-2.5 rounded-[10px] border border-[color:var(--vv-border)]" style={{ background: 'rgba(26,28,29,0.7)' }}>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{m.label}</p>
            <p className="font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[color:var(--vv-border)]">
                {['Deal', 'Business', 'Milestone', 'Amount', 'Status', 'Due', 'Evidence'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MILESTONE_FUNDING.map((m, i) => {
                const msCfg = MS_STATUS_CFG[m.status];
                const evCfg = EV_CFG[m.evidenceStatus];
                return (
                  <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{m.deal}</td>
                    <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text)] font-medium">{m.business}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-[color:var(--vv-text-secondary)]">{m.milestone}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-[color:var(--vv-text)]">{fmtBDT(m.amount)}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: msCfg.color, background: `${msCfg.color}18` }}>{msCfg.label}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{m.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-semibold" style={{ color: evCfg.color }}>{evCfg.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Investment summary table --------------------------------------------------

function InvestmentSummaryTable() {
  return (
    <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-[color:var(--vv-border)]">
              {['Deal', 'Business', 'Model', 'Total Amount', 'Deployed', 'Pending', 'Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVESTMENT_SUMMARY.map((s, i) => (
              <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                <td className="px-4 py-2.5 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{s.id}</td>
                <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text)] font-medium">{s.business}</td>
                <td className="px-4 py-2.5"><ModelTag model={s.model} /></td>
                <td className="px-4 py-2.5 font-mono text-[11.5px] text-[color:var(--vv-text)]">{fmtBDT(s.totalAmount)}</td>
                <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#22C55E]">{fmtBDT(s.deployed)}</td>
                <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#C67A4E]">{fmtBDT(s.pending)}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={s.status === 'completed' ? 'success' : s.status === 'restricted' ? 'info' : 'neutral'}>
                    {s.status === 'active' ? 'Active' : s.status === 'completed' ? 'Completed' : 'Restricted'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[color:var(--vv-border)]">
              <td colSpan={3} className="px-4 py-3 text-[11px] font-bold text-[color:var(--vv-text)]">Total</td>
              <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[color:var(--vv-text)]">
                {fmtBDT(INVESTMENT_SUMMARY.reduce((s, e) => s + e.totalAmount, 0))}
              </td>
              <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#22C55E]">
                {fmtBDT(INVESTMENT_SUMMARY.reduce((s, e) => s + e.deployed, 0))}
              </td>
              <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C67A4E]">
                {fmtBDT(INVESTMENT_SUMMARY.reduce((s, e) => s + e.pending, 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

type ReportTab = 'pl' | 'milestones' | 'summary';

export default function FinancialReports() {
  const [tab, setTab] = useState<ReportTab>('pl');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Aug 2026');

  const discrepancyCount = PL_ENTRIES.filter(e => e.discrepancy !== 'none').length;
  const evidenceIssues = MILESTONE_FUNDING.filter(m =>
    m.status !== 'upcoming' && (m.evidenceStatus === 'not_submitted' || m.evidenceStatus === 'disputed')
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight mb-1">Financial Reports</h1>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Governance-level view of simulated investment activity, P/L reporting, and milestone funding.</p>
      </div>

      {/* Simulation notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-5 text-[11.5px]"
        style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}
      >
        <IconAlertTriangle s={14} className="shrink-0 mt-0.5" />
        <span>
          <strong>SIMULATION PLATFORM</strong> - All financial figures, equity terms, P/L data, and milestone amounts on Vault Ventures are simulated.
          Net P/L = Revenue - Expenses. No returns are guaranteed. Admin may review figures but may not arbitrarily alter calculations.
        </span>
      </div>

      {/* Alert strip */}
      {(discrepancyCount > 0 || evidenceIssues > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {discrepancyCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[10px]" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <IconAlertTriangle s={14} className="text-[#F59E0B] shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{discrepancyCount} P/L discrepanc{discrepancyCount > 1 ? 'ies' : 'y'} flagged</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Review P/L Report tab for details.</p>
              </div>
            </div>
          )}
          {evidenceIssues > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[10px]" style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.2)' }}>
              <IconFileText s={14} className="text-[#C67A4E] shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{evidenceIssues} milestone{evidenceIssues > 1 ? 's' : ''} awaiting evidence</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Review Milestone Funding tab.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[color:var(--vv-border)] mb-5 overflow-x-auto">
        {([
          { id: 'pl',         label: 'P/L Report (Micro)' },
          { id: 'milestones', label: 'Milestone Funding' },
          { id: 'summary',    label: 'Investment Summary' },
        ] as { id: ReportTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-3 text-[12.5px] font-medium border-b-2 transition-colors whitespace-nowrap"
            style={tab === t.id
              ? { borderColor: '#C67A4E', color: '#EAF0FA' }
              : { borderColor: 'transparent', color: '#5E6D8F' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* P/L tab */}
      {tab === 'pl' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Period:</span>
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all"
                style={selectedPeriod === p
                  ? { background: 'rgba(198,122,78,0.15)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
                  : { background: 'rgba(36,48,74,0.4)', color: '#5E6D8F', border: '1px solid rgba(53,68,106,0.3)' }}
              >
                {p}
              </button>
            ))}
          </div>
          <PLReport selectedPeriod={selectedPeriod} />
        </div>
      )}

      {/* Milestones tab */}
      {tab === 'milestones' && <MilestoneFundingTable />}

      {/* Summary tab */}
      {tab === 'summary' && (
        <div className="space-y-3">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Overview of all active simulated investments. All amounts in BDT. No real capital is tracked here.</p>
          <InvestmentSummaryTable />
        </div>
      )}
    </div>
  );
}
