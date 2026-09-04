import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconZap, IconArrowRight, IconTrendingUp } from '../../components/layout/Icons';
import { AIBadge } from '../../components/ui/AIInsights';

// --- Data --------------------------------------------------------------------

const METRICS = [
  { label: 'Active Deal Rooms', value: '4', sub: '1 action required', color: '#F59E0B' },
  { label: 'Saved Opportunities', value: '18', sub: '3 with new activity', color: '#EAF0FA' },
  { label: 'Avg Match Score', value: '79%', sub: 'Across saved opps', color: '#C67A4E', ai: true },
  { label: 'Simulated Portfolio', value: 'BDT 2,40,00,000', sub: 'Simulated only - not real capital', color: '#EAF0FA' },
];

const RECOMMENDED = [
  {
    name: 'NovaTech AI', industry: 'FinTech - AI/ML', stage: 'Seed',
    ask: 'BDT 60,00,000', match: 91, readiness: 78, tier: 2 as const,
    reason: 'FinTech + Seed + AI/ML - all match your thesis',
  },
  {
    name: 'Orbit Analytics', industry: 'Data - SaaS', stage: 'Pre-seed',
    ask: 'BDT 18,00,000', match: 82, readiness: 52, tier: 1 as const,
    reason: 'SaaS focus + within your BDT 10L-BDT 50L range',
  },
  {
    name: 'Medify Health', industry: 'HealthTech - B2C', stage: 'Seed',
    ask: 'BDT 1,20,00,000', match: 74, readiness: 83, tier: 2 as const,
    reason: 'High readiness score; adjacent to AI/ML interest',
  },
];

const SAVED = [
  { name: 'Structra Build', industry: 'PropTech - B2B', stage: 'Series A', ask: 'BDT 3,00,00,000', readiness: 70, saved: '3d ago', statusV: 'info' as const, status: 'Interested' },
  { name: 'GreenPath Logistics', industry: 'CleanTech', stage: 'Pre-seed', ask: 'BDT 25,00,000', readiness: 54, saved: '1w ago', statusV: 'info' as const, status: 'Viewed' },
  { name: 'Chainlink Legal', industry: 'LegalTech - SaaS', stage: 'Seed', ask: 'BDT 40,00,000', readiness: 63, saved: '2w ago', statusV: 'neutral' as const, status: 'Saved' },
];

const DEAL_ROOMS = [
  { business: 'NovaTech AI', founder: 'Alex Morgan', stage: 'NDA Signed', stageV: 'success' as const, updated: '2h ago', action: 'Sign term sheet' },
  { business: 'Structra Build', founder: 'Jamie Torres', stage: 'Negotiation', stageV: 'warning' as const, updated: '1d ago', action: 'Review counter-offer' },
  { business: 'GreenPath Logistics', founder: 'Sam Okafor', stage: 'Interest Confirmed', stageV: 'info' as const, updated: '3d ago', action: 'Advance to Deal Room' },
  { business: 'Chainlink Legal', founder: 'Priya Nair', stage: 'Matched', stageV: 'neutral' as const, updated: '5d ago', action: 'Confirm interest' },
];

const ACTIVITY = [
  { text: 'NovaTech AI uploaded cap table to Stage 3 docs', time: '1h ago', dot: '#C67A4E' },
  { text: 'Structra Build submitted counter-offer on terms', time: '5h ago', dot: '#F59E0B' },
  { text: 'Match Score updated for Orbit Analytics: +5 pts', time: '1d ago', dot: '#C67A4E' },
  { text: 'GreenPath confirmed connection request', time: '2d ago', dot: '#3B82F6' },
  { text: 'NDA signed with NovaTech AI', time: '3d ago', dot: '#C9A24B' },
];

