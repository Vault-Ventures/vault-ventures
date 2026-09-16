import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Tabs, InfoRow, SectionHeader } from '../../components/ui/DataDisplay';
import { IconArrowRight, IconCheck, IconLock, IconPlus, IconShield, IconUsers, IconBriefcase, IconX } from '../../components/layout/Icons';
import {
  DisclosureProgress, DisclosureGate, LockedDocument,
  AccessGrantedBanner, NDAStatusPanel, NDARequestModal, FounderConfirmationPanel,
} from '../../components/ui/StagedDisclosure';
import type { NDARecord } from '../../components/ui/StagedDisclosure';
import {
  AIBadge, MatchScoreRing, MatchFactors, ImprovementItem, AIDisclaimer, MatchExplanationDrawer,
} from '../../components/ui/AIInsights';
import type { MatchFactor, ImprovementItemData, MatchDetail } from '../../components/ui/AIInsights';
import { useRole } from '../../components/layout/AppShell';

// -- Prototype data -------------------------------------------------

const BUSINESS = {
  id: 'nova-health',
  name: 'Nova Health',
  tagline: 'AI-powered diagnostics scheduling for healthcare providers',
  industry: 'HealthTech',
  stage: 'Pre-Seed',
  location: 'Dhaka, Bangladesh',
  founded: '2024',
  website: 'novahealth.io',
  verificationTier: 1 as 0 | 1 | 2,
  disclosureStage: 2,
  status: 'Published' as 'Draft' | 'Published',
  updatedAt: '2 days ago',
  problem: 'Healthcare providers in Bangladesh struggle with manual appointment scheduling, leading to 30% average no-show rates and 2-3 hour patient wait times across 12,000+ facilities.',
  solution: 'AI-powered scheduling platform that reduces no-shows by 60% through smart reminders and predictive slot allocation. Integrates with existing EMR systems in under 2 hours.',
  targetMarket: 'Private clinics and diagnostic centers in Bangladesh - 12,000+ facilities, TAM estimated BDT 480 Cr/year.',
  businessModel: 'SaaS subscription. BDT 2,500-BDT 8,000/month per facility depending on volume. Onboarding fee waived for first 6 months.',
  fundingAmount: 1500000,
  fundingStage: 'Pre-Seed',
  useOfFunds: '60% product development, 30% marketing & sales, 10% operations',
  revenueStatus: 'Pre-revenue',
  traction: '3 pilot contracts signed, 2 LOIs from hospital networks, 200+ beta users across Dhaka.',
  requiredSkills: ['Series A Preparation', 'Legal & IP', 'Growth Marketing', 'Financial Modeling', 'Healthcare Domain'],
};

const READINESS_FACTORS = [
  { name: 'Market Clarity', score: 88, weight: 15, desc: 'TAM/SAM clearly articulated with data sources.' },
  { name: 'Solution Differentiation', score: 82, weight: 15, desc: 'Clear competitive advantage over manual scheduling.' },
  { name: 'Business Model', score: 76, weight: 15, desc: 'SaaS model validated; pricing tiers defined.' },
  { name: 'Team Strength', score: 72, weight: 15, desc: 'Domain experience present; tech lead to be hired.' },
  { name: 'Traction', score: 68, weight: 15, desc: '3 pilots active; revenue not yet generated.' },
  { name: 'Financial Planning', score: 60, weight: 10, desc: 'Runway projections present; burn rate not modeled.' },
  { name: 'Legal & Compliance', score: 55, weight: 8, desc: 'Business registered; IP protection pending.' },
  { name: 'Investor Readiness', score: 50, weight: 7, desc: 'Pitch deck exists; data room incomplete.' },
];

const MILESTONES = [
  { id: 1, name: 'Reach 500 paying customers', target: 'BDT 12,50,000 ARR', status: 'Active', progress: 35, due: 'Q3 2025' },
  { id: 2, name: 'Launch in 3 new cities', target: 'Chittagong, Sylhet, Khulna', status: 'Upcoming', progress: 0, due: 'Q4 2025' },
  { id: 3, name: 'Achieve BDT 10L monthly revenue', target: 'BDT 10,00,000/mo', status: 'Upcoming', progress: 0, due: 'Q1 2026' },
];

const TEAM = [
  { id: '1', name: 'Rifat Ahsan', role: 'CEO & Co-Founder', avatar: 'RA', color: '#C67A4E', bio: '8 years in digital health. Former product lead at a major Dhaka hospital network.' },
  { id: '2', name: 'Sarah Chen', role: 'CTO & Co-Founder', avatar: 'SC', color: '#C9A24B', bio: 'ML engineer, 6 years. Built scheduling systems at scale for logistics platforms.' },
  { id: '3', name: 'Marcus Johnson', role: 'Head of Growth', avatar: 'MJ', color: '#22C55E', bio: 'GTM specialist. Scaled two B2B SaaS companies to Series A.' },
  { id: '4', name: 'Ayesha Malik', role: 'Product Lead', avatar: 'AM', color: '#A78BFA', bio: 'UX/product background. Previously at a major HealthTech startup in Dhaka.' },
];

const OPPORTUNITIES = [
  { role: 'Series A Preparation', type: 'Professional', desc: 'Financial modeling, investor-ready reporting' },
  { role: 'Legal Advisory', type: 'Professional', desc: 'IP protection, term sheet review' },
  { role: 'Growth Marketing', type: 'Professional', desc: 'Channel strategy for hospital network sales' },
];

// -- AI data --------------------------------------------------------

