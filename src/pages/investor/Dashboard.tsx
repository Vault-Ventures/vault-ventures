import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconZap, IconArrowRight, IconTrendingUp, IconActivity } from '../../components/layout/Icons';
import { AIBadge } from '../../components/ui/AIInsights';
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
  funding_amount: number | null;
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

// --- Skeleton -----------------------------------------------------------------

function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3 animate-pulse">
          <div className="h-2.5 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded mb-3" />
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded mb-2" />
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
            <div className="h-2.5 w-36 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedBusiness[]>([]);
  const [reputation, setReputation] = useState<ReputationSummaryData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recRes, repRes] = await Promise.all([
        api.recommendations.businesses('investor').catch(() => []),
        api.reputation.get('investor').catch(() => null),
      ]);

      const recItems = Array.isArray(recRes) ? recRes : ((recRes as any)?.data || []);
      setRecommendations(recItems);
      setReputation(repRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load investor dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const simulatedBdt = Number(reputation?.track_record?.total_simulated_bdt || 0);
  const formattedSimulatedBdt = `৳${simulatedBdt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const metrics = [
    {
      label: 'Recommended Startups',
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
      label: 'Funded Milestones',
      value: (reputation?.track_record?.completed_milestones_count ?? 0).toString(),
      sub: 'Delivered tranches',
      color: '#F59E0B',
    },
    {
      label: 'Simulated Deployed',
      value: formattedSimulatedBdt,
      sub: 'Simulated only - no real custody',
      color: '#C67A4E',
    },
  ];

  const recentReviews: DealFeedbackItem[] = reputation?.feedback?.reviews || [];

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">
            {greeting}, {user?.name || 'Investor'}
          </h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Investor workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<IconActivity s={12} />} onClick={loadData}>Refresh</Button>
          <Link to="/app/investor/preferences">
            <Button variant="secondary" icon={<IconTrendingUp s={13} />} size="sm">Edit Preferences</Button>
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
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="font-mono text-[18px] font-semibold tabular-nums leading-none" style={{ color: m.color }}>{m.value}</p>
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-tight">{m.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Startups */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]"
              style={{ background: 'rgba(198,122,78,0.02)' }}>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Recommended for You</p>
                <AIBadge />
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono hidden sm:inline">Matched to your investment profile</span>
              </div>
              <Link to="/app/investor/discover">
                <Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>Discover all</Button>
              </Link>
            </div>
            {loading ? <SkeletonRows rows={3} /> : recommendations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No recommendations yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Complete your investment preferences to improve your matches.</p>
                <Link to="/app/investor/preferences">
                  <Button size="sm">Complete Preferences</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[580px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Startup', 'Industry', 'Stage', 'Funding Ask', 'Match', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((s) => (
                      <tr key={s.id} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                              {s.name[0] || 'S'}
                            </div>
                            <div>
                              <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{s.name}</span>
                              {s.description && (
                                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 max-w-xs truncate">{s.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{s.industry || 'General'}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{s.business_stage || 'Active'}</td>
                        <td className="px-4 py-3 font-mono text-[12px] font-medium text-[color:var(--vv-text)] tabular-nums">
                          {s.funding_amount ? `৳${Number(s.funding_amount).toLocaleString('en-IN')}` : 'Undisclosed'}
                        </td>
                        <td className="px-4 py-3">
                          {s.match?.overall_score !== undefined ? (
                            <ScoreChip score={s.match.overall_score} label="Match" topFactors={s.match.factors || []} />
                          ) : (
                            <Badge variant="neutral">Matched</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/app/investor/discover">
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {recommendations.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0 mt-0.5">
                        {s.name[0] || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{s.name}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">
                          {s.industry || 'General'} • {s.business_stage || 'Active'} • <span className="font-mono">{s.funding_amount ? `৳${Number(s.funding_amount).toLocaleString('en-IN')}` : ''}</span>
                        </p>
                      </div>
                      {s.match?.overall_score !== undefined && (
                        <ScoreChip score={s.match.overall_score} label="Match" topFactors={s.match.factors || []} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#1c2a3e]"
                  style={{ background: 'rgba(198,122,78,0.02)' }}>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                    • Recommendations are generated based on your investment preferences and are informational only. They do not constitute investment advice.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Saved Opportunities */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Saved Opportunities"
              action={<Link to="/app/investor/saved"><Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>All saved</Button></Link>}
            />
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No saved opportunities</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Save startups from Discovery to track them here.</p>
              <Link to="/app/investor/discover">
                <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Go to Discovery</Button>
              </Link>
            </div>
          </div>

          {/* Active Deal Rooms */}
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
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Deal Room Management</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-sm mx-auto">
                Deal rooms open when you confirm interest in a startup and the founder accepts. Manage active negotiations, agreements, and simulated funding.
              </p>
              <Link to="/app/deal-room">
                <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Go to Deal Room</Button>
              </Link>
            </div>
          </div>

        </div>

        {/* -- Sidebar ----------------------------------------------------- */}
        <div className="space-y-4 order-1 xl:order-2">

          {/* Investor Preferences */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Investment Preferences</p>
              <Link to="/app/investor/preferences">
                <Button variant="ghost" size="sm">Edit</Button>
              </Link>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">Verification</span>
                <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">
                  {reputation?.verification?.tier ? `Tier ${reputation.verification.tier}` : 'Unverified'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">Track Record</span>
                <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">
                  {reputation?.verification?.is_track_record_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-snug">
                Your investment preferences shape recommended startup ranking and matchmaking factors.
              </p>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Explore Discoveries</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">
                Browse through high-readiness startups and initiate connection requests.
              </p>
              <Link to="/app/investor/discover">
                <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Go to Discovery</Button>
              </Link>
            </div>
          </div>

          {/* Simulated Portfolio */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Portfolio Summary</p>
              <span className="text-[9px] font-semibold text-[#F59E0B] uppercase tracking-wider border border-[#F59E0B]/30 rounded px-1.5 py-0.5">Simulated</span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-[#1c2a3e]">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Total Value</p>
                <p className="font-mono text-[14px] font-semibold tabular-nums text-[#EAF0FA] truncate">{formattedSimulatedBdt}</p>
              </div>
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Completed Deals</p>
                <p className="font-mono text-[15px] font-semibold tabular-nums text-[#C67A4E]">{reputation?.track_record?.completed_deals_count ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Funded Milestones</p>
                <p className="font-mono text-[15px] font-semibold tabular-nums text-[#EAF0FA]">{reputation?.track_record?.completed_milestones_count ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Reviews</p>
                <p className="font-mono text-[15px] font-semibold tabular-nums text-[#EAF0FA]">{reputation?.feedback?.reviews_count ?? 0}</p>
              </div>
            </div>
            <div className="px-4 py-2 border-t border-[color:var(--vv-border)]">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/70 leading-snug text-center">All portfolio values are simulated. No real capital is moved on-platform.</p>
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