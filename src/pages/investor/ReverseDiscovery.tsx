import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { MatchExplainDrawer, buildDemoMatchData } from '../../components/ui/MatchExplainDrawer';

// --- Data ---------------------------------------------------------------------

interface Business {
  id: string;
  name: string;
  industry: string;
  stage: string;
  location: string;
  pitch: string;
  ask: string;
  askRaw: number;
  match: number;
  readiness: number;
  matchReasons: string[];
  expressed: boolean;
}

const BUSINESSES: Business[] = [
  {
    id: 'nova-health',
    name: 'Nova Health',
    industry: 'HealthTech - AI/ML',
    stage: 'Pre-Seed',
    location: 'Dhaka, Bangladesh',
    pitch: 'AI-powered diagnostics scheduling for healthcare providers. 60% reduction in no-shows across 12,000+ facilities.',
    ask: 'BDT 15,00,000',
    askRaw: 1500000,
    match: 91,
    readiness: 78,
    matchReasons: ['HealthTech aligns with your investment focus', 'Pre-Seed stage matches your preference', 'Funding ask within your stated range', 'AI/ML vertical is a stated interest'],
    expressed: false,
  },
  {
    id: 'novatech-ai',
    name: 'NovaTech AI',
    industry: 'FinTech - AI/ML',
    stage: 'Seed',
    location: 'Dhaka, Bangladesh',
    pitch: 'AI-powered credit risk assessment for underbanked SMBs using alternative data sources. BDT 2.4Cr pipeline.',
    ask: 'BDT 60,00,000',
    askRaw: 6000000,
    match: 86,
    readiness: 82,
    matchReasons: ['FinTech is your top stated interest', 'Seed stage matches your preference', 'AI/ML expertise aligns with your background', 'B2B model fits your portfolio thesis'],
    expressed: false,
  },
  {
    id: 'orbit-analytics',
    name: 'Orbit Analytics',
    industry: 'Data - SaaS - B2B',
    stage: 'Pre-Seed',
    location: 'Remote',
    pitch: 'No-code analytics for ops teams. Connects 40+ data sources in minutes. 3 enterprise pilots active.',
    ask: 'BDT 18,00,000',
    askRaw: 1800000,
    match: 79,
    readiness: 67,
    matchReasons: ['SaaS / B2B aligns with your focus', 'Remote-friendly matches your geography preference', 'Pre-Seed stage within your range', 'Data & Analytics is a stated interest'],
    expressed: false,
  },
  {
    id: 'greenpath',
    name: 'GreenPath Logistics',
    industry: 'CleanTech - Logistics',
    stage: 'Pre-Seed',
    location: 'Dhaka, Bangladesh',
    pitch: 'Route optimisation reducing last-mile delivery carbon footprint by 30%. LOIs from 3 national carriers.',
    ask: 'BDT 25,00,000',
    askRaw: 2500000,
    match: 74,
    readiness: 61,
    matchReasons: ['CleanTech aligns with your broader portfolio interest', 'Pre-Seed stage matches your preference', 'Bangladesh-based business matches your geography'],
    expressed: false,
  },
  {
    id: 'chainlink-legal',
    name: 'Chainlink Legal',
    industry: 'LegalTech - SaaS',
    stage: 'Seed',
    location: 'Dhaka, Bangladesh',
    pitch: 'Contract lifecycle management for law firms. 60% review time reduction. Growing pipeline across South Asia.',
    ask: 'BDT 40,00,000',
    askRaw: 4000000,
    match: 68,
    readiness: 72,
    matchReasons: ['SaaS model aligns with your portfolio thesis', 'Seed stage is within your stated preference', 'Bangladesh geography matches'],
    expressed: false,
  },
];

const FILTER_INDUSTRIES = ['All Industries', 'FinTech', 'HealthTech', 'CleanTech', 'SaaS / B2B', 'Data & Analytics', 'LegalTech'];
const FILTER_STAGES = ['All Stages', 'Pre-Seed', 'Seed', 'Early Stage', 'Series A'];
const SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'readiness', label: 'Readiness' },
  { value: 'ask_asc', label: 'Funding Ask: Low to High' },
  { value: 'ask_desc', label: 'Funding Ask: High to Low' },
];

