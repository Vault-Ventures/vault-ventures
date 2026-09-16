import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconPlus, IconArrowRight } from '../../components/layout/Icons';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// --- BDT ---------------------------------------------------------------------

function fmtBDT(n: number): string {
  return 'BDT ' + n.toLocaleString('en-IN');
}

// --- Types --------------------------------------------------------------------

interface BackendBusiness {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  business_stage: string | null;
  risk_level: string | null;
  expected_involvement: string | null;
  location: string | null;
  status: 'draft' | 'under_review' | 'published' | 'suspended' | 'archived';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  requirements?: {
    funding_amount: number | null;
    skills: string[];
    accepted_investment_types?: string[];
  } | null;
}

interface Business {
  id: string;
  name: string;
  initials: string;
  industry: string;
  stage: string;
  funding: number;
  fundingStage: string;
  verificationTier: 0 | 1 | 2;
  readiness: number;
  status: 'Draft' | 'Published';
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
  const isPub = b.status === 'published' || b.status === 'under_review';
  const readiness = isPub ? Math.max(65, completionPct) : Math.round(completionPct * 0.8);

  return {
    id: String(b.id),
    name: b.name,
    initials: getInitials(b.name),
    industry: b.industry || 'General',
    stage: b.business_stage || 'Idea',
    funding: b.requirements?.funding_amount ? Number(b.requirements.funding_amount) : 0,
    fundingStage: b.business_stage || 'Not specified',
    verificationTier: tier,
    readiness,
    status: isPub ? 'Published' : 'Draft',
    updatedAt: formatRelativeTime(b.updated_at || b.created_at),
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

function StatusBadge({ status }: { status: 'Draft' | 'Published' }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.22)] text-[#22C55E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        Published
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

function BusinessLogo({ initials }: { initials: string }) {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11.5px] font-bold text-[#C67A4E]"
      style={{ background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.22)' }}>
      {initials}
    </div>
  );
}

// --- Draft requirements card --------------------------------------------------

function DraftRequirements({ business, onPublish }: { business: Business; onPublish: () => void }) {
  if (business.status === 'Published' || business.missingFields.length === 0) return null;
  return (
    <div className="px-5 py-3.5 border-t border-[#1c2a3e]"
      style={{ background: 'rgba(245,158,11,0.04)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-medium text-[#F59E0B] mb-1.5 flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            Required before publishing
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

function RowActions({ business, onPublish }: {
  business: Business;
  onPublish: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Link to={`/app/founder/businesses/${business.id}`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>
      {business.status === 'Draft' && business.missingFields.length === 0 && (
        <Button size="sm" onClick={() => onPublish(business.id)}>Publish</Button>
      )}
      {business.status === 'Draft' && business.missingFields.length > 0 && (
        <Link to={`/app/founder/businesses/${business.id}`}>
          <Button variant="secondary" size="sm">Edit</Button>
        </Link>
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
  const [publishing, setPublishing] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState<string | null>(null);

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

  const published = businesses.filter(b => b.status === 'Published').length;
  const drafts = businesses.filter(b => b.status === 'Draft').length;

  async function handlePublish(id: string) {
    try {
      setPublishing(id);
      await api.post(`/api/me/businesses/${id}/submit`);
      setPublishing(null);
      setJustPublished(id);
      await loadBusinesses();
      setTimeout(() => setJustPublished(null), 4000);
    } catch (err) {
      setPublishing(null);
      if (err instanceof ApiError) {
        alert(err.message || 'Failed to publish business.');
      } else {
        alert('An unexpected error occurred while publishing.');
      }
    }
  }

  return (
    <div className="p-5 max-w-[1100px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={() => navigate('/app/founder/dashboard')}
              className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors flex items-center gap-1">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Dashboard
            </button>
            <span className="text-[#35446A] text-[10px]">/</span>
            <span className="text-[12px] text-[color:var(--vv-text-secondary)]">My Businesses</span>
          </div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">My Businesses</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            {published} published - {drafts} {drafts === 1 ? 'draft' : 'drafts'}
          </p>
        </div>
        <Link to="/app/founder/businesses/new">
          <Button icon={<IconPlus s={13} />} size="sm">New Business</Button>
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[12.5px]">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Published banner */}
      {justPublished && (
        <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
          <span className="text-[12.5px] text-[#22C55E] font-medium">
            {businesses.find(b => b.id === justPublished)?.name} is now published and eligible for discovery.
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
                <div className="h-2 w-24 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        /* Empty state */
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-6 py-14 text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.22)' }}>
            <svg width="20" height="20" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
            </svg>
          </div>
          <h2 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-1.5">No businesses yet</h2>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-5 max-w-xs mx-auto">Create your first business profile to start attracting investors and professionals.</p>
          <Link to="/app/founder/businesses/new">
            <Button icon={<IconPlus s={13} />} size="md">Create Business</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map(business => (
            <div key={business.id} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">

              {/* Desktop row */}
              <div className="hidden md:flex items-center gap-4 px-5 py-4">
                <BusinessLogo initials={business.initials} />

                {/* Name + meta */}
                <div className="flex-[2] min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">{business.name}</p>
                    {justPublished === business.id && (
                      <span className="text-[10.5px] text-[#22C55E] font-medium animate-pulse">Published!</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] truncate">{business.industry} - {business.stage}</p>
                </div>

                {/* Funding */}
                <div className="flex-[1.2] min-w-0">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-0.5 uppercase tracking-wider">Funding</p>
                  <p className="font-mono text-[12.5px] text-[#C67A4E] tabular-nums">{fmtBDT(business.funding)}</p>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{business.fundingStage}</p>
                </div>

                {/* Verification */}
                <div className="w-[110px] shrink-0">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-wider">Verification</p>
                  {business.verificationTier === 0
                    ? <Badge variant="neutral">Unverified</Badge>
                    : <VerificationBadge tier={business.verificationTier} />}
                </div>

                {/* Readiness */}
                <div className="w-[90px] shrink-0">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-wider">Readiness</p>
                  <ReadinessBar value={business.readiness} />
                </div>

                {/* Status */}
                <div className="w-[110px] shrink-0">
                  <StatusBadge status={business.status} />
                  {business.status === 'Draft' && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-[2px] rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${business.completionPct}%`, background: business.completionPct >= 90 ? '#22C55E' : '#F59E0B' }} />
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-[color:var(--vv-text-tertiary)] shrink-0">{business.completionPct}%</span>
                    </div>
                  )}
                </div>

                {/* Updated */}
                <div className="w-[80px] shrink-0 text-right">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Updated</p>
                  <p className="text-[11px] text-[color:var(--vv-text-secondary)] mt-0.5">{business.updatedAt}</p>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  {publishing === business.id ? (
                    <Button size="sm" loading>Publishing...</Button>
                  ) : (
                    <RowActions business={business} onPublish={handlePublish} />
                  )}
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden px-4 py-4">
                <div className="flex items-start gap-3">
                  <BusinessLogo initials={business.initials} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-[color:var(--vv-text)] leading-snug">{business.name}</p>
                      <StatusBadge status={business.status} />
                    </div>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">{business.industry} - {business.stage}</p>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Funding</p>
                        <p className="font-mono text-[12px] text-[#C67A4E]">{fmtBDT(business.funding)}</p>
                      </div>
                      <div className="w-px h-6 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                      <div>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-1">Readiness</p>
                        <ReadinessBar value={business.readiness} />
                      </div>
                      <div className="w-px h-6 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                      <div>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-0.5">Verification</p>
                        {business.verificationTier === 0
                          ? <Badge variant="neutral">Unverified</Badge>
                          : <VerificationBadge tier={business.verificationTier} />}
                      </div>
                    </div>
                    {/* Required skills (compact) */}
                    {business.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {business.requiredSkills.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded text-[10px] border"
                            style={{ background: 'rgba(198,122,78,0.07)', borderColor: 'rgba(198,122,78,0.18)', color: '#C67A4E' }}>{s}</span>
                        ))}
                        {business.requiredSkills.length > 3 && (
                          <span className="px-2 py-0.5 rounded text-[10px] border"
                            style={{ background: 'rgba(198,122,78,0.07)', borderColor: 'rgba(198,122,78,0.18)', color: '#C67A4E' }}>
                            +{business.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {publishing === business.id ? (
                        <Button size="sm" loading>Publishing...</Button>
                      ) : (
                        <RowActions business={business} onPublish={handlePublish} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Required skills row (desktop) */}
              {business.requiredSkills.length > 0 && (
                <div className="hidden md:flex items-center gap-3 px-5 py-2.5 border-t border-[#1c2a3e]">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider shrink-0">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {business.requiredSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10.5px] border"
                        style={{ background: 'rgba(198,122,78,0.07)', borderColor: 'rgba(198,122,78,0.18)', color: '#C67A4E' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft requirements (if any) */}
              <DraftRequirements business={business} onPublish={() => handlePublish(business.id)} />
            </div>
          ))}

          {/* Add business CTA */}
          <Link to="/app/founder/businesses/new" className="block">
            <div className="border border-dashed border-[color:var(--vv-border-strong)] rounded-[12px] px-5 py-4 flex items-center gap-3 hover:border-[#C67A4E]/40 hover:bg-[#C67A4E]/3 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-dashed border-[color:var(--vv-border-strong)] group-hover:border-[#C67A4E]/40 transition-colors">
                <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:stroke-[#C67A4E] transition-colors">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] group-hover:text-[#C67A4E] transition-colors font-medium">Add another business</p>
              <IconArrowRight s={12} className="text-[#35446A] ml-auto group-hover:text-[#C67A4E]/60 transition-colors" />
            </div>
          </Link>
        </div>
      )}

    </div>
  );
}