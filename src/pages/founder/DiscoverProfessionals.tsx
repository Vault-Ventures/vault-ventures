import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconX } from '../../components/layout/Icons';
import { MatchScoreChip, MatchExplanationDrawer } from '../../components/ui/AIInsights';
import type { MatchFactor, MatchDetail } from '../../components/ui/AIInsights';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Professional {
  id: string;
  name: string;
  initials: string;
  color: string;
  title: string;
  location: string;
  bio: string;
  skills: string[];
  industryFocus: string[];
  experienceYears: number;
  verificationTier: 0 | 1 | 2;
  matchScore: number;
  matchReasons: MatchFactor[];
  matchDetail: MatchDetail;
}

interface Filters {
  skills: string[];
  industries: string[];
  location: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PROFESSIONALS: Professional[] = [
  {
    id: 'arif-hossain',
    name: 'Arif Hossain',
    initials: 'AH',
    color: '#C9A24B',
    title: 'CFO / Financial Advisor',
    location: 'Dhaka',
    bio: 'Experienced CFO with 12 years across FinTech, banking, and growth-stage startups. Expert in financial modeling, fundraising preparation, and regulatory compliance.',
    skills: ['Finance', 'Financial Modeling', 'Investor Relations', 'Strategy'],
    industryFocus: ['FinTech', 'SaaS'],
    experienceYears: 12,
    verificationTier: 2,
    matchScore: 88,
    matchReasons: [
      { label: 'Financial Modeling skill match', description: 'Directly addresses your highest-priority improvement area.', positive: true },
      { label: 'Investor Relations expertise', description: 'Helps with pre-raise preparation — your critical need.', positive: true },
      { label: 'FinTech background', description: 'Domain proximity to HealthTech SaaS is relevant.', positive: true },
    ],
    matchDetail: {
      score: 88,
      entityName: 'Arif Hossain',
      summary: 'Strong alignment — Financial Modeling and Investor Relations skills directly address your top two priorities.',
      alignments: [
        { factor: 'Skills Match', score: 92, description: 'Financial Modeling is your highest-priority gap — directly addressed.' },
        { factor: 'Investor Relations', score: 90, description: 'Pre-raise preparation expertise matches your critical near-term need.' },
        { factor: 'Domain Proximity', score: 80, description: 'FinTech background is applicable to HealthTech SaaS financial structure.' },
        { factor: 'Experience Level', score: 84, description: '12 years across FinTech and growth-stage startups — senior credibility.' },
      ],
      gaps: [
        { factor: 'Healthcare Domain', description: 'FinTech primary focus — HealthTech-specific regulatory knowledge may need supplementing.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Financial Modeling is your listed highest-priority improvement — this is Arif\'s specialty.',
        'Investor Relations expertise directly serves your pre-raise preparation need.',
        'Growth-stage startup background means practical, not theoretical, guidance.',
        '12 years experience means credibility that strengthens your investor pitch.',
      ],
    },
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#C67A4E',
    title: 'Marketing Strategist',
    location: 'Dhaka',
    bio: 'Go-to-market specialist with 8 years in SaaS and EdTech. Led growth campaigns that drove 5× user growth at two Bangladesh-based startups.',
    skills: ['Marketing', 'Go-to-Market Strategy', 'Content', 'Brand'],
    industryFocus: ['SaaS', 'EdTech'],
    experienceYears: 8,
    verificationTier: 2,
    matchScore: 74,
    matchReasons: [
      { label: 'Growth Marketing skill match', description: 'Growth Marketing is listed in your required skills.', positive: true },
      { label: 'SaaS GTM expertise', description: 'B2B SaaS GTM experience applies to clinic sales.', positive: true },
      { label: 'Healthcare domain not primary', description: 'No specific healthcare vertical experience listed.', positive: false },
    ],
    matchDetail: {
      score: 74,
      entityName: 'Priya Sharma',
      summary: 'Good match — Growth Marketing and SaaS GTM experience directly applies to your clinic channel strategy.',
      alignments: [
        { factor: 'Marketing Skills', score: 84, description: 'Growth Marketing is listed in your required skills — direct match.' },
        { factor: 'SaaS GTM Expertise', score: 80, description: 'B2B SaaS go-to-market experience applies to clinic network sales.' },
        { factor: 'Proven Track Record', score: 76, description: '5× user growth at two Bangladesh startups — demonstrated results.' },
      ],
      gaps: [
        { factor: 'Healthcare Domain', description: 'No specific healthcare vertical experience listed — requires domain ramp-up.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Growth Marketing is an open role — Priya specializes here.',
        'B2B SaaS GTM experience translates directly to clinic network sales motions.',
        'Bangladesh startup track record means understanding of local market dynamics.',
        'Healthcare ramp-up time is manageable given the structured clinic sales process.',
      ],
    },
  },
  {
    id: 'james-cole',
    name: 'James Cole',
    initials: 'JC',
    color: '#22C55E',
    title: 'Legal Counsel',
    location: 'Dhaka',
    bio: '15 years specializing in startup law, IP protection, and investment agreements. Advised 40+ startups from Pre-Seed through Series B across South Asia.',
    skills: ['Legal', 'IP Protection', 'Contract Review', 'Regulatory Compliance'],
    industryFocus: ['FinTech', 'HealthTech', 'SaaS'],
    experienceYears: 15,
    verificationTier: 2,
    matchScore: 91,
    matchReasons: [
      { label: 'Legal & IP skills — critical match', description: 'Your IP protection gap is high priority; James specializes here.', positive: true },
      { label: 'HealthTech industry experience', description: 'Direct sector expertise across HealthTech startups.', positive: true },
      { label: 'Pre-Seed through Series B track record', description: 'Exactly the stage you are navigating.', positive: true },
    ],
    matchDetail: {
      score: 91,
      entityName: 'James Cole',
      summary: 'Exceptional alignment — Legal and IP expertise directly addresses your highest-priority gap with HealthTech sector experience.',
      alignments: [
        { factor: 'Legal & IP Skills', score: 96, description: 'IP protection is your high-priority gap — James specializes in startup IP.' },
        { factor: 'HealthTech Experience', score: 92, description: 'Direct HealthTech sector expertise across 40+ startups in South Asia.' },
        { factor: 'Stage Match', score: 90, description: 'Pre-Seed through Series B experience exactly matches your current stage.' },
        { factor: 'Track Record', score: 88, description: '40+ startups advised — reliable, proven legal advisory.' },
      ],
      gaps: [
        { factor: 'Bangladesh Regulation', description: 'Confirm familiarity with DGDA and BFIU HealthTech-specific requirements.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'IP protection is your highest-priority gap — James specializes exactly here.',
        'HealthTech industry experience means no sector education required.',
        '40+ startups from Pre-Seed through Series B mirrors your exact stage journey.',
        'Investment agreement expertise helps with upcoming term sheet review.',
      ],
    },
  },
  {
    id: 'tania-ahmed',
    name: 'Tania Ahmed',
    initials: 'TA',
    color: '#A78BFA',
    title: 'Product Manager',
    location: 'Dhaka',
    bio: 'Product leader with 7 years in HealthTech and SaaS. Shipped products used by 300K+ users in South Asia. Strong background in UX research and agile delivery.',
    skills: ['Product Management', 'User Research', 'Roadmapping', 'Agile'],
    industryFocus: ['HealthTech', 'SaaS'],
    experienceYears: 7,
    verificationTier: 1,
    matchScore: 83,
    matchReasons: [
      { label: 'HealthTech domain expertise', description: 'Primary domain matches your industry directly.', positive: true },
      { label: 'Product Management skill match', description: 'Open role listed in your required skills.', positive: true },
      { label: 'Verification at Tier 1', description: 'Only identity verified — consider requesting further diligence.', positive: false },
    ],
    matchDetail: {
      score: 83,
      entityName: 'Tania Ahmed',
      summary: 'Strong match — HealthTech domain expertise and Product Management skills align with your open role priorities.',
      alignments: [
        { factor: 'Industry Domain', score: 90, description: 'HealthTech is primary focus — no domain education required.' },
        { factor: 'Product Management', score: 88, description: 'Open Product Management role listed in your required skills.' },
        { factor: 'User Research', score: 82, description: 'UX research background helps improve clinic user experience.' },
        { factor: 'Scale Experience', score: 78, description: '300K+ users in South Asia — knows how to scale health products.' },
      ],
      gaps: [
        { factor: 'Verification Level', description: 'Tier 1 only — additional diligence recommended before formal engagement.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'HealthTech is Tania\'s primary domain — zero sector ramp-up required.',
        'Product Management is listed as an open role in your required skills.',
        '300K+ user product experience applies directly to your clinic scaling challenge.',
        'Tier 1 verification is worth requesting additional background on before formal engagement.',
      ],
    },
  },
  {
    id: 'reza-khan',
    name: 'Reza Khan',
    initials: 'RK',
    color: '#60A5FA',
    title: 'Data Scientist / ML Engineer',
    location: 'Dhaka',
    bio: 'ML engineer with 6 years in FinTech and data-heavy platforms. Specializes in predictive models, recommendation systems, and production ML deployment.',
    skills: ['Data Science', 'Machine Learning', 'Python', 'Analytics'],
    industryFocus: ['FinTech', 'AgriTech'],
    experienceYears: 6,
    verificationTier: 1,
    matchScore: 76,
    matchReasons: [
      { label: 'Machine Learning expertise', description: 'Your AI scheduling platform benefits from ML depth.', positive: true },
      { label: 'FinTech primary focus', description: 'Industry focus is adjacent but not direct HealthTech.', positive: false },
      { label: 'Production ML experience', description: 'Relevant for scaling your AI scheduling model.', positive: true },
    ],
    matchDetail: {
      score: 76,
      entityName: 'Reza Khan',
      summary: 'Good technical match — ML and production model experience directly serves the AI scheduling platform core.',
      alignments: [
        { factor: 'Machine Learning', score: 86, description: 'ML specialization is directly applicable to your AI scheduling model.' },
        { factor: 'Production ML', score: 82, description: 'Production deployment experience is rare and relevant for scaling.' },
        { factor: 'Technical Depth', score: 78, description: 'Python and predictive modeling skills align with your platform stack.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'FinTech primary focus — HealthTech context requires domain adjustment.', severity: 'moderate' },
        { factor: 'Healthcare Data', description: 'Healthcare-specific data handling (patient records, privacy) experience unclear.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'ML engineering is at the core of your AI scheduling platform.',
        'Production ML deployment experience is critical for scaling beyond pilots.',
        'FinTech to HealthTech transition is manageable given strong technical fundamentals.',
        'Recommendation system expertise applies directly to predictive slot allocation.',
      ],
    },
  },
  {
    id: 'lisa-park',
    name: 'Lisa Park',
    initials: 'LP',
    color: '#F472B6',
    title: 'Growth & BD Specialist',
    location: 'Chittagong',
    bio: 'Business development strategist with 10 years growing B2B SaaS and logistics companies across Bangladesh. Strong enterprise sales and partnership networks.',
    skills: ['Business Development', 'Sales', 'Partnerships', 'Strategy'],
    industryFocus: ['SaaS', 'Logistics'],
    experienceYears: 10,
    verificationTier: 2,
    matchScore: 79,
    matchReasons: [
      { label: 'Business Development skill match', description: 'BD is listed in your required skills.', positive: true },
      { label: 'Hospital sales network', description: 'Enterprise B2B experience applicable to clinic network sales.', positive: true },
      { label: 'Based in Chittagong', description: 'Geographic coverage for your Chittagong expansion.', positive: true },
    ],
    matchDetail: {
      score: 79,
      entityName: 'Lisa Park',
      summary: 'Strong BD match — enterprise B2B experience and Chittagong location directly serve your expansion strategy.',
      alignments: [
        { factor: 'Business Development', score: 88, description: 'BD is listed as a required skill — Lisa specializes here.' },
        { factor: 'Enterprise B2B Sales', score: 84, description: 'B2B sales experience directly applicable to clinic network sales.' },
        { factor: 'Geographic Coverage', score: 82, description: 'Chittagong-based — covers your planned geographic expansion market.' },
        { factor: 'Partnerships', score: 76, description: 'Partnership network-building experience is relevant to hospital group deals.' },
      ],
      gaps: [
        { factor: 'Healthcare Domain', description: 'Primary experience is SaaS and logistics — healthcare sales may have a ramp.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Business Development is an open role — Lisa has 10 years of direct BD experience.',
        'Enterprise B2B sales motions apply directly to clinic and hospital network deals.',
        'Chittagong location provides in-person relationship-building for your expansion.',
        'Strong partnerships background helps accelerate enterprise hospital group agreements.',
      ],
    },
  },
];

const SKILLS_LIST = [
  'Finance', 'Financial Modeling', 'Marketing', 'Legal', 'Product Management',
  'Data Science', 'Machine Learning', 'Business Development', 'Sales', 'Strategy',
  'Investor Relations', 'Engineering', 'Operations', 'HR / Talent',
];
const INDUSTRIES = ['FinTech', 'HealthTech', 'SaaS', 'EdTech', 'AgriTech', 'Logistics', 'CleanTech'];
const SORT_OPTIONS = [
  { value: 'exp-desc', label: 'Most Experience' },
  { value: 'exp-asc', label: 'Least Experience' },
  { value: 'name', label: 'Name A–Z' },
];

const EMPTY_FILTERS: Filters = { skills: [], industries: [], location: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function countActiveFilters(f: Filters): number {
  return f.skills.length + f.industries.length + (f.location.trim() ? 1 : 0);
}

function applyFilters(items: Professional[], filters: Filters, search: string): Professional[] {
  const q = search.toLowerCase().trim();
  return items.filter(p => {
    if (q && ![p.name, p.title, p.bio, ...p.skills, ...p.industryFocus]
      .some(t => t.toLowerCase().includes(q))) return false;
    if (filters.skills.length > 0 && !filters.skills.some(s => p.skills.includes(s))) return false;
    if (filters.industries.length > 0 && !filters.industries.some(i => p.industryFocus.includes(i))) return false;
    if (filters.location.trim() && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });
}

function sortItems(items: Professional[], sort: string): Professional[] {
  const s = [...items];
  if (sort === 'exp-desc') s.sort((a, b) => b.experienceYears - a.experienceYears);
  else if (sort === 'exp-asc') s.sort((a, b) => a.experienceYears - b.experienceYears);
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
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_LIST.map(s => (
              <FilterChip key={s} label={s} active={filters.skills.includes(s)}
                onClick={() => onChange({ ...filters, skills: toggle(filters.skills, s) })} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">Industry Focus</p>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(i => (
              <FilterChip key={i} label={i} active={filters.industries.includes(i)}
                onClick={() => onChange({ ...filters, industries: toggle(filters.industries, i) })} />
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
  filters.skills.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, skills: filters.skills.filter(x => x !== v) }) }));
  filters.industries.forEach(v => chips.push({ label: v, onRemove: () => onChange({ ...filters, industries: filters.industries.filter(x => x !== v) }) }));
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

function ProfessionalCard({ professional, onOpenMatch }: { professional: Professional; onOpenMatch: (d: MatchDetail) => void }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 hover:border-[color:var(--vv-border-strong)] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold flex-shrink-0"
          style={{ background: `${professional.color}18`, border: `1.5px solid ${professional.color}35`, color: professional.color }}>
          {professional.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] leading-none">{professional.name}</p>
              {professional.verificationTier > 0 && <VerificationBadge tier={professional.verificationTier as 0 | 1 | 2 | 3} />}
            </div>
            <div className="sm:text-right shrink-0 space-y-1">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Experience</p>
                <p className="font-mono text-[13px] font-semibold text-[#22C55E] tabular-nums">{professional.experienceYears} years</p>
              </div>
              <MatchScoreChip score={professional.matchScore} onClick={() => onOpenMatch(professional.matchDetail)} />
            </div>
          </div>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2">
            <span className="text-[#C67A4E] font-medium">{professional.title}</span>
            {' · '}{professional.location}
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug line-clamp-2 mb-2.5">{professional.bio}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] mr-0.5">Skills:</span>
                {professional.skills.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-[10.5px] border"
                    style={{ background: 'rgba(198,122,78,0.06)', borderColor: 'rgba(198,122,78,0.16)', color: '#C67A4E' }}>
                    {s}
                  </span>
                ))}
                {professional.skills.length > 4 && (
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">+{professional.skills.length - 4}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] mr-0.5">Focus:</span>
                {professional.industryFocus.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded text-[10.5px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]">{f}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onOpenMatch(professional.matchDetail)}
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
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-40" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
          <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <svg width="20" height="20" fill="none" stroke="#22C55E" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1.5">No professionals found</h3>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-xs mx-auto">
        {hasFilters
          ? 'No professionals match your current filters. Try adjusting or clearing them.'
          : 'No professionals are available at this time. Check back soon.'}
      </p>
      {hasFilters && <Button variant="secondary" size="sm" onClick={onClear}>Clear Filters</Button>}
    </div>
  );
}

function MobileFilterDrawer({ filters, onChange, onClear, onClose }: {
  filters: Filters; onChange: (f: Filters) => void; onClear: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="professional-filters-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative bg-[#0D1626] border-t border-[#1c2a3e] rounded-t-[16px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] shrink-0">
          <p id="professional-filters-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">Filters</p>
          <button onClick={onClose} aria-label="Close professional filters" className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors">
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

export default function DiscoverProfessionals() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState('exp-desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [matchDrawer, setMatchDrawer] = useState<MatchDetail | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(
    () => sortItems(applyFilters(PROFESSIONALS, filters, search), sort),
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
            <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] leading-none">Discover Professionals</h1>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">Find skilled professionals who can help grow your business.</p>
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
                placeholder="Search by name, skill, industry…"
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
                {results.length} {results.length === 1 ? 'professional' : 'professionals'}
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
              {results.map(p => <ProfessionalCard key={p.id} professional={p} onOpenMatch={setMatchDrawer} />)}
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
          cta={{ label: 'Apply / Connect' }}
          onClose={() => setMatchDrawer(null)}
        />
      )}
    </div>
  );
}