import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle,
  IconFilter, IconEye, IconFileText, IconChevronDown,
} from '../../components/layout/Icons';

// ─── Types ──────────────────────────────────────────────────────────────────

type TeamStatus = 'Active' | 'Pending' | 'Completed' | 'Suspended';
type UserRole = 'Founder' | 'Investor' | 'Professional';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
type MemberStatus = 'Active' | 'Suspended' | 'Pending';

interface TeamMember {
  name: string;
  role: UserRole;
  teamRole: string;
  verification: 0 | 1 | 2;
  status: MemberStatus;
  joined: string;
}

interface Team {
  id: string;
  name: string;
  business: string;
  businessIndustry: string;
  businessStage: string;
  businessFounder: string;
  lead: string;
  members: TeamMember[];
  status: TeamStatus;
  created: string;
  lastActivity: string;
  flags: number;
  risk: RiskLevel;
  milestones: { label: string; done: boolean }[];
  activity: { action: string; time: string; actor: string }[];
  audit: { action: string; time: string; actor: string }[];
}

// ─── Data ───────────────────────────────────────────────────────────────────

const ALL_TEAMS: Team[] = [
  {
    id: 'TM-0011', name: 'NovaTech Core Team', business: 'NovaTech AI',
    businessIndustry: 'FinTech', businessStage: 'Seed', businessFounder: 'Alex Morgan',
    lead: 'Alex Morgan', status: 'Active', created: 'Feb 10, 2026', lastActivity: '2h ago',
    flags: 0, risk: 'None',
    members: [
      { name: 'Alex Morgan', role: 'Founder', teamRole: 'CEO & Founder', verification: 1, status: 'Active', joined: 'Feb 10' },
      { name: 'Jordan Lee', role: 'Professional', teamRole: 'CTO', verification: 1, status: 'Active', joined: 'Feb 10' },
      { name: 'Sarah Chen', role: 'Professional', teamRole: 'Product Strategy', verification: 1, status: 'Active', joined: 'Mar 5' },
      { name: 'James Okafor', role: 'Investor', teamRole: 'Lead Investor', verification: 1, status: 'Active', joined: 'Mar 20' },
    ],
    milestones: [
      { label: 'Team formation', done: true },
      { label: 'MVP delivery', done: true },
      { label: 'Seed close', done: false },
      { label: 'Series A prep', done: false },
    ],
    activity: [
      { action: 'Sarah Chen added as Product Strategy lead', time: '2h ago', actor: 'Alex Morgan' },
      { action: 'Milestone: MVP delivery completed', time: '5d ago', actor: 'Jordan Lee' },
      { action: 'James Okafor joined as Lead Investor', time: 'Mar 20', actor: 'system' },
    ],
    audit: [
      { action: 'Team created', time: 'Feb 10 · 09:00', actor: 'system' },
      { action: 'Reviewed by admin', time: 'Feb 11 · 10:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'TM-0012', name: 'Orbit Analytics Growth', business: 'Orbit Analytics',
    businessIndustry: 'SaaS', businessStage: 'Series A', businessFounder: 'Riley Kim',
    lead: 'Riley Kim', status: 'Active', created: 'Jan 5, 2026', lastActivity: '1d ago',
    flags: 0, risk: 'None',
    members: [
      { name: 'Riley Kim', role: 'Founder', teamRole: 'CEO', verification: 2, status: 'Active', joined: 'Jan 5' },
      { name: 'Priya Nair', role: 'Professional', teamRole: 'CPO', verification: 0, status: 'Active', joined: 'Jan 10' },
      { name: 'Sam Wu', role: 'Professional', teamRole: 'CRO', verification: 1, status: 'Active', joined: 'Jan 15' },
    ],
    milestones: [
      { label: 'Team onboarded', done: true },
      { label: 'Series A deck finalized', done: true },
      { label: 'Investor introductions', done: true },
      { label: 'Term sheet', done: false },
    ],
    activity: [
      { action: 'Milestone: Investor introductions completed', time: '1d ago', actor: 'Riley Kim' },
      { action: 'Sam Wu role updated to CRO', time: '3d ago', actor: 'Riley Kim' },
    ],
    audit: [
      { action: 'Team created', time: 'Jan 5 · 10:00', actor: 'system' },
    ],
  },
  {
    id: 'TM-0013', name: 'GreenPath Ops Team', business: 'GreenPath Logistics',
    businessIndustry: 'Logistics', businessStage: 'Pre-Seed', businessFounder: 'Elena Vasquez',
    lead: 'Elena Vasquez', status: 'Pending', created: 'Apr 2, 2026', lastActivity: '3d ago',
    flags: 1, risk: 'Low',
    members: [
      { name: 'Elena Vasquez', role: 'Founder', teamRole: 'Co-Founder & CEO', verification: 0, status: 'Active', joined: 'Apr 2' },
      { name: 'Taiwo Adebayo', role: 'Professional', teamRole: 'Ops Lead', verification: 0, status: 'Pending', joined: 'Apr 5' },
    ],
    milestones: [
      { label: 'Team formation', done: true },
      { label: 'First pilot customer', done: false },
      { label: 'Pre-seed close', done: false },
    ],
    activity: [
      { action: 'Taiwo Adebayo invited as Ops Lead', time: '3d ago', actor: 'Elena Vasquez' },
      { action: 'Team created', time: 'Apr 2', actor: 'system' },
    ],
    audit: [
      { action: 'Team created', time: 'Apr 2 · 11:00', actor: 'system' },
      { action: 'Flag raised (incomplete profile)', time: 'Apr 3 · 09:00', actor: 'system' },
    ],
  },
  {
    id: 'TM-0014', name: 'Meridian Health Core', business: 'Meridian Health',
    businessIndustry: 'HealthTech', businessStage: 'Seed', businessFounder: 'Priya Nair',
    lead: 'Priya Nair', status: 'Suspended', created: 'Mar 1, 2026', lastActivity: '5d ago',
    flags: 2, risk: 'Medium',
    members: [
      { name: 'Priya Nair', role: 'Founder', teamRole: 'CEO', verification: 0, status: 'Active', joined: 'Mar 1' },
      { name: 'James Okafor', role: 'Professional', teamRole: 'Medical Advisor', verification: 1, status: 'Suspended', joined: 'Mar 10' },
    ],
    milestones: [
      { label: 'Team formed', done: true },
      { label: 'MVP launched', done: false },
    ],
    activity: [
      { action: 'Team suspended pending review', time: '5d ago', actor: 'admin@vault.io' },
      { action: 'Flag raised (conflict of interest)', time: '6d ago', actor: 'admin@vault.io' },
    ],
    audit: [
      { action: 'Team created', time: 'Mar 1 · 09:00', actor: 'system' },
      { action: 'Flagged: conflict of interest', time: 'Apr 16 · 13:00', actor: 'admin@vault.io' },
      { action: 'Team suspended', time: 'Apr 16 · 13:30', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'TM-0015', name: 'Nova Robotics Build', business: 'Nova Robotics',
    businessIndustry: 'Robotics', businessStage: 'Pre-Seed', businessFounder: 'Marcus Williams',
    lead: 'Marcus Williams', status: 'Active', created: 'Apr 15, 2026', lastActivity: '6h ago',
    flags: 0, risk: 'None',
    members: [
      { name: 'Marcus Williams', role: 'Founder', teamRole: 'CEO & Lead Engineer', verification: 0, status: 'Active', joined: 'Apr 15' },
      { name: 'Sara Lin', role: 'Professional', teamRole: 'Lead Engineer', verification: 0, status: 'Active', joined: 'Apr 15' },
    ],
    milestones: [
      { label: 'Team formation', done: true },
      { label: 'Prototype v1', done: false },
    ],
    activity: [
      { action: 'Sara Lin added as Lead Engineer', time: '6h ago', actor: 'Marcus Williams' },
      { action: 'Team created', time: 'Apr 15', actor: 'system' },
    ],
    audit: [
      { action: 'Team created', time: 'Apr 15 · 10:00', actor: 'system' },
    ],
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  None: '#5E6D8F', Low: '#C67A4E', Medium: '#F59E0B', High: '#F04438', Critical: '#F04438',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusVariant = (s: TeamStatus) =>
  s === 'Active' ? 'success' : s === 'Suspended' ? 'danger' : s === 'Completed' ? 'info' : 'neutral';

const memberStatusVariant = (s: MemberStatus) =>
  s === 'Active' ? 'success' : s === 'Suspended' ? 'danger' : 'neutral';

function RolePill({ role }: { role: UserRole }) {
  const color: Record<UserRole, string> = {
    Founder: 'text-[#C67A4E] border-[#C67A4E]/30 bg-[#C67A4E]/8',
    Investor: 'text-[#C9A24B] border-[#C9A24B]/30 bg-[#C9A24B]/8',
    Professional: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8',
  };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color[role]}`}>{role}</span>;
}

function AvatarStack({ members, max = 4 }: { members: TeamMember[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - max;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m, i) => (
        <div key={i} className="w-5 h-5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#0D1626] flex items-center justify-center text-[8px] font-bold text-[color:var(--vv-text)] shrink-0">
          {m.name[0]}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-5 h-5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] border border-[#0D1626] flex items-center justify-center text-[8px] font-bold text-[color:var(--vv-text-tertiary)] shrink-0">
          +{extra}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="w-7 h-7 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-2 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Suspend modal ────────────────────────────────────────────────────────────

function SuspendModal({ team, onSuspend, onCancel }: { team: Team; onSuspend: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="suspend-team-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="suspend-team-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Suspend Team</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{team.name} · {team.business}</p>
          </div>
        </div>
        <div className="p-3 bg-[#F04438]/8 border border-[#F04438]/20 rounded-md mb-4">
          <p className="text-[12px] text-[#F04438]">Suspending this team will restrict all collaborative activity and visibility until restored.</p>
        </div>
        <div className="space-y-2 mb-4">
          {[
            { label: 'Team', value: team.name },
            { label: 'Business', value: team.business },
            { label: 'Current status', value: team.status },
          ].map((r, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
              <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Reason <span className="text-[#F04438]">*</span></label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
            <option value="">Select a reason…</option>
            {['Policy violation', 'Conflict of interest', 'Suspicious activity', 'Compliance hold', 'Admin review', 'Other'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onSuspend()} disabled={!reason}>
            Suspend Team
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore modal ────────────────────────────────────────────────────────────

function RestoreModal({ team, onRestore, onCancel }: { team: Team; onRestore: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="restore-team-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="restore-team-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Restore Team</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{team.name}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] mb-5 leading-snug">
          Restoring this team will resume collaborative activity and visibility. This action will be logged in audit history.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onRestore}>
            Restore Team
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function TeamDrawer({ team, onClose, onSuspend, onRestore }: {
  team: Team;
  onClose: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}) {
  const [section, setSection] = useState<'overview' | 'members' | 'activity' | 'audit'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="team-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p id="team-drawer-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{team.name}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{team.id} · {team.business}</p>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(team.status)} dot>{team.status}</Badge>
            <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{team.members.length} members</span>
            <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">· Created {team.created}</span>
            {team.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[team.risk] }}>
                <IconAlertTriangle s={10} />{team.flags} flag{team.flags > 1 ? 's' : ''} · {team.risk}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['overview', 'members', 'activity', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{t === 'audit' ? 'Audit' : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {section === 'overview' && (
            <div className="px-5 py-4 space-y-5">
              {/* Business */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Business</p>
                <div className="space-y-0">
                  {[
                    { label: 'Name', value: team.business },
                    { label: 'Industry', value: team.businessIndustry },
                    { label: 'Stage', value: <Badge variant="neutral">{team.businessStage}</Badge> },
                    { label: 'Founder', value: team.businessFounder },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                  <IconEye s={11} /> View business
                </button>
              </div>

              {/* Milestones */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Milestones</p>
                <div className="space-y-2">
                  {team.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${m.done ? 'bg-[#22C55E]/10 border-[#22C55E]/50' : 'border-[color:var(--vv-border-strong)]'}`}>
                        {m.done && <IconCheck s={8} className="text-[#22C55E]" />}
                      </div>
                      <span className={`text-[11.5px] ${m.done ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              {team.flags > 0 && (
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F59E0B]/20 rounded-md">
                  <p className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold mb-1">Active Flags</p>
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle s={12} className="text-[#F59E0B]" />
                    <span className="text-[12px] font-medium" style={{ color: RISK_COLORS[team.risk] }}>
                      {team.flags} flag{team.flags > 1 ? 's' : ''} · {team.risk} risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'members' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Team Members <span className="text-[#35446A] normal-case font-normal">({team.members.length})</span>
              </p>
              <div className="space-y-2">
                {team.members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px] hover:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{m.name}</p>
                        <RolePill role={m.role} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] truncate">{m.teamRole}</p>
                        <span className="text-[10px] text-[#35446A]">·</span>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">Joined {m.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <VerificationBadge tier={m.verification} />
                      <Badge variant={memberStatusVariant(m.status)}>{m.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10.5px] text-[color:var(--vv-text-tertiary)]">Click a member to navigate to their Admin user profile.</p>
            </div>
          )}

          {section === 'activity' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Recent Activity</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {team.activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{a.action}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{a.time} · {a.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'audit' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Audit History</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {team.audit.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{a.action}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{a.time} · {a.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                View full audit logs <IconFileText s={11} />
              </button>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Admin Actions</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconEye s={12} />}>View Business</Button>
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconFileText s={12} />}>Audit Logs</Button>
            </div>
            {team.status === 'Suspended' ? (
              <Button size="sm" className="w-full bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                icon={<IconCheck s={12} />} onClick={onRestore}>
                Restore Team
              </Button>
            ) : (
              <Button variant="destructive" size="sm" className="w-full" icon={<IconX s={12} />} onClick={onSuspend}>
                Suspend Team
              </Button>
            )}
          </div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">All actions are logged and auditable.</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminTeams() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>(ALL_TEAMS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<Team | null>(null);
  const [modal, setModal] = useState<'suspend' | 'restore' | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    total: teams.length,
    active: teams.filter(t => t.status === 'Active').length,
    pending: teams.filter(t => t.status === 'Pending').length,
    flagged: teams.filter(t => t.flags > 0).length,
  };

  const filtered = teams.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.business.toLowerCase().includes(q)) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (flagFilter === 'Flagged' && t.flags === 0) return false;
    if (flagFilter === 'No flags' && t.flags > 0) return false;
    return true;
  });

  const hasFilters = !!(search || statusFilter || flagFilter !== 'All');
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setFlagFilter('All'); };

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every(t => selected.has(t.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(t => t.id)));

  const applyStatus = (id: string, status: TeamStatus) => {
    setTeams(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, status } : null);
    setModal(null);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Teams</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Manage collaboration teams, members and team activity.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Teams', value: summary.total, color: '#EAF0FA' },
          { label: 'Active', value: summary.active, color: '#22C55E' },
          { label: 'Pending', value: summary.pending, color: '#F59E0B' },
          { label: 'Flagged', value: summary.flagged, color: '#F04438' },
        ].map(s => (
          <div key={s.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-3.5 py-2.5">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1 leading-none">{s.label}</p>
            <p className="font-mono text-[20px] font-semibold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or business…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
              <option value="">All statuses</option>
              {['Active', 'Pending', 'Completed', 'Suspended'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selCls}>
              {['All', 'Flagged', 'No flags'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          <button onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]">
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">Clear filters</button>}
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {teams.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All statuses</option>
              {['Active', 'Pending', 'Completed', 'Suspended'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selCls + " w-full"}>
              {['All', 'Flagged', 'No flags'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md">
            <span className="text-[12px] text-[color:var(--vv-text-secondary)]">{selected.size} selected</span>
            <Button variant="ghost" size="sm">Export Selected</Button>
            <Button variant="ghost" size="sm">Review Selected</Button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto mb-3">
              <IconFileText s={18} className="text-[#35446A]" />
            </div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No teams found.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                    </th>
                    {['Team', 'Business', 'Members', 'Lead', 'Status', 'Created', 'Last Activity', 'Flags', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${t.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                      onClick={() => setDrawer(t)}>
                      <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(t.id); }}>
                        <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                          className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{t.name}</p>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{t.id}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{t.business}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <AvatarStack members={t.members} />
                          <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] tabular-nums">{t.members.length}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{t.lead}</td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(t.status)} dot>{t.status}</Badge></td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{t.created}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{t.lastActivity}</td>
                      <td className="px-3 py-3">
                        {t.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>
                          : <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: RISK_COLORS[t.risk] }}>
                              <IconAlertTriangle s={11} />{t.flags}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(t)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(t => (
                <div key={t.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${t.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(t)}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{t.name}</p>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{t.business}</p>
                    </div>
                    <Badge variant={statusVariant(t.status)} dot>{t.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <AvatarStack members={t.members} />
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{t.members.length} members</span>
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono ml-auto">{t.lastActivity}</span>
                    {t.flags > 0 && (
                      <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: RISK_COLORS[t.risk] }}>
                        <IconAlertTriangle s={10} />{t.flags}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {drawer && (
        <TeamDrawer
          team={drawer}
          onClose={() => setDrawer(null)}
          onSuspend={() => setModal('suspend')}
          onRestore={() => setModal('restore')}
        />
      )}

      {/* Modals */}
      {drawer && modal === 'suspend' && (
        <SuspendModal team={drawer} onSuspend={() => applyStatus(drawer.id, 'Suspended')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'restore' && (
        <RestoreModal team={drawer} onRestore={() => applyStatus(drawer.id, 'Active')} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}