// --- Components ---------------------------------------------------------------

function ReadinessBar({ value }: { value: number }) {
  const color = value >= 75 ? '#22C55E' : value >= 55 ? '#C67A4E' : '#F59E0B';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10.5px] font-mono tabular-nums flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

function IncompletePrompt({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="mb-6 px-5 py-4 rounded-[12px] flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.14)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">Complete your Investor Preferences</p>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug">
          Better preferences help Vault Ventures generate more relevant opportunities and matches.
        </p>
      </div>
      <Button size="sm" className="flex-shrink-0" onClick={onComplete}>
        Complete Preferences
      </Button>
    </div>
  );
}

// --- Business card ------------------------------------------------------------

function BusinessCard({ biz, onExpressInterest, onMatchClick, onViewProfile, expressed }: {
  biz: Business;
  onExpressInterest: () => void;
  onMatchClick: () => void;
  onViewProfile: () => void;
  expressed: boolean;
}) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] overflow-hidden hover:border-[color:var(--vv-border-strong)] transition-colors group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1c2a3e]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">{biz.name}</h3>
              <Badge variant="neutral">{biz.stage}</Badge>
            </div>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{biz.industry} - {biz.location}</p>
          </div>
          <ScoreChip
            score={biz.match}
            label="Match"
            topFactors={biz.matchReasons.slice(0, 3)}
            onClick={e => { e.stopPropagation(); onMatchClick(); }}
          />
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug">{biz.pitch}</p>
      </div>

      {/* Match reasons */}
      <div className="px-5 py-3 border-b border-[#1c2a3e] space-y-1">
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5">Why this match</p>
        {biz.matchReasons.slice(0, 3).map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-[11.5px] text-[color:var(--vv-text-secondary)]">
            <svg width="10" height="10" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {r}
          </div>
        ))}
      </div>

      {/* Metrics + actions */}
      <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[color:var(--vv-text-tertiary)]">Readiness</span>
            <span className="text-[color:var(--vv-text-tertiary)]">Funding Ask</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ReadinessBar value={biz.readiness} />
            </div>
            <span className="font-mono text-[12px] font-semibold text-[#C67A4E] flex-shrink-0 tabular-nums">{biz.ask}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onViewProfile}>View Profile</Button>
          {expressed ? (
            <Button variant="ghost" size="sm" disabled>
              <svg width="11" height="11" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Interest Sent
            </Button>
          ) : (
            <Button size="sm" onClick={onExpressInterest}>Express Interest</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function ReverseDiscovery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('All Industries');
  const [stage, setStage] = useState('All Stages');
  const [sort, setSort] = useState('match');
  const [businesses, setBusinesses] = useState(BUSINESSES);
  const [matchItem, setMatchItem] = useState<Business | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [prefsComplete] = useState(true); // pre-filled demo state

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  function handleExpressInterest(id: string) {
    setBusinesses(bs => bs.map(b => b.id === id ? { ...b, expressed: true } : b));
  }

  const filtered = businesses.filter(b => {
    if (industry !== 'All Industries' && !b.industry.includes(industry)) return false;
    if (stage !== 'All Stages' && b.stage !== stage) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'match') return b.match - a.match;
    if (sort === 'readiness') return b.readiness - a.readiness;
    if (sort === 'ask_asc') return a.askRaw - b.askRaw;
    if (sort === 'ask_desc') return b.askRaw - a.askRaw;
    return 0;
  });

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">

      {/* Match explain drawer */}
      {matchItem && (
        <MatchExplainDrawer
          data={buildDemoMatchData(
            { name: matchItem.name, match: matchItem.match, role: matchItem.industry },
            'investor',
            () => { setMatchItem(null); navigate(`/app/businesses/${matchItem.id}`); }
          )}
          state="ready"
          onClose={() => setMatchItem(null)}
        />
      )}

      {/* Mobile filter sheet */}
      {mobileFilters && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileFilters(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] overflow-hidden"
            style={{ background: 'rgba(8,12,18,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(180,200,220,0.09)' }}>
            <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Filters</p>
              <button onClick={() => setMobileFilters(false)} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <FilterBlock label="Industry" options={FILTER_INDUSTRIES} value={industry} onChange={setIndustry} />
              <FilterBlock label="Stage" options={FILTER_STAGES} value={stage} onChange={setStage} />
              <FilterBlock label="Sort by" options={SORT_OPTIONS.map(o => o.label)} value={SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Best Match'}
                onChange={v => setSort(SORT_OPTIONS.find(o => o.label === v)?.value ?? 'match')} />
              <Button className="w-full" onClick={() => setMobileFilters(false)}>Apply</Button>
            </div>
          </div>
        </>
      )}

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
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Matched Opportunities</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)]">Matched Opportunities</h1>
            {!loading && (
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#C67A4E]/10 text-[#C67A4E] border border-[#C67A4E]/20">
                {filtered.length}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">
            Businesses surfaced by your investment preferences and AI match scoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"
            onClick={() => navigate('/app/investor/preferences')}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
            </svg>
            Edit Preferences
          </Button>
          <button onClick={() => setMobileFilters(true)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] text-[color:var(--vv-text-tertiary)] border border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)] transition-colors">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* Incomplete prompt */}
      {!prefsComplete && <IncompletePrompt onComplete={() => navigate('/app/investor/preferences')} />}

      {/* Desktop filter bar */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-5">
        <FilterSelect label="Industry" options={FILTER_INDUSTRIES} value={industry} onChange={setIndustry} />
        <FilterSelect label="Stage" options={FILTER_STAGES} value={stage} onChange={setStage} />
        <FilterSelect label="Sort" options={SORT_OPTIONS.map(o => o.label)}
          value={SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Best Match'}
          onChange={v => setSort(SORT_OPTIONS.find(o => o.label === v)?.value ?? 'match')} />
        {(industry !== 'All Industries' || stage !== 'All Stages') && (
          <button onClick={() => { setIndustry('All Industries'); setStage('All Stages'); }}
            className="text-[11.5px] text-[#C67A4E] hover:underline px-2">
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState onEditPrefs={() => navigate('/app/investor/preferences')} />
      ) : (
        <div className="space-y-4">
          {filtered.map(biz => (
            <BusinessCard
              key={biz.id}
              biz={biz}
              expressed={biz.expressed}
              onMatchClick={() => setMatchItem(biz)}
              onViewProfile={() => navigate(`/app/businesses/${biz.id}`)}
              onExpressInterest={() => handleExpressInterest(biz.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ------------------------------------------------------------------

function FilterSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 pl-2.5 pr-6 appearance-none bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-[7px] text-[11.5px] text-[color:var(--vv-text-secondary)] outline-none hover:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]">
        <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}

function FilterBlock({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className="px-3 py-1.5 rounded-[8px] text-[12px] border transition-all"
            style={value === o ? {
              background: 'rgba(198,122,78,0.10)', borderColor: 'rgba(198,122,78,0.28)', color: '#C67A4E',
            } : {
              background: 'rgba(24,35,56,0.7)', borderColor: 'rgba(36,48,74,0.9)', color: '#5E6D8F',
            }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#C67A4E] animate-pulse" />
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Finding relevant opportunities-</p>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
              <div className="h-3 w-24 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
            </div>
            <div className="w-16 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
          </div>
          <div className="h-3 w-full rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
          <div className="h-3 w-4/5 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onEditPrefs }: { onEditPrefs: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mb-4">
        <svg width="22" height="22" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-1.5">No strong matches yet</p>
      <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-xs leading-snug mb-5">
        Try adjusting your Investor Preferences to discover more relevant opportunities.
      </p>
      <Button onClick={onEditPrefs}>Review Preferences</Button>
    </div>
  );
}