const AI_ANALYSIS = {
  overallAssessment: 'Nova Health demonstrates strong problem-solution fit with validated early traction in a fragmented HealthTech market. The business is positioned as a developing-stage opportunity with clear upside potential, contingent on completing financial documentation and investor readiness materials.',
  strengths: [
    { title: 'Validated market demand', description: '3 active pilot contracts and 2 LOIs from hospital networks confirm real market pull beyond concept stage.' },
    { title: 'Quantified problem', description: 'The 30% no-show rate is a measurable, documented pain point that resonates clearly with target customers.' },
    { title: 'Experienced founding team', description: 'Combined domain expertise across digital health and ML engineering is a meaningful early-stage signal for investors.' },
    { title: 'Investor-friendly revenue model', description: 'SaaS subscription pricing with defined per-facility tiers is predictable and scalable.' },
  ],
  improvements: [
    { title: 'Complete financial projections', description: 'Runway projections and burn rate model are incomplete. These are required for institutional Pre-Seed discussions.', priority: 'high' as const },
    { title: 'Clarify IP and legal structure', description: 'IP protection is currently pending. Document existing filings and provide a timeline for formal protection.', priority: 'high' as const },
    { title: 'Strengthen investor materials', description: 'Pitch deck exists but financial projections and cap table are incomplete. Finish before approaching investors.', priority: 'medium' as const },
    { title: 'Build out team profiles', description: 'Formal credential links and LinkedIn profiles for each team member would strengthen trust signals.', priority: 'low' as const },
  ] as ImprovementItemData[],
  insights: [
    'Pre-Seed traction with 3 signed pilots is above average for HealthTech at this stage in Bangladesh.',
    'A TAM of BDT 480 Cr/year is credible and supports an institutional seed round once documentation is complete.',
    'Bangladesh HealthTech scheduling is fragmented with no dominant platform - early mover advantage is available.',
  ],
};

const INVESTOR_MATCH: { score: number; factors: MatchFactor[] } = {
  score: 84,
  factors: [
    { label: 'HealthTech industry alignment', description: 'Matches your stated focus on digital health and diagnostics.', positive: true },
    { label: 'Pre-Seed stage preference', description: 'Aligns with your early-stage investment mandate.', positive: true },
    { label: 'Bangladesh market', description: 'In-market investment consistent with your geographic preference.', positive: true },
    { label: 'IP documentation incomplete', description: 'IP protection is pending - common at this stage but worth monitoring.', positive: false },
  ],
};

const PROFESSIONAL_MATCH: { score: number; factors: MatchFactor[] } = {
  score: 78,
  factors: [
    { label: 'Required skills alignment', description: 'Your FinTech and Financial Modeling expertise matches 2 of 5 open roles.', positive: true },
    { label: 'Early-stage environment', description: 'Pre-Seed stage suits advisory and embedded specialist roles.', positive: true },
    { label: 'Healthcare domain gap', description: 'This business requires healthcare domain expertise as a key priority.', positive: false },
  ],
};

const INVESTOR_MATCH_DETAIL: MatchDetail = {
  score: 84,
  entityName: 'Nova Health',
  summary: 'Strong alignment across industry, stage, market geography and early traction signals.',
  alignments: [
    { factor: 'Industry Alignment', score: 90, description: 'HealthTech digital scheduling is a direct match with stated investment focus.' },
    { factor: 'Stage Preference', score: 88, description: 'Pre-Seed aligns with your early-stage entry mandate.' },
    { factor: 'Market Geography', score: 86, description: 'Bangladesh-first business fits your regional investment thesis.' },
    { factor: 'Early Traction', score: 76, description: '3 signed pilots and 2 LOIs show above-average early validation.' },
  ],
  gaps: [
    { factor: 'IP Documentation', description: 'IP protection is pending - common at Pre-Seed but worth monitoring.', severity: 'moderate' },
    { factor: 'Revenue Stage', description: 'Pre-revenue - confirm timeline to first paying customer.', severity: 'clarification' },
  ],
  whyThisMatch: [
    'HealthTech is a stated primary focus - sector aligns directly.',
    'Pre-Seed entry matches your preferred early-stage investment mandate.',
    'Bangladesh market expertise positions you to add value beyond capital.',
    '3 signed pilots with hospital networks shows real customer pull.',
  ],
};

const PROFESSIONAL_MATCH_DETAIL: MatchDetail = {
  score: 78,
  entityName: 'Nova Health',
  summary: 'Good alignment - skills match 2 of 5 open roles and Pre-Seed stage suits specialist engagement.',
  alignments: [
    { factor: 'Skills Match', score: 84, description: 'Financial Modeling and Investor Relations match 2 of the listed required skills.' },
    { factor: 'Stage Fit', score: 80, description: 'Pre-Seed environment suits advisory and embedded specialist roles.' },
    { factor: 'Problem Relevance', score: 74, description: 'Financial structure challenges are your specialty - directly needed here.' },
  ],
  gaps: [
    { factor: 'Healthcare Domain', description: 'Healthcare-specific domain knowledge is listed as a priority requirement.', severity: 'moderate' },
  ],
  whyThisMatch: [
    'Financial Modeling is a listed high-priority gap - your core expertise.',
    'Investor Relations helps prepare for the upcoming fundraise.',
    'Pre-Seed stage means high ownership and direct advisory impact.',
    'Healthcare domain gap is manageable given the SaaS-centric business model.',
  ],
};

const NDA_RECORD: NDARecord = {
  version: '2.1',
  date: 'September 2026',
  parties: [
    { name: 'Nova Health (Founder)', role: 'Disclosing Party', accepted: true, acceptedAt: '28 Aug 2026' },
    { name: 'Rahim Chowdhury (Investor)', role: 'Receiving Party', accepted: false },
  ],
};

// -- Helpers --------------------------------------------------------

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-[15px]' : 'w-10 h-10 text-[12px]';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ background: `${color}18`, border: `1.5px solid ${color}35`, color }}>
      {initials}
    </div>
  );
}

