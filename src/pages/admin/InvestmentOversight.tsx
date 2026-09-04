import React, { useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconFilter, IconEye, IconAlertTriangle, IconCheck,
} from '../../components/layout/Icons';

// --- Types --------------------------------------------------------------------

type InvestmentModel = 'large' | 'micro';
type DealStage = 'NDA Signed' | 'Negotiation' | 'Agreement' | 'Milestone Funding Active' | 'Completed' | 'Restricted';
type MilestoneState = 'completed' | 'active' | 'submitted' | 'upcoming';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

interface Milestone {
  label: string;
  state: MilestoneState;
  amount: string;
  dueDate?: string;
}

interface InvestmentDeal {
  id: string;
  business: string;
  businessIndustry: string;
  founder: string;
  investor: string;
  model: InvestmentModel;
  stage: DealStage;
  totalAmount: string;
  // Large model
  equityPct?: string;
  preMoneyVal?: string;
  boardRights?: string;
  // Micro model
  plSharePct?: string;
  sharingPeriod?: string;
  // Shared
  milestones: Milestone[];
  ndaDate: string;
  agreementStatus: 'Draft' | 'Executed' | 'Pending';
  risk: RiskLevel;
  flags: number;
  lastActivity: string;
  simulationNote: string;
}

// --- Data ---------------------------------------------------------------------

function fmtBDT(s: string) { return s; }

const ALL_INVESTMENTS: InvestmentDeal[] = [
  {
    id: 'INV-001',
    business: 'NovaTech AI',
    businessIndustry: 'FinTech - AI/ML',
    founder: 'Alex Morgan',
    investor: 'James Okafor (Meridian Capital)',
    model: 'large',
    stage: 'Negotiation',
    totalAmount: 'BDT 60,00,000',
    equityPct: '10-12% (under negotiation)',
    preMoneyVal: 'BDT 4,50,00,000-BDT 5,00,00,000',
    boardRights: 'Observer seat proposed',
    milestones: [
      { label: 'Initial tranche', state: 'completed', amount: 'BDT 15,00,000', dueDate: 'Apr 2026' },
      { label: 'MVP delivery',     state: 'active',    amount: 'BDT 20,00,000', dueDate: 'Jun 2026' },
      { label: 'Pilot launch',     state: 'upcoming',  amount: 'BDT 15,00,000', dueDate: 'Sep 2026' },
      { label: 'Series A prep',    state: 'upcoming',  amount: 'BDT 10,00,000', dueDate: 'Dec 2026' },
    ],
    ndaDate: 'Apr 16, 2026',
    agreementStatus: 'Draft',
    risk: 'None',
    flags: 0,
    lastActivity: '2h ago',
    simulationNote: 'All values are simulated. No real equity or capital transfers.',
  },
  {
    id: 'INV-002',
    business: 'Orbit Analytics',
    businessIndustry: 'SaaS - Data',
    founder: 'Riley Kim',
    investor: 'Sarah Chen (Apex Ventures)',
    model: 'large',
    stage: 'Milestone Funding Active',
    totalAmount: 'BDT 2,50,00,000',
    equityPct: '14%',
    preMoneyVal: 'BDT 15,00,00,000',
    boardRights: 'Full board seat',
    milestones: [
      { label: 'Series A close',   state: 'completed', amount: 'BDT 1,00,00,000', dueDate: 'Apr 2026' },
      { label: 'Hiring milestone', state: 'completed', amount: 'BDT 50,00,000',   dueDate: 'Apr 2026' },
      { label: 'Revenue milestone',state: 'active',    amount: 'BDT 75,00,000',   dueDate: 'Jul 2026' },
      { label: 'Series B prep',    state: 'upcoming',  amount: 'BDT 25,00,000',   dueDate: 'Oct 2026' },
    ],
    ndaDate: 'Apr 10, 2026',
    agreementStatus: 'Executed',
    risk: 'None',
    flags: 0,
    lastActivity: '1d ago',
    simulationNote: 'All values are simulated. No real equity or capital transfers.',
  },
  {
    id: 'INV-003',
    business: 'AgriLink BD',
    businessIndustry: 'AgriTech',
    founder: 'Karim Uddin',
    investor: 'Priya Mehta (BlueSky Ventures)',
    model: 'micro',
    stage: 'Milestone Funding Active',
    totalAmount: 'BDT 12,00,000',
    plSharePct: '22%',
    sharingPeriod: '18 months from deployment',
    milestones: [
      { label: 'Platform deployment', state: 'completed', amount: 'BDT 4,00,000', dueDate: 'Mar 2026' },
      { label: 'First 500 farmers',  state: 'active',     amount: 'BDT 4,00,000', dueDate: 'Jun 2026' },
      { label: 'BDT 5L monthly GMV',    state: 'upcoming',   amount: 'BDT 4,00,000', dueDate: 'Sep 2026' },
    ],
    ndaDate: 'Mar 28, 2026',
    agreementStatus: 'Executed',
    risk: 'Low',
    flags: 0,
    lastActivity: '3d ago',
    simulationNote: 'Profit/loss sharing is simulated. Net P/L = Revenue - Expenses. No returns guaranteed.',
  },
  {
    id: 'INV-004',
    business: 'GreenPath Logistics',
    businessIndustry: 'Logistics',
    founder: 'Elena Vasquez',
    investor: 'Marcus Williams',
    model: 'micro',
    stage: 'NDA Signed',
    totalAmount: 'BDT 30,00,000',
    plSharePct: '18% (proposed)',
    sharingPeriod: '12 months',
    milestones: [
      { label: 'Initial funding',   state: 'upcoming', amount: 'BDT 10,00,000', dueDate: 'Aug 2026' },
      { label: 'Fleet expansion',   state: 'upcoming', amount: 'BDT 20,00,000', dueDate: 'Nov 2026' },
    ],
    ndaDate: 'Apr 20, 2026',
    agreementStatus: 'Pending',
    risk: 'Low',
    flags: 1,
    lastActivity: '3d ago',
    simulationNote: 'Profit/loss sharing is simulated. No real transactions.',
  },
  {
    id: 'INV-005',
    business: 'Meridian Health',
    businessIndustry: 'HealthTech',
    founder: 'Priya Nair',
    investor: 'James Okafor',
    model: 'large',
    stage: 'Restricted',
    totalAmount: 'BDT 1,20,00,000',
    equityPct: '15% (proposed)',
    preMoneyVal: 'BDT 6,80,00,000',
    boardRights: 'Under negotiation',
    milestones: [
      { label: 'Seed tranche 1', state: 'upcoming', amount: 'BDT 40,00,000', dueDate: 'Pending' },
      { label: 'Seed tranche 2', state: 'upcoming', amount: 'BDT 80,00,000', dueDate: 'Pending' },
    ],
    ndaDate: 'Apr 8, 2026',
    agreementStatus: 'Pending',
    risk: 'High',
    flags: 2,
    lastActivity: '5d ago',
    simulationNote: 'Deal restricted pending compliance review.',
  },
];

