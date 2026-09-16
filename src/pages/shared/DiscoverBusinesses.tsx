import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconArrowRight, IconX } from '../../components/layout/Icons';
import { MatchScoreChip, MatchExplanationDrawer } from '../../components/ui/AIInsights';
import type { MatchFactor, MatchDetail } from '../../components/ui/AIInsights';
import { api, ApiError } from '../../services/api';

// ── BDT ───────────────────────────────────────────────────────────────────────

function fmtBDT(n: number): string {
  return '৳' + n.toLocaleString('en-IN');
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  initials: string;
  industry: string;
  stage: string;
  location: string;
  description: string;
  fundingAmount: number;
  requiredSkills: string[];
  verificationTier: 0 | 1 | 2;
  foundedYear: number;
  teamSize: string;
  matchScore: number;
  matchReasons: MatchFactor[];
  matchDetail: MatchDetail;
}

interface Filters {
  industries: string[];
  stages: string[];
  skills: string[];
  fundingPreset: string;
}

const INDUSTRIES = ['FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AgriTech', 'SaaS', 'Logistics'];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];
const SKILLS_LIST = [
  'Machine Learning', 'FinTech', 'HealthTech', 'EdTech', 'Marketing', 'Product Management',
  'Business Development', 'Operations', 'Legal', 'Finance', 'Sales', 'Strategy',
  'Engineering', 'Agriculture', 'Logistics Engineering',
];

const FUNDING_PRESETS = [
  { id: 'under25L', label: 'Under ৳25L', min: 0, max: 2_500_000 },
  { id: '25L-1Cr', label: '৳25L – ৳1Cr', min: 2_500_000, max: 10_000_000 },
  { id: '1Cr-5Cr', label: '৳1Cr – ৳5Cr', min: 10_000_000, max: 50_000_000 },
  { id: '5Cr+', label: '৳5Cr+', min: 50_000_000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'match-desc', label: 'Best Match' },
  { value: 'funding-desc', label: 'Funding ↓' },
  { value: 'funding-asc', label: 'Funding ↑' },
  { value: 'name', label: 'Name A–Z' },
];

