import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';

// --- Types & Data -------------------------------------------------------------

type DealStatus = 'active' | 'negotiation' | 'due_diligence' | 'completed' | 'paused';

interface PortfolioItem {
  id: string;
  name: string;
  initials: string;
  industry: string;
  stage: string;
  status: DealStatus;
  match: number;
  progress: number;
  currentMilestone: string;
  nextMilestone: string | null;
  investedDate: string;
  completedDate?: string;
  funding: string;
  milestoneCount: number;
  milestoneDone: number;
}

const STATUS_CONFIG: Record<DealStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
  negotiation: { label: 'Negotiation', color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  due_diligence: { label: 'Due Diligence', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  completed: { label: 'Completed', color: '#93A1BF', bg: 'rgba(93,101,127,0.08)', border: 'rgba(93,101,127,0.18)' },
  paused: { label: 'Paused', color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.2)' },
};

const ACTIVE_DEALS: PortfolioItem[] = [
  {
    id: 'nova-health',
    name: 'Nova Health',
    initials: 'NH',
    industry: 'HealthTech',
    stage: 'Seed',
    status: 'negotiation',
    match: 91,
    progress: 64,
    currentMilestone: 'Term Sheet',
    nextMilestone: 'Market Validation',
    investedDate: 'Aug 1, 2026',
    funding: 'BDT 1.5 Cr',
    milestoneCount: 5,
    milestoneDone: 3,
  },
  {
    id: 'finflow',
    name: 'FinFlow',
    initials: 'FF',
    industry: 'FinTech',
    stage: 'Early Stage',
    status: 'due_diligence',
    match: 85,
    progress: 38,
    currentMilestone: 'Due Diligence',
    nextMilestone: 'Term Sheet',
    investedDate: 'Jul 15, 2026',
    funding: 'BDT 2.2 Cr',
    milestoneCount: 5,
    milestoneDone: 2,
  },
];

const COMPLETED_DEALS: PortfolioItem[] = [
  {
    id: 'greengrid',
    name: 'GreenGrid',
    initials: 'GG',
    industry: 'CleanTech',
    stage: 'Early Stage',
    status: 'completed',
    match: 68,
    progress: 100,
    currentMilestone: 'Completed',
    nextMilestone: null,
    investedDate: 'Mar 10, 2026',
    completedDate: 'Jul 22, 2026',
    funding: 'BDT 3.5 Cr',
    milestoneCount: 5,
    milestoneDone: 5,
  },
];

// --- Summary metrics ----------------------------------------------------------

const SUMMARY = [
  { label: 'Active Deals', value: '2', sub: 'In progress', accent: '#C67A4E' },
  { label: 'Saved', value: '5', sub: 'Bookmarked', accent: '#93A1BF' },
  { label: 'Completed Deals', value: '1', sub: 'All time', accent: '#22C55E' },
  { label: 'Avg Match Score', value: '81', sub: 'Across portfolio', accent: '#A78BFA' },
];

// --- Components ---------------------------------------------------------------

function StatusBadge({ status }: { status: DealStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function MiniProgress({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,48,74,0.8)' }}>
      <div className="h-full rounded-full transition-all"
        style={{
          width: `${value}%`,
          background: value === 100
            ? 'rgba(34,197,94,0.8)'
            : 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)',
        }} />
    </div>
  );
}

function ActiveDealCard({ item }: { item: PortfolioItem }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-[14px] border overflow-hidden transition-all hover:border-[#2E3E5E]"
      style={{ background: 'rgba(26,28,29,0.85)', borderColor: '#2B2D2F' }}>
      <div className="p-5">
        {/* Top */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-[#C67A4E]"
              style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.16)' }}>
              {item.initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{item.industry}</span>
                <span className="text-[#35446A]">-</span>
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{item.stage}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ScoreChip score={item.match} />
          </div>
        </div>

        {/* Status + milestone */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <StatusBadge status={item.status} />
          <span className="text-[10.5px] text-[#35446A]">Since <span className="text-[color:var(--vv-text-secondary)]">{item.investedDate}</span></span>
        </div>

        {/* Progress */}
        <div className="p-3 rounded-[10px] mb-3" style={{ background: 'rgba(33,35,36,0.6)', border: '1px solid rgba(43,45,47,0.6)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Current Milestone</p>
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{item.currentMilestone}</p>
            </div>
            <span className="text-[18px] font-bold text-[#C67A4E] font-mono">{item.progress}%</span>
          </div>
          <MiniProgress value={item.progress} />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-[#35446A]">{item.milestoneDone}/{item.milestoneCount} milestones</p>
            {item.nextMilestone && (
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Next: <span className="text-[color:var(--vv-text-secondary)]">{item.nextMilestone}</span></p>
            )}
          </div>
        </div>

        {/* Simulated note */}
        <p className="text-[10px] text-[#35446A] italic mb-1">
          * Progress is simulated for demo purposes.
        </p>
      </div>

      {/* Actions */}
      <div className="border-t border-[#1E2C44] px-5 py-3 flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => navigate('/app/deal-room')}>View Deal</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/app/milestones`)}>View Progress</Button>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/app/businesses/${item.id}`)}>Business</Button>
      </div>
    </div>
  );
}

function CompletedDealRow({ item }: { item: PortfolioItem }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#1E2C44] last:border-b-0 hover:bg-[color:var(--vv-raised)]/30 transition-colors">
      <div className="w-9 h-9 flex-shrink-0 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text-secondary)]"
        style={{ background: 'rgba(93,101,127,0.08)', border: '1px solid rgba(93,101,127,0.16)' }}>
        {item.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{item.name}</p>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
          {item.industry} - {item.stage} - Completed {item.completedDate}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Milestones</p>
          <p className="text-[12px] font-semibold text-[#22C55E]">{item.milestoneDone}/{item.milestoneCount}</p>
        </div>
        <button onClick={() => navigate(`/app/businesses/${item.id}`)}
          className="text-[11px] text-[#C67A4E] hover:underline whitespace-nowrap">
          View ?
        </button>
      </div>
    </div>
  );
}

function SkeletonSummary() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-[12px] border border-[color:var(--vv-border)] p-4 animate-pulse" style={{ background: 'rgba(26,28,29,0.85)' }}>
          <div className="h-7 w-10 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] mb-2" />
          <div className="h-3 w-16 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] mb-1" />
          <div className="h-2.5 w-12 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        </div>
      ))}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function Portfolio() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading] = useState(false);

  const lc = search.toLowerCase();
  const filteredActive = ACTIVE_DEALS.filter(i =>
    i.name.toLowerCase().includes(lc) || i.industry.toLowerCase().includes(lc)
  );
  const filteredCompleted = COMPLETED_DEALS.filter(i =>
    i.name.toLowerCase().includes(lc) || i.industry.toLowerCase().includes(lc)
  );

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/investor/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Portfolio</span>
      </div>

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Portfolio
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Your active and completed investment relationships.
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search portfolio..."
            className="pl-9 pr-4 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none w-full sm:w-52"
          />
        </div>
      </div>

      {/* Summary strip */}
      {loading ? <SkeletonSummary /> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {SUMMARY.map(m => (
            <div key={m.label} className="rounded-[12px] border border-[color:var(--vv-border)] p-4 transition-all hover:border-[#2E3E5E]"
              style={{ background: 'rgba(26,28,29,0.85)' }}>
              <p className="font-display text-[24px] font-bold leading-none mb-1" style={{ color: m.accent }}>
                {m.value}
              </p>
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{m.label}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Simulated disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-6"
        style={{ background: 'rgba(198,122,78,0.05)', border: '1px solid rgba(198,122,78,0.18)' }}>
        <svg width="14" height="14" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
        </svg>
        <p className="text-[11.5px] text-[#C67A4E]">
          <span className="font-semibold">Simulated</span> - Portfolio progress, milestones, and deal metrics are for demonstration purposes only. No real financial transactions are implied.
        </p>
      </div>

      {/* Active Deals */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Active Deals</h2>
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{filteredActive.length} deal{filteredActive.length !== 1 ? 's' : ''}</span>
        </div>
        {filteredActive.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center rounded-[14px] border border-[color:var(--vv-border)]"
            style={{ background: 'rgba(26,28,29,0.6)' }}>
            <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-2">No active deals{search ? ' matching your search' : ''}.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Express interest in matched opportunities to start a deal.</p>
            <Button onClick={() => navigate('/app/investor/discover')}>Explore Opportunities</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActive.map(item => <ActiveDealCard key={item.id} item={item} />)}
          </div>
        )}
      </section>

      {/* Completed Deals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Completed Deals</h2>
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{filteredCompleted.length} deal{filteredCompleted.length !== 1 ? 's' : ''}</span>
        </div>
        {filteredCompleted.length === 0 ? (
          <div className="py-10 text-center rounded-[14px] border border-[color:var(--vv-border)]"
            style={{ background: 'rgba(26,28,29,0.6)' }}>
            <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">No completed deals{search ? ' matching your search' : ''} yet.</p>
          </div>
        ) : (
          <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden"
            style={{ background: 'rgba(26,28,29,0.85)' }}>
            {filteredCompleted.map(item => <CompletedDealRow key={item.id} item={item} />)}
          </div>
        )}
      </section>
    </div>
  );
}