// --- Sub-components ------------------------------------------------------------

const RISK_CFG: Record<RiskLevel, { color: string; variant: 'success' | 'info' | 'warning' | 'neutral' | 'accent' }> = {
  None:     { color: '#22C55E', variant: 'success' },
  Low:      { color: '#93A1BF', variant: 'neutral' },
  Medium:   { color: '#C9A24B', variant: 'warning' },
  High:     { color: '#F59E0B', variant: 'warning' },
  Critical: { color: '#EF4444', variant: 'info'    },
};

const MS_CFG: Record<MilestoneState, { color: string; label: string }> = {
  completed: { color: '#22C55E', label: 'Completed' },
  active:    { color: '#C67A4E', label: 'In Progress' },
  submitted: { color: '#C9A24B', label: 'Submitted' },
  upcoming:  { color: '#35446A', label: 'Upcoming' },
};

function ModelTag({ model }: { model: InvestmentModel }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={model === 'micro'
        ? { background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }
        : { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.2)' }}
    >
      {model === 'micro' ? '? Micro - P/L Sharing' : '? Standard - Equity/Ownership'}
    </span>
  );
}

function MilestoneRow({ ms }: { ms: Milestone }) {
  const cfg = MS_CFG[ms.state];
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
        <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] truncate">{ms.label}</span>
        {ms.dueDate && <span className="text-[10px] text-[#35446A] shrink-0 font-mono">{ms.dueDate}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: cfg.color, background: `${cfg.color}18` }}>{cfg.label}</span>
        <span className="text-[11px] text-[color:var(--vv-text)] font-mono">{ms.amount}</span>
      </div>
    </div>
  );
}