const EMPTY_FILTERS: Filters = { industries: [], stages: [], skills: [], fundingPreset: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function countActiveFilters(f: Filters): number {
  return f.industries.length + f.stages.length + f.skills.length + (f.fundingPreset ? 1 : 0);
}

function applyFilters(items: Business[], filters: Filters, search: string): Business[] {
  const q = search.toLowerCase().trim();
  return items.filter(b => {
    if (q && ![b.name, b.industry, b.description, ...b.requiredSkills]
      .some(t => t.toLowerCase().includes(q))) return false;
    if (filters.industries.length > 0 && !filters.industries.includes(b.industry)) return false;
    if (filters.stages.length > 0 && !filters.stages.includes(b.stage)) return false;
    if (filters.skills.length > 0 && !filters.skills.some(s => b.requiredSkills.includes(s))) return false;
    if (filters.fundingPreset) {
      const preset = FUNDING_PRESETS.find(p => p.id === filters.fundingPreset);
      if (preset && (b.fundingAmount < preset.min || b.fundingAmount > preset.max)) return false;
    }
    return true;
  });
}

function sortItems(items: Business[], sort: string): Business[] {
  const s = [...items];
  if (sort === 'match-desc') s.sort((a, b) => b.matchScore - a.matchScore);
  else if (sort === 'funding-desc') s.sort((a, b) => b.fundingAmount - a.fundingAmount);
  else if (sort === 'funding-asc') s.sort((a, b) => a.fundingAmount - b.fundingAmount);
  else if (sort === 'name') s.sort((a, b) => a.name.localeCompare(b.name));
  return s;
}

// ── Filter chip toggle ────────────────────────────────────────────────────────

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

// ── Sidebar ───────────────────────────────────────────────────────────────────

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
        <FilterSection label="Industry">
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(i => (
              <FilterChip key={i} label={i} active={filters.industries.includes(i)}
                onClick={() => onChange({ ...filters, industries: toggle(filters.industries, i) })} />
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Business Stage">
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <FilterChip key={s} label={s} active={filters.stages.includes(s)}
                onClick={() => onChange({ ...filters, stages: toggle(filters.stages, s) })} />
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Funding Requirement">
          <div className="space-y-1.5">
            {FUNDING_PRESETS.map(p => (
              <button key={p.id} type="button"
                onClick={() => onChange({ ...filters, fundingPreset: filters.fundingPreset === p.id ? '' : p.id })}
                className={`w-full text-left px-3 py-2 rounded-md text-[12px] border transition-all ${
                  filters.fundingPreset === p.id
                    ? 'bg-[rgba(198,122,78,0.10)] border-[#C67A4E] text-[#C67A4E]'
                    : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text-secondary)]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Required Skills">
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_LIST.map(s => (
              <FilterChip key={s} label={s} active={filters.skills.includes(s)}
                onClick={() => onChange({ ...filters, skills: toggle(filters.skills, s) })} />
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">{label}</p>
      {children}
    </div>
  );
}

// ── Active filter strip ───────────────────────────────────────────────────────

function ActiveFilterStrip({ filters, search, onChange, onClearAll }: {
  filters: Filters; search: string; onChange: (f: Filters) => void; onClearAll: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  filters.industries.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, industries: filters.industries.filter(x => x !== v) }) }));
  filters.stages.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, stages: filters.stages.filter(x => x !== v) }) }));
  filters.skills.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, skills: filters.skills.filter(x => x !== v) }) }));
  if (filters.fundingPreset) {
    const p = FUNDING_PRESETS.find(x => x.id === filters.fundingPreset);
    chips.push({ label: p?.label ?? '', onRemove: () => onChange({ ...filters, fundingPreset: '' }) });
  }
  if (chips.length === 0 && !search) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2 mb-1">
      {search && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-secondary)]">
          "{search}"
        </span>
      )}
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
          style={{ background: 'rgba(198,122,78,0.08)', borderColor: 'rgba(198,122,78,0.22)', color: '#C67A4E' }}>
          {c.label}
          <button onClick={c.onRemove} className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
            <IconX s={10} />
          </button>
        </span>
      ))}
      {chips.length > 0 && (
        <button onClick={onClearAll} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors underline underline-offset-2 ml-0.5">
          Clear all
        </button>
      )}
    </div>
  );
}

// ── Business card — list view ─────────────────────────────────────────────────

function BusinessCardList({ business, contextLabel, onOpenMatch }: {
  business: Business;
  contextLabel: string;
  onOpenMatch: (biz: Business) => void;
}) {
  return (
    <Link to={`/app/businesses/${business.id}`}>
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 hover:border-[color:var(--vv-border-strong)] hover:bg-[#131e30] transition-all group cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-[#C67A4E] flex-shrink-0"
            style={{ background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.22)' }}>
            {business.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] leading-none">{business.name}</p>
                {business.verificationTier > 0 && <VerificationBadge tier={business.verificationTier as 0 | 1 | 2} />}
                <Badge variant="neutral">{business.stage}</Badge>
              </div>
              <div className="sm:text-right shrink-0 space-y-1">
                {business.fundingAmount > 0 && (
                  <div>
                    <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Seeking</p>
                    <p className="font-mono text-[13px] font-semibold text-[#C67A4E] tabular-nums">{fmtBDT(business.fundingAmount)}</p>
                  </div>
                )}
                <MatchScoreChip score={business.matchScore} contextLabel={contextLabel} onClick={() => onOpenMatch(business)} />
              </div>
            </div>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2">
              <span className="text-[#C67A4E] font-medium">{business.industry}</span>
              {' · '}{business.location}{' · '}Est. {business.foundedYear}{' · '}{business.teamSize}
            </p>
            <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug line-clamp-2 mb-2.5">{business.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {business.requiredSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)] mr-0.5">Seeking:</span>
                  {business.requiredSkills.slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded text-[10.5px] border"
                      style={{ background: 'rgba(198,122,78,0.06)', borderColor: 'rgba(198,122,78,0.16)', color: '#C67A4E' }}>
                      {s}
                    </span>
                  ))}
                  {business.requiredSkills.length > 4 && (
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">+{business.requiredSkills.length - 4} more</span>
                  )}
                </div>
              )}
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onOpenMatch(business); }}
                className="text-[10.5px] text-[#C67A4E] hover:underline shrink-0 transition-colors">
                View match analysis
              </button>
            </div>
          </div>
          <IconArrowRight s={14} className="text-[#35446A] group-hover:text-[#C67A4E] transition-colors mt-0.5 shrink-0 hidden sm:block" />
        </div>
      </div>
    </Link>
  );
}

// ── Business card — grid view ─────────────────────────────────────────────────

function BusinessCardGrid({ business, contextLabel, onOpenMatch }: {
  business: Business; contextLabel: string; onOpenMatch: (biz: Business) => void;
}) {
  return (
    <Link to={`/app/businesses/${business.id}`} className="block h-full">
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 hover:border-[color:var(--vv-border-strong)] transition-all group h-full flex flex-col">
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-[#C67A4E]"
            style={{ background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.22)' }}>
            {business.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] leading-tight">{business.name}</p>
              {business.verificationTier > 0 && <VerificationBadge tier={business.verificationTier as 0 | 1 | 2} />}
            </div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              <span className="text-[#C67A4E]">{business.industry}</span> · {business.stage}
            </p>
          </div>
        </div>
        <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug line-clamp-3 mb-3 flex-1">{business.description}</p>
        <div className="space-y-2 pt-2 border-t border-[#1c2a3e]">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{business.location} · Est. {business.foundedYear}</span>
            {business.fundingAmount > 0 && (
              <span className="font-mono text-[12px] font-semibold text-[#C67A4E]">{fmtBDT(business.fundingAmount)}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {business.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {business.requiredSkills.slice(0, 3).map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] border"
                    style={{ background: 'rgba(198,122,78,0.06)', borderColor: 'rgba(198,122,78,0.16)', color: '#C67A4E' }}>
                    {s}
                  </span>
                ))}
                {business.requiredSkills.length > 3 && (
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">+{business.requiredSkills.length - 3}</span>
                )}
              </div>
            )}
            <MatchScoreChip score={business.matchScore} contextLabel={contextLabel} onClick={() => onOpenMatch(business)} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex gap-2">
            <div className="h-3.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-28" />
            <div className="h-3.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-14" />
          </div>
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-40" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.18)' }}>
        <svg width="20" height="20" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1.5">No businesses found</h3>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-xs mx-auto">
        {hasFilters
          ? 'No businesses match your current filters. Try adjusting or clearing them to see more results.'
          : 'No published businesses are currently available matching your role criteria. Check back soon.'}
      </p>
      {hasFilters && (
        <Button variant="secondary" size="sm" onClick={onClear}>Clear Filters</Button>
      )}
    </div>
  );
}

// ── Mobile filter drawer ──────────────────────────────────────────────────────

function MobileFilterDrawer({ filters, onChange, onClear, onClose }: {
  filters: Filters; onChange: (f: Filters) => void; onClear: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="business-filters-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative bg-[#0D1626] border-t border-[#1c2a3e] rounded-t-[16px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] shrink-0">
          <p id="business-filters-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">Filters</p>
          <button onClick={onClose} aria-label="Close business filters" className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors">
            <IconX s={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarFilters filters={filters} onChange={onChange} onClear={onClear} />
        </div>
        <div className="px-5 py-4 border-t border-[#1c2a3e] shrink-0">
          <Button className="w-full" size="md" onClick={onClose}>
            View Results <IconArrowRight s={14} />
          </Button>
        </div>
      </aside>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DiscoverBusinesses({ context }: { context: 'investor' | 'professional' }) {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState('match-desc');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.get<any[]>(`/api/me/recommendations/businesses?role=${context}`);
      const mapped: Business[] = (data || []).map((item: any) => {
        const name = item.name || 'Published Business';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'PB';

        const matchObj = item.match || {};
        const score = Math.round((matchObj.overall_score ?? 0) * 100);
        const alignments = matchObj.strongest_alignments || [];
        const gaps = matchObj.potential_gaps || [];

        const matchReasons: MatchFactor[] = [
          ...alignments.map((a: any) => ({
            label: a.factor_name || 'Alignment',
            description: a.explanation || '',
            positive: true,
          })),
          ...gaps.map((g: any) => ({
            label: g.factor_name || 'Gap',
            description: g.explanation || '',
            positive: false,
          })),
        ];

        const matchDetail: MatchDetail = {
          score,
          entityName: name,
          summary: matchObj.summary_explanation || `AI matching analysis for ${name}.`,
          alignments: alignments.map((a: any) => ({
            factor: a.factor_name || 'Factor',
            score: Math.round((a.score ?? 0) * 100),
            description: a.explanation || '',
          })),
          gaps: gaps.map((g: any) => ({
            factor: g.factor_name || 'Factor',
            description: g.explanation || '',
            severity: (g.score ?? 0) < 0.3 ? 'weak' : 'moderate',
          })),
          whyThisMatch: alignments.map((a: any) => a.explanation).filter(Boolean),
        };

        return {
          id: String(item.id),
          name,
          initials,
          industry: item.industry || 'Technology',
          stage: item.business_stage || 'Seed',
          location: item.location || 'Dhaka',
          description: item.description || '',
          fundingAmount: item.funding_amount ? Number(item.funding_amount) : 0,
          requiredSkills: item.skills || [],
          verificationTier: 1,
          foundedYear: 2023,
          teamSize: item.expected_involvement || 'Core Team',
          matchScore: score,
          matchReasons,
          matchDetail,
        };
      });
      setBusinesses(mapped);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load business recommendations.');
      }
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleExpressInterest = async (business: Business) => {
    setInterestLoading(true);
    setInterestSuccess(null);
    try {
      await api.post(`/api/me/businesses/${business.id}/express-interest`, {
        role: context,
      });
      setInterestSuccess(`Interest expressed in ${business.name}!`);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to express interest.';
      setErrorMessage(msg);
    } finally {
      setInterestLoading(false);
    }
  };

  const results = useMemo(
    () => sortItems(applyFilters(businesses, filters, search), sort),
    [businesses, search, filters, sort]
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0 || !!search.trim();

  const handleClearAll = () => { setFilters(EMPTY_FILTERS); setSearch(''); };

  const pageTitle = context === 'investor' ? 'Discover Businesses' : 'Discover Opportunities';
  const pageSubtitle = context === 'investor'
    ? 'Browse published businesses seeking investment.'
    : 'Find businesses looking for skilled professionals.';

  const ctaLabel = context === 'investor' ? 'Express Interest' : 'Apply / Connect';
  const contextLabel = context === 'investor' ? 'Investor match' : 'Professional match';
  
  const handleOpenMatch = (biz: Business) => {
    setActiveBusiness(biz);
    setInterestSuccess(null);
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[256px] shrink-0 border-r border-[#1c2a3e] sticky top-0 max-h-screen">
        <SidebarFilters filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-5">
        <div className="max-w-[880px]">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] leading-none">{pageTitle}</h1>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">{pageSubtitle}</p>
          </div>

          {/* Search + controls row */}
          <div className="flex items-center gap-2 mb-2">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, industry, skills…"
                className="w-full h-9 pl-9 pr-8 rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
                  <IconX s={13} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="h-9 pl-3 pr-7 rounded-md text-[12.5px] text-[color:var(--vv-text-secondary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none appearance-none cursor-pointer transition-colors">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            {/* Layout toggle — desktop */}
            <div className="hidden sm:flex items-center bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md p-0.5 shrink-0">
              {(['list', 'grid'] as const).map(l => (
                <button key={l} onClick={() => setLayout(l)} aria-label={l === 'list' ? 'List view' : 'Grid view'}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${layout === l ? 'bg-[#C67A4E] text-[color:var(--vv-on-copper)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'}`}>
                  {l === 'list'
                    ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/></svg>
                    : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
                </button>
              ))}
            </div>

            {/* Mobile filter button */}
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
                <span className="w-4 h-4 rounded-full bg-[#C67A4E] text-[color:var(--vv-on-copper)] text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          <ActiveFilterStrip filters={filters} search={search} onChange={setFilters} onClearAll={handleClearAll} />

          {errorMessage && (
            <div className="p-3 mb-3 rounded-md text-[12px] bg-red-950/40 border border-red-800/40 text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Result count + AI note */}
          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                {results.length} {results.length === 1 ? 'business' : 'businesses'}
                {hasActiveFilters ? ' match your filters' : ' recommended'}
              </p>
              <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1">
                <span style={{ color: '#C67A4E' }}>✦</span>
                AI match scores calculated by backend matching engine · sorted by {SORT_OPTIONS.find(o => o.value === sort)?.label ?? sort}
              </span>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : results.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={handleClearAll} />
          ) : layout === 'list' ? (
            <div className="space-y-3">
              {results.map(b => (
                <BusinessCardList
                  key={b.id}
                  business={b}
                  contextLabel={contextLabel}
                  onOpenMatch={handleOpenMatch}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map(b => (
                <BusinessCardGrid
                  key={b.id}
                  business={b}
                  contextLabel={contextLabel}
                  onOpenMatch={handleOpenMatch}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <MobileFilterDrawer
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          onClose={() => setShowMobileFilters(false)}
        />
      )}

      {/* Match explanation drawer */}
      {activeBusiness && (
        <MatchExplanationDrawer
          data={activeBusiness.matchDetail}
          cta={{
            label: interestSuccess ? '✓ Interest Expressed' : interestLoading ? 'Expressing…' : ctaLabel,
            action: () => handleExpressInterest(activeBusiness),
          }}
          onClose={() => { setActiveBusiness(null); setInterestSuccess(null); }}
        />
      )}
    </div>
  );
}