import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { VerificationBadge } from '../../components/ui/Badge';
import { MatchExplainDrawer, buildDemoMatchData, type MatchRole } from '../../components/ui/MatchExplainDrawer';
import {
  IconSearch, IconGrid, IconList, IconZap,
  IconCheck, IconChevronDown, IconX, IconChevronLeft,
} from '../../components/layout/Icons';

/* ─── Data ─── */
const STARTUPS = [
  { name: 'NovaTech AI',         industry: 'FinTech · AI/ML',   stage: 'Seed',     askRaw: 6000000,  ask: '৳60,00,000',    match: 86, readiness: 78, location: 'Dhaka, BD',      tier: 2, pitch: 'AI-powered credit risk assessment for underbanked SMBs using alternative data.',     risk: 'Moderate' },
  { name: 'GreenPath Logistics', industry: 'CleanTech · SaaS',  stage: 'Pre-seed', askRaw: 2500000,  ask: '৳25,00,000',    match: 74, readiness: 61, location: 'Chittagong, BD', tier: 1, pitch: 'Route optimisation reducing last-mile delivery carbon footprint by 30%.',           risk: 'High'     },
  { name: 'Medify Health',       industry: 'HealthTech · B2C',  stage: 'Seed',     askRaw: 12000000, ask: '৳1,20,00,000',  match: 68, readiness: 83, location: 'Dhaka, BD',      tier: 2, pitch: 'Personalised medication adherence platform. 94% adherence rate in trial.',         risk: 'Low'      },
  { name: 'Structra Build',      industry: 'PropTech · B2B',    stage: 'Series A', askRaw: 30000000, ask: '৳3,00,00,000',  match: 55, readiness: 91, location: 'Sylhet, BD',     tier: 1, pitch: 'Construction PM SaaS replacing spreadsheets. ৳18L ARR, 40% QoQ growth.',         risk: 'Low'      },
  { name: 'Orbit Analytics',     industry: 'Data · SaaS',       stage: 'Pre-seed', askRaw: 1800000,  ask: '৳18,00,000',    match: 79, readiness: 52, location: 'Remote',         tier: 1, pitch: 'No-code analytics for ops teams. Connects 40+ data sources in minutes.',         risk: 'Moderate' },
  { name: 'Chainlink Legal',     industry: 'LegalTech · B2B',   stage: 'Seed',     askRaw: 4000000,  ask: '৳40,00,000',    match: 61, readiness: 69, location: 'Dhaka, BD',      tier: 1, pitch: 'Contract lifecycle management for SMB law firms. 60% review time reduction.',     risk: 'Low'      },
];

const FILTER_GROUPS = [
  { label: 'Industry', options: ['FinTech', 'HealthTech', 'CleanTech', 'PropTech', 'Data/SaaS', 'LegalTech'] },
  { label: 'Stage',    options: ['Pre-seed', 'Seed', 'Series A', 'Series B+'] },
  { label: 'Risk',     options: ['Low', 'Moderate', 'High'] },
];

type SortKey = 'match' | 'readiness' | 'newest' | 'ask';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'match',     label: 'Best Match'   },
  { value: 'readiness', label: 'Readiness'    },
  { value: 'newest',    label: 'Newest'       },
  { value: 'ask',       label: 'Funding Ask'  },
];

const RANGE_MAX = 300000000;
const PRESETS = [
  { label: 'Under ৳10L',   min: 0,         max: 1000000   },
  { label: '৳10L – ৳50L',  min: 1000000,   max: 5000000   },
  { label: '৳50L – ৳1Cr',  min: 5000000,   max: 10000000  },
  { label: '৳1Cr – ৳5Cr',  min: 10000000,  max: 50000000  },
  { label: '৳5Cr+',        min: 50000000,  max: RANGE_MAX },
];

type Startup = typeof STARTUPS[0];

function fmt(v: number): string {
  if (v >= 10000000) return `৳${(v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1)}Cr`;
  if (v >= 100000)   return `৳${Math.round(v / 100000)}L`;
  return `৳${v}`;
}

