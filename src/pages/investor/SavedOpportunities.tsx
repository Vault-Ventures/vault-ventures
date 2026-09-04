import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';

// --- Data ---------------------------------------------------------------------

type SavedStatus = 'saved' | 'interest_sent' | 'in_deal' | 'completed';

interface SavedItem {
  id: string;
  name: string;
  initials: string;
  industry: string;
  stage: string;
  description: string;
  match: number;
  funding: string;
  savedDate: string;
  status: SavedStatus;
}

const STATUS_CONFIG: Record<SavedStatus, { label: string; color: string; bg: string; border: string }> = {
  saved: { label: 'Saved', color: '#93A1BF', bg: 'rgba(93,101,127,0.08)', border: 'rgba(93,101,127,0.18)' },
  interest_sent: { label: 'Interest Sent', color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  in_deal: { label: 'In Deal Room', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  completed: { label: 'Completed', color: '#22C55E', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
};

const SAVED_ITEMS: SavedItem[] = [
  {
    id: 'nova-health',
    name: 'Nova Health',
    initials: 'NH',
    industry: 'HealthTech',
    stage: 'Seed',
    description: 'AI-powered diagnostics platform reducing misdiagnosis rates across rural Bangladesh.',
    match: 91,
    funding: 'BDT 1.5 Cr',
    savedDate: 'Aug 18, 2026',
    status: 'in_deal',
  },
  {
    id: 'agrilink',
    name: 'AgriLink BD',
    initials: 'AL',
    industry: 'AgriTech',
    stage: 'Pre-Seed',
    description: 'Digital marketplace connecting smallholder farmers directly to urban buyers, cutting out middlemen.',
    match: 78,
    funding: 'BDT 60 L',
    savedDate: 'Aug 21, 2026',
    status: 'interest_sent',
  },
  {
    id: 'finflow',
    name: 'FinFlow',
    initials: 'FF',
    industry: 'FinTech',
    stage: 'Early Stage',
    description: 'Embedded financial infrastructure for SMEs - invoice factoring, payroll, and credit lines.',
    match: 85,
    funding: 'BDT 2.2 Cr',
    savedDate: 'Aug 23, 2026',
    status: 'saved',
  },
  {
    id: 'edgevision',
    name: 'EdgeVision AI',
    initials: 'EV',
    industry: 'AI / ML',
    stage: 'Seed',
    description: 'On-device computer vision for manufacturing quality control without cloud dependency.',
    match: 73,
    funding: 'BDT 1.1 Cr',
    savedDate: 'Aug 25, 2026',
    status: 'saved',
  },
  {
    id: 'greengrid',
    name: 'GreenGrid',
    initials: 'GG',
    industry: 'CleanTech',
    stage: 'Early Stage',
    description: 'Community-scale solar microgrids for underserved peri-urban and rural areas.',
    match: 68,
    funding: 'BDT 3.5 Cr',
    savedDate: 'Aug 10, 2026',
    status: 'completed',
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'saved', label: 'Saved' },
  { key: 'interest_sent', label: 'Interest Sent' },
  { key: 'in_deal', label: 'In Deal Room' },
  { key: 'completed', label: 'Completed' },
];

// --- Components ---------------------------------------------------------------

function StatusBadge({ status }: { status: SavedStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function SavedCard({ item, onRemove }: { item: SavedItem; onRemove: (id: string) => void }) {
  const navigate = useNavigate();
  const profileUrl = `/app/businesses/${item.id}`;
  const dealUrl = '/app/deal-room';

  return (
    <div className="rounded-[14px] border overflow-hidden transition-all hover:border-[#2E3E5E]"
      style={{ background: 'rgba(26,28,29,0.85)', borderColor: '#2B2D2F' }}>
      <div className="p-5">
        {/* Top row */}
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

        {/* Description */}
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed mb-3 line-clamp-2">{item.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={item.status} />
          <span className="text-[10.5px] text-[#35446A]">Funding: <span className="text-[color:var(--vv-text-secondary)]">{item.funding}</span></span>
          <span className="text-[10.5px] text-[#35446A]">Saved <span className="text-[color:var(--vv-text-secondary)]">{item.savedDate}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#2B2D2F] px-5 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {item.status === 'in_deal' ? (
            <Button size="sm" onClick={() => navigate(dealUrl)}>View Deal</Button>
          ) : (
            <Button size="sm" onClick={() => navigate(profileUrl)}>View Business</Button>
          )}
          {item.status !== 'in_deal' && item.status !== 'completed' && (
            <Button size="sm" variant="secondary" onClick={() => navigate(profileUrl)}>
              {item.status === 'saved' ? 'Express Interest' : 'View Business'}
            </Button>
          )}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-[11px] text-[#35446A] hover:text-[#C67A4E] transition-colors flex items-center gap-1">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] p-5 animate-pulse" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-[10px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
          <div className="h-2.5 w-20 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        </div>
        <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2.5 w-full rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        <div className="h-2.5 w-3/4 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-md bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        <div className="h-5 w-24 rounded-md bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function SavedOpportunities() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [items, setItems] = useState<SavedItem[]>(SAVED_ITEMS);
  const [loading] = useState(false);

  function handleRemove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = activeFilter === 'all'
    ? items
    : items.filter(i => i.status === activeFilter);

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">

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
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Saved Opportunities</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Saved Opportunities
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Businesses you've bookmarked for review.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/app/investor/discover')}>
          Explore More
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[10px] mb-6 overflow-x-auto"
        style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid #2B2D2F' }}>
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all' ? items.length : items.filter(i => i.status === tab.key).length;
          const active = activeFilter === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={active ? {
                background: 'rgba(198,122,78,0.1)',
                color: '#C67A4E',
                border: '1px solid rgba(198,122,78,0.22)',
              } : {
                color: '#5E6D8F',
                border: '1px solid transparent',
              }}>
              {tab.label}
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={active ? { background: 'rgba(198,122,78,0.18)', color: '#C67A4E' } : { background: 'rgba(36,48,74,0.8)', color: '#5E6D8F' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.14)' }}>
            <svg width="22" height="22" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">
            {activeFilter === 'all' ? 'No saved opportunities yet.' : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()} opportunities.`}
          </p>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-xs mb-5">
            {activeFilter === 'all' ? 'Save promising businesses to review them later.' : 'Try a different filter to see other saved items.'}
          </p>
          {activeFilter === 'all' ? (
            <Button onClick={() => navigate('/app/investor/discover')}>Explore Opportunities</Button>
          ) : (
            <Button variant="secondary" onClick={() => setActiveFilter('all')}>View All Saved</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => (
            <SavedCard key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}