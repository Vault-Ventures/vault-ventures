import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { IconZap, IconArrowRight } from '../../components/layout/Icons';

// --- Data --------------------------------------------------------------------

const METRICS = [
  { label: 'Active Applications', value: '4', sub: '1 awaiting response', color: '#EAF0FA' },
  { label: 'Active Deal Rooms', value: '2', sub: '1 action required', color: '#F59E0B' },
  { label: 'Profile Views', value: '61', sub: 'Last 30 days', color: '#EAF0FA' },
  { label: 'Avg Match Score', value: '84%', sub: 'Recommended opps', color: '#C67A4E', ai: true },
];

const RECOMMENDED = [
  {
    name: 'NovaTech AI',
    industry: 'FinTech - AI/ML',
    stage: 'Seed',
    seeking: ['AI/ML', 'Product Strategy', 'Data Analysis'],
    match: 91,
    tier: 2 as const,
    reason: 'AI/ML + Product + FinTech - all in your top skills',
    type: 'Advisory',
  },
  {
    name: 'Orbit Analytics',
    industry: 'Data - SaaS',
    stage: 'Pre-seed',
    seeking: ['Data Engineering', 'Growth'],
    match: 83,
    tier: 1 as const,
    reason: 'Data Engineering match + early-stage preference',
    type: 'Contract',
  },
  {
    name: 'Medify Health',
    industry: 'HealthTech - B2C',
    stage: 'Seed',
    seeking: ['Product Strategy', 'UX Research'],
    match: 76,
    tier: 2 as const,
    reason: 'Product background + health-adjacent portfolio',
    type: 'Advisory',
  },
];

const APPLICATIONS = [
  { business: 'NovaTech AI', role: 'AI/ML Advisor', applied: '3d ago', updated: '1h ago', statusV: 'accent' as const, status: 'Under Review', action: 'Follow up' },
  { business: 'Orbit Analytics', role: 'Data Engineering Consultant', applied: '1w ago', updated: '2d ago', statusV: 'info' as const, status: 'Submitted', action: 'View application' },
  { business: 'Structra Build', role: 'Product Strategist', applied: '2w ago', updated: '5d ago', statusV: 'success' as const, status: 'Accepted', action: 'Open Deal Room' },
  { business: 'Chainlink Legal', role: 'Technical Advisor', applied: '3w ago', updated: '1w ago', statusV: 'neutral' as const, status: 'Withdrawn', action: null },
];

const DEAL_ROOMS = [
  { business: 'NovaTech AI', participant: 'Alex Morgan', stage: 'Interest Confirmed', stageV: 'accent' as const, updated: '3h ago', action: 'Advance engagement' },
  { business: 'Structra Build', participant: 'Jamie Torres', stage: 'NDA Signed', stageV: 'info' as const, updated: '1d ago', action: 'Review terms' },
];

const STRONG_SKILLS = [
  { name: 'AI/ML', level: 92 },
  { name: 'Product Strategy', level: 88 },
  { name: 'Data Analysis', level: 81 },
  { name: 'FinTech Domain', level: 77 },
  { name: 'Growth Strategy', level: 70 },
];

const SKILL_GAPS = ['UX Research', 'Hardware Integration', 'Regulatory Compliance'];

const ACTIVITY = [
  { text: 'NovaTech AI viewed your application', time: '2h ago', dot: '#C67A4E' },
  { text: 'New opportunity matched: Orbit Analytics at 83%', time: '5h ago', dot: '#C67A4E' },
  { text: 'Structra Build accepted your connection', time: 'Yesterday', dot: '#3B82F6' },
  { text: 'Deal Room updated by Jamie Torres', time: '2d ago', dot: '#F59E0B' },
  { text: 'Tier 1 verification approved', time: '4d ago', dot: '#C9A24B' },
];

// --- Sub-components -----------------------------------------------------------

