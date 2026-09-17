import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Tabs, InfoRow, SectionHeader } from '../../components/ui/DataDisplay';
import { IconArrowRight, IconCheck, IconLock, IconPlus, IconShield, IconUsers, IconBriefcase, IconX, IconCamera } from '../../components/layout/Icons';
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
import { api, resolveMediaUrl } from '../../services/api';

// -- Currency helper ------------------------------------------------
function fmtBDT(n: number): string {
  return 'BDT ' + n.toLocaleString('en-IN');
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || 'BU').toUpperCase();
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

function EditDrawer({
  section,
  business,
  onSaved,
  onClose,
}: {
  section: string;
  business: any;
  onSaved: (value: any) => void;
  onClose: () => void;
}) {
  const fields = [
    ['name', 'Business Name'],
    ['description', 'Description'],
    ['industry', 'Industry'],
    ['business_stage', 'Business Stage'],
    ['risk_level', 'Risk Level'],
    ['expected_involvement', 'Expected Involvement'],
    ['location', 'Location'],
  ];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(([key]) => [key, business?.[key] ?? '']))
  );
  const [fundingAmount, setFundingAmount] = useState<string>(() =>
    business?.requirements?.funding_amount ? String(business.requirements.funding_amount) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.businesses.updateRecord(business.id, values);
      if (fundingAmount !== '') {
        const raw = fundingAmount.replace(/[৳,\s]/g, '');
        const amountNum = raw ? Number(raw) : null;
        try {
          await api.patch(`/api/me/businesses/${business.id}/requirements`, { funding_amount: amountNum });
        } catch {
          // Non-fatal if requirements sub-endpoint fails
        }
      }
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to save business.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Edit Business">
      <form onSubmit={save} className="w-full sm:max-w-md bg-[#0D1626] p-6 overflow-auto space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[color:var(--vv-border)]">
          <h2 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">Edit Business - {section}</h2>
          <button type="button" onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-white">
            <IconX s={16} />
          </button>
        </div>
        {fields.map(([key, label]) => (
          <label className="block text-[12px] text-[color:var(--vv-text-secondary)] font-medium space-y-1" key={key}>
            {label}
            {key === 'description' ? (
              <textarea
                value={values[key]}
                onChange={event => setValues(v => ({ ...v, [key]: event.target.value }))}
                rows={4}
                className="block w-full p-2.5 rounded bg-[#182338] border border-[color:var(--vv-border-strong)] text-[13px] text-white focus:outline-none focus:border-[#C67A4E]"
              />
            ) : (
              <input
                required={key === 'name'}
                value={values[key]}
                onChange={event => setValues(v => ({ ...v, [key]: event.target.value }))}
                className="block w-full p-2 rounded bg-[#182338] border border-[color:var(--vv-border-strong)] text-[13px] text-white focus:outline-none focus:border-[#C67A4E]"
              />
            )}
          </label>
        ))}
        <label className="block text-[12px] text-[color:var(--vv-text-secondary)] font-medium space-y-1">
          Funding Requirement (BDT)
          <input
            value={fundingAmount}
            onChange={event => setFundingAmount(event.target.value)}
            placeholder="e.g. 1500000"
            className="block w-full p-2 rounded bg-[#182338] border border-[color:var(--vv-border-strong)] text-[13px] text-white focus:outline-none focus:border-[#C67A4E]"
          />
        </label>
        {error && <p role="alert" className="text-red-400 text-[12px] bg-red-500/10 border border-red-500/30 p-2 rounded">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}

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
  const [bizStatus, setBizStatus] = useState<'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Rejected'>('Draft');
  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishedBanner, setPublishedBanner] = useState(false);
  const [submittedBanner, setSubmittedBanner] = useState(false);
  const [disclosureStage, setDisclosureStage] = useState(2);
  const [unlockedBanner, setUnlockedBanner] = useState<number | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Auto-unlock Stage 3 when returning from completed NDA flow
  useEffect(() => {
    if (searchParams.get('stage') === '3') {
      setDisclosureStage(3);
      setUnlockedBanner(3);
    }
  }, [searchParams]);

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
          const b = businessRecord.business ? {
            ...businessRecord.business,
            requirements: businessRecord.requirements || businessRecord.business.requirements,
            readiness: businessRecord.readiness,
            documents: businessRecord.documents,
            disclosure: businessRecord.disclosure,
            disclosure_stage: businessRecord.disclosure?.stage,
          } : businessRecord;

          setBizData(b);
          const raw = b.status;
          if (raw) {
            if (raw === 'published' || raw === 'submitted') {
              setBizStatus('Published');
            } else if (raw === 'approved') {
              setBizStatus('Approved');
            } else if (raw === 'pending_approval' || raw === 'under_review') {
              setBizStatus('Pending Approval');
            } else if (raw === 'rejected') {
              setBizStatus('Rejected');
            } else {
              setBizStatus('Draft');
            }
          }
          const stage = businessRecord.disclosure?.stage ?? businessRecord.disclosure_stage ?? b.disclosure_stage;
          if (stage !== undefined) {
            setDisclosureStage(stage);
          }
          if (businessRecord.readiness) {
            setReadinessData(businessRecord.readiness);
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
        await api.businesses.publish(bizData.id);
      }
      setBizStatus('Published');
      setBizData((prev: any) => ({ ...prev, status: 'published' }));
      setPublishedBanner(true);
      setTimeout(() => setPublishedBanner(false), 5000);
    } catch (e: any) {
      alert(e?.message || 'Failed to publish business.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    try {
      if (bizData?.id) {
        await api.businesses.submit(bizData.id);
      }
      setBizStatus('Pending Approval');
      setBizData((prev: any) => ({ ...prev, status: 'pending_approval' }));
      setSubmittedBanner(true);
      setTimeout(() => setSubmittedBanner(false), 5000);
    } catch (e: any) {
      alert(e?.message || 'Failed to submit business for approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bizData?.id) return;
    setUploadingLogo(true);
    try {
      const res = await api.businesses.uploadLogo(bizData.id, file);
      setBizData((prev: any) => ({ ...prev, logo_url: res.logo_url }));
      setLogoError(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload business logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bizData?.id) return;
    setUploadingCover(true);
    try {
      const res = await api.businesses.uploadCoverPhoto(bizData.id, file);
      setBizData((prev: any) => ({ ...prev, cover_photo_url: res.cover_photo_url }));
    } catch (err: any) {
      alert(err?.message || 'Failed to upload cover photo.');
    } finally {
      setUploadingCover(false);
    }
  };

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

  // Derive dynamic business values from persisted backend data
  const b = bizData?.business ?? bizData;
  const req = bizData?.requirements ?? b?.requirements;

  const currentBusiness = {
    id: b?.id ? String(b.id) : (id || ''),
    name: b?.name || 'Untitled Business',
    tagline: b?.description || 'No description provided.',
    industry: b?.industry || 'General',
    stage: b?.business_stage || 'Not specified',
    location: b?.location || 'Not specified',
    riskLevel: b?.risk_level || null,
    expectedInvolvement: b?.expected_involvement || null,
    logoUrl: b?.logo_url || null,
    coverPhotoUrl: b?.cover_photo_url || null,
    verificationTier: (b?.founder_verification_tier ?? b?.user?.verification_tier ?? b?.verification_tier ?? 0) as 0 | 1 | 2,
    disclosureStage: bizData?.disclosure?.stage ?? bizData?.disclosure_stage ?? disclosureStage,
    status: bizStatus,
    updatedAt: b?.updated_at ? new Date(b.updated_at).toLocaleDateString() : 'Recently',
    description: b?.description || '',
    fundingAmount: req?.funding_amount ? Number(req.funding_amount) : 0,
    fundingStage: b?.business_stage || 'Not specified',
    requiredSkills: req?.skills || [],
    acceptedInvestmentTypes: req?.accepted_investment_types || [],
    microProposedTerms: req?.micro_proposed_terms || null,
    largeStandardProposedTerms: req?.large_standard_proposed_terms || null,
    requiredExperienceLevel: req?.required_experience_level || null,
    requiredAvailability: req?.required_availability || null,
    compensationPreferences: req?.compensation_preferences || [],
  };

  // Derive readiness factors dynamically
  const readinessFactors = readinessData?.factor_results
    ? Object.entries(readinessData.factor_results).map(([key, val]: [string, any]) => ({
        name: val.label || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        score: Math.round(val.score || 0),
        weight: val.weight || 12.5,
        desc: val.description || (val.score >= 70 ? 'Strong alignment.' : 'Needs refinement.'),
      }))
    : [];

  const overallReadiness = readinessData?.overall_score !== undefined
    ? Math.round(readinessData.overall_score)
    : (readinessFactors.length > 0
        ? Math.round(readinessFactors.reduce((acc: number, f: any) => acc + f.score * (f.weight / 100), 0))
        : null);

  // Derive AI analysis dynamically
  const aiAnalysis = {
    overallAssessment: analysisData?.overall_assessment || analysisData?.summary || null,
    strengths: analysisData?.strengths
      ? analysisData.strengths.map((s: any) => typeof s === 'string' ? { title: s, description: s } : s)
      : [],
    improvements: (analysisData?.improvements || []) as ImprovementItemData[],
    insights: (analysisData?.insights || []) as string[],
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

  const resolvedCover = resolveMediaUrl(currentBusiness.coverPhotoUrl);
  const resolvedLogo = resolveMediaUrl(currentBusiness.logoUrl);

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

      {/* Submitted confirmation banner */}
      {submittedBanner && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <IconCheck s={14} />
          <span className="text-[12.5px] text-[#F59E0B] font-medium">Business submitted for Admin review. You will be notified once approved.</span>
        </div>
      )}

      {/* Status banners (owner view) */}
      {isOwner && bizStatus === 'Approved' && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center justify-between gap-4"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
            <span className="text-[12.5px] text-[#10B981] font-medium">
              <span className="font-semibold">Approved by Admin</span> &mdash; Ready to be published to discovery.
            </span>
          </div>
          <Button size="sm" loading={publishing} onClick={handlePublish}>
            {publishing ? 'Publishing...' : 'Publish Now'}
          </Button>
        </div>
      )}

      {isOwner && bizStatus === 'Pending Approval' && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          <span className="text-[12px] text-[#F59E0B]">
            <span className="font-semibold">Under Admin Review</span> &mdash; This business is currently pending Admin approval. Publishing is restricted until an Admin approves it.
          </span>
        </div>
      )}

      {isOwner && bizStatus === 'Rejected' && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center justify-between gap-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[12px] text-[#EF4444]">
              <span className="font-semibold">Rejected by Admin:</span> {bizData?.rejection_reason || 'Please revise your details and resubmit for approval.'}
            </span>
          </div>
          <Button size="sm" variant="secondary" loading={submitting} onClick={handleSubmitForApproval}>
            {submitting ? 'Submitting...' : 'Resubmit for Approval'}
          </Button>
        </div>
      )}

      {isOwner && bizStatus === 'Draft' && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center justify-between gap-4"
          style={{ background: 'rgba(94,109,143,0.08)', border: '1px solid rgba(94,109,143,0.20)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="13" height="13" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <span className="text-[12px] text-[color:var(--vv-text-secondary)]">
              <span className="font-semibold text-white">Draft</span> &mdash; Complete key requirements and submit for Admin approval.
            </span>
          </div>
          <Button size="sm" loading={submitting} onClick={handleSubmitForApproval}>
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      )}

      <div className="mb-4 text-[10.5px] text-[color:var(--vv-text-tertiary)]">Viewing as <span className="font-medium text-[#C67A4E] capitalize">{viewAs}</span> workspace</div>

      {/* -- Business Header --------------------------------------- */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] overflow-hidden mb-5">
        {/* Cover banner */}
        <div className="h-32 sm:h-44 relative overflow-hidden bg-gradient-to-r from-[#182338] via-[#121A2B] to-[#182338]">
          {resolvedCover ? (
            <img
              src={resolvedCover}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(198,122,78,0.14) 0%, rgba(14,20,28,0.9) 55%, rgba(198,122,78,0.10) 100%)' }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(198,122,78,0.12),transparent_60%)]" />
            </div>
          )}

          {isOwner && (
            <label className="absolute top-3 right-3 px-2.5 py-1.5 rounded-md bg-black/60 hover:bg-black/80 border border-white/15 text-[11px] text-white backdrop-blur-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
              <input
                type="file"
                data-testid="business-cover-input"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
              />
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {uploadingCover ? 'Uploading...' : 'Change Cover'}
            </label>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5">
          {/* Top row: Logo overlapping banner + Action buttons aligned on right */}
          <div className="flex items-end justify-between gap-4 -mt-10 sm:-mt-12">
            {/* Logo */}
            <div className="relative group flex-shrink-0 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#121A2B] bg-[#182338] shadow-lg flex items-center justify-center overflow-hidden ring-1 ring-[color:var(--vv-border)]">
                {resolvedLogo && !logoError ? (
                  <img
                    src={resolvedLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="font-display font-bold text-[24px] sm:text-[28px] text-[#C67A4E]">
                    {getInitials(currentBusiness.name)}
                  </span>
                )}
              </div>
              {isOwner && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-[2px]">
                  <input
                    type="file"
                    data-testid="business-logo-input"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <span className="text-[10px] font-medium text-center px-1">
                    {uploadingLogo ? '...' : 'Upload Logo'}
                  </span>
                </label>
              )}
            </div>

            {/* Primary actions */}
            <div className="flex flex-wrap items-center gap-2 pb-1 justify-end">
              {isOwner && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditSection('Basic Information')}>
                    Manage Business
                  </Button>
                  {bizStatus === 'Approved' && (
                    <Button size="sm" loading={publishing} onClick={handlePublish}>
                      {publishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  )}
                  {bizStatus === 'Draft' && (
                    <Button size="sm" loading={submitting} onClick={handleSubmitForApproval}>
                      {submitting ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                  )}
                  {bizStatus === 'Rejected' && (
                    <Button size="sm" variant="secondary" loading={submitting} onClick={handleSubmitForApproval}>
                      {submitting ? 'Submitting...' : 'Resubmit'}
                    </Button>
                  )}
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

          {/* Business Identity & Details - Positioned cleanly in natural flow below the banner */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-[color:var(--vv-text)] leading-tight tracking-tight break-words">
                {currentBusiness.name}
              </h1>
              <VerificationBadge tier={currentBusiness.verificationTier} />
              {isOwner && (
                bizStatus === 'Published' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.22)] text-[#22C55E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />Published
                  </span>
                ) : bizStatus === 'Approved' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-[#10B981]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />Approved
                  </span>
                ) : bizStatus === 'Pending Approval' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)] text-[#F59E0B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Pending Admin Approval
                  </span>
                ) : bizStatus === 'Rejected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.25)] text-[#EF4444]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(94,109,143,0.10)] border-[rgba(94,109,143,0.22)] text-[color:var(--vv-text-tertiary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D8F]" />Draft
                  </span>
                )
              )}
            </div>
            {currentBusiness.tagline && (
              <p className="text-[13.5px] sm:text-[14px] text-[color:var(--vv-text-secondary)] leading-relaxed line-clamp-2">
                {currentBusiness.tagline}
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3.5 text-[12.5px] text-[color:var(--vv-text-tertiary)]">
            <span className="text-[#C67A4E] font-medium">{currentBusiness.industry}</span>
            <span className="w-1 h-1 rounded-full bg-[#35446A]" />
            <Badge variant="neutral">{currentBusiness.stage}</Badge>
            <span className="w-1 h-1 rounded-full bg-[#35446A]" />
            <span>{currentBusiness.location}</span>
            {currentBusiness.expectedInvolvement && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#35446A]" />
                <span>{currentBusiness.expectedInvolvement}</span>
              </>
            )}
            {currentBusiness.riskLevel && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#35446A]" />
                <span>Risk: {currentBusiness.riskLevel}</span>
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
                    Unlock Stage {disclosureStage + 1} &rarr;
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
              {/* Business Description */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5">
                <SectionHeader title="Business Description" action={isOwner ? (
                  <button onClick={() => setEditSection('Basic Information')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                ) : undefined} />
                {currentBusiness.description ? (
                  <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mt-3 whitespace-pre-wrap">{currentBusiness.description}</p>
                ) : (
                  <p className="text-[13px] text-[color:var(--vv-text-tertiary)] italic mt-3">No description provided yet.</p>
                )}
              </div>

              {/* Requirements & Core Structure */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5">
                <SectionHeader title="Key Details" action={isOwner ? (
                  <button onClick={() => setEditSection('Key Details')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                ) : undefined} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <InfoRow label="Industry" value={currentBusiness.industry} />
                  <InfoRow label="Stage" value={currentBusiness.stage} />
                  <InfoRow label="Location" value={currentBusiness.location} />
                  <InfoRow label="Expected Involvement" value={currentBusiness.expectedInvolvement || 'Not specified'} />
                  {currentBusiness.riskLevel && <InfoRow label="Risk Profile" value={currentBusiness.riskLevel} />}
                </div>
              </div>

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
              {aiAnalysis.overallAssessment ? (
                <>
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[color:var(--vv-border)]"
                      style={{ background: 'rgba(198,122,78,0.03)' }}>
                      <AIBadge label="AI Analysis" />
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Generated by Vault AI &bull; Updated {currentBusiness.updatedAt}</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-4">{aiAnalysis.overallAssessment}</p>
                    </div>
                  </div>

                  {aiAnalysis.strengths.length > 0 && (
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
                  )}

                  {aiAnalysis.improvements.length > 0 && (
                    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Improvement Areas</p>
                      </div>
                      <div className="px-5 py-1">
                        {aiAnalysis.improvements.map((item: any, i: number) => (
                          <ImprovementItem key={i} {...item} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-8 text-center">
                  <AIBadge label="AI Analysis" />
                  <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mt-3 mb-1.5">No AI Analysis Generated Yet</h3>
                  <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mb-4">
                    AI analysis is calculated based on submitted readiness inputs and business disclosures.
                  </p>
                  {isOwner && (
                    <Button size="sm" onClick={() => navigate(`/app/founder/readiness?businessId=${bizData.id}`)}>
                      Run Readiness Assessment
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* READINESS */}
          {activeTab === 'readiness' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">Readiness Score</p>
                  <p className="text-[13px] text-[color:var(--vv-text)] font-semibold">
                    {readinessFactors.length > 0 ? `${readinessFactors.length}-factor business readiness analysis` : 'Readiness Assessment'}
                  </p>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/app/founder/readiness?businessId=${bizData.id}`)}>
                    Full Report <IconArrowRight s={12} />
                  </Button>
                )}
              </div>
              <div className="p-5">
                {overallReadiness !== null ? (
                  <>
                    <div className="flex items-center gap-6 mb-6">
                      <ReadinessDonut score={overallReadiness} />
                      <div>
                        <p className="font-display text-[22px] font-semibold text-[color:var(--vv-text)] mb-0.5">
                          {overallReadiness >= 75 ? 'Investment Ready' : overallReadiness >= 55 ? 'Developing' : 'Early Stage'}
                        </p>
                        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-3">Score from {readinessFactors.length} weighted factors</p>
                        {readinessFactors.length > 0 && (
                          <button onClick={() => setExpandedReadiness(v => !v)}
                            className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1">
                            {expandedReadiness ? 'Hide breakdown' : 'View breakdown'} <IconArrowRight s={11} />
                          </button>
                        )}
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
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-3">No readiness assessment has been recorded for this business yet.</p>
                    {isOwner && (
                      <Button size="sm" onClick={() => navigate(`/app/founder/readiness?businessId=${bizData.id}`)}>
                        Complete Readiness Assessment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FUNDING & MILESTONES */}
          {activeTab === 'funding' && (
            <div className="space-y-5">
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Funding Requirements</p>
                  {isOwner && (
                    <button onClick={() => setEditSection('Funding')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4">
                      <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Target Amount</p>
                      <p className="font-mono text-[20px] font-semibold text-[#C67A4E] tabular-nums">
                        {currentBusiness.fundingAmount > 0 ? fmtBDT(currentBusiness.fundingAmount) : 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4">
                      <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Stage</p>
                      <Badge variant="gold">{currentBusiness.fundingStage}</Badge>
                    </div>
                  </div>

                  {currentBusiness.acceptedInvestmentTypes.length > 0 && (
                    <InfoRow label="Accepted Investment Types" value={currentBusiness.acceptedInvestmentTypes.join(', ')} />
                  )}
                  {currentBusiness.microProposedTerms && (
                    <InfoRow label="Proposed Micro Terms" value={currentBusiness.microProposedTerms} />
                  )}
                  {currentBusiness.largeStandardProposedTerms && (
                    <InfoRow label="Proposed Standard Terms" value={currentBusiness.largeStandardProposedTerms} />
                  )}
                </div>
              </div>

              {/* Milestones info */}
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Deal & Milestone Execution</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-4">
                  Formal funding milestones are negotiated and established during Deal Room agreements with connecting investors.
                </p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/founder/dashboard')}>
                  View Active Deals
                </Button>
              </div>
            </div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-3 text-[#C67A4E]">
                <IconUsers s={20} />
              </div>
              <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">Team Structure</h3>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mb-4">
                {currentBusiness.expectedInvolvement || 'Team involvement details recorded in profile settings.'}
              </p>
              {isOwner && (
                <Button variant="secondary" size="sm" onClick={() => setEditSection('Basic Information')}>
                  Update Team Info
                </Button>
              )}
            </div>
          )}

          {/* OPPORTUNITIES (founder-only) */}
          {activeTab === 'opportunities' && isOwner && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Open Roles & Specialist Needs</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Skills and advisory expertise requested for this venture</p>
              </div>
              <div className="p-5">
                {currentBusiness.requiredSkills.length > 0 ? (
                  <div className="divide-y divide-[#1c2a3e]">
                    {currentBusiness.requiredSkills.map(skill => (
                      <div key={skill} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{skill}</p>
                          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Required professional expertise</p>
                        </div>
                        <Badge variant="accent">Open Requirement</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[color:var(--vv-text-tertiary)] italic">No specific skill requirements listed yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* -- Sidebar ------------------------------------------- */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)]">Summary</p>
            <InfoRow label="Stage" value={<Badge variant="neutral">{currentBusiness.stage}</Badge>} />
            <InfoRow label="Industry" value={currentBusiness.industry} />
            <InfoRow label="Location" value={currentBusiness.location} />
            {overallReadiness !== null && (
              <InfoRow label="Readiness" value={
                <span className="font-mono text-[13px] text-[#C67A4E]">{overallReadiness}/100</span>
              } />
            )}
            {currentBusiness.fundingAmount > 0 && (
              <InfoRow label="Seeking" value={
                <span className="font-mono text-[13px] text-[#C9A24B]">{fmtBDT(currentBusiness.fundingAmount)}</span>
              } />
            )}
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-3">Manage</p>
              {[
                { label: 'Edit Basic Information', section: 'Basic Information' },
                { label: 'Edit Key Details', section: 'Key Details' },
                { label: 'Edit Required Skills', section: 'Required Skills' },
                { label: 'Edit Funding', section: 'Funding' },
              ].map(({ label, section }) => (
                <button key={section} onClick={() => setEditSection(section)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[12.5px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors text-left">
                  {label}
                  <IconArrowRight s={12} className="text-[#35446A]" />
                </button>
              ))}
              <div className="pt-2 border-t border-[color:var(--vv-border)]">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/app/founder/dashboard')}>
                  Dashboard
                </Button>
              </div>
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