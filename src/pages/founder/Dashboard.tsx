import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconPlus, IconArrowRight, IconZap, IconActivity, IconClipboard } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';
import { api, ReputationSummaryData, DealFeedbackItem, FounderApplicationItem } from '../../services/api';

// --- Data Types ---------------------------------------------------------------

interface BackendBusiness {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  business_stage: string | null;
  status: 'draft' | 'under_review' | 'published' | 'suspended' | 'archived';
  requirements?: {
    funding_amount: number | null;
    skills: string[];
  } | null;
}

interface DashboardBusiness {
  id: string;
  name: string;
  industry: string;
  stage: string;
  tier: 0 | 1 | 2;
  readiness: number;
  status: 'Published' | 'Draft' | 'Under Review';
  statusV: 'success' | 'neutral' | 'accent';
}

interface RecommendedInvestor {
  id: number;
  user_id: number;
  name: string;
  verification_tier: number;
  industry?: string;
  risk_level?: string;
  business_stage?: string;
  match?: {
    overall_score?: number;
    factors?: string[];
  };
}

// --- Sub-components -----------------------------------------------------------

function ReadinessBar({ value }: { value: number }) {
  const color = value >= 75 ? '#C67A4E' : value >= 55 ? '#F59E0B' : '#F04438';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums w-6 text-right shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
      <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{title}</p>
      {action}
    </div>
  );
}

// --- Skeleton -----------------------------------------------------------------

