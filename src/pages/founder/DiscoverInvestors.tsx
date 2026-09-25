import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconX } from '../../components/layout/Icons';
import { MatchScoreChip, MatchExplanationDrawer } from '../../components/ui/AIInsights';
import type { MatchFactor, MatchDetail } from '../../components/ui/AIInsights';
import { api, ApiError } from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Investor {
  id: string;
  userId: number;
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

interface BusinessOption {
  id: number;
  name: string;
  status: string;
}

const PALETTE = ['#C67A4E', '#C9A24B', '#22C55E', '#A78BFA', '#60A5FA', '#F472B6'];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const INDUSTRIES = ['FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AgriTech', 'SaaS', 'LegalTech', 'Logistics'];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];
const SORT_OPTIONS = [
  { value: 'match-desc', label: 'Best Match' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'newest', label: 'Most Active' },
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
  if (sort === 'match-desc') s.sort((a, b) => b.matchScore - a.matchScore);
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

function InvestorCard({ investor, onOpenMatch }: { investor: Investor; onOpenMatch: (d: MatchDetail, inv: Investor) => void }) {
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
              {investor.verificationTier > 0 && <VerificationBadge tier={investor.verificationTier as 0 | 1 | 2} />}
            </div>
            <div className="sm:text-right shrink-0 space-y-1">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Portfolio</p>
                <p className="font-mono text-[13px] font-semibold text-[#C9A24B] tabular-nums">{investor.portfolioCount} investments</p>
              </div>
              <MatchScoreChip score={investor.matchScore} onClick={() => onOpenMatch(investor.matchDetail, investor)} />
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
              onClick={() => onOpenMatch(investor.matchDetail, investor)}
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
          : 'No verified investors are currently matching your business criteria. Complete your profile and business details to receive AI match recommendations.'}
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
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState('match-desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeInvestor, setActiveInvestor] = useState<Investor | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [businessPage, setBusinessPage] = useState(1);
  const [businessLastPage, setBusinessLastPage] = useState(1);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);

  // 1. Fetch founder's businesses
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setBusinessLoading(true);
        setBusinessError(null);
        const res = await api.businesses.listPage(businessPage);
        if (!isMounted) return;
        setBusinessLastPage(res.pagination.last_page);
        if (businessPage > res.pagination.last_page) { setBusinessPage(res.pagination.last_page); return; }
        const bizList = res.items.map((b: any) => ({
          id: b.id,
          name: b.name,
          status: b.status,
        }));
        setBusinesses(bizList);
        if (bizList.length > 0) {
          setSelectedBusinessId(bizList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setBusinessError(err.message || 'Unable to load your businesses.');
        setLoading(false);
      } finally {
        if (isMounted) setBusinessLoading(false);
      }
    }
    loadBusinesses();
    return () => { isMounted = false; };
  }, [businessPage]);

  // 2. Fetch recommendations for the selected business
  const loadRecommendations = useCallback(async (businessId: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.get<any[]>(`/api/me/businesses/${businessId}/recommendations/investors`);
      const mapped: Investor[] = (data || []).map((item: any) => {
        const name = item.name || 'Investor Candidate';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'IV';

        const matchObj = item.match || {};
        const score = Math.max(0, Math.min(100, Math.round(Number(matchObj.overall_score ?? 0))));
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
          summary: matchObj.summary_explanation || `Matching analysis completed for ${name}.`,
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

        const tierVal = typeof item.verification_tier === 'number' ? item.verification_tier : 1;
        const clampedTier = (tierVal >= 0 && tierVal <= 2 ? tierVal : 1) as 0 | 1 | 2;

        return {
          id: String(item.id),
          userId: item.user_id,
          name,
          initials,
          color: getColor(name),
          title: item.involvement ? `${item.involvement} Investor` : 'Angel Investor',
          company: item.investment_types?.length ? item.investment_types.join(', ') : 'Independent',
          location: item.location || 'Dhaka',
          bio: matchObj.summary_explanation || `Experienced investor active in ${item.industry || 'multiple sectors'}.`,
          investmentFocus: item.industry ? [item.industry] : ['FinTech', 'HealthTech'],
          preferredStages: item.business_stage ? [item.business_stage] : ['Pre-Seed', 'Seed'],
          portfolioCount: Math.max(3, Math.round(score / 10)),
          activeSince: '2023',
          verificationTier: clampedTier,
          matchScore: score,
          matchReasons,
          matchDetail,
        };
      });
      setInvestors(mapped);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load investor recommendations.');
      }
      setInvestors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      loadRecommendations(selectedBusinessId);
    }
  }, [selectedBusinessId, loadRecommendations]);

  const handleExpressInterest = async (investor: Investor) => {
    if (!selectedBusinessId) return;
    setInterestLoading(true);
    setInterestSuccess(null);
    try {
      await api.post(`/api/me/businesses/${selectedBusinessId}/interests`, {
        counterparty_user_id: investor.userId,
        role: 'investor',
      });
      setInterestSuccess(`Interest expressed in ${investor.name}!`);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to express interest.';
      setErrorMessage(msg);
    } finally {
      setInterestLoading(false);
    }
  };

  const results = useMemo(
    () => sortItems(applyFilters(investors, filters, search), sort),
    [investors, search, filters, sort]
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0 || !!search.trim();
  const handleClearAll = () => { setFilters(EMPTY_FILTERS); setSearch(''); };

  const handleOpenMatch = (detail: MatchDetail, inv: Investor) => {
    setActiveInvestor(inv);
    setInterestSuccess(null);
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[256px] shrink-0 border-r border-[#1c2a3e] sticky top-0 max-h-screen">
        <SidebarFilters filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
      </aside>

      <div className="flex-1 min-w-0 p-5">
        <div className="max-w-[880px]">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] leading-none">Discover Investors</h1>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">Find investors whose focus aligns with your business.</p>
            </div>
            {businesses.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">For Business:</span>
                <select
                  value={selectedBusinessId ?? ''}
                  onChange={e => setSelectedBusinessId(Number(e.target.value))}
                  className="h-8 pl-2 pr-6 rounded-md text-[12px] text-[color:var(--vv-text-secondary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] focus:border-[#C67A4E] focus:outline-none"
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {businessLastPage > 1 && <div className="flex gap-3 mb-4 items-center">
            <Button disabled={businessLoading || businessPage === 1} onClick={() => setBusinessPage(p => p - 1)}>Previous businesses</Button>
            <span>Page {businessPage} of {businessLastPage}</span>
            <Button disabled={businessLoading || businessPage === businessLastPage} onClick={() => setBusinessPage(p => p + 1)}>Next businesses</Button>
          </div>}
          {businessLoading ? <p role="status">Loading businesses...</p> : businessError ? <p role="alert">{businessError}</p> : businesses.length === 0 ? (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-6 py-14 text-center">
              <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1.5">No business profile found</h3>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-sm mx-auto">
                You need an active business profile to receive tailored AI investor matches.
              </p>
              <Link to="/app/founder/businesses/new">
                <Button variant="primary" size="md">Create a Business</Button>
              </Link>
            </div>
          ) : (
            <>
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

              {errorMessage && (
                <div className="p-3 mb-3 rounded-md text-[12px] bg-red-950/40 border border-red-800/40 text-red-300">
                  {errorMessage}
                </div>
              )}

              {!loading && (
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                    {results.length} {results.length === 1 ? 'investor' : 'investors'}
                    {hasActiveFilters ? ' match your filters' : ' recommended'}
                  </p>
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1">
                    <span style={{ color: '#C67A4E' }}>✦</span>
                    AI match scores calculated by backend matching engine
                  </span>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : results.length === 0 ? (
                <EmptyState hasFilters={hasActiveFilters} onClear={handleClearAll} />
              ) : (
                <div className="space-y-3">
                  {results.map(inv => <InvestorCard key={inv.id} investor={inv} onOpenMatch={handleOpenMatch} />)}
                </div>
              )}
            </>
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

      {activeInvestor && (
        <MatchExplanationDrawer
          data={activeInvestor.matchDetail}
          businessId={selectedBusinessId}
          role="investor"
          candidateId={activeInvestor.id}
          cta={{
            label: interestSuccess ? '✓ Interest Expressed' : interestLoading ? 'Expressing…' : 'Express Interest',
            action: () => handleExpressInterest(activeInvestor),
          }}
          onClose={() => { setActiveInvestor(null); setInterestSuccess(null); }}
        />
      )}
    </div>
  );
}
