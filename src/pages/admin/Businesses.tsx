import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle, IconShield,
  IconFilter, IconEye, IconFileText, IconChevronDown,
} from '../../components/layout/Icons';

// ─── Types ─────────────────────────────────────────────────────────────────

type BizStatus = 'Active' | 'Pending' | 'Under Review' | 'Suspended' | 'Restricted';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
type FlagSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type UserRole = 'Founder' | 'Investor' | 'Professional';

interface Business {
  id: string;
  name: string;
  tagline: string;
  initials: string;
  color: string;
  founder: string;
  founderRoles: UserRole[];
  industry: string;
  stage: string;
  ask: string;
  readiness: number;
  verificationTier: 0 | 1 | 2;
  status: BizStatus;
  flags: number;
  risk: RiskLevel;
  location: string;
  founded: string;
  created: string;
  description: string;
  team: { name: string; role: string }[];
  funding: { raised: string; target: string; round: string; investors: string };
  readinessFactors: { label: string; score: number }[];
}

// ─── Data ──────────────────────────────────────────────────────────────────

const ALL_BUSINESSES: Business[] = [
  {
    id: 'BIZ-0001', name: 'NovaTech AI', tagline: 'AI-powered compliance for financial services', initials: 'NT', color: '#C67A4E',
    founder: 'Alex Morgan', founderRoles: ['Founder', 'Investor'], industry: 'FinTech', stage: 'Seed',
    ask: '৳60,00,000', readiness: 78, verificationTier: 1, status: 'Active', flags: 0, risk: 'None',
    location: 'Dhaka, Bangladesh', founded: 'Jan 2023', created: 'Mar 12, 2024',
    description: 'NovaTech AI builds compliance automation tools for banks and fintechs, reducing manual review time by 60%.',
    team: [{ name: 'Alex Morgan', role: 'CEO' }, { name: 'Jordan Lee', role: 'CTO' }],
    funding: { raised: '৳15,00,000', target: '৳60,00,000', round: 'Seed', investors: '2 angel investors' },
    readinessFactors: [{ label: 'Pitch deck', score: 90 }, { label: 'Financials', score: 70 }, { label: 'Legal', score: 65 }, { label: 'Team', score: 85 }],
  },
  {
    id: 'BIZ-0002', name: 'GreenPath Logistics', tagline: 'Sustainable last-mile delivery platform', initials: 'GP', color: '#22C55E',
    founder: 'Elena Vasquez', founderRoles: ['Founder'], industry: 'Logistics', stage: 'Pre-Seed',
    ask: '৳30,00,000', readiness: 55, verificationTier: 0, status: 'Pending', flags: 1, risk: 'Low',
    location: 'Chattogram, Bangladesh', founded: 'Aug 2024', created: 'Apr 2, 2025',
    description: 'GreenPath replaces diesel fleets with electric cargo bikes in dense urban corridors.',
    team: [{ name: 'Elena Vasquez', role: 'CEO' }, { name: 'Taiwo Adebayo', role: 'Ops Lead' }],
    funding: { raised: '৳0', target: '৳30,00,000', round: 'Pre-Seed', investors: 'None yet' },
    readinessFactors: [{ label: 'Pitch deck', score: 60 }, { label: 'Financials', score: 40 }, { label: 'Legal', score: 55 }, { label: 'Team', score: 70 }],
  },
  {
    id: 'BIZ-0003', name: 'Orbit Analytics', tagline: 'Real-time product intelligence for SaaS', initials: 'OA', color: '#8B5CF6',
    founder: 'Riley Kim', founderRoles: ['Founder'], industry: 'SaaS', stage: 'Series A',
    ask: '৳2,50,00,000', readiness: 91, verificationTier: 2, status: 'Active', flags: 0, risk: 'None',
    location: 'Sylhet, Bangladesh', founded: 'Feb 2022', created: 'Jan 5, 2024',
    description: 'Orbit provides event-driven analytics with AI-generated feature usage insights for growth teams.',
    team: [{ name: 'Riley Kim', role: 'CEO' }, { name: 'Priya Nair', role: 'CPO' }, { name: 'Sam Wu', role: 'CRO' }],
    funding: { raised: '৳75,00,000', target: '৳2,50,00,000', round: 'Series A', investors: 'Apex Ventures (lead)' },
    readinessFactors: [{ label: 'Pitch deck', score: 95 }, { label: 'Financials', score: 88 }, { label: 'Legal', score: 90 }, { label: 'Team', score: 92 }],
  },
  {
    id: 'BIZ-0004', name: 'Meridian Health', tagline: 'Chronic disease management via wearables', initials: 'MH', color: '#F59E0B',
    founder: 'Priya Nair', founderRoles: ['Founder', 'Professional'], industry: 'HealthTech', stage: 'Seed',
    ask: '৳1,20,00,000', readiness: 66, verificationTier: 1, status: 'Under Review', flags: 2, risk: 'Medium',
    location: 'Rajshahi, Bangladesh', founded: 'May 2023', created: 'Jun 20, 2024',
    description: 'Meridian integrates with consumer wearables to deliver personalized chronic condition management plans.',
    team: [{ name: 'Priya Nair', role: 'CEO' }, { name: 'James Okafor', role: 'Medical Advisor' }],
    funding: { raised: '৳20,00,000', target: '৳1,20,00,000', round: 'Seed', investors: '1 institutional, 1 angel' },
    readinessFactors: [{ label: 'Pitch deck', score: 75 }, { label: 'Financials', score: 50 }, { label: 'Legal', score: 60 }, { label: 'Team', score: 80 }],
  },
  {
    id: 'BIZ-0005', name: 'ShadyToken Protocol', tagline: '—', initials: 'ST', color: '#F04438',
    founder: 'Unknown Account', founderRoles: ['Founder'], industry: 'Crypto', stage: 'Pre-Seed',
    ask: '৳5,00,00,000', readiness: 12, verificationTier: 0, status: 'Suspended', flags: 3, risk: 'Critical',
    location: '—', founded: '—', created: 'Apr 20, 2025',
    description: 'No verifiable business description provided.',
    team: [{ name: 'Unknown', role: '—' }],
    funding: { raised: '—', target: '৳5,00,00,000', round: 'Pre-Seed', investors: '—' },
    readinessFactors: [{ label: 'Pitch deck', score: 10 }, { label: 'Financials', score: 5 }, { label: 'Legal', score: 8 }, { label: 'Team', score: 20 }],
  },
  {
    id: 'BIZ-0006', name: 'Nova Robotics', tagline: 'Autonomous warehouse picking systems', initials: 'NR', color: '#3B82F6',
    founder: 'Marcus Williams', founderRoles: ['Founder'], industry: 'Robotics', stage: 'Pre-Seed',
    ask: '৳80,00,000', readiness: 48, verificationTier: 0, status: 'Pending', flags: 0, risk: 'None',
    location: 'Khulna, Bangladesh', founded: 'Oct 2024', created: 'Apr 15, 2025',
    description: 'Nova Robotics develops AI-driven robotic arms for e-commerce fulfillment centers.',
    team: [{ name: 'Marcus Williams', role: 'CEO' }, { name: 'Sara Lin', role: 'Lead Engineer' }],
    funding: { raised: '৳0', target: '৳80,00,000', round: 'Pre-Seed', investors: 'None yet' },
    readinessFactors: [{ label: 'Pitch deck', score: 55 }, { label: 'Financials', score: 30 }, { label: 'Legal', score: 45 }, { label: 'Team', score: 60 }],
  },
];

