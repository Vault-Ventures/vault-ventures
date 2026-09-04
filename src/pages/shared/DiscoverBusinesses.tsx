import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconArrowRight, IconX } from '../../components/layout/Icons';
import { MatchScoreChip, MatchExplanationDrawer } from '../../components/ui/AIInsights';
import type { MatchFactor, MatchDetail } from '../../components/ui/AIInsights';

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
  investorMatchScore: number;
  professionalMatchScore: number;
  investorMatchReasons: MatchFactor[];
  professionalMatchReasons: MatchFactor[];
  investorMatchDetail: MatchDetail;
  professionalMatchDetail: MatchDetail;
}

interface Filters {
  industries: string[];
  stages: string[];
  skills: string[];
  fundingPreset: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const BUSINESSES: Business[] = [
  {
    id: 'novatech-ai',
    name: 'NovaTech AI',
    initials: 'NA',
    industry: 'FinTech',
    stage: 'Seed',
    location: 'Dhaka',
    description: 'AI-powered financial analytics platform helping SMEs automate reporting and access credit faster. 200+ active clients across Bangladesh.',
    fundingAmount: 5000000,
    requiredSkills: ['Machine Learning', 'FinTech', 'Product Management', 'Business Development'],
    verificationTier: 2,
    foundedYear: 2022,
    teamSize: '6–15',
    investorMatchScore: 91,
    professionalMatchScore: 83,
    investorMatchReasons: [
      { label: 'FinTech industry alignment', description: 'Matches primary investment focus.', positive: true },
      { label: 'Seed stage preference', description: 'Aligns with preferred entry stage.', positive: true },
      { label: 'Track-record verified', description: 'Tier 2 verification adds trust.', positive: true },
    ],
    professionalMatchReasons: [
      { label: 'ML & FinTech skills needed', description: 'Your expertise directly matches 2 open roles.', positive: true },
      { label: 'Seed stage team', description: 'Good fit for embedded specialist role.', positive: true },
    ],
    investorMatchDetail: {
      score: 91,
      entityName: 'NovaTech AI',
      summary: 'Strong alignment across industry sector, funding stage, verification level, and Bangladesh market fit.',
      alignments: [
        { factor: 'Industry Alignment', score: 94, description: 'FinTech is a primary investment focus — direct match.' },
        { factor: 'Stage Preference', score: 90, description: 'Seed stage aligns with preferred early-stage entry mandate.' },
        { factor: 'Verification Level', score: 88, description: 'Tier 2 verified — highest trust signal on the platform.' },
        { factor: 'Market Geography', score: 82, description: 'Bangladesh-first business consistent with local investment thesis.' },
      ],
      gaps: [
        { factor: 'Revenue Stage', description: 'Still pre-revenue — standard for Seed, but worth monitoring early burn.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'FinTech is a direct match with your primary stated investment focus.',
        'Seed stage aligns exactly with your preferred entry point.',
        'Tier 2 verification adds credibility rare at this stage in Bangladesh.',
        '200+ active clients demonstrates early product-market validation.',
      ],
    },
    professionalMatchDetail: {
      score: 83,
      entityName: 'NovaTech AI',
      summary: 'Your ML and FinTech skills match two open roles directly, and the Seed stage is well-suited for an embedded specialist.',
      alignments: [
        { factor: 'Skills Match', score: 90, description: 'Machine Learning and FinTech expertise matches 2 of the open roles.' },
        { factor: 'Stage Fit', score: 85, description: 'Seed stage offers meaningful embedded specialist engagement.' },
        { factor: 'Industry Proximity', score: 76, description: 'FinTech background is relevant to the analytics and credit platform.' },
      ],
      gaps: [
        { factor: 'Domain Specialization', description: 'Deep FinTech AI experience preferred — broader ML backgrounds may need ramp-up.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Your ML expertise directly serves the core AI analytics platform.',
        'FinTech background means minimal domain ramp-up time.',
        'Seed stage team is actively building — high impact contribution possible.',
      ],
    },
  },
  {
    id: 'greenpath-logistics',
    name: 'GreenPath Logistics',
    initials: 'GL',
    industry: 'CleanTech',
    stage: 'Pre-Seed',
    location: 'Chittagong',
    description: 'Electric last-mile delivery network for urban commerce across Chittagong and Dhaka. Piloting with 3 e-commerce partners.',
    fundingAmount: 1500000,
    requiredSkills: ['Logistics Engineering', 'Operations', 'Sales'],
    verificationTier: 1,
    foundedYear: 2023,
    teamSize: '2–5',
    investorMatchScore: 72,
    professionalMatchScore: 66,
    investorMatchReasons: [
      { label: 'CleanTech outside primary focus', description: 'Sector may not align with core investment thesis.', positive: false },
      { label: 'Pre-Seed stage', description: 'Stage matches early-stage mandate.', positive: true },
      { label: 'Chittagong market', description: 'Geographic diversification opportunity.', positive: true },
    ],
    professionalMatchReasons: [
      { label: 'Operations skills relevant', description: 'Operational expertise is valued here.', positive: true },
      { label: 'Logistics niche required', description: 'Domain-specific logistics knowledge needed.', positive: false },
    ],
    investorMatchDetail: {
      score: 72,
      entityName: 'GreenPath Logistics',
      summary: 'Moderate alignment — stage and geography match, but CleanTech is outside primary investment focus.',
      alignments: [
        { factor: 'Stage Preference', score: 80, description: 'Pre-Seed stage matches early-stage investment mandate.' },
        { factor: 'Geographic Fit', score: 76, description: 'Chittagong market offers geographic portfolio diversification.' },
        { factor: 'Sector Alignment', score: 55, description: 'CleanTech is adjacent but outside primary focus areas.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'CleanTech falls outside primary and secondary investment verticals.', severity: 'weak' },
        { factor: 'Traction Stage', description: 'Only 3 e-commerce pilots — limited validation data at this stage.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Pre-Seed stage aligns with your early-entry investment strategy.',
        'Chittagong focus adds geographic diversification to a Dhaka-heavy portfolio.',
        'Electric logistics is an emerging CleanTech niche with regional tailwinds.',
      ],
    },
    professionalMatchDetail: {
      score: 66,
      entityName: 'GreenPath Logistics',
      summary: 'Partial match — operational skills are relevant, but logistics domain specialization is a key requirement.',
      alignments: [
        { factor: 'Operations Skills', score: 74, description: 'Operational expertise is directly relevant to logistics scaling.' },
        { factor: 'Stage Engagement', score: 70, description: 'Pre-Seed stage suits embedded operational contributors.' },
      ],
      gaps: [
        { factor: 'Logistics Domain', description: 'Specialist logistics domain knowledge is listed as essential.', severity: 'weak' },
        { factor: 'CleanTech Experience', description: 'Electric delivery infrastructure is a niche requiring specific knowledge.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Operational skills are valued in this early logistics build-out.',
        'Pre-Seed stage means high ownership and direct contribution impact.',
      ],
    },
  },
  {
    id: 'medibook-bd',
    name: 'MediBook BD',
    initials: 'MB',
    industry: 'HealthTech',
    stage: 'Pre-Seed',
    location: 'Dhaka',
    description: 'Digital appointment scheduling and patient management for private clinics. Reducing no-shows by 45% across 80 partner facilities.',
    fundingAmount: 2500000,
    requiredSkills: ['Healthcare Domain', 'Business Development', 'Marketing'],
    verificationTier: 1,
    foundedYear: 2023,
    teamSize: '2–5',
    investorMatchScore: 81,
    professionalMatchScore: 74,
    investorMatchReasons: [
      { label: 'HealthTech secondary focus', description: 'Sector aligns with portfolio diversification goals.', positive: true },
      { label: 'Pre-Seed stage', description: 'Matches early-stage entry preference.', positive: true },
      { label: 'Limited traction data', description: 'Verification at Tier 1 — more diligence needed.', positive: false },
    ],
    professionalMatchReasons: [
      { label: 'BD & marketing skills match', description: 'Your skills align with open roles.', positive: true },
      { label: 'Healthcare domain a priority', description: 'Domain expertise is a key requirement.', positive: false },
    ],
    investorMatchDetail: {
      score: 81,
      entityName: 'MediBook BD',
      summary: 'Good match — HealthTech aligns with secondary investment focus and Pre-Seed entry preference.',
      alignments: [
        { factor: 'Industry Alignment', score: 84, description: 'HealthTech is a secondary investment focus — meaningful match.' },
        { factor: 'Stage Preference', score: 86, description: 'Pre-Seed matches early-stage entry mandate.' },
        { factor: 'Problem Clarity', score: 78, description: '45% no-show reduction is a measurable, credible outcome.' },
      ],
      gaps: [
        { factor: 'Verification Level', description: 'Tier 1 only — more diligence needed before commitment.', severity: 'moderate' },
        { factor: 'Revenue Traction', description: 'Pre-revenue with 80 partner facilities — still building commercial proof.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'HealthTech fits your portfolio diversification strategy.',
        'Pre-Seed stage aligns with your preferred early-entry mandate.',
        '80 partner facilities shows meaningful real-world traction.',
      ],
    },
    professionalMatchDetail: {
      score: 74,
      entityName: 'MediBook BD',
      summary: 'BD and marketing skills align with two open roles, though healthcare domain expertise is a listed priority.',
      alignments: [
        { factor: 'Skills Match', score: 82, description: 'BD and marketing skills directly match open roles.' },
        { factor: 'Stage Engagement', score: 78, description: 'Pre-Seed suits growth-focused embedded contributors.' },
      ],
      gaps: [
        { factor: 'Healthcare Domain', description: 'Healthcare-specific domain expertise is listed as a priority need.', severity: 'weak' },
      ],
      whyThisMatch: [
        'BD and marketing are both listed as required skills for this business.',
        'Pre-Seed stage means your work directly shapes growth from the ground up.',
        'Bangladesh clinic market experience would be a strong advantage.',
      ],
    },
  },
  {
    id: 'eduleap',
    name: 'EduLeap',
    initials: 'EL',
    industry: 'EdTech',
    stage: 'Seed',
    location: 'Dhaka',
    description: 'Adaptive learning platform for K-12 students in Bangladesh. 15,000 active learners, partnerships with 45 schools nationwide.',
    fundingAmount: 7500000,
    requiredSkills: ['EdTech', 'Marketing', 'Product Management', 'Strategy'],
    verificationTier: 2,
    foundedYear: 2021,
    teamSize: '16–50',
    investorMatchScore: 76,
    professionalMatchScore: 78,
    investorMatchReasons: [
      { label: 'EdTech outside primary focus', description: 'Sector is adjacent but not a primary target.', positive: false },
      { label: 'Strong traction', description: '15K learners and 45 school partnerships is solid.', positive: true },
      { label: 'Track-record verified', description: 'Tier 2 verification adds credibility.', positive: true },
    ],
    professionalMatchReasons: [
      { label: 'Marketing & PM skills needed', description: 'Open roles match your expertise closely.', positive: true },
      { label: 'Scale-stage opportunity', description: 'Seed stage with strong traction.', positive: true },
    ],
    investorMatchDetail: {
      score: 76,
      entityName: 'EduLeap',
      summary: 'Good match driven by strong traction and verification — EdTech sector is adjacent to primary focus.',
      alignments: [
        { factor: 'Traction Quality', score: 88, description: '15K learners and 45 school partnerships is strong Seed-stage proof.' },
        { factor: 'Verification Level', score: 85, description: 'Tier 2 verified — strong trust signal.' },
        { factor: 'Sector Adjacency', score: 60, description: 'EdTech is adjacent but outside primary investment focus areas.' },
      ],
      gaps: [
        { factor: 'Industry Focus', description: 'EdTech is not a primary sector — requires thesis expansion.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Exceptional traction for Seed stage — 15K active learners is a strong signal.',
        'Tier 2 verification adds credibility above most Seed-stage businesses.',
        'Education infrastructure in Bangladesh is a growing sector.',
      ],
    },
    professionalMatchDetail: {
      score: 78,
      entityName: 'EduLeap',
      summary: 'Marketing and PM skills match open roles closely; Seed stage with strong traction is a meaningful engagement.',
      alignments: [
        { factor: 'Skills Match', score: 85, description: 'Marketing and Product Management skills match listed open roles.' },
        { factor: 'Stage Quality', score: 80, description: 'Seed with 15K users means stable enough for meaningful contribution.' },
        { factor: 'Growth Opportunity', score: 72, description: 'Scaling from 45 to 200+ school partnerships is the active challenge.' },
      ],
      gaps: [
        { factor: 'EdTech Domain', description: 'K-12 education domain knowledge is a preference for senior roles.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Marketing and PM skills are both actively needed for the next growth phase.',
        'Strong traction means real problems to solve — not pre-product stage.',
        '45 school partnerships provides a solid base to scale from.',
      ],
    },
  },
  {
    id: 'agronext-bd',
    name: 'AgroNext BD',
    initials: 'AN',
    industry: 'AgriTech',
    stage: 'Pre-Seed',
    location: 'Sylhet',
    description: 'Precision farming platform connecting smallholder farmers with buyers and providing real-time soil and crop analytics.',
    fundingAmount: 1200000,
    requiredSkills: ['Agriculture', 'Engineering', 'Operations'],
    verificationTier: 0,
    foundedYear: 2024,
    teamSize: '2–5',
    investorMatchScore: 58,
    professionalMatchScore: 52,
    investorMatchReasons: [
      { label: 'AgriTech niche sector', description: 'Outside primary and secondary focus areas.', positive: false },
      { label: 'Unverified business', description: 'No verification completed yet.', positive: false },
      { label: 'Pre-Seed stage', description: 'Stage matches early-stage mandate.', positive: true },
    ],
    professionalMatchReasons: [
      { label: 'Agriculture domain required', description: 'Specialist agricultural knowledge is essential.', positive: false },
      { label: 'Early-stage opportunity', description: 'High impact potential at founding stage.', positive: true },
    ],
    investorMatchDetail: {
      score: 58,
      entityName: 'AgroNext BD',
      summary: 'Developing match — stage aligns but AgriTech sector is outside focus and the business lacks verification.',
      alignments: [
        { factor: 'Stage Preference', score: 72, description: 'Pre-Seed stage matches early-stage mandate.' },
        { factor: 'Impact Potential', score: 65, description: 'Smallholder farming is a meaningful impact opportunity in Bangladesh.' },
      ],
      gaps: [
        { factor: 'Sector Alignment', description: 'AgriTech is outside primary and secondary investment focus areas.', severity: 'weak' },
        { factor: 'Verification', description: 'Unverified business — no trust signal established yet.', severity: 'weak' },
        { factor: 'Traction', description: 'Very early stage — minimal commercial validation available.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'Pre-Seed stage matches your early-entry investment mandate.',
        'Rural connectivity and precision agriculture are emerging in Bangladesh.',
        'First-mover position in AgriTech could yield strong returns if thesis expands.',
      ],
    },
    professionalMatchDetail: {
      score: 52,
      entityName: 'AgroNext BD',
      summary: 'Developing match — early-stage opportunity exists but agriculture domain specialization is essential.',
      alignments: [
        { factor: 'Stage Impact', score: 70, description: 'Founding-stage engagement offers maximum ownership and influence.' },
        { factor: 'Engineering Relevance', score: 60, description: 'Technical skills applicable to platform development.' },
      ],
      gaps: [
        { factor: 'Agriculture Domain', description: 'Specialist agricultural knowledge is listed as essential for core roles.', severity: 'weak' },
        { factor: 'Sector Experience', description: 'AgriTech is a niche sector requiring specific domain background.', severity: 'weak' },
      ],
      whyThisMatch: [
        'Early-stage engagement means direct influence on product direction.',
        'Bangladesh agri-sector is underserved — meaningful social impact potential.',
      ],
    },
  },
  {
    id: 'paystack-bd',
    name: 'PayStack BD',
    initials: 'PS',
    industry: 'FinTech',
    stage: 'Series A',
    location: 'Dhaka',
    description: 'Full-stack digital payments infrastructure for Bangladeshi businesses. Processing ৳2Cr+ monthly, fully BFIU compliant.',
    fundingAmount: 20000000,
    requiredSkills: ['FinTech', 'Legal', 'Finance', 'Business Development', 'Strategy'],
    verificationTier: 2,
    foundedYear: 2020,
    teamSize: '16–50',
    investorMatchScore: 85,
    professionalMatchScore: 80,
    investorMatchReasons: [
      { label: 'Strong FinTech alignment', description: 'Core sector match with investment thesis.', positive: true },
      { label: 'Series A — later stage', description: 'Slightly later than preferred entry stage.', positive: false },
      { label: 'Track-record verified', description: 'Tier 2 and processing ৳2Cr+ monthly.', positive: true },
    ],
    professionalMatchReasons: [
      { label: 'Finance & Legal skills needed', description: 'Multiple open roles match your skill set.', positive: true },
      { label: 'Established team', description: 'Series A stage offers stable engagement.', positive: true },
    ],
    investorMatchDetail: {
      score: 85,
      entityName: 'PayStack BD',
      summary: 'Strong match — core FinTech sector alignment backed by Tier 2 verification and proven processing volume.',
      alignments: [
        { factor: 'Industry Alignment', score: 92, description: 'FinTech payments is a direct match with core investment thesis.' },
        { factor: 'Verification Level', score: 88, description: 'Tier 2 verified with ৳2Cr+ monthly processing — strong credibility.' },
        { factor: 'Business Maturity', score: 82, description: 'BFIU compliant payments infrastructure — de-risked operations.' },
        { factor: 'Stage Preference', score: 66, description: 'Series A is slightly later than preferred Seed entry stage.' },
      ],
      gaps: [
        { factor: 'Entry Stage', description: 'Series A is later than your preferred early-stage entry point.', severity: 'moderate' },
      ],
      whyThisMatch: [
        'FinTech payments is a direct sector match with your core investment thesis.',
        '৳2Cr+ monthly processing is strong commercial proof for a Bangladesh fintech.',
        'BFIU compliance reduces regulatory risk — a key concern in this sector.',
      ],
    },
    professionalMatchDetail: {
      score: 80,
      entityName: 'PayStack BD',
      summary: 'Strong match — Finance and Legal skills map directly to multiple open roles at a stable Series A company.',
      alignments: [
        { factor: 'Skills Match', score: 88, description: 'Finance and Legal skills match multiple listed open roles.' },
        { factor: 'Stage Stability', score: 84, description: 'Series A stage offers stable, structured engagement.' },
        { factor: 'Industry Fit', score: 80, description: 'FinTech background directly applies to the payments infrastructure context.' },
      ],
      gaps: [
        { factor: 'Payments Domain', description: 'BFIU compliance and payments-specific legal experience is preferred.', severity: 'clarification' },
      ],
      whyThisMatch: [
        'Finance and Legal are both actively listed as required skills.',
        'Series A stage means structured processes and clear scope of engagement.',
        'Bangladesh payments infrastructure is a high-growth, regulated sector.',
      ],
    },
  },
];

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
  { value: 'newest', label: 'Newest' },
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
  if (sort === 'newest') s.sort((a, b) => b.foundedYear - a.foundedYear);
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

function BusinessCardList({ business, matchScore, matchDetail, contextLabel, onOpenMatch }: {
  business: Business;
  matchScore: number;
  matchDetail: MatchDetail;
  contextLabel: string;
  onOpenMatch: (detail: MatchDetail) => void;
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
                {business.verificationTier > 0 && <VerificationBadge tier={business.verificationTier as 0 | 1 | 2 | 3} />}
                <Badge variant="neutral">{business.stage}</Badge>
              </div>
              <div className="sm:text-right shrink-0 space-y-1">
                <div>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Seeking</p>
                  <p className="font-mono text-[13px] font-semibold text-[#C67A4E] tabular-nums">{fmtBDT(business.fundingAmount)}</p>
                </div>
                <MatchScoreChip score={matchScore} contextLabel={contextLabel} onClick={() => onOpenMatch(matchDetail)} />
              </div>
            </div>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2">
              <span className="text-[#C67A4E] font-medium">{business.industry}</span>
              {' · '}{business.location}{' · '}Est. {business.foundedYear}{' · '}{business.teamSize} people
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
                onClick={e => { e.preventDefault(); e.stopPropagation(); onOpenMatch(matchDetail); }}
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

function BusinessCardGrid({ business, matchScore, matchDetail, contextLabel, onOpenMatch }: {
  business: Business; matchScore: number; matchDetail: MatchDetail; contextLabel: string; onOpenMatch: (d: MatchDetail) => void;
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
              {business.verificationTier > 0 && <VerificationBadge tier={business.verificationTier as 0 | 1 | 2 | 3} />}
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
            <span className="font-mono text-[12px] font-semibold text-[#C67A4E]">{fmtBDT(business.fundingAmount)}</span>
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
            <MatchScoreChip score={matchScore} contextLabel={contextLabel} onClick={() => onOpenMatch(matchDetail)} />
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
          : 'No published businesses are available at this time. Check back soon.'}
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
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState('newest');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [matchDrawer, setMatchDrawer] = useState<{ detail: MatchDetail; cta: { label: string } } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(
    () => sortItems(applyFilters(BUSINESSES, filters, search), sort),
    [search, filters, sort]
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
  const handleOpenMatch = (detail: MatchDetail) => setMatchDrawer({ detail: { ...detail, contextLabel }, cta: { label: ctaLabel } });

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

          {/* Result count + AI note */}
          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                {results.length} {results.length === 1 ? 'business' : 'businesses'}
                {hasActiveFilters ? ' match your filters' : ' available'}
              </p>
              <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1">
                <span style={{ color: '#C67A4E' }}>✦</span>
                AI match scores shown · sorted by {SORT_OPTIONS.find(o => o.value === sort)?.label ?? sort}
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
                  matchScore={context === 'investor' ? b.investorMatchScore : b.professionalMatchScore}
                  matchDetail={context === 'investor' ? b.investorMatchDetail : b.professionalMatchDetail}
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
                  matchScore={context === 'investor' ? b.investorMatchScore : b.professionalMatchScore}
                  matchDetail={context === 'investor' ? b.investorMatchDetail : b.professionalMatchDetail}
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
      {matchDrawer && (
        <MatchExplanationDrawer
          data={matchDrawer.detail}
          cta={matchDrawer.cta}
          onClose={() => setMatchDrawer(null)}
        />
      )}
    </div>
  );
}