function SkillBar({ name, level }: { name: string; level: number }) {
  const color = level >= 85 ? '#C67A4E' : level >= 70 ? '#3B82F6' : '#5E6D8F';
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] w-28 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${level}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[10.5px] tabular-nums w-7 text-right shrink-0" style={{ color }}>{level}</span>
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
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Professional workspace</p>
        </div>
        <Link to="/app/profile">
          <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>View profile</Button>
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
            {loading ? <SkeletonRows rows={3} /> : RECOMMENDED.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No matching opportunities yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Add more skills and experience to improve your AI-powered recommendations.</p>
                <Link to="/app/professional/profile-edit">
                  <Button size="sm">Update Profile</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Industry', 'Stage', 'Looking for', 'Type', 'Match', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECOMMENDED.map((r, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0">{r.name[0]}</div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.name}</span>
                                <VerificationBadge tier={r.tier} />
                              </div>
                              <p className="text-[10.5px] text-[#C67A4E]/70 mt-0.5 leading-snug">{r.reason}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{r.industry}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] whitespace-nowrap">{r.stage}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.seeking.map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded text-[color:var(--vv-text-secondary)]">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreChip score={r.match} label="Match" topFactors={['Skill overlap', 'Industry: FinTech']} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Apply</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {/* Mobile rows */}
                <div className="md:hidden">
                  {RECOMMENDED.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[#C67A4E] shrink-0 mt-0.5">{r.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{r.name}</p>
                          <VerificationBadge tier={r.tier} />
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">{r.industry} - {r.stage} - {r.type}</p>
                        <p className="text-[10.5px] text-[#C67A4E]/70 leading-snug">{r.reason}</p>
                      </div>
                      <ScoreChip score={r.match} label="Match" topFactors={['Skill overlap', 'Industry fit']} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Applications */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="My Applications"
              action={<Link to="/app/professional/applications"><Button variant="ghost" size="sm" iconRight={<IconArrowRight s={11} />}>All</Button></Link>}
            />
            {loading ? <SkeletonRows rows={3} /> : APPLICATIONS.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No applications yet</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-xs mx-auto">Browse recommended opportunities and submit your first application.</p>
                <Link to="/app/professional/discover">
                  <Button variant="secondary" size="sm" iconRight={<IconArrowRight s={12} />}>Discover opportunities</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Role / Contribution', 'Applied', 'Last activity', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {APPLICATIONS.map((a, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{a.business}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{a.role}</td>
                        <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums whitespace-nowrap">{a.applied}</td>
                        <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums whitespace-nowrap">{a.updated}</td>
                        <td className="px-4 py-3"><Badge variant={a.statusV} dot>{a.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          {a.action && (
                            a.action === 'Open Deal Room'
                              ? <Link to="/app/deal-room"><Button variant="ghost" size="sm">{a.action}</Button></Link>
                              : <Button variant="ghost" size="sm">{a.action}</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="md:hidden">
                  {APPLICATIONS.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{a.business}</p>
                          <Badge variant={a.statusV} dot>{a.status}</Badge>
                        </div>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] truncate">{a.role} - {a.updated}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Deal Rooms */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader
              title="Active Deal Rooms"
              badge={<Badge variant="warning">1 action</Badge>}
            />
            {loading ? <SkeletonRows rows={2} /> : DEAL_ROOMS.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No active deal rooms</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-xs mx-auto">Deal rooms open when a founder advances your application beyond initial interest.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto"><table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[#1c2a3e]">
                      {['Business', 'Participant', 'Stage', 'Last activity', 'Next action', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEAL_ROOMS.map((d, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{d.business}</td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{d.participant}</td>
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
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{d.business} - {d.participant}</p>
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
            {DEAL_ROOMS.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
                <Link to="/app/deal-room">
                  <Button variant="tertiary" size="sm" className="w-full text-[11.5px]" iconRight={<IconArrowRight s={11} />}>All deal rooms</Button>
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* -- Sidebar ----------------------------------------------------- */}
        <div className="space-y-4 order-1 xl:order-2">

          {/* Next Action */}
          <div className="bg-[#121A2B] border border-[#C67A4E]/20 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] animate-pulse" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Next Action</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Follow up with NovaTech AI</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">Your application has been under review for 3 days. A brief follow-up message can keep you visible.</p>
              <Link to="/app/deal-room">
                <Button size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Open deal room</Button>
              </Link>
            </div>
          </div>

          {/* Skill Matching */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--vv-border)]">
              <IconZap s={12} className="text-[#C67A4E]" />
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Skill Matching</p>
            </div>
            {loading ? <SkeletonRows rows={4} /> : (
              <>
                <div className="px-4 py-3 space-y-2.5 border-b border-[#1c2a3e]">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Your strongest matches</p>
                  {STRONG_SKILLS.map(s => <SkillBar key={s.name} {...s} />)}
                </div>
                <div className="px-4 py-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Skills in demand - gaps</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILL_GAPS.map(s => (
                      <span key={s} className="text-[10.5px] px-2 py-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded text-[color:var(--vv-text-tertiary)]">{s}</span>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]/70 mt-2 leading-snug">Adding these skills could improve your match score by up to 12 pts.</p>
                </div>
              </>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <SectionHeader title="Profile Completion" />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Overall profile</span>
                <span className="font-mono text-[12px] text-[color:var(--vv-text)] tabular-nums">84%</span>
              </div>
              <div className="h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-[#C67A4E] rounded-full" style={{ width: '84%' }} />
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Skills added', done: true },
                  { label: 'Add portfolio', done: false },
                  { label: 'Add availability', done: false },
                  { label: 'Tier 2 verification', done: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${item.done ? 'border-[#C67A4E] bg-[#C67A4E]/10' : 'border-[color:var(--vv-border-strong)]'}`}>
                      {item.done && (
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11.5px] ${item.done ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 pb-3">
              <Link to="/app/professional/profile-edit">
                <Button variant="secondary" size="sm" className="w-full text-[12px]" iconRight={<IconArrowRight s={11} />}>Complete profile</Button>
              </Link>
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