const AUDIT_ENTRIES: Record<string, { action: string; time: string; actor: string }[]> = {
  'BIZ-0004': [
    { action: 'Placed under review', time: 'Apr 18 · 09:15', actor: 'admin@vault.io' },
    { action: 'Flag added (Medium risk)', time: 'Apr 18 · 09:20', actor: 'admin@vault.io' },
    { action: 'Review requested from compliance', time: 'Apr 18 · 10:00', actor: 'compliance@vault.io' },
  ],
  'BIZ-0005': [
    { action: 'Business created', time: 'Apr 20 · 08:00', actor: 'system' },
    { action: 'Flagged (Critical)', time: 'Apr 20 · 11:00', actor: 'admin@vault.io' },
    { action: 'Account suspended', time: 'Apr 20 · 11:30', actor: 'admin@vault.io' },
  ],
  default: [
    { action: 'Business registered', time: 'On file', actor: 'system' },
    { action: 'Reviewed by admin', time: 'On file', actor: 'admin@vault.io' },
  ],
};

const INDUSTRIES = ['All industries', 'FinTech', 'HealthTech', 'SaaS', 'Logistics', 'Robotics', 'Crypto'];
const STAGES = ['All stages', 'Pre-Seed', 'Seed', 'Series A', 'Series B'];
const FLAG_OPTIONS = ['All', 'Flagged', 'No flags'];
const RISK_COLORS: Record<RiskLevel, string> = {
  None: '#5E6D8F', Low: '#C67A4E', Medium: '#F59E0B', High: '#F04438', Critical: '#F04438',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusVariant = (s: BizStatus) =>
  s === 'Active' ? 'success' : s === 'Suspended' ? 'danger' : s === 'Restricted' ? 'danger' : s === 'Under Review' ? 'info' : 'neutral';

function RolePills({ roles }: { roles: UserRole[] }) {
  const color: Record<UserRole, string> = {
    Founder: 'text-[#C67A4E] border-[#C67A4E]/30 bg-[#C67A4E]/8',
    Investor: 'text-[#C9A24B] border-[#C9A24B]/30 bg-[#C9A24B]/8',
    Professional: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8',
  };
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => (
        <span key={r} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color[r]}`}>{r}</span>
      ))}
    </div>
  );
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? '#C67A4E' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#F04438';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] tabular-nums w-6 shrink-0" style={{ color }}>{score}</span>
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden min-w-[40px]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
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
          <div className="h-4 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Flag modal ─────────────────────────────────────────────────────────────

function FlagModal({ biz, onFlag, onCancel }: {
  biz: Business | null;
  onFlag: (severity: FlagSeverity, reason: string, notes: string) => void;
  onCancel: () => void;
}) {
  if (!biz) return null;
  const [severity, setSeverity] = useState<FlagSeverity>('Low');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const selectCls = "w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="flag-business-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
            <IconAlertTriangle s={14} className="text-[#F59E0B]" />
          </div>
          <div>
            <p id="flag-business-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Flag Business</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{biz.name}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Severity <span className="text-[#F04438]">*</span></label>
            <select value={severity} onChange={e => setSeverity(e.target.value as FlagSeverity)} className={selectCls}>
              {(['Low', 'Medium', 'High', 'Critical'] as FlagSeverity[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Reason <span className="text-[#F04438]">*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)} className={selectCls}>
              <option value="">Select a reason…</option>
              {['Suspicious activity', 'Incomplete / misleading information', 'Policy violation', 'Financial irregularity', 'Founder account issue', 'Other'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Admin notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Additional context for the audit record…"
              className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black border-transparent"
            onClick={() => reason && onFlag(severity, reason, notes)} disabled={!reason}>
            Flag Business
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Suspend modal ───────────────────────────────────────────────────────────

function SuspendModal({ biz, onSuspend, onCancel }: { biz: Business; onSuspend: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="suspend-business-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="suspend-business-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Suspend Business</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{biz.name} · currently {biz.status}</p>
          </div>
        </div>
        <div className="p-3 bg-[#F04438]/8 border border-[#F04438]/20 rounded-md mb-4">
          <p className="text-[12px] text-[#F04438]">This business will no longer appear in normal discovery until restored.</p>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Reason <span className="text-[#F04438]">*</span></label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
            <option value="">Select a reason…</option>
            {['Policy violation', 'Fraudulent submission', 'Financial misrepresentation', 'Legal hold', 'Admin review', 'Other'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onSuspend()} disabled={!reason}>
            Suspend Business
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore modal ───────────────────────────────────────────────────────────

function RestoreModal({ biz, onRestore, onCancel }: { biz: Business; onRestore: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="restore-business-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="restore-business-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Restore Business</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{biz.name}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] mb-5 leading-snug">
          Restoring this business will make it visible in discovery again. This action will be logged in audit history.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onRestore}>
            Restore Business
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ───────────────────────────────────────────────────────────

function BusinessDrawer({ biz, onClose, onFlag, onSuspend, onRestore }: {
  biz: Business;
  onClose: () => void;
  onFlag: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}) {
  const [section, setSection] = useState<'overview' | 'funding' | 'team' | 'audit'>('overview');
  const audit = AUDIT_ENTRIES[biz.id] ?? AUDIT_ENTRIES.default;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="business-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[14px] font-bold shrink-0"
                style={{ backgroundColor: biz.color + '20', color: biz.color, border: `1px solid ${biz.color}30` }}>
                {biz.initials}
              </div>
              <div className="min-w-0">
                <p id="business-drawer-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{biz.name}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{biz.industry} · {biz.stage} · {biz.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(biz.status)} dot>{biz.status}</Badge>
            <VerificationBadge tier={biz.verificationTier} />
            {biz.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: RISK_COLORS[biz.risk] }}>
                <IconAlertTriangle s={10} />{biz.flags} flag{biz.flags > 1 ? 's' : ''} · {biz.risk}
              </span>
            )}
          </div>
        </div>

        {/* Founder strip */}
        <div className="shrink-0 px-5 py-3 border-b border-[color:var(--vv-border)] bg-[#121A2B]/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1">Founder</p>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{biz.founder}</span>
                <RolePills roles={biz.founderRoles} />
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={<IconEye s={11} />}>View User</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['overview', 'funding', 'team', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{t === 'audit' ? 'Audit History' : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {section === 'overview' && (
            <div className="px-5 py-4 space-y-5">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Overview</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3">{biz.description}</p>
                <div className="space-y-0">
                  {[
                    { label: 'Location', value: biz.location },
                    { label: 'Founded', value: biz.founded },
                    { label: 'Registered', value: biz.created },
                    { label: 'Funding ask', value: biz.ask },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Readiness</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[22px] font-semibold tabular-nums" style={{ color: biz.readiness >= 80 ? '#C67A4E' : biz.readiness >= 60 ? '#3B82F6' : '#F59E0B' }}>{biz.readiness}</span>
                  <div className="flex-1 h-[4px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${biz.readiness}%`, backgroundColor: biz.readiness >= 80 ? '#C67A4E' : biz.readiness >= 60 ? '#3B82F6' : '#F59E0B' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {biz.readinessFactors.map(f => (
                    <div key={f.label} className="flex items-center gap-2.5">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] w-24 shrink-0">{f.label}</span>
                      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${f.score}%`, backgroundColor: f.score >= 80 ? '#C67A4E' : f.score >= 60 ? '#3B82F6' : '#F59E0B' }} />
                      </div>
                      <span className="font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)] w-6 text-right shrink-0 tabular-nums">{f.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              {biz.flags > 0 && (
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F59E0B]/20 rounded-md">
                  <p className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold mb-1">Active Flags</p>
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle s={12} className="text-[#F59E0B]" />
                    <span className="text-[12px] text-[#F59E0B] font-medium">{biz.flags} flag{biz.flags > 1 ? 's' : ''} · {biz.risk} risk</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'funding' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Funding Details</p>
              <div className="space-y-0">
                {[
                  { label: 'Funding ask', value: biz.ask },
                  { label: 'Amount raised', value: biz.funding.raised },
                  { label: 'Round', value: biz.funding.round },
                  { label: 'Current investors', value: biz.funding.investors },
                  { label: 'Stage', value: biz.stage },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
                    <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] font-medium font-mono tabular-nums">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'team' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Team Members</p>
              <div className="space-y-2">
                {biz.team.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                    <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{m.name}</p>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{m.role}</p>
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
                {audit.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 relative z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{h.action}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{h.time} · {h.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                View full audit history <IconFileText s={11} />
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
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconShield s={12} />}>Review Verification</Button>
            </div>
            <Button size="sm" className="w-full bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 hover:border-[#F59E0B]/50"
              icon={<IconAlertTriangle s={12} />} onClick={onFlag}>
              Flag Business
            </Button>
            {biz.status === 'Suspended' ? (
              <Button size="sm" className="w-full bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 hover:border-[#22C55E]/50"
                icon={<IconCheck s={12} />} onClick={onRestore}>
                Restore Business
              </Button>
            ) : (
              <Button variant="destructive" size="sm" className="w-full" icon={<IconX s={12} />} onClick={onSuspend}>
                Suspend Business
              </Button>
            )}
          </div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">All actions are logged and auditable.</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AdminBusinesses() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>(ALL_BUSINESSES);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All industries');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<Business | null>(null);
  const [modal, setModal] = useState<'flag' | 'suspend' | 'restore' | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    total: businesses.length,
    active: businesses.filter(b => b.status === 'Active').length,
    pending: businesses.filter(b => b.status === 'Pending' || b.status === 'Under Review').length,
    flagged: businesses.filter(b => b.flags > 0).length,
  };

  const filtered = businesses
    .filter(b => {
      const q = search.toLowerCase();
      if (q && !b.name.toLowerCase().includes(q) && !b.founder.toLowerCase().includes(q)) return false;
      if (industryFilter !== 'All industries' && b.industry !== industryFilter) return false;
      if (stageFilter !== 'All stages' && b.stage !== stageFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (flagFilter === 'Flagged' && b.flags === 0) return false;
      if (flagFilter === 'No flags' && b.flags > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return a.id.localeCompare(b.id);
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'readiness') return b.readiness - a.readiness;
      if (sortBy === 'ask') return parseInt(b.ask.replace(/\D/g, '')) - parseInt(a.ask.replace(/\D/g, ''));
      return 0;
    });

  const hasFilters = search || industryFilter !== 'All industries' || stageFilter !== 'All stages' || statusFilter || flagFilter !== 'All';
  const clearFilters = () => { setSearch(''); setIndustryFilter('All industries'); setStageFilter('All stages'); setStatusFilter(''); setFlagFilter('All'); };

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every(b => selected.has(b.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(b => b.id)));

  const applyStatus = (id: string, status: BizStatus) => {
    setBusinesses(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, status } : null);
    setModal(null);
  };

  const applyFlag = (id: string) => {
    setBusinesses(bs => bs.map(b => b.id === id ? { ...b, flags: b.flags + 1, risk: 'Medium' as RiskLevel } : b));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, flags: d.flags + 1 } : null);
    setModal(null);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Businesses</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Manage registered businesses, verification, readiness and platform status.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Businesses', value: summary.total, color: '#EAF0FA' },
          { label: 'Active', value: summary.active, color: '#22C55E' },
          { label: 'Pending Review', value: summary.pending, color: '#F59E0B' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business name or founder…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className={selCls}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className={selCls}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
              <option value="">All statuses</option>
              {['Active', 'Pending', 'Under Review', 'Suspended', 'Restricted'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selCls}>
              {FLAG_OPTIONS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selCls}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="readiness">Readiness</option>
              <option value="ask">Funding Ask</option>
            </select>
          </div>

          <button onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]">
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">Clear filters</button>}
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {businesses.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className={selCls + " w-full"}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className={selCls + " w-full"}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All statuses</option>
              {['Active', 'Pending', 'Under Review', 'Suspended', 'Restricted'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selCls + " w-full"}>
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
              <option value="readiness">Readiness</option><option value="ask">Funding Ask</option>
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
              <IconShield s={18} className="text-[#35446A]" />
            </div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No businesses found.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                    </th>
                    {['Business', 'Founder', 'Industry', 'Stage', 'Ask', 'Readiness', 'Verification', 'Status', 'Flags', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${b.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                      onClick={() => setDrawer(b)}>
                      <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(b.id); }}>
                        <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)}
                          className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: b.color + '20', color: b.color, border: `1px solid ${b.color}30` }}>
                            {b.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{b.name}</p>
                            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{b.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{b.founder}</td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{b.industry}</td>
                      <td className="px-3 py-3"><Badge variant="neutral">{b.stage}</Badge></td>
                      <td className="px-3 py-3 font-mono text-[12px] text-[color:var(--vv-text)] tabular-nums whitespace-nowrap">{b.ask}</td>
                      <td className="px-3 py-3 min-w-[80px]"><ReadinessBar score={b.readiness} /></td>
                      <td className="px-3 py-3"><VerificationBadge tier={b.verificationTier} /></td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(b.status)} dot>{b.status}</Badge></td>
                      <td className="px-3 py-3">
                        {b.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>
                          : <span className="flex items-center gap-1 font-medium text-[12px]" style={{ color: RISK_COLORS[b.risk] }}>
                              <IconAlertTriangle s={11} />{b.flags}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(b)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(b => (
                <div key={b.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${b.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(b)}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[7px] flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: b.color + '20', color: b.color, border: `1px solid ${b.color}30` }}>
                      {b.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{b.name}</p>
                        <Badge variant={statusVariant(b.status)} dot>{b.status}</Badge>
                      </div>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1.5">{b.founder} · {b.stage} · {b.ask}</p>
                      <div className="flex items-center gap-3">
                        <VerificationBadge tier={b.verificationTier} />
                        <ReadinessBar score={b.readiness} />
                        {b.flags > 0 && (
                          <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[b.risk] }}>
                            <IconAlertTriangle s={10} />{b.flags}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail drawer */}
      {drawer && (
        <BusinessDrawer
          biz={drawer}
          onClose={() => setDrawer(null)}
          onFlag={() => setModal('flag')}
          onSuspend={() => setModal('suspend')}
          onRestore={() => setModal('restore')}
        />
      )}

      {/* Modals */}
      {modal === 'flag' && (
        <FlagModal biz={drawer} onFlag={() => drawer && applyFlag(drawer.id)} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'suspend' && (
        <SuspendModal biz={drawer} onSuspend={() => applyStatus(drawer.id, 'Suspended')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'restore' && (
        <RestoreModal biz={drawer} onRestore={() => applyStatus(drawer.id, 'Active')} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}