function ReadinessDonut({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22C55E' : score >= 55 ? '#C67A4E' : '#F59E0B';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)" />
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'IBM Plex Mono', fontSize: '18px', fontWeight: 600, fill: color }}>{score}</text>
      <text x="50" y="62" textAnchor="middle"
        style={{ fontFamily: 'Inter', fontSize: '9px', fill: '#5E6D8F' }}>/ 100</text>
    </svg>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'accent' | 'neutral' | 'warning'; dot: boolean }> = {
    Active: { variant: 'accent', dot: true },
    Completed: { variant: 'success', dot: true },
    Upcoming: { variant: 'neutral', dot: false },
    Disputed: { variant: 'warning', dot: true },
  };
  const cfg = map[status] ?? { variant: 'neutral', dot: false };
  return <Badge variant={cfg.variant} dot={cfg.dot}>{status}</Badge>;
}

// -- Edit Drawer ----------------------------------------------------

function EditDrawer({ section, business, onSaved, onClose }: { section: string; business: any; onSaved: (value: any) => void; onClose: () => void }) {
  const fields = [
    ['name', 'Business Name'], ['description', 'Description'], ['industry', 'Industry'],
    ['business_stage', 'Business Stage'], ['risk_level', 'Risk Level'],
    ['expected_involvement', 'Expected Involvement'], ['location', 'Location'],
  ];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, business[key] ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.businesses.updateRecord(business.id, values);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to save business.');
    } finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Edit Business">
    <form onSubmit={save} className="w-full sm:max-w-md bg-[#0D1626] p-6 overflow-auto space-y-4">
      <h2>Edit Business ? {section}</h2>
      {fields.map(([key, label]) => <label className="block" key={key}>{label}
        <input required={key === 'name'} value={values[key]} onChange={event => setValues(v => ({ ...v, [key]: event.target.value }))} className="block w-full p-2 rounded bg-[#182338]" />
      </label>)}
      {error && <p role="alert">{error}</p>}
      <Button type="button" disabled={saving} onClick={onClose}>Cancel</Button>
      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
    </form>
  </div>;
}

import { api } from '../../services/api';

// -- Main -----------------------------------------------------------

type ViewRole = 'founder' | 'investor' | 'professional';

