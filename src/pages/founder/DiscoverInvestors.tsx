import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconX } from '../../components/layout/Icons';
import { MatchScoreChip, MatchExplanationDrawer } from '../../components/ui/AIInsights';
import type { MatchFactor, MatchDetail } from '../../components/ui/AIInsights';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Investor {
  id: string;
  name: string;
  initials: string;
  color: string;
  title: string;
  company: string;
  location: string;
  bio: string;
  investmentFocus: string[];
  preferredStages: string[];
  portfolioCount: number;
  activeSince: string;
  verificationTier: 0 | 1 | 2;
  matchScore: number;
  matchReasons: MatchFactor[];
  matchDetail: MatchDetail;
}

interface Filters {
  industries: string[];
  stages: string[];
  location: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const INVESTORS: Investor[] = [
  {
    id: 'rahim-chowdhury',
    name: 'Rahim Chowdhury',
    initials: 'RC',
    color: '#C67A4E',
    title: 'Angel Investor',
    company: 'Independent',
    location: 'Dhaka',
    bio: '15+ years in financial services. Early-stage angel investor focused on FinTech and HealthTech startups with strong Bangladesh market fit.',
    investmentFocus: ['FinTech', 'HealthTech'],
    preferredStages: ['Pre-Seed', 'Seed'],
    portfolioCount: 8,
    activeSince: '2018',
    verificationTier: 2,
    matchScore: 88,
    matchReasons: [
      { label: 'HealthTech focus alignment', description: 'Invests in HealthTech — a direct match for your business.', positive: true },
      { label: 'Pre-Seed stage match', description: 'Actively invests at Pre-Seed, your current stage.', positive: true },
      { label: 'Bangladesh market expertise', description: 'Strong local market network and deal flow.', positive: true },
    ],
    matchDetail: {
      score: 88,
      entityName: 'Rahim Chowdhury',
      summary: 'Strong alignment — HealthTech focus, Pre-Seed stage, and Bangladesh market expertise directly match your business.',
      alignments: [
        { factor: 'Industry Focus', score: 94, description: 'HealthTech is a primary investment focus — direct sector match.' },
        { factor: 'Stage Preference', score: 90, description: 'Actively invests at Pre-Seed — your current funding stage.' },
        { factor: 'Market Expertise', score: 86, description: 'Deep Bangladesh market network relevant to your local expansion.' },
        { factor: 'Track Record', score: 82, description: 'Tier 2 verified with 8 investments since 2018.' },
      ],
      gaps: [
        { factor: 'Portfolio Concentration', description: 'Limited portfolio breadth — 8 investments may mean slower deployment.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'HealthTech is a primary investment focus — your sector is directly in scope.',
        'Pre-Seed is actively invested — no pitch timing gap.',
        'Bangladesh market network could accelerate local clinic partnerships.',
        '15+ years in financial services adds domain credibility to your investor cap table.',
      ],
    },
  },
  {
    id: 'sophia-lee',
    name: 'Sophia Lee',
    initials: 'SL',
    color: '#C9A24B',
    title: 'VC Partner',
    company: 'NextGen Ventures',
    location: 'Dhaka',
    bio: 'Partner at NextGen Ventures. Leads SaaS and EdTech investments across South and Southeast Asia. Managed ৳50M+ in deployed capital.',
    investmentFocus: ['SaaS', 'EdTech'],
    preferredStages: ['Seed', 'Series A'],
    portfolioCount: 15,
    activeSince: '2016',
    verificationTier: 2,
    matchScore: 64,
    matchReasons: [
      { label: 'SaaS and EdTech focus', description: 'Primary sectors do not overlap with HealthTech.', positive: false },
      { label: 'Seed stage preference', description: 'Stage aligns but sector is outside her focus.', positive: true },
      { label: 'Strong track record', description: '15 investments and ৳50M+ deployed is credible.', positive: true },
    ],
    matchDetail: {
      score: 64,
      entityName: 'Sophia Lee',
      summary: 'Moderate match — Seed stage aligns and track record is strong, but SaaS/EdTech focus does not directly cover HealthTech.',
      alignments: [
        { factor: 'Stage Preference', score: 80, description: 'Seed investments align with your current fundraising stage.' },
        { factor: 'Track Record', score: 82, description: '৳50M+ deployed across 15 investments — substantial credibility.' },
        { factor: 'Deployment Scale', score: 75, description: 'Southeast Asia focus includes Bangladesh market context.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'SaaS and EdTech are primary sectors — HealthTech is outside current thesis.', severity: 'weak' },
        { factor: 'Sector Expertise', description: 'Healthcare-specific domain knowledge not listed in focus areas.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Seed stage aligns with your current fundraising stage.',
        'A ৳50M+ portfolio brings strong follow-on capacity if a thesis expansion occurs.',
        'Southeast Asia experience means regional market understanding.',
        'Worth approaching with a clear cross-sector value proposition.',
      ],
    },
  },
  {
    id: 'kabir-hassan',
    name: 'Kabir Hassan',
    initials: 'KH',
    color: '#22C55E',
    title: 'Family Office Principal',
    company: 'Hassan Capital',
    location: 'Chittagong',
    bio: 'Family office focused on CleanTech and AgriTech in rural and semi-urban Bangladesh. Patient capital with hands-on operational support.',
    investmentFocus: ['CleanTech', 'AgriTech'],
    preferredStages: ['Pre-Seed', 'Seed'],
    portfolioCount: 5,
    activeSince: '2020',
    verificationTier: 1,
    matchScore: 52,
    matchReasons: [
      { label: 'CleanTech and AgriTech focus', description: 'Sector does not align with HealthTech.', positive: false },
      { label: 'Pre-Seed stage match', description: 'Invests at the right stage.', positive: true },
      { label: 'Patient capital approach', description: 'Hands-on support could be useful for early growth.', positive: true },
    ],
    matchDetail: {
      score: 52,
      entityName: 'Kabir Hassan',
      summary: 'Developing match — Pre-Seed stage is right but CleanTech/AgriTech focus does not align with HealthTech.',
      alignments: [
        { factor: 'Stage Preference', score: 78, description: 'Pre-Seed stage matches your current funding stage.' },
        { factor: 'Patient Capital', score: 68, description: 'Hands-on operational support could help early clinic rollouts.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'CleanTech and AgriTech are primary sectors — HealthTech is not in scope.', severity: 'weak' },
        { factor: 'Geographic Focus', description: 'Chittagong-centric portfolio — may not cover Dhaka HealthTech operations.', severity: 'moderate' },
        { factor: 'Verification', description: 'Tier 1 — limited verification compared to other options.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Pre-Seed stage matches and patient capital approach suits early-stage HealthTech.',
        'Operational support could accelerate early clinic onboarding.',
        'Sector mismatch is the primary gap to address in any outreach.',
      ],
    },
  },
  {
    id: 'faisal-alam',
    name: 'Faisal Alam',
    initials: 'FA',
    color: '#A78BFA',
    title: 'Angel Investor',
    company: 'Independent',
    location: 'Dhaka',
    bio: 'Serial entrepreneur turned angel investor. 12 investments in early-stage FinTech and LegalTech. Strong regulatory and compliance network.',
    investmentFocus: ['FinTech', 'LegalTech'],
    preferredStages: ['Pre-Seed'],
    portfolioCount: 12,
    activeSince: '2019',
    verificationTier: 2,
    matchScore: 71,
    matchReasons: [
      { label: 'FinTech/LegalTech focus', description: 'Sector is adjacent but not a direct HealthTech match.', positive: false },
      { label: 'Pre-Seed specialist', description: 'Dedicated pre-seed investor — your current stage.', positive: true },
      { label: 'Compliance network', description: 'Strong regulatory network could help your compliance needs.', positive: true },
    ],
    matchDetail: {
      score: 71,
      entityName: 'Faisal Alam',
      summary: 'Good match on stage and regulatory expertise — sector is adjacent, with meaningful compliance network value.',
      alignments: [
        { factor: 'Stage Alignment', score: 88, description: 'Pre-Seed specialist — dedicated focus on your exact stage.' },
        { factor: 'Regulatory Network', score: 80, description: 'Strong compliance contacts — directly applicable to HealthTech operations.' },
        { factor: 'Investment Experience', score: 76, description: '12 investments as a serial entrepreneur-turned-investor adds operational credibility.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'FinTech and LegalTech are primary sectors — HealthTech is adjacent but not core.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Pre-Seed specialization means no pitch timing gap — actively deploying.',
        'Regulatory and compliance network is directly relevant to HealthTech licensing.',
        'Serial entrepreneur background brings operational insight beyond capital.',
        'Adjacent sector experience means HealthTech pitch would require clear differentiation.',
      ],
    },
  },
  {
    id: 'nadia-rahman',
    name: 'Nadia Rahman',
    initials: 'NR',
    color: '#60A5FA',
    title: 'Venture Partner',
    company: 'BD Tech Fund',
    location: 'Dhaka',
    bio: "Venture Partner at BD Tech Fund, Bangladesh's largest early-stage VC. Focus areas: HealthTech, EdTech, and digital SaaS. 22-business active portfolio.",
    investmentFocus: ['HealthTech', 'EdTech', 'SaaS'],
    preferredStages: ['Seed', 'Series A'],
    portfolioCount: 22,
    activeSince: '2015',
    verificationTier: 2,
    matchScore: 82,
    matchReasons: [
      { label: 'HealthTech primary focus', description: 'Direct sector alignment with your business.', positive: true },
      { label: 'Seed preference', description: 'Typically invests at Seed — slightly later than current stage.', positive: false },
      { label: 'Largest BD early-stage VC', description: 'BD Tech Fund portfolio brings strong follow-on potential.', positive: true },
    ],
    matchDetail: {
      score: 82,
      entityName: 'Nadia Rahman',
      summary: 'Strong match — HealthTech is a primary focus and BD Tech Fund portfolio brings exceptional follow-on potential.',
      alignments: [
        { factor: 'Industry Focus', score: 92, description: 'HealthTech is a primary investment focus — direct sector match.' },
        { factor: 'Portfolio Follow-On', score: 88, description: "Bangladesh's largest early-stage VC means strong institutional follow-on potential." },
        { factor: 'Track Record', score: 84, description: '22-business active portfolio demonstrates active deployment cadence.' },
        { factor: 'Stage Preference', score: 64, description: 'Seed is preferred — you may need to pitch bridge to Seed readiness.' },
      ],
      gaps: [
        { factor: 'Stage Timing', description: 'Typically leads at Seed — Pre-Seed requires bridge narrative or early pipeline entry.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'HealthTech is a primary stated focus — your sector is directly in scope.',
        'BD Tech Fund provides the strongest follow-on pathway of any local VC.',
        'Active portfolio of 22 businesses shows consistent deployment pace.',
        'A clear Pre-Seed-to-Seed roadmap would address the stage timing gap.',
      ],
    },
  },
];

const INDUSTRIES = ['FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AgriTech', 'SaaS', 'LegalTech'];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];
const SORT_OPTIONS = [
  { value: 'portfolio-desc', label: 'Portfolio Size' },
  { value: 'newest', label: 'Most Active' },
  { value: 'name', label: 'Name A–Z' },
];

const EMPTY_FILTERS: Filters = { industries: [], stages: [], location: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function countActiveFilters(f: Filters): number {
  return f.industries.length + f.stages.length + (f.location.trim() ? 1 : 0);
}

function applyFilters(items: Investor[], filters: Filters, search: string): Investor[] {
  const q = search.toLowerCase().trim();
  return items.filter(inv => {
    if (q && ![inv.name, inv.title, inv.company, inv.bio, ...inv.investmentFocus]
      .some(t => t.toLowerCase().includes(q))) return false;
    if (filters.industries.length > 0 && !filters.industries.some(i => inv.investmentFocus.includes(i))) return false;
    if (filters.stages.length > 0 && !filters.stages.some(s => inv.preferredStages.includes(s))) return false;
    if (filters.location.trim() && !inv.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });
}

function sortItems(items: Investor[], sort: string): Investor[] {
  const s = [...items];
  if (sort === 'portfolio-desc') s.sort((a, b) => b.portfolioCount - a.portfolioCount);
  else if (sort === 'newest') s.sort((a, b) => parseInt(b.activeSince) - parseInt(a.activeSince));
  else if (sort === 'name') s.sort((a, b) => a.name.localeCompare(b.name));
  return s;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className={`px-2.5 py-1 rounded text-[11.5px] font-medium border transition-all ${
        active
          ? 'bg-[rgba(198,122,78,0.10)] border-[#C67A4E] text-[#C67A4E]'
          : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text-secondary)]'
      }`}>
      {label}
    </button>
  );
}

function SidebarFilters({ filters, onChange, onClear }: {
  filters: Filters; onChange: (f: Filters) => void; onClear: () => void;
}) {
  const count = countActiveFilters(filters);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1c2a3e] shrink-0">
        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Filters</p>
        {count > 0 && (
          <button onClick={onClear} className="text-[11px] text-[#C67A4E] hover:underline transition-colors">
            Clear all ({count})
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">Investment Focus</p>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(i => (
              <FilterChip key={i} label={i} active={filters.industries.includes(i)}
                onClick={() => onChange({ ...filters, industries: toggle(filters.industries, i) })} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">Preferred Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <FilterChip key={s} label={s} active={filters.stages.includes(s)}
                onClick={() => onChange({ ...filters, stages: toggle(filters.stages, s) })} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">Location</p>
          <input
            type="text"
            value={filters.location}
            onChange={e => onChange({ ...filters, location: e.target.value })}
            placeholder="e.g. Dhaka"
            className="w-full h-8 px-3 rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function ActiveFilterStrip({ filters, search, onChange, onClearAll }: {
  filters: Filters; search: string; onChange: (f: Filters) => void; onClearAll: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  filters.industries.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, industries: filters.industries.filter(x => x !== v) }) }));
  filters.stages.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, stages: filters.stages.filter(x => x !== v) }) }));
  if (filters.location.trim()) chips.push({ label: filters.location, onRemove: () => onChange({ ...filters, location: '' }) });
  if (chips.length === 0 && !search) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2 mb-1">
      {search && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-secondary)]">
          "{search}"
        </span>
      )}
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
          style={{ background: 'rgba(198,122,78,0.08)', borderColor: 'rgba(198,122,78,0.22)', color: '#C67A4E' }}>
          {c.label}
          <button onClick={c.onRemove} aria-label={`Remove ${c.label} filter`} className="ml-0.5 opacity-70 hover:opacity-100"><IconX s={10} /></button>
        </span>
      ))}
      {chips.length > 0 && (
        <button onClick={onClearAll} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] underline underline-offset-2 transition-colors ml-0.5">
          Clear all
        </button>
      )}
    </div>
  );
}

