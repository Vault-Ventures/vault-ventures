import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconZap, IconArrowRight, IconActivity } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';
import { api, ReputationSummaryData, DealFeedbackItem } from '../../services/api';

// --- Data Types ---------------------------------------------------------------

interface RecommendedBusiness {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  business_stage: string | null;
  risk_level: string | null;
  expected_involvement: string | null;
  requirements?: {
    skills?: Array<{ id: number; name: string }>;
  } | null;
  match?: {
    overall_score?: number;
    factors?: string[];
  };
}

// --- Sub-components -----------------------------------------------------------

function SectionHeader({ title, badge, action }: { title: string; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{title}</p>
        {badge}
      </div>
      {action}
    </div>
  );
}

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

function SkeletonRows({ rows = 3 }: { rows?: number }) {
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

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedBusiness[]>([]);
  const [reputation, setReputation] = useState<ReputationSummaryData | null>(null);

  const tier = (user?.verification_tier as 0 | 1 | 2) ?? 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recRes, repRes] = await Promise.all([
        api.recommendations.businesses('professional').catch(() => []),
        api.reputation.get('professional').catch(() => null),
      ]);

      const recItems = Array.isArray(recRes) ? recRes : ((recRes as any)?.data || []);
      setRecommendations(recItems);
      setReputation(repRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load professional dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const metrics = [
    {
      label: 'Opportunities',
      value: recommendations.length.toString(),
      sub: 'Matched to your profile',
      color: '#EAF0FA',
    },
    {
      label: 'Completed Deals',
      value: (reputation?.track_record?.completed_deals_count ?? 0).toString(),
      sub: 'Verified completed deals',
      color: '#EAF0FA',
    },
    {
      label: 'Delivered Milestones',
      value: (reputation?.track_record?.completed_milestones_count ?? 0).toString(),
      sub: 'Delivered tranches',
      color: '#C67A4E',
    },
    {
      label: 'Average Rating',
      value: reputation?.feedback?.average_rating ? `${Number(reputation.feedback.average_rating).toFixed(1)} / 5.0` : 'None',
      sub: `${reputation?.feedback?.reviews_count ?? 0} reviews`,
      color: '#EAF0FA',
    },
  ];

  const recentReviews: DealFeedbackItem[] = reputation?.feedback?.reviews || [];
  const profileSkills: string[] = Array.isArray(reputation?.profile_evidence?.skills)
    ? reputation.profile_evidence.skills
    : [];

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">
            {greeting}, {user?.name || 'Professional'}
          </h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Professional workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<IconActivity s={12} />} onClick={loadData}>Refresh</Button>
          <Link to="/app/profile">
            <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>View profile</Button>
          </Link>
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

          {/* Recommended Opportunities */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <div className="flex items-center gap-2">
                <IconZap s={13} className="text-[#C67A4E]" />
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Recommended Opportunities</p>
                <span className="text-[10px] text-[#C67A4E]/80 font-mono">Ranked by Match Score</span>
              </div>
              <Link to="/app/professional/discover">
                <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>Discover all</Button>
              </Link>
            </div>
            {loading ? <SkeletonRows rows={3} /> : recommendations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No matching opportunities yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Add more skills and experience to improve your recommendations.</p>
                <Link to="/app/profile">
                  <Button size="sm">Update Profile</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Industry', 'Stage', 'Involvement', 'Match', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r) => (
                      <tr key={r.id} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                              {r.name[0] || 'B'}
                            </div>
                            <div>
                              <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.name}</span>
                              {r.description && (
                                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 max-w-xs truncate">{r.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{r.industry || 'General'}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{r.business_stage || 'Active'}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{r.expected_involvement || 'Advisory / Project'}</td>
                        <td className="px-4 py-3">
                          {r.match?.overall_score !== undefined ? (
                            <ScoreChip score={r.match.overall_score} label="Match" topFactors={r.match.factors || []} />
                          ) : (
                            <Badge variant="neutral">Matched</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/app/professional/discover">
                            <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {recommendations.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0 mt-0.5">
                        {r.name[0] || 'B'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{r.name}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">{r.industry || 'General'} • {r.business_stage || 'Active'}</p>
                      </div>
                      {r.match?.overall_score !== undefined && (
                        <ScoreChip score={r.match.overall_score} label="Match" topFactors={r.match.factors || []} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Applications */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="My Applications & Engagements"
              action={<Link to="/app/professional/discover"><Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>Explore</Button></Link>}
            />
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No active applications</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Browse recommended opportunities and submit your profile for collaboration.</p>
              <Link to="/app/professional/discover">
                <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Discover opportunities</Button>
              </Link>
            </div>
          </div>

          {/* Deal Rooms */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Active Deal Rooms"
              action={
                <Link to="/app/deal-room">
                  <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>View</Button>
                </Link>
              }
            />
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Deal Room Engagements</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-sm mx-auto">
                Deal rooms open when a founder accepts your collaboration or advisory proposal. Manage deliverables and milestones here.
              </p>
              <Link to="/app/deal-room">
                <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Go to Deal Room</Button>
              </Link>
            </div>
          </div>

        </div>

        {/* -- Sidebar ----------------------------------------------------- */}
        <div className="space-y-4 order-1 xl:order-2">

          {/* Profile Status */}
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

          {/* Next Action */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Explore Opportunities</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">
                Browse verified startups seeking advisory, fractional, or technical roles.
              </p>
              <Link to="/app/professional/discover">
                <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Discover Startups</Button>
              </Link>
            </div>
          </div>

          {/* Skills from Profile Evidence */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--vv-border)]">
              <IconZap s={12} className="text-[#C67A4E]" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Profile Skills</p>
            </div>
            <div className="px-4 py-3">
              {profileSkills.length === 0 ? (
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                  No skills listed on your professional profile yet. Add skills to improve match rankings.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profileSkills.map((s) => (
                    <span key={s} className="text-[10.5px] px-2 py-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded text-[color:var(--vv-text-secondary)]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 pb-3 border-t border-[color:var(--vv-border)] pt-2.5">
              <Link to="/app/profile">
                <Button variant="ghost" size="sm" className="w-full text-[11.5px]">Update skills</Button>
              </Link>
            </div>
          </div>

          {/* Recent Counterparty Activity & Feedback */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Recent Activity & Reviews</p>
            </div>
            {loading ? <SkeletonRows rows={3} /> : recentReviews.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">No recent counterparty reviews recorded on-platform yet.</p>
            ) : (
              <div>
                {recentReviews.slice(0, 4).map((rev) => (
                  <div key={rev.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <div className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[#C67A4E]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">
                          {rev.reviewer_name || `Counterparty (${rev.reviewer_role})`}: {rev.comment || 'Feedback submitted'}
                        </p>
                        <span className="text-[10px] text-[#C67A4E] shrink-0 font-mono">★ {rev.rating}/5</span>
                      </div>
                      {rev.submitted_at && (
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono mt-0.5">
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
      </div>
    </div>
  );
}