export default function BusinessProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { role } = useRole();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bizData, setBizData] = useState<any>(null);
  const [readinessData, setReadinessData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Auto-unlock Stage 3 when returning from completed NDA flow
  useEffect(() => {
    if (searchParams.get('stage') === '3') {
      setDisclosureStage(3);
      setUnlockedBanner(3);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState('overview');
  const viewAs: ViewRole = location.pathname.startsWith('/app/founder/') ? 'founder' : role === 'investor' || role === 'professional' ? role : 'founder';
  const isOwner = viewAs === 'founder';
  const [editSection, setEditSection] = useState<string | null>(null);
  const [showInterestSent, setShowInterestSent] = useState(false);
  const [expressingInterest, setExpressingInterest] = useState(false);
  const [showApplied, setShowApplied] = useState(false);
  const [matchDrawer, setMatchDrawer] = useState<{ detail: MatchDetail; cta: string } | null>(null);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showFounderConfirm, setShowFounderConfirm] = useState(false);
  const [expandedReadiness, setExpandedReadiness] = useState(false);
  const [bizStatus, setBizStatus] = useState<'Draft' | 'Published'>('Published');
  const [publishing, setPublishing] = useState(false);
  const [publishedBanner, setPublishedBanner] = useState(false);
  const [disclosureStage, setDisclosureStage] = useState(2);
  const [unlockedBanner, setUnlockedBanner] = useState<number | null>(null);

  // Fetch real data from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError(null);
      setBizData(null);
      setReadinessData(null);
      setAnalysisData(null);
      try {
        if (!id || !/^[1-9]\d*$/.test(id)) throw new Error('Invalid business ID.');
        const businessId = id;
        const businessRecord = isOwner
          ? await api.businesses.get(businessId)
          : await api.businesses.getDisclosure(businessId);

        if (businessRecord && isMounted) {
          setBizData(businessRecord);
          if (businessRecord.status) {
            setBizStatus(businessRecord.status === 'submitted' ? 'Published' : 'Draft');
          }
          if (businessRecord.disclosure_stage !== undefined) {
            setDisclosureStage(businessRecord.disclosure_stage);
          }
        }

        // Fetch readiness & analysis if businessId available
        if (businessId && /^\d+$/.test(businessId)) {
          try {
            const rData = await api.readiness.getLatestAssessment(businessId);
            if (rData && isMounted) {
              setReadinessData(rData);
            }
          } catch (e) {}

          try {
            const aData = await api.businesses.getLatestAnalysis(businessId);
            if (aData && isMounted) {
              setAnalysisData(aData);
            }
          } catch (e) {}

          if (!isOwner) {
            try {
              const dStatus = await api.businesses.getDisclosureStatus(businessId);
              if (dStatus && dStatus.current_stage !== undefined && isMounted) {
                setDisclosureStage(dStatus.current_stage);
              }
            } catch (e) {}
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || 'Failed to load business profile.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [id, isOwner, role]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (bizData?.id) {
        await api.post(`/api/me/businesses/${bizData.id}/submit`);
      }
      setBizStatus('Published');
      setPublishedBanner(true);
      setTimeout(() => setPublishedBanner(false), 4000);
    } catch (e) {
      setBizStatus('Published');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = () => setBizStatus('Draft');

  const handleExpressInterest = async () => {
    if (bizData?.id) {
      setExpressingInterest(true);
      try {
        await api.businesses.expressInterest(bizData.id);
        setShowInterestSent(true);
      } catch (err) {
        setShowInterestSent(true);
      } finally {
        setExpressingInterest(false);
      }
    } else {
      setShowInterestSent(true);
    }
  };

  function handleUnlock(stage: number) {
    if (stage === 2) {
      setDisclosureStage(2);
      handleExpressInterest();
      setUnlockedBanner(2);
    } else if (stage === 3) {
      setShowNDAModal(true);
    } else if (stage === 4) {
      setShowFounderConfirm(true);
    }
  }

  // Derive dynamic business values
  const currentBusiness = {
    id: bizData?.id ? String(bizData.id) : (BUSINESS.id),
    name: bizData?.name || BUSINESS.name,
    tagline: bizData?.description ?? bizData?.tagline ?? bizData?.short_description ?? BUSINESS.tagline,
    industry: bizData?.industry || BUSINESS.industry,
    stage: bizData?.business_stage || bizData?.stage || BUSINESS.stage,
    location: bizData?.location || BUSINESS.location,
    founded: bizData?.founded_year ? String(bizData.founded_year) : BUSINESS.founded,
    website: bizData?.website || BUSINESS.website,
    verificationTier: (bizData?.user?.verification_tier ?? bizData?.verification_tier ?? BUSINESS.verificationTier) as 0 | 1 | 2,
    disclosureStage: disclosureStage,
    status: bizStatus,
    updatedAt: bizData?.updated_at ? new Date(bizData.updated_at).toLocaleDateString() : BUSINESS.updatedAt,
    problem: bizData?.problem || BUSINESS.problem,
    solution: bizData?.solution || BUSINESS.solution,
    targetMarket: bizData?.target_market || BUSINESS.targetMarket,
    businessModel: bizData?.business_model || BUSINESS.businessModel,
    fundingAmount: bizData?.funding_amount_cents ? bizData.funding_amount_cents / 100 : (bizData?.funding_amount ?? BUSINESS.fundingAmount),
    fundingStage: bizData?.funding_stage || bizData?.stage || BUSINESS.fundingStage,
    useOfFunds: bizData?.use_of_funds || BUSINESS.useOfFunds,
    revenueStatus: bizData?.revenue_status || BUSINESS.revenueStatus,
    traction: bizData?.traction || BUSINESS.traction,
    requiredSkills: bizData?.required_skills || BUSINESS.requiredSkills,
  };

  // Derive readiness factors dynamically
  const readinessFactors = readinessData?.factor_results
    ? Object.entries(readinessData.factor_results).map(([key, val]: [string, any]) => ({
        name: val.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: Math.round(val.score || 0),
        weight: val.weight || 12.5,
        desc: val.description || (val.score >= 70 ? 'Strong alignment.' : 'Needs refinement.'),
      }))
    : READINESS_FACTORS;

  const overallReadiness = readinessData?.overall_score
    ? Math.round(readinessData.overall_score)
    : Math.round(readinessFactors.reduce((acc, f) => acc + f.score * (f.weight / 100), 0));

  // Derive AI analysis dynamically
  const aiAnalysis = {
    overallAssessment: analysisData?.overall_assessment || analysisData?.summary || AI_ANALYSIS.overallAssessment,
    strengths: analysisData?.strengths
      ? analysisData.strengths.map((s: any) => typeof s === 'string' ? { title: s, description: s } : s)
      : AI_ANALYSIS.strengths,
    improvements: analysisData?.improvements || AI_ANALYSIS.improvements,
    insights: analysisData?.insights || AI_ANALYSIS.insights,
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'ai', label: 'AI Analysis' },
    { key: 'readiness', label: 'Readiness' },
    { key: 'funding', label: 'Funding & Milestones' },
    { key: 'team', label: 'Team' },
    ...(isOwner ? [{ key: 'opportunities', label: 'Opportunities' }] : []),
  ];

  if (loading) return <div className="p-6" role="status">Loading business...</div>;
  if (loadError || !bizData) return <div className="p-6" role="alert">{loadError || 'Business not found.'}</div>;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      {/* Unlock banner */}
      {unlockedBanner && (
        <AccessGrantedBanner stage={unlockedBanner} onDismiss={() => setUnlockedBanner(null)} />
      )}

      {/* Published confirmation banner */}
      {publishedBanner && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
          <span className="text-[12.5px] text-[#22C55E] font-medium">Business is now published and eligible for investor and professional discovery.</span>
        </div>
      )}

      {/* Draft warning banner (owner view) */}
      {isOwner && bizStatus === 'Draft' && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center justify-between gap-4"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="13" height="13" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <span className="text-[12px] text-[#F59E0B]"><span className="font-semibold">Draft</span> - This business is not visible in discovery. Publish when ready.</span>
          </div>
          <Button size="sm" loading={publishing} onClick={handlePublish}>
            {publishing ? 'Publishing-' : 'Publish Now'}
          </Button>
        </div>
      )}

      <div className="mb-4 text-[10.5px] text-[color:var(--vv-text-tertiary)]">Viewing as <span className="font-medium text-[#C67A4E] capitalize">{viewAs}</span> workspace</div>

      {/* -- Business Header --------------------------------------- */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] overflow-hidden mb-5">
        {/* Cover gradient */}
        <div className="h-24 sm:h-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(198,122,78,0.14) 0%, rgba(14,20,28,0.9) 55%, rgba(198,122,78,0.10) 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(198,122,78,0.10), transparent 70%)' }} />
          {isOwner && (
            <button onClick={() => setEditSection('Basic Information')}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/30 border border-white/10 text-[11px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-black/50 transition-colors flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5">
          {/* Logo + identity */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-8 sm:-mt-10">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-[color:var(--vv-border)] flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(198,122,78,0.15), rgba(198,122,78,0.08))', backdropFilter: 'blur(12px)' }}>
                <span className="font-display font-bold text-[22px] sm:text-[26px] text-[#C67A4E]">NH</span>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)]">{currentBusiness.name}</h1>
                  <VerificationBadge tier={currentBusiness.verificationTier} />
                  {isOwner && (
                    bizStatus === 'Published'
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border leading-none" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#22C55E' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />Published
                        </span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border leading-none" style={{ background: 'rgba(94,109,143,0.10)', borderColor: 'rgba(94,109,143,0.25)', color: '#5E6D8F' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D8F]" />Draft
                        </span>
                  )}
                </div>
                <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">{currentBusiness.tagline}</p>
              </div>
            </div>

            {/* Primary actions */}
            <div className="flex flex-wrap gap-2 pb-1">
              {isOwner && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditSection('Basic Information')}>
                    Manage Business
                  </Button>
                  {bizStatus === 'Draft'
                    ? <Button size="sm" loading={publishing} onClick={handlePublish}>{publishing ? 'Publishing-' : 'Publish'}</Button>
                    : <Button variant="ghost" size="sm" onClick={handleUnpublish}>Unpublish</Button>
                  }
                  <Button size="sm" onClick={() => navigate('/app/founder/businesses/new')}>
                    <IconPlus s={13} /> Add Business
                  </Button>
                </>
              )}
              {viewAs === 'investor' && (
                showInterestSent ? (
                  <Button variant="success" size="sm" icon={<IconCheck s={13} />}>Interest Sent</Button>
                ) : (
                  <Button size="sm" loading={expressingInterest} onClick={handleExpressInterest}>
                    Express Interest <IconArrowRight s={13} />
                  </Button>
                )
              )}
              {viewAs === 'professional' && (
                showApplied ? (
                  <Button variant="success" size="sm" icon={<IconCheck s={13} />}>Applied</Button>
                ) : (
                  <Button size="sm" onClick={() => setShowApplied(true)}>
                    Apply / Connect <IconArrowRight s={13} />
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[12.5px] text-[color:var(--vv-text-tertiary)]">
            <span className="text-[#C67A4E] font-medium">{currentBusiness.industry}</span>
            <span className="w-1 h-1 rounded-full bg-[#35446A]" />
            <Badge variant="neutral">{currentBusiness.stage}</Badge>
            <span className="w-1 h-1 rounded-full bg-[#35446A]" />
            <span>{currentBusiness.location}</span>
            <span className="w-1 h-1 rounded-full bg-[#35446A]" />
            <span>Founded {currentBusiness.founded}</span>
            {currentBusiness.website && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#35446A]" />
                <span className="text-[#C67A4E]">{currentBusiness.website}</span>
              </>
            )}
          </div>

          {/* Disclosure stage indicator (external view) */}
          {!isOwner && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-[8px] w-fit"
              style={{ background: 'rgba(198,122,78,0.05)', border: '1px solid rgba(198,122,78,0.14)' }}>
              <IconShield s={12} className="text-[#C67A4E]" />
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                Information Access -{' '}
                <span className="text-[color:var(--vv-text)] font-medium">Stage {disclosureStage} of 4</span>
                {disclosureStage < 4 && (
                  <button
                    onClick={() => handleUnlock(disclosureStage + 1 as 2 | 3 | 4)}
                    className="ml-2 text-[#C67A4E] hover:underline">
                    Unlock Stage {disclosureStage + 1} ?
                  </button>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-[#1c2a3e] px-5 sm:px-6">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* -- Tab Content ------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {[
                { title: 'Problem', content: currentBusiness.problem, editKey: 'Business Details' },
                { title: 'Solution', content: currentBusiness.solution, editKey: 'Business Details' },
                { title: 'Target Market', content: currentBusiness.targetMarket, editKey: 'Business Details' },
                { title: 'Business Model', content: currentBusiness.businessModel, editKey: 'Business Details' },
              ].map(({ title, content, editKey }) => (
                <div key={title} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5">
                  <SectionHeader title={title} action={isOwner ? (
                    <button onClick={() => setEditSection(editKey)} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                  ) : undefined} />
                  <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mt-3">{content}</p>
                </div>
              ))}

              {/* Required Skills */}
              {currentBusiness.requiredSkills && currentBusiness.requiredSkills.length > 0 && (
                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5">
                  <SectionHeader title="Required Skills" action={isOwner ? (
                    <button onClick={() => setEditSection('Required Skills')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                  ) : undefined} />
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1 mb-3">Expertise areas this business is actively seeking.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentBusiness.requiredSkills.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded text-[11.5px] border"
                        style={{ background: 'rgba(198,122,78,0.08)', borderColor: 'rgba(198,122,78,0.20)', color: '#C67A4E' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* AI ANALYSIS */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Overall Assessment */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[color:var(--vv-border)]"
                  style={{ background: 'rgba(198,122,78,0.03)' }}>
                  <AIBadge label="AI Analysis" />
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Generated by Vault AI - Updated {currentBusiness.updatedAt}</span>
                </div>
                <div className="p-5">
                  {!isOwner && (
                    <div className="mb-5 p-4 rounded-[10px] space-y-3"
                      style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.14)' }}>
                      <div className="flex items-center gap-3">
                        <MatchScoreRing score={viewAs === 'investor' ? INVESTOR_MATCH.score : PROFESSIONAL_MATCH.score} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-mono text-[22px] font-semibold" style={{ color: '#C67A4E' }}>
                              {viewAs === 'investor' ? INVESTOR_MATCH.score : PROFESSIONAL_MATCH.score}%
                            </p>
                            <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">profile match</span>
                          </div>
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Based on your preferences and this business profile</p>
                        </div>
                      </div>
                      <MatchFactors
                        factors={viewAs === 'investor' ? INVESTOR_MATCH.factors : PROFESSIONAL_MATCH.factors}
                        defaultExpanded={true}
                      />
                      <AIDisclaimer match />
                    </div>
                  )}
                  <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-4">{aiAnalysis.overallAssessment}</p>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[11.5px] font-medium text-[color:var(--vv-text)]">Assessment:</span>
                    <Badge variant="warning">Developing Stage</Badge>
                    <Badge variant="neutral">{currentBusiness.stage}</Badge>
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-medium border"
                      style={{ background: 'rgba(198,122,78,0.08)', borderColor: 'rgba(198,122,78,0.18)', color: '#C67A4E' }}>
                      {currentBusiness.industry}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Strengths */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Key Strengths</p>
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{aiAnalysis.strengths.length} identified</span>
                </div>
                <div className="divide-y divide-[#1c2a3e]">
                  {aiAnalysis.strengths.map((s: any, i: number) => (
                    <div key={i} className="flex gap-3 px-5 py-3.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}>
                        <svg width="9" height="9" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
                      </div>
                      <div>
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-0.5">{s.title}</p>
                        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Areas */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Improvement Areas</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Actionable steps to strengthen investor readiness.</p>
                </div>
                <div className="px-5 py-1">
                  {aiAnalysis.improvements.map((item: any, i: number) => (
                    <ImprovementItem key={i} {...item} />
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-3">Insights</p>
                <div className="space-y-2.5">
                  {aiAnalysis.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="text-[#C67A4E] shrink-0 mt-0.5 text-[12px] leading-snug">-</span>
                      <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug">{insight}</p>
                    </div>
                  ))}
                </div>
                <AIDisclaimer />
              </div>
            </div>
          )}

          {/* READINESS */}
          {activeTab === 'readiness' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">AI Readiness Score</p>
                  <p className="text-[13px] text-[color:var(--vv-text)] font-semibold">{readinessFactors.length}-factor business readiness analysis</p>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/app/founder/readiness?businessId=${bizData.id}`)}>
                    Full Report <IconArrowRight s={12} />
                  </Button>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-6 mb-6">
                  <ReadinessDonut score={overallReadiness} />
                  <div>
                    <p className="font-display text-[22px] font-semibold text-[color:var(--vv-text)] mb-0.5">
                      {overallReadiness >= 75 ? 'Investment Ready' : overallReadiness >= 55 ? 'Developing' : 'Early Stage'}
                    </p>
                    <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-3">Score from {readinessFactors.length} weighted factors</p>
                    <button onClick={() => setExpandedReadiness(v => !v)}
                      className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1">
                      {expandedReadiness ? 'Hide breakdown' : 'View breakdown'} <IconArrowRight s={11} />
                    </button>
                  </div>
                </div>

                {expandedReadiness && (
                  <div className="space-y-2.5 mb-5">
                    {readinessFactors.map((f: any) => (
                      <div key={f.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-[color:var(--vv-text)]">{f.name}</span>
                          <span className="font-mono text-[12px] tabular-nums" style={{ color: f.score >= 75 ? '#22C55E' : f.score >= 55 ? '#C67A4E' : '#F59E0B' }}>
                            {f.score}<span className="text-[color:var(--vv-text-tertiary)]">/100</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${f.score}%`, background: f.score >= 75 ? '#22C55E' : f.score >= 55 ? '#C67A4E' : '#F59E0B' }} />
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Improvement Suggestions */}
                <div className="pt-4 border-t border-[color:var(--vv-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AIBadge label="AI Suggestions" />
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Priority improvements</span>
                  </div>
                  <div className="mt-1">
                    {aiAnalysis.improvements.slice(0, 3).map((item: any, i: number) => (
                      <ImprovementItem key={i} {...item} />
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="text-[11px] text-[#C67A4E] hover:underline mt-1">
                    View full AI Analysis ?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FUNDING & MILESTONES */}
          {activeTab === 'funding' && (
            <>
              {/* Funding */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Funding Requirements</p>
                  {isOwner && (
                    <button onClick={() => setEditSection('Funding')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  {/* Stage 2: funding stage + revenue status always visible after connect */}
                  <DisclosureGate
                    stageRequired={2}
                    currentStage={isOwner ? 4 : disclosureStage}
                    title="Funding Overview"
                    hint="Express interest to see funding stage and revenue status."
                    onUnlock={!isOwner ? handleUnlock : undefined}
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4">
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Funding Stage</p>
                        <Badge variant="gold">{currentBusiness.fundingStage}</Badge>
                      </div>
                      <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4">
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Revenue Status</p>
                        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{currentBusiness.revenueStatus}</p>
                      </div>
                    </div>
                    <InfoRow label="Traction" value={currentBusiness.traction} />
                  </DisclosureGate>

                  {/* Stage 3: detailed financials */}
                  <DisclosureGate
                    stageRequired={3}
                    currentStage={isOwner ? 4 : disclosureStage}
                    title="Detailed Financials"
                    hint="Confidential - NDA required to view funding amount and use of funds."
                    onUnlock={!isOwner ? handleUnlock : undefined}
                  >
                    <div>
                      <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4 mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Amount Sought</p>
                        <p className="font-mono text-[22px] font-semibold text-[#C67A4E] tabular-nums">
                          ?{currentBusiness.fundingAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <InfoRow label="Use of Funds" value={currentBusiness.useOfFunds} />
                    </div>
                  </DisclosureGate>

                  {/* Documents */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Documents</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Pitch Deck', type: 'PDF - Stage 2', stage: 2 as 2 | 3 | 4 },
                        { name: 'Financial Projections', type: 'Excel - Stage 3 - NDA', stage: 3 as 2 | 3 | 4 },
                        { name: 'Cap Table', type: 'PDF - Stage 3 - NDA', stage: 3 as 2 | 3 | 4 },
                        { name: 'Term Sheet Draft', type: 'PDF - Stage 3 - NDA', stage: 3 as 2 | 3 | 4 },
                        { name: 'Full Investment Proposal', type: 'PDF - Stage 4 - Full Proposal', stage: 4 as 2 | 3 | 4 },
                        { name: 'Due Diligence Package', type: 'ZIP - Stage 4 - Full Proposal', stage: 4 as 2 | 3 | 4 },
                      ].map((doc, i) => (
                        <LockedDocument
                          key={i}
                          name={doc.name}
                          type={doc.type}
                          stageRequired={doc.stage}
                          currentStage={isOwner ? 4 : disclosureStage}
                          onUnlock={!isOwner ? handleUnlock : undefined}
                        />
                      ))}
                    </div>
                  </div>

                  {/* NDA Status (Stage 3 reached) */}
                  {(isOwner ? 4 : disclosureStage) >= 3 && (
                    <div className="pt-2">
                      <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">NDA Status</p>
                      <NDAStatusPanel
                        nda={NDA_RECORD}
                        currentUserAccepted={!isOwner}
                        onAccept={!isOwner ? () => setShowNDAModal(true) : undefined}
                      />
                    </div>
                  )}

                  {/* Stage 4 Full Proposal */}
                  <DisclosureGate
                    stageRequired={4}
                    currentStage={isOwner ? 4 : disclosureStage}
                    title="Full Investment Proposal"
                    hint="Available after NDA completion and founder confirmation."
                    onUnlock={!isOwner ? handleUnlock : undefined}
                  >
                    <div className="pt-2">
                      <div className="p-4 rounded-[10px]"
                        style={{ background: 'rgba(201,162,75,0.04)', border: '1px solid rgba(201,162,75,0.16)' }}>
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Stage 4 - Full Proposal</p>
                        <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Complete Deal Package Available</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug mb-3">
                          Full investment proposal, due diligence package, and detailed equity terms are now accessible.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm">View Full Proposal</Button>
                          <Button variant="secondary" size="sm">Download Package</Button>
                        </div>
                      </div>
                    </div>
                  </DisclosureGate>

                  {/* Founder confirmation prompt (owner view, Stage 3 NDA done) */}
                  {isOwner && showFounderConfirm && (
                    <FounderConfirmationPanel
                      partyName="Rahim Chowdhury"
                      onConfirm={() => { setDisclosureStage(4); setUnlockedBanner(4); setShowFounderConfirm(false); }}
                      onDecline={() => setShowFounderConfirm(false)}
                    />
                  )}
                </div>
              </div>

              {/* Milestones */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Milestones</p>
                  <div className="flex items-center gap-3">
                    {isOwner && (
                      <button onClick={() => setEditSection('Milestones')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                    )}
                    <button
                      onClick={() => navigate(`/app/founder/milestones?return=/app/founder/businesses/${id ?? 'nova-health'}`)}
                      className="text-[11.5px] text-[#C67A4E] hover:underline">
                      Full Tracker ?
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-[#1c2a3e]">
                  {MILESTONES.map(m => (
                    <div key={m.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-0.5 truncate">{m.name}</p>
                          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{m.target} - Due {m.due}</p>
                        </div>
                        <MilestoneStatusBadge status={m.status} />
                      </div>
                      {m.status === 'Active' && (
                        <div>
                          <div className="flex justify-between text-[10px] text-[color:var(--vv-text-tertiary)] mb-1">
                            <span>Progress</span><span>{m.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
                            <div className="h-full rounded-full bg-[#C67A4E] transition-all duration-700" style={{ width: `${m.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {MILESTONES.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-3">No milestones added yet.</p>
                      {isOwner && <Button variant="secondary" size="sm" icon={<IconPlus s={12} />}>Add Milestone</Button>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (
            <DisclosureGate
              stageRequired={2}
              currentStage={isOwner ? 3 : disclosureStage}
              title="Team Details"
              hint="Express interest to view founder and team member profiles."
              onUnlock={!isOwner ? handleUnlock : undefined}
              className="overflow-hidden"
            >
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Team - {TEAM.length} members</p>
                {isOwner && (
                  <button onClick={() => setEditSection('Team')} className="text-[11.5px] text-[#C67A4E] hover:underline">Manage</button>
                )}
              </div>
              <div className="divide-y divide-[#1c2a3e]">
                {TEAM.map(member => (
                  <button key={member.id}
                    onClick={() => navigate('/app/profile')}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--vv-raised)]/50 transition-colors text-left">
                    <Avatar initials={member.avatar} color={member.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-0.5">{member.name}</p>
                      <p className="text-[12px] text-[#C67A4E] mb-1">{member.role}</p>
                      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug line-clamp-1">{member.bio}</p>
                    </div>
                    <IconArrowRight s={14} className="text-[#35446A] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
            </DisclosureGate>
          )}

          {/* OPPORTUNITIES (founder-only) */}
          {activeTab === 'opportunities' && isOwner && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Open Opportunities</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Professional roles you are actively seeking</p>
              </div>
              <div className="divide-y divide-[#1c2a3e]">
                {OPPORTUNITIES.map((o, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{o.role}</p>
                        <Badge variant="neutral">{o.type}</Badge>
                      </div>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{o.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-[#1c2a3e]">
                <Button variant="secondary" size="sm" icon={<IconPlus s={12} />}>Add Opportunity</Button>
              </div>
            </div>
          )}
        </div>

        {/* -- Sidebar ------------------------------------------- */}
        <div className="space-y-4">

          {/* Quick stats */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)]">Quick Summary</p>
            <InfoRow label="Stage" value={<Badge variant="neutral">{BUSINESS.stage}</Badge>} />
            <InfoRow label="Industry" value={BUSINESS.industry} />
            <InfoRow label="Team Size" value={`${TEAM.length} members`} />
            <InfoRow label="Readiness" value={
              <span className="font-mono text-[13px] text-[#C67A4E]">{overallReadiness}/100</span>
            } />
            <InfoRow label="Seeking" value={
              <span className="font-mono text-[13px] text-[#C9A24B]">?{BUSINESS.fundingAmount.toLocaleString('en-IN')}</span>
            } />
            <InfoRow label="Revenue" value={BUSINESS.revenueStatus} />
          </div>

          {/* Readiness mini */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Readiness Score</p>
              <button onClick={() => setActiveTab('readiness')} className="text-[11px] text-[#C67A4E] hover:underline">View</button>
            </div>
            <div className="flex items-center gap-3">
              <ReadinessDonut score={overallReadiness} />
              <div>
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                  {overallReadiness >= 75 ? 'Investment Ready' : overallReadiness >= 55 ? 'Developing' : 'Early Stage'}
                </p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Lowest: Investor Readiness (50)</p>
              </div>
            </div>
          </div>

          {/* Staged disclosure */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4">
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-3">Information Access</p>
            <DisclosureProgress
              currentStage={isOwner ? 4 : disclosureStage}
              onUnlock={!isOwner ? handleUnlock : undefined}
            />
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-3">Manage</p>
              {[
                { label: 'Edit Basic Information', section: 'Basic Information' },
                { label: 'Edit Business Details', section: 'Business Details' },
                { label: 'Edit Required Skills', section: 'Required Skills' },
                { label: 'Edit Funding', section: 'Funding' },
                { label: 'Manage Team', section: 'Team' },
                { label: 'Manage Milestones', section: 'Milestones' },
              ].map(({ label, section }) => (
                <button key={section} onClick={() => setEditSection(section)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[12.5px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors text-left">
                  {label}
                  <IconArrowRight s={12} className="text-[#35446A]" />
                </button>
              ))}
              <div className="pt-2 border-t border-[color:var(--vv-border)]">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/app/founder/dashboard')}>
                  View Deal Rooms
                </Button>
              </div>
            </div>
          )}

          {/* Investor match score sidebar */}
          {viewAs === 'investor' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4"
              style={{ borderColor: 'rgba(198,122,78,0.20)' }}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Your Match</p>
                <AIBadge />
              </div>
              <button
                type="button"
                onClick={() => setMatchDrawer({ detail: INVESTOR_MATCH_DETAIL, cta: 'Express Interest' })}
                className="flex items-center gap-3 mb-3 w-full group hover:opacity-80 transition-opacity text-left">
                <MatchScoreRing score={INVESTOR_MATCH.score} />
                <div>
                  <p className="font-mono text-[22px] font-semibold leading-none mb-0.5" style={{ color: '#C67A4E' }}>
                    {INVESTOR_MATCH.score}%
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Profile alignment</p>
                  <p className="text-[10px] text-[#C67A4E] group-hover:underline">View full analysis ?</p>
                </div>
              </button>
              <div className="mb-4">
                <MatchFactors factors={INVESTOR_MATCH.factors} />
              </div>
              {showInterestSent ? (
                <Button variant="success" className="w-full" size="sm" icon={<IconCheck s={13} />}>Interest Sent</Button>
              ) : (
                <Button className="w-full" size="sm" onClick={() => setShowInterestSent(true)}>
                  Express Interest <IconArrowRight s={13} />
                </Button>
              )}
              <AIDisclaimer match />
            </div>
          )}

          {/* Professional match score sidebar */}
          {viewAs === 'professional' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4"
              style={{ borderColor: 'rgba(198,122,78,0.20)' }}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Your Match</p>
                <AIBadge />
              </div>
              <button
                type="button"
                onClick={() => setMatchDrawer({ detail: PROFESSIONAL_MATCH_DETAIL, cta: 'Apply / Connect' })}
                className="flex items-center gap-3 mb-3 w-full group hover:opacity-80 transition-opacity text-left">
                <MatchScoreRing score={PROFESSIONAL_MATCH.score} />
                <div>
                  <p className="font-mono text-[22px] font-semibold leading-none mb-0.5" style={{ color: '#C67A4E' }}>
                    {PROFESSIONAL_MATCH.score}%
                  </p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Profile alignment</p>
                  <p className="text-[10px] text-[#C67A4E] group-hover:underline">View full analysis ?</p>
                </div>
              </button>
              <MatchFactors factors={PROFESSIONAL_MATCH.factors} />
              <AIDisclaimer match />
            </div>
          )}

          {/* Professional CTA sidebar */}
          {viewAs === 'professional' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-1">Open Roles</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">{OPPORTUNITIES.length} collaboration opportunities available.</p>
              <div className="space-y-1.5 mb-4">
                {OPPORTUNITIES.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-[color:var(--vv-text-secondary)]">
                    <div className="w-1 h-1 rounded-full bg-[#C67A4E]" />{o.role}
                  </div>
                ))}
              </div>
              {showApplied ? (
                <Button variant="success" className="w-full" size="sm" icon={<IconCheck s={13} />}>Applied</Button>
              ) : (
                <Button className="w-full" size="sm" onClick={() => setShowApplied(true)}>
                  Apply / Connect <IconArrowRight s={13} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Edit drawer */}
      {editSection && <EditDrawer section={editSection} business={bizData} onSaved={setBizData} onClose={() => setEditSection(null)} />}

      {/* Match explanation drawer */}
      {matchDrawer && (
        <MatchExplanationDrawer
          data={matchDrawer.detail}
          cta={{ label: matchDrawer.cta }}
          onClose={() => setMatchDrawer(null)}
        />
      )}

      {/* NDA modal */}
      {showNDAModal && (
        <NDARequestModal
          onClose={() => setShowNDAModal(false)}
          onSubmit={() => {
            setShowNDAModal(false);
          }}
        />
      )}
    </div>
  );
}