function InvestorCard({ investor, onOpenMatch }: { investor: Investor; onOpenMatch: (d: MatchDetail) => void }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 hover:border-[color:var(--vv-border-strong)] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold flex-shrink-0"
          style={{ background: `${investor.color}18`, border: `1.5px solid ${investor.color}35`, color: investor.color }}>
          {investor.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] leading-none">{investor.name}</p>
              {investor.verificationTier > 0 && <VerificationBadge tier={investor.verificationTier as 0 | 1 | 2 | 3} />}
            </div>
            <div className="sm:text-right shrink-0 space-y-1">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Portfolio</p>
                <p className="font-mono text-[13px] font-semibold text-[#C9A24B] tabular-nums">{investor.portfolioCount} investments</p>
              </div>
              <MatchScoreChip score={investor.matchScore} onClick={() => onOpenMatch(investor.matchDetail)} />
            </div>
          </div>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2">
            <span className="text-[#C67A4E] font-medium">{investor.title}</span>
            {investor.company !== 'Independent' && ` · ${investor.company}`}
            {' · '}{investor.location}{' · '}Active since {investor.activeSince}
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug line-clamp-2 mb-2.5">{investor.bio}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] mr-0.5">Focus:</span>
                {investor.investmentFocus.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded text-[10.5px] border"
                    style={{ background: 'rgba(201,162,75,0.07)', borderColor: 'rgba(201,162,75,0.18)', color: '#C9A24B' }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] mr-0.5">Stages:</span>
                {investor.preferredStages.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-[10.5px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]">{s}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onOpenMatch(investor.matchDetail)}
              className="text-[10.5px] text-[#C67A4E] hover:underline shrink-0 transition-colors">
              View match analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-32" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-48" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(201,162,75,0.08)', border: '1px solid rgba(201,162,75,0.18)' }}>
        <svg width="20" height="20" fill="none" stroke="#C9A24B" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1.5">No investors found</h3>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-xs mx-auto">
        {hasFilters
          ? 'No investors match your current filters. Try adjusting or clearing them.'
          : 'No investors are available at this time. Check back soon.'}
      </p>
      {hasFilters && <Button variant="secondary" size="sm" onClick={onClear}>Clear Filters</Button>}
    </div>
  );
}

function MobileFilterDrawer({ filters, onChange, onClear, onClose }: {
  filters: Filters; onChange: (f: Filters) => void; onClear: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="investor-filters-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative bg-[#0D1626] border-t border-[#1c2a3e] rounded-t-[16px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] shrink-0">
          <p id="investor-filters-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">Filters</p>
          <button onClick={onClose} aria-label="Close investor filters" className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors">
            <IconX s={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarFilters filters={filters} onChange={onChange} onClear={onClear} />
        </div>
        <div className="px-5 py-4 border-t border-[#1c2a3e] shrink-0">
          <Button className="w-full" size="md" onClick={onClose}>View Results</Button>
        </div>
      </aside>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DiscoverInvestors() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState('portfolio-desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [matchDrawer, setMatchDrawer] = useState<MatchDetail | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(
    () => sortItems(applyFilters(INVESTORS, filters, search), sort),
    [search, filters, sort]
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0 || !!search.trim();
  const handleClearAll = () => { setFilters(EMPTY_FILTERS); setSearch(''); };

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[256px] shrink-0 border-r border-[#1c2a3e] sticky top-0 max-h-screen">
        <SidebarFilters filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
      </aside>

      <div className="flex-1 min-w-0 p-5">
        <div className="max-w-[880px]">
          <div className="mb-5">
            <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] leading-none">Discover Investors</h1>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">Find investors whose focus aligns with your business.</p>
          </div>

          {/* Search + controls */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, focus area, company…"
                className="w-full h-9 pl-9 pr-8 rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
                  <IconX s={13} />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="h-9 pl-3 pr-7 rounded-md text-[12.5px] text-[color:var(--vv-text-secondary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none appearance-none cursor-pointer transition-colors">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <button onClick={() => setShowMobileFilters(true)}
              className={`lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-md text-[12.5px] font-medium border transition-all shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-[rgba(198,122,78,0.08)] border-[rgba(198,122,78,0.25)] text-[#C67A4E]'
                  : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#C67A4E] text-[color:var(--vv-on-copper)] text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          <ActiveFilterStrip filters={filters} search={search} onChange={setFilters} onClearAll={handleClearAll} />

          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                {results.length} {results.length === 1 ? 'investor' : 'investors'}
                {hasActiveFilters ? ' match your filters' : ' available'}
              </p>
              <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1">
                <span style={{ color: '#C67A4E' }}>✦</span>
                AI match scores shown for your business profile
              </span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : results.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={handleClearAll} />
          ) : (
            <div className="space-y-3">
              {results.map(inv => <InvestorCard key={inv.id} investor={inv} onOpenMatch={setMatchDrawer} />)}
            </div>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <MobileFilterDrawer
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          onClose={() => setShowMobileFilters(false)}
        />
      )}

      {matchDrawer && (
        <MatchExplanationDrawer
          data={matchDrawer}
          cta={{ label: 'Express Interest' }}
          onClose={() => setMatchDrawer(null)}
        />
      )}
    </div>
  );
}