function parseInput(s: string): number | null {
  const clean = s.trim().replace(/[$,\s]/g, '');
  if (!clean) return null;
  const mult = /m$/i.test(clean) ? 1e6 : /k$/i.test(clean) ? 1e3 : 1;
  const num = parseFloat(clean.replace(/[kmKM]/gi, ''));
  return isNaN(num) ? null : num * mult;
}

function roleCTA(role: string): string {
  if (role === 'investor') return 'Express Interest';
  if (role === 'professional') return 'Apply';
  return 'Connect';
}

function appliedLabel(role: string): string {
  if (role === 'investor') return 'Interest Expressed';
  if (role === 'professional') return 'Applied';
  return 'Connected';
}

/* ─── Readiness bar ─── */
function ReadinessBar({ value }: { value: number }) {
  const color = value >= 75 ? '#C67A4E' : value >= 55 ? '#F59E0B' : '#F04438';
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11.5px] tabular-nums w-7 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

/* ─── Skeleton rows ─── */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#1c2a3e]">
      {[160, 100, 72, 56, 88, 72, 56].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] animate-pulse" style={{ width: w }} />
        </td>
      ))}
      <td className="px-4 py-3" />
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-28" />
          <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
        <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-4/5" />
      </div>
    </div>
  );
}

/* ─── Dual-range slider ─── */
function RangeFilter({
  minVal, maxVal, onChange,
}: {
  minVal: number; maxVal: number; onChange: (min: number, max: number) => void;
}) {
  const [error, setError] = useState('');
  const [minTxt, setMinTxt] = useState('');
  const [maxTxt, setMaxTxt] = useState('');
  const pct = (v: number) => (v / RANGE_MAX) * 100;
  const hasRange = minVal > 0 || maxVal < RANGE_MAX;

  const commit = (rawMin: number, rawMax: number) => {
    if (rawMin >= rawMax) { setError('Minimum must be less than maximum.'); return; }
    setError('');
    onChange(Math.max(0, rawMin), Math.min(RANGE_MAX, rawMax));
  };

  const applyText = () => {
    const mn = parseInput(minTxt);
    const mx = parseInput(maxTxt);
    commit(mn !== null ? mn : minVal, mx !== null ? mx : maxVal);
    setMinTxt(''); setMaxTxt('');
  };

  return (
    <div className="space-y-3">
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-[#1c2a3e] rounded-full" />
        <div className="absolute h-[3px] bg-[#C67A4E] rounded-full"
          style={{ left: `${pct(minVal)}%`, right: `${100 - pct(maxVal)}%` }} />
        <input type="range" min={0} max={RANGE_MAX} step={10000} value={minVal}
          onChange={e => {
            const v = Number(e.target.value);
            if (v < maxVal) { setError(''); onChange(v, maxVal); }
            else setError('Minimum must be less than maximum.');
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C67A4E]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0D1626]
            [&::-webkit-slider-thumb]:shadow pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
          style={{ zIndex: minVal > RANGE_MAX * 0.95 ? 5 : 3 }} />
        <input type="range" min={0} max={RANGE_MAX} step={10000} value={maxVal}
          onChange={e => {
            const v = Number(e.target.value);
            if (v > minVal) { setError(''); onChange(minVal, v); }
            else setError('Minimum must be less than maximum.');
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C67A4E]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0D1626]
            [&::-webkit-slider-thumb]:shadow pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
          style={{ zIndex: 4 }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tabular-nums text-[#C67A4E]">{fmt(minVal)}</span>
        <span className="text-[10px] text-[#35446A]">to</span>
        <span className="font-mono text-[11px] tabular-nums text-[#C67A4E]">{fmt(maxVal)}</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1">Minimum</p>
          <input value={minTxt} onChange={e => setMinTxt(e.target.value)}
            onBlur={applyText} onKeyDown={e => e.key === 'Enter' && applyText()}
            placeholder={fmt(minVal)}
            className="w-full h-7 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11px] font-mono text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
        </div>
        <div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1">Maximum</p>
          <input value={maxTxt} onChange={e => setMaxTxt(e.target.value)}
            onBlur={applyText} onKeyDown={e => e.key === 'Enter' && applyText()}
            placeholder={fmt(maxVal)}
            className="w-full h-7 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11px] font-mono text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
        </div>
      </div>

      {error && <p className="text-[10.5px] text-[#F59E0B] leading-snug">{error}</p>}

      <div className="space-y-px pt-0.5">
        {PRESETS.map(p => {
          const active = minVal === p.min && maxVal === p.max;
          return (
            <button key={p.label}
              onClick={() => { onChange(p.min, p.max); setError(''); setMinTxt(''); setMaxTxt(''); }}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11.5px] transition-colors ${
                active ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
              }`}>
              <span>{p.label}</span>
              {active && <IconCheck s={10} className="text-[#C67A4E]" />}
            </button>
          );
        })}
      </div>

      {hasRange && (
        <button
          onClick={() => { onChange(0, RANGE_MAX); setError(''); setMinTxt(''); setMaxTxt(''); }}
          className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          Reset range
        </button>
      )}
    </div>
  );
}

/* ─── Filter sidebar ─── */
function Sidebar({
  search, onSearch,
  filters, onFilter, onClearFilter,
  rangeMin, rangeMax, onRange,
  expandedFilter, onExpand,
  activeCount, onClearAll,
  searchSaved, onSaveSearch,
}: {
  search: string; onSearch: (v: string) => void;
  filters: Record<string, string>; onFilter: (k: string, v: string) => void; onClearFilter: (k: string) => void;
  rangeMin: number; rangeMax: number; onRange: (mn: number, mx: number) => void;
  expandedFilter: string | null; onExpand: (k: string | null) => void;
  activeCount: number; onClearAll: () => void;
  searchSaved: boolean; onSaveSearch: () => void;
}) {
  const hasRange = rangeMin > 0 || rangeMax < RANGE_MAX;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3.5 pt-4 pb-3 border-b border-[#1c2a3e] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Filters</p>
          {activeCount > 0 && (
            <button onClick={onClearAll} className="text-[10.5px] text-[#C67A4E] hover:underline">Clear all</button>
          )}
        </div>
        <div className="relative">
          <IconSearch s={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search…"
            className="w-full h-8 pl-8 pr-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-0">
        {FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <button
              onClick={() => onExpand(expandedFilter === group.label ? null : group.label)}
              className="w-full flex items-center justify-between py-2.5 text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold hover:text-[color:var(--vv-text-secondary)] transition-colors">
              <span>{group.label}</span>
              <div className="flex items-center gap-1.5">
                {filters[group.label] && (
                  <span className="px-1.5 py-0.5 rounded border border-[#C67A4E]/20 text-[9.5px] font-medium text-[#C67A4E]" style={{backgroundColor:'rgba(198,122,78,0.08)'}}>
                    {filters[group.label]}
                  </span>
                )}
                <IconChevronDown s={10} className={`transition-transform ${expandedFilter === group.label ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedFilter === group.label && (
              <div className="pb-2 space-y-px">
                {group.options.map(opt => {
                  const active = filters[group.label] === opt;
                  return (
                    <button key={opt}
                      onClick={() => active ? onClearFilter(group.label) : onFilter(group.label, opt)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[12px] transition-colors ${
                        active ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
                      }`}>
                      <span>{opt}</span>
                      {active && <IconX s={9} className="text-[color:var(--vv-text-tertiary)]" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="h-px bg-[#1c2a3e]" />
          </div>
        ))}

        <div>
          <button
            onClick={() => onExpand(expandedFilter === 'Funding Ask' ? null : 'Funding Ask')}
            className="w-full flex items-center justify-between py-2.5 text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold hover:text-[color:var(--vv-text-secondary)] transition-colors">
            <span>Funding Ask</span>
            <div className="flex items-center gap-1.5">
              {hasRange && (
                <span className="px-1.5 py-0.5 rounded border border-[#C67A4E]/20 text-[9.5px] font-mono font-medium text-[#C67A4E]" style={{backgroundColor:'rgba(198,122,78,0.08)'}}>
                  {fmt(rangeMin)}–{fmt(rangeMax)}
                </span>
              )}
              <IconChevronDown s={10} className={`transition-transform ${expandedFilter === 'Funding Ask' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {expandedFilter === 'Funding Ask' && (
            <div className="pb-3">
              <RangeFilter minVal={rangeMin} maxVal={rangeMax} onChange={onRange} />
            </div>
          )}
          <div className="h-px bg-[#1c2a3e]" />
        </div>
      </div>

      <div className="px-3.5 py-3 border-t border-[#1c2a3e] flex-shrink-0">
        <button onClick={onSaveSearch}
          className="flex items-center gap-1.5 text-[11.5px] transition-colors"
          style={{ color: searchSaved ? '#22C55E' : '#C67A4E' }}>
          {searchSaved
            ? <><IconCheck s={11} className="text-[#22C55E]" /> Search saved</>
            : 'Save this search'
          }
        </button>
      </div>
    </div>
  );
}

/* ─── Opportunity detail drawer ─── */
function OpportunityDrawer({
  item, role, applied, onApply, onClose, onMatchExplain,
}: {
  item: Startup; role: string; applied: boolean;
  onApply: () => void; onClose: () => void; onMatchExplain?: () => void;
}) {
  const cta = roleCTA(role);
  const done = appliedLabel(role);
  const riskV = (r: string) => r === 'Low' ? 'success' : r === 'Moderate' ? 'warning' : 'danger';

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[400px] bg-[#121A2B] border-l border-[color:var(--vv-border)] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[color:var(--vv-border)] shrink-0">
          <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1 -ml-1 shrink-0">
            <IconChevronLeft s={18} />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
              {item.name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{item.name}</p>
                <VerificationBadge tier={item.tier as 1 | 2} />
              </div>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] truncate">{item.industry}</p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Pitch */}
          <div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Overview</p>
            <p className="text-[13px] text-[color:var(--vv-text-secondary)] leading-relaxed">{item.pitch}</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Stage', value: item.stage, mono: false },
              { label: 'Funding Ask', value: item.ask, mono: true },
              { label: 'Location', value: item.location, mono: false },
              { label: 'Risk', value: item.risk, mono: false },
            ].map(row => (
              <div key={row.label} className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1">{row.label}</p>
                <p className={`text-[12.5px] font-medium text-[color:var(--vv-text)] ${row.mono ? 'font-mono tabular-nums' : ''}`}>{row.value}</p>
              </div>
            ))}
          </div>

          {/* Scores */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Readiness Score</p>
              <ReadinessBar value={item.readiness} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Match Score</p>
              <ScoreChip score={item.match} label="Match" topFactors={['Industry alignment', 'Stage fit', 'Thesis match']} onClick={onMatchExplain} />
            </div>
          </div>

          {/* Risk badge */}
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Risk</p>
            <Badge variant={riskV(item.risk)}>{item.risk}</Badge>
          </div>

          {/* Disclaimer */}
          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]/70 leading-snug">
            Simulated opportunity. No real capital or legal obligations are created on this platform.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626] space-y-2.5">
          {applied ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
              <IconCheck s={14} className="text-[#22C55E]" />
              <span className="text-[13px] font-medium text-[#22C55E]">{done}</span>
            </div>
          ) : (
            <Button className="w-full" onClick={onApply}>{cta}</Button>
          )}
          <button onClick={onClose}
            className="w-full text-center text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors py-1">
            ← Back to Discovery
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Application modal ─── */
function ApplicationModal({
  item, role, onClose, onSubmit,
}: {
  item: Startup; role: string; onClose: () => void; onSubmit: () => void;
}) {
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [note, setNote] = useState('');
  const cta = roleCTA(role);
  const APPLICANT = 'Alex Morgan';

  const placeholder =
    role === 'investor' ? 'Describe your investment thesis and the value you bring to this business...' :
    role === 'professional' ? 'Describe your relevant experience and how you can contribute...' :
    'Introduce yourself and explain your interest in connecting...';

  const noteLabel =
    role === 'investor' ? 'Investment thesis & value add' :
    role === 'professional' ? 'Relevant skills & contribution' :
    'Your message';

  const noun =
    cta === 'Apply' ? 'Application' :
    cta === 'Express Interest' ? 'Interest' :
    'Connection request';

  const successTitle =
    cta === 'Apply' ? 'Application submitted!' :
    cta === 'Express Interest' ? 'Interest expressed!' :
    'Connection request sent!';

  const successBody =
    `${item.name} will be notified. Track your ${cta === 'Apply' ? 'application' : 'request'} status from your dashboard.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="discovery-action-title">
      <div className="absolute inset-0 bg-black/60" onClick={step !== 'success' ? onClose : undefined} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border)] rounded-[12px] w-full max-w-md shadow-2xl flex flex-col overflow-hidden">

        {step === 'form' && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
              <div>
                <p id="discovery-action-title" className="text-[14px] font-semibold text-[color:var(--vv-text)]">{cta}</p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{item.name}</p>
              </div>
              <button onClick={onClose} aria-label={`Close ${cta} dialog`} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1">
                <IconX s={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Context summary */}
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg divide-y divide-[#1c2a3e]">
                {[
                  { label: 'Opportunity', value: item.name },
                  { label: 'Industry', value: item.industry },
                  { label: 'Stage', value: item.stage },
                  { label: 'Applicant', value: APPLICANT },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{row.label}</span>
                    <span className="text-[12px] font-medium text-[color:var(--vv-text)] text-right ml-4">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                  {noteLabel} <span className="text-[#F04438]">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder={placeholder}
                  className="w-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] px-3 py-2.5 focus:outline-none focus:border-[color:var(--vv-border-strong)] resize-none leading-relaxed transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-[color:var(--vv-border)]">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" disabled={!note.trim()} onClick={() => setStep('review')}>Review →</Button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
              <div>
                <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">Review {noun}</p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Confirm before submitting</p>
              </div>
              <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1">
                <IconX s={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg divide-y divide-[#1c2a3e]">
                {[
                  { label: 'For', value: item.name },
                  { label: 'Industry', value: item.industry },
                  { label: 'Stage', value: item.stage },
                  { label: 'Applicant', value: APPLICANT },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] shrink-0">{row.label}</span>
                    <span className="text-[12px] font-medium text-[color:var(--vv-text)] text-right ml-4">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg px-4 py-3">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5">Your message</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed">{note}</p>
              </div>

              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                Simulated — no real obligations are created.
              </p>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-[color:var(--vv-border)]">
              <Button variant="secondary" className="flex-1" onClick={() => setStep('form')}>← Edit</Button>
              <Button className="flex-1" onClick={() => { onSubmit(); setStep('success'); }}>Submit</Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="px-5 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-4">
              <IconCheck s={24} className="text-[#22C55E]" />
            </div>
            <p className="text-[15px] font-semibold text-[color:var(--vv-text)] mb-2">{successTitle}</p>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed max-w-xs mx-auto mb-6">
              {successBody}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Back to Discovery</Button>
              <Button className="flex-1" onClick={onClose}>View Status</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Discovery({ role = 'investor' }: { role?: string }) {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'search' | 'ai'>('ai');
  const [layout, setLayout] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(RANGE_MAX);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [expandedFilter, setExpandedFilter] = useState<string | null>('Industry');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchSaved, setSearchSaved] = useState(false);

  /* Detail drawer + application flow */
  const [detailItem, setDetailItem] = useState<Startup | null>(null);
  const [appItem, setAppItem] = useState<Startup | null>(null);
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());

  /* Match explainability drawer */
  const [matchItem, setMatchItem] = useState<Startup | null>(null);

  const viewerRole: MatchRole = role.startsWith('founder') ? 'founder' : role === 'professional' ? 'professional' : 'investor';
  const openMatchExplain = (item: Startup) => setMatchItem(item);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const hasRange = rangeMin > 0 || rangeMax < RANGE_MAX;
  const activeCount = Object.keys(filters).length + (hasRange ? 1 : 0);

  const filtered = STARTUPS.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.industry.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters['Industry'] && !s.industry.toLowerCase().includes(filters['Industry'].toLowerCase())) return false;
    if (filters['Stage'] && s.stage !== filters['Stage']) return false;
    if (filters['Risk'] && s.risk !== filters['Risk']) return false;
    if (hasRange && (s.askRaw < rangeMin || s.askRaw > rangeMax)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (viewMode === 'ai' || sortBy === 'match') return b.match - a.match;
    if (sortBy === 'readiness') return b.readiness - a.readiness;
    if (sortBy === 'ask') return a.askRaw - b.askRaw;
    return 0;
  });

  const toggleSave = (name: string) => setSavedItems(prev => {
    const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n;
  });

  const clearFilter = (k: string) => setFilters(f => { const n = { ...f }; delete n[k]; return n; });
  const clearAll = () => { setFilters({}); setRangeMin(0); setRangeMax(RANGE_MAX); };

  const handleSaveSearch = () => {
    setSearchSaved(true);
    setTimeout(() => setSearchSaved(false), 2500);
  };

  const handleApply = (item: Startup) => {
    setDetailItem(null);
    setAppItem(item);
  };

  const handleSubmitApp = (name: string) => {
    setAppliedItems(prev => { const n = new Set(prev); n.add(name); return n; });
  };

  const riskVariant = (r: string) => r === 'Low' ? 'success' : r === 'Moderate' ? 'warning' : 'danger';
  const cta = roleCTA(role);

  const sidebarProps = {
    search, onSearch: setSearch,
    filters, onFilter: (k: string, v: string) => setFilters(f => ({ ...f, [k]: v })), onClearFilter: clearFilter,
    rangeMin, rangeMax, onRange: (mn: number, mx: number) => { setRangeMin(mn); setRangeMax(mx); },
    expandedFilter, onExpand: setExpandedFilter,
    activeCount, onClearAll: clearAll,
    searchSaved, onSaveSearch: handleSaveSearch,
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Opportunity detail drawer ── */}
      {detailItem && (
        <OpportunityDrawer
          item={detailItem}
          role={role}
          applied={appliedItems.has(detailItem.name)}
          onApply={() => handleApply(detailItem)}
          onClose={() => setDetailItem(null)}
          onMatchExplain={() => { setDetailItem(null); openMatchExplain(detailItem); }}
        />
      )}

      {/* ── Application modal ── */}
      {appItem && (
        <ApplicationModal
          item={appItem}
          role={role}
          onClose={() => setAppItem(null)}
          onSubmit={() => handleSubmitApp(appItem.name)}
        />
      )}

      {/* ── Match Explainability drawer ── */}
      {matchItem && (
        <MatchExplainDrawer
          data={buildDemoMatchData(matchItem, viewerRole, () => { setMatchItem(null); setDetailItem(matchItem); })}
          state="ready"
          onClose={() => setMatchItem(null)}
        />
      )}

      {/* ── Desktop filter rail ── */}
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-[#1c2a3e] bg-[#0D1626] overflow-hidden">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* ── Mobile filter drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileFiltersOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 max-w-[calc(100vw-2rem)] bg-[#0D1626] border-r border-[#1c2a3e] z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e] flex-shrink-0">
              <span className="text-[13px] font-semibold text-[color:var(--vv-text)]">Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
                <IconX s={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar {...sidebarProps} />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Controls bar */}
        <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[#1c2a3e] bg-[#0D1626]">

          <button onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 h-7 px-2.5 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[11.5px] text-[color:var(--vv-text-secondary)] hover:border-[color:var(--vv-border-strong)] transition-colors">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M4 6h16M7 12h10M10 18h4"/>
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="px-1 rounded bg-[#C67A4E]/20 text-[#C67A4E] text-[9px] font-bold">{activeCount}</span>
            )}
          </button>

          <div className="flex bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md p-0.5">
            <button onClick={() => setViewMode('search')}
              className={`px-3 py-1 rounded text-[11.5px] font-medium transition-colors ${
                viewMode === 'search' ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>
              Search Results
            </button>
            <button onClick={() => setViewMode('ai')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-[11.5px] font-medium transition-colors ${
                viewMode === 'ai' ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>
              <IconZap s={11} />
              AI Suggestions
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="font-medium text-[color:var(--vv-text)]">{loading ? '—' : sorted.length}</span>
            <span className="text-[color:var(--vv-text-tertiary)]">results</span>
            {viewMode === 'ai' && !loading && (
              <span className="flex items-center gap-0.5 text-[#C67A4E] text-[10.5px] ml-0.5">
                <IconZap s={10} /> Ranked by Match Score
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(filters).map(([k, v]) => (
              <button key={k} onClick={() => clearFilter(k)}
                className="inline-flex items-center gap-1 h-6 px-2 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[11px] text-[color:var(--vv-text-secondary)] hover:border-[#5E6D8F] transition-colors">
                {v} <IconX s={8} />
              </button>
            ))}
            {hasRange && (
              <button onClick={() => { setRangeMin(0); setRangeMax(RANGE_MAX); }}
                className="inline-flex items-center gap-1 h-6 px-2 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[11px] font-mono text-[color:var(--vv-text-secondary)] hover:border-[#5E6D8F] transition-colors">
                {fmt(rangeMin)}–{fmt(rangeMax)} <IconX s={8} />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <select
              value={viewMode === 'ai' ? 'match' : sortBy}
              disabled={viewMode === 'ai'}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="h-7 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none disabled:opacity-50 transition-colors">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded p-0.5">
              <button onClick={() => setLayout('list')} title="List view" aria-label="List view"
                className={`p-1 rounded transition-colors ${layout === 'list' ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'}`}>
                <IconList s={13} />
              </button>
              <button onClick={() => setLayout('grid')} title="Grid view" aria-label="Grid view"
                className={`p-1 rounded transition-colors ${layout === 'grid' ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'}`}>
                <IconGrid s={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Table (desktop list view) ── */}
          {layout === 'list' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[color:var(--vv-border)]">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Business</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Industry</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Stage</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Ask</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">
                        <span className="flex items-center gap-1"><IconZap s={9} className="text-[#C67A4E]" />Readiness</span>
                      </th>
                      {viewMode === 'ai' && (
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">
                          <span className="flex items-center gap-1"><IconZap s={9} className="text-[#C67A4E]" />Match</span>
                        </th>
                      )}
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Risk</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                      : sorted.map(s => {
                          const isApplied = appliedItems.has(s.name);
                          return (
                            <tr key={s.name}
                              onClick={() => setDetailItem(s)}
                              className="border-b border-[#1c2a3e] last:border-0 transition-colors cursor-pointer group hover:bg-[color:var(--vv-raised)]/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] flex-shrink-0">
                                    {s.name[0]}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{s.name}</p>
                                      <VerificationBadge tier={s.tier as 1 | 2} />
                                    </div>
                                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] max-w-[200px] truncate">{s.pitch}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{s.industry}</td>
                              <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{s.stage}</td>
                              <td className="px-4 py-3 font-mono text-[12px] font-medium text-[color:var(--vv-text)] tabular-nums">{s.ask}</td>
                              <td className="px-4 py-3"><ReadinessBar value={s.readiness} /></td>
                              {viewMode === 'ai' && (
                                <td className="px-4 py-3">
                                  <ScoreChip score={s.match} label="Match"
                                    topFactors={['Industry alignment', 'Stage fit', 'Thesis match']}
                                    onClick={e => { e.stopPropagation(); openMatchExplain(s); }} />
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <Badge variant={riskVariant(s.risk)}>{s.risk}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toggleSave(s.name); }}>
                                    {savedItems.has(s.name) ? 'Saved' : 'Save'}
                                  </Button>
                                  {isApplied ? (
                                    <span className="flex items-center gap-1 text-[11.5px] font-medium text-[#22C55E] px-2">
                                      <IconCheck s={11} className="text-[#22C55E]" />
                                      {appliedLabel(role)}
                                    </span>
                                  ) : (
                                    <Button size="sm" onClick={e => { e.stopPropagation(); setDetailItem(s); }}>{cta}</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>

              {/* Mobile compact rows */}
              <div className="md:hidden divide-y divide-[#1c2a3e]">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-3.5 animate-pulse space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-28" />
                            <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-40" />
                          </div>
                        </div>
                      </div>
                    ))
                  : sorted.map(s => {
                      const isApplied = appliedItems.has(s.name);
                      return (
                        <div key={s.name}
                          className="p-3.5 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer"
                          onClick={() => setDetailItem(s)}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] flex-shrink-0">
                                {s.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{s.name}</p>
                                  <VerificationBadge tier={s.tier as 1 | 2} />
                                </div>
                                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{s.stage} · {s.ask} · {s.industry}</p>
                              </div>
                            </div>
                            {viewMode === 'ai' && <ScoreChip score={s.match} label="Investor match" topFactors={['Industry', 'Stage fit']} onClick={e => { e.stopPropagation(); openMatchExplain(s); }} />}
                          </div>
                          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug mb-2.5 line-clamp-2">{s.pitch}</p>
                          <div className="flex items-center gap-3">
                            <ReadinessBar value={s.readiness} />
                            <Badge variant={riskVariant(s.risk)}>{s.risk}</Badge>
                            <div className="ml-auto flex gap-1.5">
                              <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toggleSave(s.name); }}>
                                {savedItems.has(s.name) ? 'Saved' : 'Save'}
                              </Button>
                              {isApplied ? (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-[#22C55E]">
                                  <IconCheck s={10} className="text-[#22C55E]" />
                                  {appliedLabel(role)}
                                </span>
                              ) : (
                                <Button size="sm" onClick={e => { e.stopPropagation(); setDetailItem(s); }}>{cta}</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          )}

          {/* ── Grid ── */}
          {layout === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : sorted.map(s => {
                    const isApplied = appliedItems.has(s.name);
                    return (
                      <div key={s.name}
                        className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] hover:border-[color:var(--vv-border-strong)] transition-all cursor-pointer group overflow-hidden flex flex-col"
                        onClick={() => setDetailItem(s)}>
                        <div className="p-4 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[12px] font-bold text-[#C67A4E] flex-shrink-0">
                                {s.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{s.name}</p>
                                  <VerificationBadge tier={s.tier as 1 | 2} />
                                </div>
                                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{s.industry} · {s.location}</p>
                              </div>
                            </div>
                            {viewMode === 'ai' && (
                              <ScoreChip score={s.match} label="Match" topFactors={['Industry', 'Stage fit', 'Thesis']} onClick={e => { e.stopPropagation(); openMatchExplain(s); }} />
                            )}
                          </div>
                          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug mb-4 line-clamp-2">{s.pitch}</p>
                          <div className="flex items-center gap-3 text-[11px] mb-3">
                            <span className="text-[color:var(--vv-text-tertiary)]">Stage <span className="text-[color:var(--vv-text-secondary)] font-medium">{s.stage}</span></span>
                            <span className="text-[color:var(--vv-text-tertiary)]">Ask <span className="font-mono font-medium text-[color:var(--vv-text)] tabular-nums">{s.ask}</span></span>
                            <Badge variant={riskVariant(s.risk)}>{s.risk}</Badge>
                          </div>
                          <ReadinessBar value={s.readiness} />
                        </div>
                        <div className="flex border-t border-[#1c2a3e]">
                          <button
                            onClick={e => { e.stopPropagation(); toggleSave(s.name); }}
                            className={`flex-1 py-2.5 text-[11.5px] font-medium border-r border-[#1c2a3e] transition-colors ${
                              savedItems.has(s.name) ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]'
                            }`}>
                            {savedItems.has(s.name) ? '✓ Saved' : 'Save'}
                          </button>
                          {isApplied ? (
                            <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5">
                              <IconCheck s={11} className="text-[#22C55E]" />
                              <span className="text-[11.5px] font-medium text-[#22C55E]">{appliedLabel(role)}</span>
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setDetailItem(s); }}
                              className="flex-1 py-2.5 text-[11.5px] font-medium text-[#C67A4E] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors">
                              {cta}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mb-4">
                <IconSearch s={20} className="text-[color:var(--vv-text-tertiary)]" />
              </div>
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-1.5">No opportunities match your current filters</p>
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-xs leading-relaxed">
                Try adjusting your filters or expanding your funding range to see more results.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={clearAll}>Clear filters</Button>
                <Button variant="ghost" size="sm" onClick={() => setExpandedFilter('Funding Ask')}>
                  Adjust funding range
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}