const PORTFOLIO = [
  { name: 'NovaTech AI', milestone: 'Series A Bridge', progress: 40, ask: 'BDT 60,00,000', statusV: 'success' as const, status: 'Active' },
  { name: 'Structra Build', milestone: 'Series A', progress: 75, ask: 'BDT 3,00,00,000', statusV: 'warning' as const, status: 'Negotiation' },
  { name: 'Medify Health', milestone: 'Seed round', progress: 20, ask: 'BDT 1,20,00,000', statusV: 'neutral' as const, status: 'Early' },
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">{greeting}, Alex</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Investor workspace</p>
        </div>
        <Link to="/app/investor/preferences">
          <Button variant="secondary" icon={<IconTrendingUp s={13} />} size="sm">Edit Preferences</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* -- Main column ------------------------------------------------ */}
        <div className="xl:col-span-2 space-y-5 order-2 xl:order-1">

          {/* Metrics */}
          {loading ? <SkeletonMetrics /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {METRICS.map(m => (
                <div key={m.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5 leading-none">{m.label}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="font-mono text-[20px] font-semibold tabular-nums leading-none" style={{ color: m.color }}>{m.value}</p>
                    {m.ai && <IconZap s={10} className="text-[#C67A4E] mb-0.5" />}
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-tight">{m.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Recommended Startups */}
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
            {loading ? <SkeletonRows rows={3} /> : RECOMMENDED.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No recommendations yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Complete your investment preferences to improve your AI matches.</p>
                <Link to="/app/profile">
                  <Button size="sm">Complete Preferences</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[580px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Startup', 'Industry', 'Stage', 'Ask', 'Readiness', 'Match', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECOMMENDED.map((s, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">{s.name[0]}</div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{s.name}</span>
                                <VerificationBadge tier={s.tier} />
                              </div>
                              <p className="text-[10.5px] text-[#C67A4E]/70 mt-0.5 leading-snug">{s.reason}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{s.industry}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{s.stage}</td>
                        <td className="px-4 py-3 font-mono text-[12px] font-medium text-[color:var(--vv-text)] tabular-nums">{s.ask}</td>
                        <td className="px-4 py-3"><ReadinessBar value={s.readiness} /></td>
                        <td className="px-4 py-3">
                          <ScoreChip score={s.match} label="Match" topFactors={['FinTech alignment', 'Stage: Seed']} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm">Save</Button>
                            <Button size="sm">Connect</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {RECOMMENDED.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0 mt-0.5">{s.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{s.name}</p>
                          <VerificationBadge tier={s.tier} />
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">{s.industry} - {s.stage} - <span className="font-mono">{s.ask}</span></p>
                        <p className="text-[10.5px] text-[#C67A4E]/70 leading-snug">{s.reason}</p>
                      </div>
                      <ScoreChip score={s.match} label="Match" topFactors={['FinTech alignment', 'Stage: Seed']} />
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#1c2a3e]"
                  style={{ background: 'rgba(198,122,78,0.02)' }}>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                    ? Recommendations are generated based on your investment preferences and are informational only. They do not constitute investment advice.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Saved Opportunities */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Saved Opportunities"
              badge={<span className="text-[10px] text-[#3B82F6] font-mono">3 new activity</span>}
              action={<Link to="/app/investor/saved"><Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>All saved</Button></Link>}
            />
            {loading ? <SkeletonRows rows={3} /> : SAVED.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No saved opportunities</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Save startups from Discovery to track them here.</p>
                <Link to="/app/investor/discover">
                  <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Go to Discovery</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Industry', 'Stage', 'Ask', 'Readiness', 'Saved', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAVED.map((s, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{s.name}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{s.industry}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{s.stage}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[color:var(--vv-text)] tabular-nums">{s.ask}</td>
                        <td className="px-4 py-3"><ReadinessBar value={s.readiness} /></td>
                        <td className="px-4 py-3 text-[11px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums whitespace-nowrap">{s.saved}</td>
                        <td className="px-4 py-3"><Badge variant={s.statusV} dot>{s.status}</Badge></td>
                        <td className="px-4 py-3 text-right"><Link to="/app/investor/discover"><Button variant="ghost" size="sm">View</Button></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="md:hidden">
                  {SAVED.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{s.name}</p>
                          <Badge variant={s.statusV} dot>{s.status}</Badge>
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{s.industry} - {s.stage} - <span className="font-mono">{s.ask}</span></p>
                      </div>
                      <ReadinessBar value={s.readiness} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active Deal Rooms */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Active Deal Rooms"
              badge={<Badge variant="warning">1 action</Badge>}
            />
            {loading ? <SkeletonRows rows={3} /> : DEAL_ROOMS.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No active deal rooms</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Deal rooms open when you confirm interest in a startup and the founder accepts.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Founder', 'Stage', 'Last activity', 'Next action', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEAL_ROOMS.map((d, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{d.business}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{d.founder}</td>
                        <td className="px-4 py-3"><Badge variant={d.stageV}>{d.stage}</Badge></td>
                        <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums whitespace-nowrap">{d.updated}</td>
                        <td className="px-4 py-3 text-[12px] text-[#C67A4E]">? {d.action}</td>
                        <td className="px-4 py-3 text-right"><Link to="/app/deal-room"><Button variant="ghost" size="sm">Open</Button></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="md:hidden">
                  {DEAL_ROOMS.map((d, i) => (
                    <Link key={i} to="/app/deal-room" className="block px-4 py-3 border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{d.business}</p>
                        <Badge variant={d.stageV}>{d.stage}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11.5px] text-[#C67A4E]">? {d.action}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{d.updated}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
              <Link to="/app/deal-room">
                <Button variant="tertiary" size="sm" className="w-full text-[11.5px]" iconRight={<IconArrowRight s={11} />}>All deal rooms</Button>
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
              {[
                { label: 'Interests', value: 'FinTech - AI/ML - SaaS' },
                { label: 'Stage', value: 'Seed - Series A' },
                { label: 'Range', value: '৳100K - ৳1M' },
                { label: 'Risk', value: 'Moderate' },
                { label: 'Geography', value: 'North America - Remote' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{label}</span>
                  <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right leading-snug">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-snug">These preferences shape your AI match scores and recommended startup ranking.</p>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Sign term sheet</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">NovaTech AI is waiting on your signature to advance the deal to funding stage.</p>
              <Link to="/app/deal-room">
                <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Open deal room</Button>
              </Link>
            </div>
          </div>

          {/* Simulated Portfolio */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Portfolio</p>
              <span className="text-[9px] font-semibold text-[#F59E0B] uppercase tracking-wider border border-[#F59E0B]/30 rounded px-1.5 py-0.5">Simulated</span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-[#1c2a3e]">
              {[
                { label: 'Total Value', value: '৳2.4M', color: '#EAF0FA' },
                { label: 'Active', value: '3', color: '#C67A4E' },
                { label: 'Completed', value: '1', color: '#EAF0FA' },
                { label: 'Avg Progress', value: '45%', color: '#EAF0FA' },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">{m.label}</p>
                  <p className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
            {loading ? <SkeletonRows rows={2} /> : (
              <div>
                {PORTFOLIO.map((p, i) => (
                  <div key={i} className="px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[12px] font-medium text-[color:var(--vv-text)]">{p.name}</p>
                      <Badge variant={p.statusV} dot>{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C67A4E] rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)] tabular-nums">{p.progress}%</span>
                      <span className="font-mono text-[10.5px] text-[color:var(--vv-text)] tabular-nums">{p.ask}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2 border-t border-[color:var(--vv-border)]">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/70 leading-snug text-center">All portfolio values are simulated. No real capital is moved on-platform.</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Recent Activity</p>
            </div>
            {loading ? <SkeletonRows rows={4} /> : (
              <div>
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <div className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.dot }} />
                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                      <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">{a.text}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] shrink-0 font-mono tabular-nums">{a.time}</p>
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