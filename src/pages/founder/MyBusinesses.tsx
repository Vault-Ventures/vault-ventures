import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconPlus, IconArrowRight, IconCheck, IconX } from '../../components/layout/Icons';
import { api, ApiError, resolveMediaUrl, BusinessRecord } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// --- BDT ---------------------------------------------------------------------

function fmtBDT(n: number): string {
  return 'BDT ' + n.toLocaleString('en-IN');
}

// --- Types --------------------------------------------------------------------

interface BackendBusiness extends BusinessRecord {}

interface Business {
  id: string;
  name: string;
  initials: string;
  logoUrl: string | null;
  industry: string;
  stage: string;
  funding: number;
  fundingStage: string;
  verificationTier: 0 | 1 | 2;
  readiness: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Rejected';
  rawStatus: string;
  rejectionReason?: string | null;
  updatedAt: string;
  requiredSkills: string[];
  completionPct: number;
  missingFields: string[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || 'BU').toUpperCase();
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return 'Recently';
  }
}

function mapBackendToUI(b: BackendBusiness, tier: 0 | 1 | 2): Business {
  const missing: string[] = [];
  if (!b.description) missing.push('Description');
  if (!b.industry) missing.push('Industry');
  if (!b.business_stage) missing.push('Stage');
  if (!b.location) missing.push('Location');
  if (!b.requirements?.funding_amount || Number(b.requirements.funding_amount) <= 0) missing.push('Funding requirement');
  if (!b.requirements?.skills || b.requirements.skills.length === 0) missing.push('Required skills');

  const filledCount = 6 - missing.length;
  const completionPct = Math.round((filledCount / 6) * 100);

  let uiStatus: Business['status'] = 'Draft';
  if (b.status === 'published' || b.status === 'submitted') {
    uiStatus = 'Published';
  } else if (b.status === 'approved') {
    uiStatus = 'Approved';
  } else if (b.status === 'pending_approval' || b.status === 'under_review') {
    uiStatus = 'Pending Approval';
  } else if (b.status === 'rejected') {
    uiStatus = 'Rejected';
  } else {
    uiStatus = 'Draft';
  }

  const isLive = uiStatus === 'Published' || uiStatus === 'Approved';
  const readiness = isLive ? Math.max(65, completionPct) : Math.round(completionPct * 0.8);

  return {
    id: String(b.id),
    name: b.name,
    initials: getInitials(b.name),
    logoUrl: b.logo_url || null,
    industry: b.industry || 'General',
    stage: b.business_stage || 'Idea',
    funding: b.requirements?.funding_amount ? Number(b.requirements.funding_amount) : 0,
    fundingStage: b.business_stage || 'Not specified',
    verificationTier: tier,
    readiness,
    status: uiStatus,
    rawStatus: b.status,
    rejectionReason: b.rejection_reason || null,
    updatedAt: formatRelativeTime(b.updated_at || b.created_at || new Date().toISOString()),
    requiredSkills: b.requirements?.skills || [],
    completionPct,
    missingFields: missing,
  };
}

// --- Helpers -----------------------------------------------------------------

function ReadinessBar({ value }: { value: number }) {
  const color = value >= 75 ? '#C67A4E' : value >= 55 ? '#F59E0B' : '#F04438';
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums w-5 shrink-0 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Business['status'] }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.22)] text-[#22C55E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        Published
      </span>
    );
  }
  if (status === 'Approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-[#10B981]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        Approved
      </span>
    );
  }
  if (status === 'Pending Approval') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)] text-[#F59E0B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        Pending Admin Approval
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.25)] text-[#EF4444]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(94,109,143,0.10)] border-[rgba(94,109,143,0.22)] text-[color:var(--vv-text-tertiary)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D8F]" />
      Draft
    </span>
  );
}