function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3 animate-pulse">
          <div className="h-2.5 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded mb-3" />
          <div className="h-5 w-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded mb-2" />
          <div className="h-2 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonRows({ rows = 2 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
          <div className="w-7 h-7 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);
  const [reputation, setReputation] = useState<ReputationSummaryData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedInvestor[]>([]);
  const [incomingApps, setIncomingApps] = useState<FounderApplicationItem[]>([]);

  const tier = (user?.verification_tier as 0 | 1 | 2) ?? 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load businesses and reputation concurrently
      const [bizRes, repRes] = await Promise.all([
        api.get<{ items: BackendBusiness[] }>('/api/me/businesses').catch(() => ({ items: [] })),
        api.reputation.get('founder').catch(() => null),
      ]);

      const rawItems = bizRes.items || [];
      const mapped: DashboardBusiness[] = rawItems.map(b => {
        const isPub = b.status === 'published';
        const isReview = b.status === 'under_review';
        return {
          id: String(b.id),
          name: b.name,
          industry: b.industry || 'General',
          stage: b.business_stage || 'Idea',
          tier,
          readiness: isPub ? 85 : isReview ? 65 : 45,
          status: isPub ? 'Published' : isReview ? 'Under Review' : 'Draft',
          statusV: isPub ? 'success' : isReview ? 'accent' : 'neutral',
        };
      });
      setBusinesses(mapped);
      setReputation(repRes);

      // If founder has businesses, fetch real investor recommendations for the primary business
      if (rawItems.length > 0) {
        try {
          const recRes = await api.recommendations.investors(rawItems[0].id);
          const recItems = Array.isArray(recRes) ? recRes : ((recRes as any)?.data || []);
          setRecommendations(recItems.slice(0, 5));
        } catch {
          setRecommendations([]);
        }
      } else {
        setRecommendations([]);
      }

      // Fetch incoming talent applications
      try {
        const apps = await api.applications.founder.list();
        setIncomingApps(apps || []);
      } catch {
        setIncomingApps([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const publishedCount = businesses.filter(b => b.status === 'Published').length;
  const draftCount = businesses.filter(b => b.status === 'Draft').length;

  const metrics = [
    {
      label: 'Active Businesses',
      value: businesses.length.toString(),
      sub: `${publishedCount} published, ${draftCount} draft`,
      color: '#EAF0FA',
    },
    {
      label: 'Completed Deals',
      value: (reputation?.track_record?.completed_deals_count ?? 0).toString(),
      sub: 'Verified completed deals',
      color: '#EAF0FA',
    },
    {
      label: 'Funded Milestones',
      value: (reputation?.track_record?.completed_milestones_count ?? 0).toString(),
      sub: 'Delivered milestones',
      color: '#C67A4E',
    },
    {
      label: 'Verified Reports',
      value: (reputation?.financial_transparency?.verified_reports_count ?? 0).toString(),
      sub: `${reputation?.financial_transparency?.submitted_reports_count ?? 0} submitted`,
      color: '#EAF0FA',
    },
  ];

  const recentReviews: DealFeedbackItem[] = reputation?.feedback?.reviews || [];

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">
            {greeting}, {user?.name || 'Founder'}
          </h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Founder workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<IconActivity s={12} />} onClick={loadData}>Refresh</Button>
          <Button icon={<IconPlus s={13} />} size="sm" onClick={() => navigate('/app/founder/businesses/new')}>New Business</Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-[#2C1818] border border-[#F04438]/30 rounded-[10px] flex items-center justify-between">
          <p className="text-[13px] text-[#F04438]">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* -- Main column ------------------------------------------------ */}
        <div className="xl:col-span-2 space-y-5 order-2 xl:order-1">

          {/* Metrics */}
          {loading ? <SkeletonMetrics /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {metrics.map(m => (
                <div key={m.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5 leading-none">{m.label}</p>
                  <p className="font-mono text-[20px] font-semibold tabular-nums leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-tight">{m.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* My Businesses */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="My Businesses"
              action={<Link to="/app/founder/businesses"><Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>All</Button></Link>}
            />
            {loading ? <SkeletonRows rows={2} /> : businesses.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No businesses yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Create your first business profile to start discovering investors and entering deal rooms.</p>
                <Link to="/app/founder/businesses/new"><Button icon={<IconPlus s={13} />} size="sm">Create business</Button></Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Industry', 'Stage', 'Verification', 'Readiness', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr key={b.id} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                              {b.name[0] || 'B'}
                            </div>
                            <span className="text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{b.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{b.industry}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{b.stage}</td>
                        <td className="px-4 py-3">
                          {b.tier === 0 ? <Badge variant="neutral">Unverified</Badge> : <VerificationBadge tier={b.tier} />}
                        </td>
                        <td className="px-4 py-3"><ReadinessBar value={b.readiness} /></td>
                        <td className="px-4 py-3"><Badge variant={b.statusV} dot>{b.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/app/founder/businesses/${b.id}`}>
                            <Button variant="ghost" size="sm">Manage</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {businesses.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                        {b.name[0] || 'B'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{b.name}</p>
                          <Badge variant={b.statusV} dot>{b.status}</Badge>
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.industry} - {b.stage}</p>
                      </div>
                      <ReadinessBar value={b.readiness} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Applications Inbox Card */}
          {incomingApps.length > 0 && (
            <div className="bg-[#121A2B] border border-[#C67A4E]/30 rounded-[10px] overflow-hidden shadow-sm">
              <SectionHeader
                title="Incoming Talent Applications"
                action={
                  <Link to="/app/founder/applications">
                    <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>
                      View All ({incomingApps.length})
                    </Button>
                  </Link>
                }
              />
              <div className="p-4 space-y-3">
                {incomingApps.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => navigate('/app/founder/applications')}
                    className="p-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_70%,transparent)] border border-[color:var(--vv-border)] flex items-center justify-between gap-3 hover:border-[color:var(--vv-border-hover)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1F2E4D] border border-[#2B3F6C] flex items-center justify-center font-bold text-[11px] text-[#8AA2D6] shrink-0">
                        {app.professional.initials || 'PR'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">
                            {app.professional.name}
                          </p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            {app.status === 'submitted' ? 'New' : app.status}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] truncate">
                          Applied for {app.role_title} • {app.business_name}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/app/profile/${app.professional.id}`); }}>
                      Profile
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deal Rooms Overview */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Deal Rooms"
              action={
                <Link to="/app/deal-room">
                  <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>View</Button>
                </Link>
              }
            />
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Deal Room Management</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-sm mx-auto">
                Deal rooms open when an investor advances through discovery and mutual interest. Manage active agreements, milestones, and governance.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/app/deal-room">
                  <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Go to Deal Room</Button>
                </Link>
                <Link to="/app/founder/discover-investors">
                  <Button size="sm">Discover Investors</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Counterparty Activity & Feedback */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Recent Activity & Reviews"
              action={
                <Link to="/app/founder/reputation">
                  <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>Reputation</Button>
                </Link>
              }
            />
            {loading ? <SkeletonRows rows={3} /> : recentReviews.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">No recent counterparty reviews recorded on-platform yet.</p>
            ) : (
              <div>
                {recentReviews.slice(0, 5).map((rev) => (
                  <div key={rev.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                    <div className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[#C67A4E]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-4 mb-1">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">
                          {rev.reviewer_name || `Counterparty (${rev.reviewer_role})`}
                        </p>
                        <span className="font-mono text-[11px] text-[#C67A4E] tabular-nums">★ {rev.rating}/5</span>
                      </div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{rev.comment || 'Verified counterparty engagement feedback.'}</p>
                      {rev.submitted_at && (
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono mt-1">
                          {new Date(rev.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* -- Sidebar ----------------------------------------------------- */}
        <div className="space-y-4 order-1 xl:order-2">

          {/* Profile / Verification status */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader title="Verification & Profile" />
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Verification Tier</span>
                <div className="flex items-center gap-1.5">
                  {tier === 0 ? (
                    <Badge variant="neutral">Tier 0 - Unverified</Badge>
                  ) : (
                    <VerificationBadge tier={tier} />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1c2a3e]">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Identity Verified</span>
                <span className="text-[12px] text-[color:var(--vv-text-secondary)]">
                  {reputation?.verification?.is_identity_verified ? 'Yes' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Track Record Verified</span>
                <span className="text-[12px] text-[color:var(--vv-text-secondary)]">
                  {reputation?.verification?.is_track_record_verified ? 'Yes' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="px-4 pb-3">
              <Link to="/app/profile">
                <Button variant="secondary" size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Manage profile</Button>
              </Link>
            </div>
          </div>

          {/* Next Action - Contextual CTA */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              {businesses.length === 0 ? (
                <>
                  <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Create your business</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">Add your startup details to unlock investor matching and discovery.</p>
                  <Button size="sm" className="w-full text-[12px]" onClick={() => navigate('/app/founder/businesses/new')}>
                    Add Business Profile
                  </Button>
                </>
              ) : draftCount > 0 ? (
                <>
                  <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Publish draft business</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">Complete your draft business profiles and submit them for platform review.</p>
                  <Link to="/app/founder/businesses">
                    <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Review Businesses</Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Discover investors</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">Find verified investors matching your industry stage and funding requirements.</p>
                  <Link to="/app/founder/discover-investors">
                    <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Explore Investors</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Recommended Investors */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <div className="flex items-center gap-1.5">
                <IconZap s={12} className="text-[#C67A4E]" />
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Recommended Investors</p>
              </div>
              {recommendations.length > 0 && (
                <span className="text-[10px] text-[#C67A4E] font-mono">{recommendations.length} matches</span>
              )}
            </div>
            {loading ? <SkeletonRows rows={3} /> : recommendations.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">
                {businesses.length === 0
                  ? 'Create a business profile to receive investor matches.'
                  : 'No investor recommendations matching your criteria at this time.'}
              </p>
            ) : (
              <div>
                {recommendations.map((s) => (
                  <div key={s.id} className="px-4 py-3 border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">
                          {s.name[0] || 'I'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate">{s.name}</p>
                            <VerificationBadge tier={s.verification_tier as 0 | 1 | 2} />
                          </div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5">{s.industry || 'General Investor'}</p>
                        </div>
                      </div>
                      {s.match?.overall_score !== undefined && (
                        <ScoreChip score={s.match.overall_score} label="Match" topFactors={s.match.factors || []} />
                      )}
                    </div>
                    {s.business_stage && (
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] ml-8 leading-snug">
                        Focus: {s.business_stage} stage {s.risk_level ? `• ${s.risk_level} risk` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
              <Link to="/app/founder/discover-investors">
                <Button variant="tertiary" size="sm" className="w-full text-[11.5px]" iconRight={<IconArrowRight s={11} />}>All investor matches</Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