function InvestmentCard({ deal, selected, onSelect }: {
  deal: InvestmentDeal;
  selected: boolean;
  onSelect: () => void;
}) {
  const riskCfg = RISK_CFG[deal.risk];
  const completedMs = deal.milestones.filter(m => m.state === 'completed').length;

  return (
    <div
      onClick={onSelect}
      className="rounded-[12px] border cursor-pointer transition-all"
      style={{
        background: selected ? 'rgba(198,122,78,0.06)' : 'rgba(26,28,29,0.85)',
        borderColor: selected ? 'rgba(198,122,78,0.4)' : 'rgba(36,48,74,0.9)',
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{deal.business}</p>
              {deal.flags > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                  {deal.flags} flag{deal.flags > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{deal.businessIndustry} - {deal.id}</p>
          </div>
          <Badge variant={riskCfg.variant}>{deal.risk === 'None' ? 'No risk' : deal.risk}</Badge>
        </div>

        {/* Model + stage */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <ModelTag model={deal.model} />
          <span className="text-[10.5px] text-[color:var(--vv-text-secondary)] px-2 py-0.5 rounded-full" style={{ background: 'rgba(36,48,74,0.5)', border: '1px solid rgba(53,68,106,0.4)' }}>
            {deal.stage}
          </span>
        </div>

        {/* Key values */}
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div>
            <span className="text-[#35446A]">Total </span>
            <span className="text-[color:var(--vv-text)] font-mono font-semibold">{deal.totalAmount}</span>
          </div>
          {deal.model === 'large' && deal.equityPct && (
            <div>
              <span className="text-[#35446A]">Equity </span>
              <span className="text-[#C67A4E] font-semibold">{deal.equityPct}</span>
            </div>
          )}
          {deal.model === 'micro' && deal.plSharePct && (
            <div>
              <span className="text-[#35446A]">P/L Share </span>
              <span className="text-[#22C55E] font-semibold">{deal.plSharePct}</span>
            </div>
          )}
          <div>
            <span className="text-[#35446A]">Milestones </span>
            <span className="text-[color:var(--vv-text-secondary)]">{completedMs}/{deal.milestones.length} done</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#35446A] font-mono">Last active {deal.lastActivity}</span>
          <span className="text-[11px] text-[#C67A4E]">{selected ? 'Viewing details ?' : 'View details ?'}</span>
        </div>
      </div>
    </div>
  );
}

function InvestmentDetail({ deal }: { deal: InvestmentDeal }) {
  const riskCfg = RISK_CFG[deal.risk];

  return (
    <div className="space-y-4">
      {/* Simulation boundary */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-[11px]"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}
      >
        <IconAlertTriangle s={13} className="shrink-0" />
        <span><strong>SIMULATION</strong> - {deal.simulationNote}</span>
      </div>

      {/* Deal overview */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Deal Overview</p>
          <Badge variant={riskCfg.variant}>Risk: {deal.risk}</Badge>
        </div>
        {[
          { label: 'Deal ID',         value: deal.id },
          { label: 'Business',        value: deal.business },
          { label: 'Founder',         value: deal.founder },
          { label: 'Investor',        value: deal.investor },
          { label: 'Stage',           value: deal.stage },
          { label: 'NDA Date',        value: deal.ndaDate },
          { label: 'Agreement',       value: deal.agreementStatus },
          { label: 'Total (Simulated)', value: deal.totalAmount, mono: true },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-[#1c2a3e] last:border-0">
            <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
            <span className={`text-[12px] text-[color:var(--vv-text)] font-medium ${(row as any).mono ? 'font-mono' : ''}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Model-specific terms */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-2">
          <ModelTag model={deal.model} />
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Investment Terms</p>
        </div>
        {deal.model === 'large' ? (
          [
            { label: 'Total Amount',      value: deal.totalAmount },
            { label: 'Equity Stake',      value: deal.equityPct ?? '-' },
            { label: 'Pre-money Val.',    value: deal.preMoneyVal ?? '-' },
            { label: 'Board Rights',      value: deal.boardRights ?? '-' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
              <span className="text-[12px] text-[color:var(--vv-text)] font-medium">{row.value}</span>
            </div>
          ))
        ) : (
          [
            { label: 'Investment Amount',  value: deal.totalAmount },
            { label: 'P/L Share',          value: deal.plSharePct ?? '-' },
            { label: 'Sharing Period',     value: deal.sharingPeriod ?? '-' },
            { label: 'Net P/L Formula',    value: 'Revenue - Expenses' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
              <span className="text-[12px] text-[color:var(--vv-text)] font-medium">{row.value}</span>
            </div>
          ))
        )}
      </div>

      {/* Milestones */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(14,20,34,0.9)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Milestone Funding</p>
        </div>
        <div className="px-4 py-3 space-y-0">
          {deal.milestones.map((ms, i) => <MilestoneRow key={i} ms={ms} />)}
        </div>
      </div>

      {/* Admin actions */}
      <div className="flex flex-col gap-2">
        <Button variant="secondary" size="sm" className="w-full">Flag for Review</Button>
        <Button variant="ghost" size="sm" className="w-full">Export Audit Record</Button>
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

type ModelFilter = 'all' | 'large' | 'micro';
type StageFilter = 'all' | 'active' | 'completed' | 'restricted';

export default function InvestmentOversight() {
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = ALL_INVESTMENTS.filter(deal => {
    const q = search.toLowerCase();
    const matchSearch = !q || deal.business.toLowerCase().includes(q) || deal.id.toLowerCase().includes(q) || deal.founder.toLowerCase().includes(q) || deal.investor.toLowerCase().includes(q);
    const matchModel = modelFilter === 'all' || deal.model === modelFilter;
    const matchStage = stageFilter === 'all' ||
      (stageFilter === 'active' && !['Completed', 'Restricted'].includes(deal.stage)) ||
      (stageFilter === 'completed' && deal.stage === 'Completed') ||
      (stageFilter === 'restricted' && deal.stage === 'Restricted');
    return matchSearch && matchModel && matchStage;
  });

  const selectedDeal = ALL_INVESTMENTS.find(d => d.id === selectedId) ?? null;

  const totalSimulated = 'BDT 4,72,00,000';
  const largeCount = ALL_INVESTMENTS.filter(d => d.model === 'large').length;
  const microCount = ALL_INVESTMENTS.filter(d => d.model === 'micro').length;
  const flagCount  = ALL_INVESTMENTS.filter(d => d.flags > 0).length;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight mb-1">Investment Oversight</h1>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Governance view of all simulated investment deals. No real capital is involved.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Simulated',    value: totalSimulated,          sub: 'All active deals', color: '#C67A4E' },
          { label: 'Standard - Equity',  value: largeCount,              sub: 'deals', color: '#C67A4E' },
          { label: 'Micro - P/L Share',  value: microCount,              sub: 'deals', color: '#22C55E' },
          { label: 'Flagged',            value: flagCount,               sub: 'require attention', color: flagCount > 0 ? '#F59E0B' : '#5E6D8F' },
        ].map((m, i) => (
          <div key={i} className="rounded-[12px] border border-[color:var(--vv-border)] px-4 py-3" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">{m.label}</p>
            <p className="font-display text-[18px] font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-[#35446A] mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Simulation boundary notice */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] mb-4 text-[11.5px]"
        style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}
      >
        <IconAlertTriangle s={14} className="shrink-0" />
        <span><strong>SIMULATION PLATFORM</strong> - All investment amounts, equity terms, and P/L figures are simulated. Vault Ventures does not execute real capital transfers, real equity settlement, or brokerage transactions.</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch s={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search deals, businesses, participants-"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-[8px] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] focus:outline-none focus:ring-1 focus:ring-[#C67A4E]"
            style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid rgba(53,68,106,0.5)' }}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'large', 'micro'] as ModelFilter[]).map(f => (
            <button key={f} onClick={() => setModelFilter(f)}
              className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all"
              style={modelFilter === f
                ? { background: 'rgba(198,122,78,0.15)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
                : { background: 'rgba(36,48,74,0.4)', color: '#5E6D8F', border: '1px solid rgba(53,68,106,0.3)' }}
            >
              {f === 'all' ? 'All Models' : f === 'large' ? 'Standard / Equity' : 'Micro / P/L'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'restricted'] as StageFilter[]).map(f => (
            <button key={f} onClick={() => setStageFilter(f)}
              className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all"
              style={stageFilter === f
                ? { background: 'rgba(198,122,78,0.15)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
                : { background: 'rgba(36,48,74,0.4)', color: '#5E6D8F', border: '1px solid rgba(53,68,106,0.3)' }}
            >
              {f === 'all' ? 'All Stages' : f === 'active' ? 'Active' : 'Restricted'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4 min-h-0">
        {/* List */}
        <div className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px] text-[color:var(--vv-text-tertiary)]">No investment deals match the current filters.</p>
            </div>
          ) : (
            filtered.map(deal => (
              <InvestmentCard
                key={deal.id}
                deal={deal}
                selected={selectedId === deal.id}
                onSelect={() => setSelectedId(selectedId === deal.id ? null : deal.id)}
              />
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedDeal && (
          <div className="w-[360px] xl:w-[400px] shrink-0 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            <InvestmentDetail deal={selectedDeal} />
          </div>
        )}
      </div>
    </div>
  );
}
