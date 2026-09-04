import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconPlus, IconArrowRight, IconZap } from '../../components/layout/Icons';

// --- Data --------------------------------------------------------------------

const METRICS = [
  { label: 'Active Businesses', value: '2', sub: '1 published', color: '#EAF0FA' },
  { label: 'Connections', value: '12', sub: '2 pending', color: '#EAF0FA' },
  { label: 'Deal Rooms', value: '3', sub: '1 action required', color: '#F59E0B' },
  { label: 'Profile Views', value: '94', sub: 'Last 30 days', color: '#EAF0FA' },
];

const BUSINESSES = [
  { name: 'NovaTech AI', industry: 'FinTech - AI/ML', stage: 'Seed', tier: 2 as const, readiness: 78, status: 'Published', statusV: 'success' as const },
  { name: 'GreenPath Logistics', industry: 'CleanTech - SaaS', stage: 'Pre-seed', tier: 1 as const, readiness: 54, status: 'Draft', statusV: 'neutral' as const },
];

const AI_SUGGESTIONS = [
  {
    name: 'Meridian Capital',
    type: 'Investor',
    match: 86,
    tier: 2 as const,
    reason: 'FinTech + Seed-stage + AI/ML interest',
    note: 'FinTech specialist - Seed ৳250K-৳1M',
  },
  {
    name: 'Apex Ventures',
    type: 'Investor',
    match: 79,
    tier: 1 as const,
    reason: 'AI/ML portfolio - matches NovaTech thesis',
    note: 'AI/ML focus - hands-off capital - ৳500K avg',
  },
  {
    name: 'Jordan Lee',
    type: 'Professional',
    match: 91,
    tier: 1 as const,
    reason: 'CTO profile - FinTech - 12y seed-stage ops',
    note: 'Available for advisory - 3 exits',
  },
];

const DEAL_ROOMS = [
  { counterpart: 'Meridian Capital', business: 'NovaTech AI', stage: 'NDA Signed', stageV: 'accent' as const, updated: '2h ago', action: 'Sign term sheet' },
  { counterpart: 'Lighthouse VC', business: 'NovaTech AI', stage: 'Negotiation', stageV: 'warning' as const, updated: '1d ago', action: 'Review terms' },
  { counterpart: 'Priya Nair', business: 'GreenPath Logistics', stage: 'Interest Confirmed', stageV: 'info' as const, updated: '3d ago', action: 'Advance to Deal Room' },
];

const ACTIVITY = [
  { text: 'Meridian Capital signed NDA for NovaTech AI', time: '2h ago', dot: '#C67A4E' },
  { text: 'Apex Ventures expressed interest in NovaTech AI', time: '5h ago', dot: '#3B82F6' },
  { text: 'Jordan Lee matched at 91% compatibility', time: '1d ago', dot: '#C67A4E' },
  { text: 'Tier 1 verification approved', time: '4d ago', dot: '#C9A24B' },
  { text: 'GreenPath Logistics profile updated', time: '5d ago', dot: '#5E6D8F' },
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
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Founder workspace</p>
        </div>
        <Button icon={<IconPlus s={13} />} size="sm" onClick={() => navigate('/app/founder/businesses/new')}>New Business</Button>
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
            {loading ? <SkeletonRows rows={2} /> : BUSINESSES.length === 0 ? (
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
                    {BUSINESSES.map((b, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                              {b.name[0]}
                            </div>
                            <span className="text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{b.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{b.industry}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{b.stage}</td>
                        <td className="px-4 py-3"><VerificationBadge tier={b.tier} /></td>
                        <td className="px-4 py-3"><ReadinessBar value={b.readiness} /></td>
                        <td className="px-4 py-3"><Badge variant={b.statusV} dot>{b.status}</Badge></td>
                        <td className="px-4 py-3 text-right"><Link to="/app/founder/businesses/nova-health"><Button variant="ghost" size="sm">Manage</Button></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {BUSINESSES.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">
                        {b.name[0]}
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

          {/* Deal Rooms */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Deal Rooms"
              action={<Badge variant="warning">1 action</Badge>}
            />
            {loading ? <SkeletonRows rows={3} /> : DEAL_ROOMS.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No active deal rooms</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Deal rooms open when an investor advances beyond initial interest.</p>
                <Link to="/app/founder/discover-investors">
                  <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Discover investors</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-[#1c2a3e]">
                        {['Participant - Business', 'Stage', 'Last activity', 'Next action', ''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEAL_ROOMS.map((d, i) => (
                        <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{d.counterpart}</p>
                            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{d.business}</p>
                          </td>
                          <td className="px-4 py-3"><Badge variant={d.stageV}>{d.stage}</Badge></td>
                          <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums">{d.updated}</td>
                          <td className="px-4 py-3 text-[12px] text-[#C67A4E]">? {d.action}</td>
                          <td className="px-4 py-3 text-right"><Link to="/app/deal-room"><Button variant="ghost" size="sm">Open</Button></Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">
                  {DEAL_ROOMS.map((d, i) => (
                    <Link key={i} to="/app/deal-room" className="block px-4 py-3 border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{d.counterpart} - {d.business}</p>
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

          {/* Recent Activity */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader title="Recent Activity" />
            {loading ? <SkeletonRows rows={4} /> : ACTIVITY.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">No recent activity.</p>
            ) : (
              <div>
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <div className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.dot }} />
                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{a.text}</p>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 font-mono tabular-nums">{a.time}</p>
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
            <SectionHeader title="Profile Status" />
            <div className="px-4 py-3 space-y-3">
              {/* Overall */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Overall profile</span>
                  <span className="font-mono text-[12px] text-[color:var(--vv-text)] tabular-nums">78%</span>
                </div>
                <div className="h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C67A4E] rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
              {/* Founder setup */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Founder setup</span>
                  <span className="font-mono text-[12px] text-[color:var(--vv-text)] tabular-nums">92%</span>
                </div>
                <div className="h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C67A4E] rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              {/* Verification */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1c2a3e]">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Verification</span>
                <div className="flex items-center gap-1.5">
                  <VerificationBadge tier={1} />
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Tier 1</span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-3">
              <Link to="/app/profile">
                <Button variant="secondary" size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Complete profile</Button>
              </Link>
            </div>
          </div>

          {/* Next Action - single dominant CTA */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Sign term sheet</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">Meridian Capital is waiting on your signature to advance to the funding stage.</p>
              <Link to="/app/deal-room">
                <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Open deal room</Button>
              </Link>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
              <div className="flex items-center gap-1.5">
                <IconZap s={12} className="text-[#C67A4E]" />
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">AI Suggestions</p>
              </div>
              <span className="text-[10px] text-[#C67A4E] font-mono">3 new</span>
            </div>
            {loading ? <SkeletonRows rows={3} /> : AI_SUGGESTIONS.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">Complete your profile to unlock AI suggestions.</p>
            ) : (
              <div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <div key={i} className="px-4 py-3 border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">{s.name[0]}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate">{s.name}</p>
                            <VerificationBadge tier={s.tier} />
                          </div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5">{s.type}</p>
                        </div>
                      </div>
                      <ScoreChip score={s.match} label="Match" topFactors={['Industry: FinTech', 'Stage: Seed']} />
                    </div>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] ml-8 leading-snug mb-1">{s.note}</p>
                    <p className="text-[10.5px] text-[#C67A4E]/70 ml-8 leading-snug">Why matched: {s.reason}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
              <Link to="/app/founder/discover-investors">
                <Button variant="tertiary" size="sm" className="w-full text-[11.5px]" iconRight={<IconArrowRight s={11} />}>All suggestions</Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}