function BusinessLogo({ initials, logoUrl }: { initials: string; logoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveMediaUrl(logoUrl);

  if (resolved && !imgError) {
    return (
      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[color:var(--vv-border)] bg-[#182338]">
        <img
          src={resolved}
          alt="Logo"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center font-display font-bold text-[11px] text-[#C67A4E] shrink-0">
      {initials}
    </div>
  );
}

// --- Draft requirements card (table expander) --------------------------------

function DraftRequirements({ business }: { business: Business }) {
  if (business.status === 'Published' || business.status === 'Approved' || business.missingFields.length === 0) return null;
  return (
    <div className="px-5 py-3.5 border-t border-[#1c2a3e]"
      style={{ background: 'rgba(245,158,11,0.04)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-medium text-[#F59E0B] mb-1.5 flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            Required before submitting for approval
          </p>
          <div className="flex flex-wrap gap-1.5">
            {business.missingFields.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] border border-[#F59E0B]/20 bg-[#F59E0B]/5 text-[#F59E0B]">{f}</span>
            ))}
          </div>
        </div>
        <Link to={`/app/founder/businesses/${business.id}`}>
          <Button variant="secondary" size="sm" className="shrink-0">Complete</Button>
        </Link>
      </div>
    </div>
  );
}

// --- Row actions menu ---------------------------------------------------------

function RowActions({
  business,
  onPublish,
  onSubmitForApproval,
  actionInProgress,
}: {
  business: Business;
  onPublish: (id: string) => void;
  onSubmitForApproval: (id: string) => void;
  actionInProgress: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Link to={`/app/founder/businesses/${business.id}`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>

      {business.status === 'Approved' && (
        <Button size="sm" loading={actionInProgress} onClick={() => onPublish(business.id)}>
          Publish
        </Button>
      )}

      {business.status === 'Draft' && business.missingFields.length === 0 && (
        <Button size="sm" loading={actionInProgress} onClick={() => onSubmitForApproval(business.id)}>
          Submit for Approval
        </Button>
      )}

      {business.status === 'Draft' && business.missingFields.length > 0 && (
        <Link to={`/app/founder/businesses/${business.id}`}>
          <Button variant="secondary" size="sm">Edit</Button>
        </Link>
      )}

      {business.status === 'Pending Approval' && (
        <span className="text-[11px] text-[#F59E0B] font-medium px-2 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          Under Review
        </span>
      )}

      {business.status === 'Rejected' && (
        <Button size="sm" variant="secondary" loading={actionInProgress} onClick={() => onSubmitForApproval(business.id)}>
          Resubmit
        </Button>
      )}

      {business.status === 'Published' && (
        <Link to={`/app/founder/businesses/${business.id}`}>
          <Button variant="ghost" size="sm">Manage</Button>
        </Link>
      )}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function MyBusinesses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);

  const tier = user?.verification_tier ?? 0;

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: BackendBusiness[] }>('/api/me/businesses');
      const mapped = (res.items || []).map(b => mapBackendToUI(b, tier));
      setBusinesses(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load businesses.');
      }
    } finally {
      setLoading(false);
    }
  }, [tier]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const publishedCount = businesses.filter(b => b.status === 'Published').length;
  const pendingCount = businesses.filter(b => b.status === 'Pending Approval').length;
  const approvedCount = businesses.filter(b => b.status === 'Approved').length;
  const draftsCount = businesses.filter(b => b.status === 'Draft' || b.status === 'Rejected').length;

  async function handlePublish(id: string) {
    try {
      setActiveActionId(id);
      await api.businesses.publish(id);
      setActiveActionId(null);
      setJustPublished(id);
      await loadBusinesses();
      setTimeout(() => setJustPublished(null), 4000);
    } catch (err: any) {
      setActiveActionId(null);
      alert(err.message || 'Failed to publish business.');
    }
  }

  async function handleSubmitForApproval(id: string) {
    try {
      setActiveActionId(id);
      await api.businesses.submit(id);
      setActiveActionId(null);
      setJustSubmitted(id);
      await loadBusinesses();
      setTimeout(() => setJustSubmitted(null), 4000);
    } catch (err: any) {
      setActiveActionId(null);
      alert(err.message || 'Failed to submit business for approval.');
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* --- Page Header ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--vv-text)]">
              My Businesses
            </h1>
            <Badge variant="neutral">Founder Workspace</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            {publishedCount} published · {pendingCount > 0 ? `${pendingCount} pending review · ` : ''}{approvedCount > 0 ? `${approvedCount} approved · ` : ''}{draftsCount} {draftsCount === 1 ? 'draft' : 'drafts'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => navigate('/app/founder/businesses/new')}
            icon={<IconPlus s={14} />}
          >
            Create Business
          </Button>
        </div>
      </div>

      {/* Published banner */}
      {justPublished && (
        <div className="px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
          <span className="text-[12.5px] text-[#22C55E] font-medium">
            {businesses.find(b => b.id === justPublished)?.name} is now published and eligible for discovery.
          </span>
        </div>
      )}

      {/* Submitted banner */}
      {justSubmitted && (
        <div className="px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <IconCheck s={14} />
          <span className="text-[12.5px] text-[#F59E0B] font-medium">
            {businesses.find(b => b.id === justSubmitted)?.name} submitted for Admin review.
          </span>
        </div>
      )}

      {/* --- Error state ---------------------------------------------------- */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-[#EF4444] text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={loadBusinesses}>Retry</Button>
        </div>
      )}

      {/* --- Loading skeleton ----------------------------------------------- */}
      {loading && (
        <div className="space-y-3" role="status">
          {[1, 2].map(n => (
            <div key={n} className="h-24 rounded-xl bg-[#121A2B]/60 border border-[color:var(--vv-border)] animate-pulse" />
          ))}
        </div>
      )}

      {/* --- Businesses Table / Cards --------------------------------------- */}
      {!loading && !error && businesses.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-[color:var(--vv-border)] bg-[#121A2B]">
          <h3 className="font-display text-lg font-semibold text-white mb-2">No businesses registered</h3>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            Get started by creating your business profile to begin the verification, matching, and discovery process.
          </p>
          <Button onClick={() => navigate('/app/founder/businesses/new')} icon={<IconPlus s={14} />}>
            Create Business
          </Button>
        </div>
      )}

      {!loading && !error && businesses.length > 0 && (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)] bg-[#151F33] text-[11px] uppercase tracking-wider text-[color:var(--vv-text-tertiary)] font-semibold">
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Industry & Stage</th>
                  <th className="py-3 px-4">Funding Requirement</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--vv-border)]">
                {businesses.map(b => (
                  <React.Fragment key={b.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <BusinessLogo initials={b.initials} logoUrl={b.logoUrl} />
                          <div>
                            <Link to={`/app/founder/businesses/${b.id}`} className="font-semibold text-white hover:text-[#C67A4E] transition-colors">
                              {b.name}
                            </Link>
                            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{b.updatedAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white">{b.industry}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.stage}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#C67A4E] font-medium">
                        {b.funding > 0 ? fmtBDT(b.funding) : 'Not specified'}
                      </td>
                      <td className="py-3.5 px-4">
                        <ReadinessBar value={b.readiness} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <RowActions
                          business={b}
                          onPublish={handlePublish}
                          onSubmitForApproval={handleSubmitForApproval}
                          actionInProgress={activeActionId === b.id}
                        />
                      </td>
                    </tr>
                    {b.status === 'Draft' && b.missingFields.length > 0 && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DraftRequirements business={b} />
                        </td>
                      </tr>
                    )}
                    {b.status === 'Rejected' && b.rejectionReason && (
                      <tr>
                        <td colSpan={6} className="px-5 py-2.5 bg-red-500/10 border-t border-red-500/20 text-[#EF4444] text-[11.5px]">
                          <span className="font-semibold">Rejection reason:</span> {b.rejectionReason}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards view */}
          <div className="md:hidden divide-y divide-[color:var(--vv-border)]">
            {businesses.map(b => (
              <div key={b.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BusinessLogo initials={b.initials} logoUrl={b.logoUrl} />
                    <div>
                      <Link to={`/app/founder/businesses/${b.id}`} className="font-semibold text-white text-[14px]">
                        {b.name}
                      </Link>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.industry} · {b.stage}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
                  <div>
                    <span className="text-[color:var(--vv-text-tertiary)] block text-[10.5px]">Funding Target</span>
                    <span className="font-mono text-[#C67A4E] font-medium">{b.funding > 0 ? fmtBDT(b.funding) : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[color:var(--vv-text-tertiary)] block text-[10.5px]">Readiness</span>
                    <ReadinessBar value={b.readiness} />
                  </div>
                </div>

                {b.status === 'Rejected' && b.rejectionReason && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[#EF4444] text-[11.5px]">
                    <span className="font-semibold">Rejection reason:</span> {b.rejectionReason}
                  </div>
                )}

                <div className="pt-2 border-t border-[color:var(--vv-border)] flex items-center justify-between">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.updatedAt}</span>
                  <RowActions
                    business={b}
                    onPublish={handlePublish}
                    onSubmitForApproval={handleSubmitForApproval}
                    actionInProgress={activeActionId === b.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}