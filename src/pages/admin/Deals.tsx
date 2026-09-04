import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle,
  IconFilter, IconEye, IconFileText, IconShield, IconChevronRight,
} from '../../components/layout/Icons';

// ─── Types ──────────────────────────────────────────────────────────────────

type DealStage =
  | 'Matched' | 'Interest Confirmed' | 'Deal Room'
  | 'NDA Signed' | 'Negotiation' | 'Agreement'
  | 'Milestone Funding Active' | 'Completed' | 'Restricted';

type NDAStatus = 'Not Started' | 'Pending' | 'Signed';
type AgreementStatus = 'Not Started' | 'Draft' | 'Under Review' | 'Executed';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
type UserRole = 'Founder' | 'Investor' | 'Professional';

interface Participant {
  name: string;
  role: UserRole;
  verification: 0 | 1 | 2;
  connected: boolean;
}

interface Milestone {
  label: string;
  state: 'completed' | 'active' | 'upcoming';
  amount?: string;
}

interface Deal {
  id: string;
  business: string;
  businessIndustry: string;
  businessStage: string;
  businessFounder: string;
  businessReadiness: number;
  businessAsk: string;
  participants: Participant[];
  stage: DealStage;
  nda: NDAStatus;
  ndaDate?: string;
  agreement: AgreementStatus;
  milestones: Milestone[];
  created: string;
  lastActivity: string;
  flags: number;
  risk: RiskLevel;
  history: { stage: string; date: string }[];
  activity: { action: string; time: string; actor: string }[];
  audit: { action: string; time: string; actor: string }[];
}

// ─── Data ───────────────────────────────────────────────────────────────────

const ALL_STAGES: DealStage[] = [
  'Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed',
  'Negotiation', 'Agreement', 'Milestone Funding Active', 'Completed',
];

const ALL_DEALS: Deal[] = [
  {
    id: 'DL-0031', business: 'NovaTech AI', businessIndustry: 'FinTech', businessStage: 'Seed',
    businessFounder: 'Alex Morgan', businessReadiness: 78, businessAsk: '৳60,00,000',
    participants: [
      { name: 'Alex Morgan', role: 'Founder', verification: 1, connected: true },
      { name: 'James Okafor', role: 'Investor', verification: 1, connected: true },
    ],
    stage: 'Negotiation', nda: 'Signed', ndaDate: 'Apr 16', agreement: 'Draft',
    milestones: [
      { label: 'Initial transfer', state: 'completed', amount: '৳15,00,000' },
      { label: 'MVP delivery', state: 'active', amount: '৳20,00,000' },
      { label: 'Pilot launch', state: 'upcoming', amount: '৳15,00,000' },
      { label: 'Series A prep', state: 'upcoming', amount: '৳10,00,000' },
    ],
    created: 'Apr 12, 2026', lastActivity: '2h ago', flags: 0, risk: 'None',
    history: [
      { stage: 'Matched', date: 'Apr 12' },
      { stage: 'Interest Confirmed', date: 'Apr 13' },
      { stage: 'Deal Room', date: 'Apr 14' },
      { stage: 'NDA Signed', date: 'Apr 16' },
      { stage: 'Negotiation', date: 'Apr 18' },
    ],
    activity: [
      { action: 'Term sheet updated', time: '2h ago', actor: 'James Okafor' },
      { action: 'Milestone 1 marked complete', time: '1d ago', actor: 'Alex Morgan' },
      { action: 'NDA executed by both parties', time: 'Apr 16', actor: 'system' },
    ],
    audit: [
      { action: 'Deal created', time: 'Apr 12 · 09:00', actor: 'system' },
      { action: 'Deal room verified', time: 'Apr 14 · 11:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'DL-0032', business: 'Orbit Analytics', businessIndustry: 'SaaS', businessStage: 'Series A',
    businessFounder: 'Riley Kim', businessReadiness: 91, businessAsk: '৳2,50,00,000',
    participants: [
      { name: 'Riley Kim', role: 'Founder', verification: 2, connected: true },
      { name: 'Sarah Chen', role: 'Investor', verification: 1, connected: true },
      { name: 'Marcus Williams', role: 'Professional', verification: 0, connected: true },
    ],
    stage: 'Milestone Funding Active', nda: 'Signed', ndaDate: 'Apr 10', agreement: 'Executed',
    milestones: [
      { label: 'Series A close', state: 'completed', amount: '৳1,00,00,000' },
      { label: 'Hiring milestone', state: 'completed', amount: '৳50,00,000' },
      { label: 'Revenue milestone', state: 'active', amount: '৳75,00,000' },
      { label: 'Series B prep', state: 'upcoming', amount: '৳25,00,000' },
    ],
    created: 'Mar 28, 2026', lastActivity: '1d ago', flags: 0, risk: 'None',
    history: [
      { stage: 'Matched', date: 'Mar 28' },
      { stage: 'Interest Confirmed', date: 'Mar 29' },
      { stage: 'Deal Room', date: 'Apr 1' },
      { stage: 'NDA Signed', date: 'Apr 10' },
      { stage: 'Negotiation', date: 'Apr 12' },
      { stage: 'Agreement', date: 'Apr 14' },
      { stage: 'Milestone Funding Active', date: 'Apr 15' },
    ],
    activity: [
      { action: 'Revenue milestone activated', time: '1d ago', actor: 'system' },
      { action: 'Hiring milestone completed', time: '3d ago', actor: 'Riley Kim' },
      { action: 'Agreement executed', time: 'Apr 14', actor: 'system' },
    ],
    audit: [
      { action: 'Deal created', time: 'Mar 28 · 10:00', actor: 'system' },
      { action: 'Agreement verified', time: 'Apr 14 · 14:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'DL-0033', business: 'GreenPath Logistics', businessIndustry: 'Logistics', businessStage: 'Pre-Seed',
    businessFounder: 'Elena Vasquez', businessReadiness: 55, businessAsk: '৳30,00,000',
    participants: [
      { name: 'Elena Vasquez', role: 'Founder', verification: 0, connected: true },
      { name: 'Marcus Williams', role: 'Investor', verification: 0, connected: false },
    ],
    stage: 'Deal Room', nda: 'Pending', agreement: 'Not Started',
    milestones: [
      { label: 'Initial funding', state: 'upcoming', amount: '৳10,00,000' },
      { label: 'Fleet expansion', state: 'upcoming', amount: '৳20,00,000' },
    ],
    created: 'Apr 18, 2026', lastActivity: '3d ago', flags: 1, risk: 'Low',
    history: [
      { stage: 'Matched', date: 'Apr 18' },
      { stage: 'Interest Confirmed', date: 'Apr 19' },
      { stage: 'Deal Room', date: 'Apr 20' },
    ],
    activity: [
      { action: 'Deal room opened', time: 'Apr 20', actor: 'system' },
      { action: 'Interest confirmed by both parties', time: 'Apr 19', actor: 'system' },
    ],
    audit: [
      { action: 'Deal created', time: 'Apr 18 · 11:00', actor: 'system' },
      { action: 'Flag raised (unverified participant)', time: 'Apr 18 · 11:05', actor: 'system' },
    ],
  },
  {
    id: 'DL-0034', business: 'Meridian Health', businessIndustry: 'HealthTech', businessStage: 'Seed',
    businessFounder: 'Priya Nair', businessReadiness: 66, businessAsk: '৳1,20,00,000',
    participants: [
      { name: 'Priya Nair', role: 'Founder', verification: 0, connected: true },
      { name: 'James Okafor', role: 'Investor', verification: 1, connected: true },
    ],
    stage: 'Restricted', nda: 'Signed', ndaDate: 'Apr 8', agreement: 'Under Review',
    milestones: [
      { label: 'Seed tranche 1', state: 'upcoming', amount: '৳40,00,000' },
      { label: 'Seed tranche 2', state: 'upcoming', amount: '৳80,00,000' },
    ],
    created: 'Apr 5, 2026', lastActivity: '5d ago', flags: 2, risk: 'High',
    history: [
      { stage: 'Matched', date: 'Apr 5' },
      { stage: 'Interest Confirmed', date: 'Apr 6' },
      { stage: 'Deal Room', date: 'Apr 7' },
      { stage: 'NDA Signed', date: 'Apr 8' },
      { stage: 'Negotiation', date: 'Apr 10' },
      { stage: 'Restricted', date: 'Apr 16' },
    ],
    activity: [
      { action: 'Deal restricted pending compliance review', time: '5d ago', actor: 'admin@vault.io' },
      { action: 'Flag raised (compliance concern)', time: '5d ago', actor: 'admin@vault.io' },
    ],
    audit: [
      { action: 'Deal created', time: 'Apr 5 · 09:00', actor: 'system' },
      { action: 'Compliance flag raised', time: 'Apr 16 · 13:00', actor: 'admin@vault.io' },
      { action: 'Deal restricted', time: 'Apr 16 · 13:30', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'DL-0035', business: 'Nova Robotics', businessIndustry: 'Robotics', businessStage: 'Pre-Seed',
    businessFounder: 'Marcus Williams', businessReadiness: 48, businessAsk: '৳80,00,000',
    participants: [
      { name: 'Marcus Williams', role: 'Founder', verification: 0, connected: true },
      { name: 'Riley Kim', role: 'Investor', verification: 2, connected: true },
    ],
    stage: 'NDA Signed', nda: 'Signed', ndaDate: 'Apr 20', agreement: 'Not Started',
    milestones: [
      { label: 'Pre-seed close', state: 'upcoming', amount: '৳80,00,000' },
    ],
    created: 'Apr 17, 2026', lastActivity: '6h ago', flags: 0, risk: 'None',
    history: [
      { stage: 'Matched', date: 'Apr 17' },
      { stage: 'Interest Confirmed', date: 'Apr 18' },
      { stage: 'Deal Room', date: 'Apr 19' },
      { stage: 'NDA Signed', date: 'Apr 20' },
    ],
    activity: [
      { action: 'NDA signed by Riley Kim', time: '6h ago', actor: 'Riley Kim' },
      { action: 'NDA sent to participants', time: 'Apr 20 · 09:00', actor: 'system' },
    ],
    audit: [
      { action: 'Deal created', time: 'Apr 17 · 10:00', actor: 'system' },
    ],
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  None: '#5E6D8F', Low: '#C67A4E', Medium: '#F59E0B', High: '#F04438', Critical: '#F04438',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ndaVariant = (s: NDAStatus) => s === 'Signed' ? 'success' : s === 'Pending' ? 'warning' : 'neutral';
const agreementVariant = (s: AgreementStatus) => s === 'Executed' ? 'success' : s === 'Under Review' ? 'info' : s === 'Draft' ? 'warning' : 'neutral';
const stageVariant = (s: DealStage) =>
  s === 'Completed' ? 'success' : s === 'Restricted' ? 'danger' : s === 'Milestone Funding Active' ? 'info' : 'neutral';

function RolePill({ role }: { role: UserRole }) {
  const color: Record<UserRole, string> = {
    Founder: 'text-[#C67A4E] border-[#C67A4E]/30 bg-[#C67A4E]/8',
    Investor: 'text-[#C9A24B] border-[#C9A24B]/30 bg-[#C9A24B]/8',
    Professional: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8',
  };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color[role]}`}>{role}</span>;
}

function ParticipantPips({ participants }: { participants: Participant[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {participants.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[7.5px] font-bold text-[color:var(--vv-text)] shrink-0">
            {p.name[0]}
          </div>
          <span className="text-[10.5px] text-[color:var(--vv-text-secondary)] truncate max-w-[80px]">{p.name.split(' ')[0]}</span>
          <RolePill role={p.role} />
        </div>
      ))}
    </div>
  );
}

function MilestonePip({ milestones }: { milestones: Milestone[] }) {
  const done = milestones.filter(m => m.state === 'completed').length;
  const total = milestones.length;
  const pct = total ? (done / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <span className="font-mono text-[11px] tabular-nums text-[color:var(--vv-text-secondary)] shrink-0">{done}/{total}</span>
      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#C67A4E]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LifecycleStepper({ stage }: { stage: DealStage }) {
  const stages = ALL_STAGES;
  const currentIdx = stages.indexOf(stage as any);
  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-0 min-w-max px-1 py-3">
        {stages.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  done ? 'bg-[#C67A4E] border-[#C67A4E]' : active ? 'border-[#C67A4E] bg-[#C67A4E]/15' : 'border-[color:var(--vv-border-strong)] bg-transparent'
                }`}>
                  {done && <IconCheck s={9} className="text-[#0D1626]" />}
                  {active && <div className="w-2 h-2 rounded-full bg-[#C67A4E]" />}
                </div>
                <span className={`text-[9px] font-medium whitespace-nowrap ${active ? 'text-[#C67A4E]' : done ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[#35446A]'}`}>
                  {s === 'Milestone Funding Active' ? 'Milestones' : s}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className={`h-px w-6 shrink-0 mx-0.5 mb-3 ${i < currentIdx ? 'bg-[#C67A4E]' : 'bg-[#35446A]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-28 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Restrict modal ───────────────────────────────────────────────────────────

function RestrictModal({ deal, onRestrict, onCancel }: { deal: Deal; onRestrict: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="restrict-deal-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconShield s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="restrict-deal-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Restrict Deal</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{deal.id} · {deal.business}</p>
          </div>
        </div>
        <div className="p-3 bg-[#F04438]/8 border border-[#F04438]/20 rounded-md mb-4">
          <p className="text-[12px] text-[#F04438] leading-snug">Restricting this deal will pause all participant activity and visibility pending resolution. This action is logged in the audit record.</p>
        </div>
        <div className="space-y-2 mb-4">
          {[
            { label: 'Deal', value: deal.id },
            { label: 'Business', value: deal.business },
            { label: 'Current stage', value: deal.stage },
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
            {['Compliance review', 'Suspected fraud', 'Policy violation', 'Participant dispute', 'Legal hold', 'Other'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onRestrict()} disabled={!reason}>
            Restrict Deal
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DealDrawer({ deal, onClose, onRestrict }: {
  deal: Deal;
  onClose: () => void;
  onRestrict: () => void;
}) {
  const [section, setSection] = useState<'overview' | 'participants' | 'milestones' | 'history' | 'audit'>('overview');
  const doneMilestones = deal.milestones.filter(m => m.state === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="deal-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[480px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p id="deal-drawer-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{deal.business}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{deal.id} · Created {deal.created}</p>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={stageVariant(deal.stage)} dot>{deal.stage}</Badge>
            <Badge variant={ndaVariant(deal.nda)}>NDA: {deal.nda}</Badge>
            {deal.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[deal.risk] }}>
                <IconAlertTriangle s={10} />{deal.flags} flag{deal.flags > 1 ? 's' : ''} · {deal.risk}
              </span>
            )}
          </div>
        </div>

        {/* Lifecycle stepper */}
        <div className="shrink-0 border-b border-[color:var(--vv-border)] bg-[#121A2B]/60 px-3">
          <LifecycleStepper stage={deal.stage === 'Restricted' ? deal.stage : deal.stage} />
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['overview', 'participants', 'milestones', 'history', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-3.5 py-2.5 text-[11.5px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
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
                    { label: 'Name', value: deal.business },
                    { label: 'Industry', value: deal.businessIndustry },
                    { label: 'Stage', value: <Badge variant="neutral">{deal.businessStage}</Badge> },
                    { label: 'Founder', value: deal.businessFounder },
                    { label: 'Readiness', value: <span className="font-mono text-[12px] text-[#C67A4E] tabular-nums">{deal.businessReadiness}</span> },
                    { label: 'Funding ask', value: <span className="font-mono tabular-nums">{deal.businessAsk}</span> },
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

              {/* NDA + Agreement */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Agreements</p>
                <div className="space-y-0">
                  {[
                    { label: 'NDA', value: <><Badge variant={ndaVariant(deal.nda)}>{deal.nda}</Badge>{deal.ndaDate && <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] ml-1.5">Signed {deal.ndaDate}</span>}</> },
                    { label: 'Agreement', value: <Badge variant={agreementVariant(deal.agreement)}>{deal.agreement}</Badge> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
                      <span className="flex items-center gap-1.5">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              {deal.flags > 0 && (
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F59E0B]/20 rounded-md">
                  <p className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold mb-1">Active Flags</p>
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle s={12} className="text-[#F59E0B]" />
                    <span className="text-[12px] font-medium" style={{ color: RISK_COLORS[deal.risk] }}>
                      {deal.flags} flag{deal.flags > 1 ? 's' : ''} · {deal.risk} risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'participants' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Participants <span className="text-[#35446A] normal-case font-normal">({deal.participants.length})</span>
              </p>
              <div className="space-y-2">
                {deal.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px] hover:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{p.name}</p>
                        <RolePill role={p.role} />
                      </div>
                      <div className="flex items-center gap-2">
                        <VerificationBadge tier={p.verification} />
                        <span className={`text-[10px] ${p.connected ? 'text-[#22C55E]' : 'text-[color:var(--vv-text-tertiary)]'}`}>
                          {p.connected ? '● Connected' : '○ Not connected'}
                        </span>
                      </div>
                    </div>
                    <IconEye s={12} className="text-[color:var(--vv-text-tertiary)] shrink-0" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10.5px] text-[color:var(--vv-text-tertiary)]">Click a participant to navigate to their Admin user profile.</p>
            </div>
          )}

          {section === 'milestones' && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Milestones</p>
                <span className="font-mono text-[11px] text-[#C67A4E] tabular-nums">{doneMilestones} / {deal.milestones.length} completed</span>
              </div>
              <div className="space-y-2">
                {deal.milestones.map((m, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-[8px] border ${
                    m.state === 'completed' ? 'bg-[#22C55E]/5 border-[#22C55E]/20' :
                    m.state === 'active' ? 'bg-[#C67A4E]/5 border-[#C67A4E]/20' :
                    'bg-[#121A2B] border-[color:var(--vv-border)]'
                  }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      m.state === 'completed' ? 'bg-[#22C55E] border-[#22C55E]' :
                      m.state === 'active' ? 'border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
                    }`}>
                      {m.state === 'completed' && <IconCheck s={8} className="text-[#0D1626]" />}
                      {m.state === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium ${m.state === 'completed' ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text)]'}`}>{m.label}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] capitalize">{m.state}</p>
                    </div>
                    {m.amount && <span className="font-mono text-[11.5px] tabular-nums text-[#C9A24B] shrink-0">{m.amount}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'history' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Deal History</p>
              <div className="space-y-3 relative mb-5">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {deal.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C67A4E] border border-[#0D1626] shrink-0 mt-1 z-10" />
                    <div className="flex items-center gap-3">
                      <p className="text-[12px] font-medium text-[color:var(--vv-text-secondary)]">{h.stage}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Recent Activity</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {deal.activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{a.action}</p>
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
                {deal.audit.map((a, i) => (
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

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Admin Actions</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconEye s={12} />}>View Business</Button>
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconFileText s={12} />}>Audit Logs</Button>
            </div>
            {deal.stage !== 'Restricted' && deal.stage !== 'Completed' && (
              <Button size="sm" className="w-full bg-[#F04438]/10 hover:bg-[#F04438]/20 text-[#F04438] border border-[#F04438]/30 hover:border-[#F04438]/50"
                icon={<IconShield s={12} />} onClick={onRestrict}>
                Restrict Deal
              </Button>
            )}
            {deal.stage === 'Restricted' && (
              <div className="p-2.5 bg-[#F04438]/8 border border-[#F04438]/20 rounded-md text-center">
                <p className="text-[11px] text-[#F04438]">This deal is currently restricted.</p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">Admin is an oversight role only. All actions are logged.</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDeals() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>(ALL_DEALS);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [ndaFilter, setNdaFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<Deal | null>(null);
  const [showRestrict, setShowRestrict] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    active: deals.filter(d => !['Completed', 'Restricted'].includes(d.stage)).length,
    ndaPending: deals.filter(d => d.nda === 'Pending').length,
    negotiating: deals.filter(d => d.stage === 'Negotiation').length,
    milestoneActive: deals.filter(d => d.stage === 'Milestone Funding Active').length,
    completed: deals.filter(d => d.stage === 'Completed').length,
  };

  const filtered = deals.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.business.toLowerCase().includes(q) && !d.participants.some(p => p.name.toLowerCase().includes(q))) return false;
    if (stageFilter && d.stage !== stageFilter) return false;
    if (ndaFilter && d.nda !== ndaFilter) return false;
    if (flagFilter === 'Flagged' && d.flags === 0) return false;
    if (flagFilter === 'No flags' && d.flags > 0) return false;
    return true;
  });

  const hasFilters = !!(search || stageFilter || ndaFilter || flagFilter !== 'All');
  const clearFilters = () => { setSearch(''); setStageFilter(''); setNdaFilter(''); setFlagFilter('All'); };

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(d => d.id)));

  const applyRestrict = (id: string) => {
    setDeals(ds => ds.map(d => d.id === id ? { ...d, stage: 'Restricted' as DealStage } : d));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, stage: 'Restricted' as DealStage } : null);
    setShowRestrict(false);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Deals</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Monitor deal lifecycle, participants, agreements and milestone activity.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Active', value: summary.active, color: '#22C55E' },
          { label: 'NDA Pending', value: summary.ndaPending, color: '#F59E0B' },
          { label: 'Negotiating', value: summary.negotiating, color: '#3B82F6' },
          { label: 'Milestones Active', value: summary.milestoneActive, color: '#C67A4E' },
          { label: 'Completed', value: summary.completed, color: '#5E6D8F' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business or participant…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className={selCls}>
              <option value="">All stages</option>
              {ALL_STAGES.map(s => <option key={s}>{s}</option>)}
              <option>Restricted</option>
            </select>
            <select value={ndaFilter} onChange={e => setNdaFilter(e.target.value)} className={selCls}>
              <option value="">NDA: All</option>
              {(['Not Started', 'Pending', 'Signed'] as NDAStatus[]).map(s => <option key={s}>{s}</option>)}
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
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {deals.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All stages</option>
              {ALL_STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={ndaFilter} onChange={e => setNdaFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">NDA: All</option>
              {['Not Started', 'Pending', 'Signed'].map(s => <option key={s}>{s}</option>)}
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
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No deals found.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                    </th>
                    {['Business', 'Participants', 'Stage', 'NDA', 'Agreement', 'Milestones', 'Last Activity', 'Flags', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${d.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''} ${d.stage === 'Restricted' ? 'opacity-70' : ''}`}
                      onClick={() => setDrawer(d)}>
                      <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(d.id); }}>
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)}
                          className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{d.business}</p>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{d.id}</p>
                      </td>
                      <td className="px-3 py-3"><ParticipantPips participants={d.participants} /></td>
                      <td className="px-3 py-3"><Badge variant={stageVariant(d.stage)} dot>{d.stage}</Badge></td>
                      <td className="px-3 py-3"><Badge variant={ndaVariant(d.nda)}>{d.nda}</Badge></td>
                      <td className="px-3 py-3"><Badge variant={agreementVariant(d.agreement)}>{d.agreement}</Badge></td>
                      <td className="px-3 py-3"><MilestonePip milestones={d.milestones} /></td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{d.lastActivity}</td>
                      <td className="px-3 py-3">
                        {d.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>
                          : <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: RISK_COLORS[d.risk] }}>
                              <IconAlertTriangle s={11} />{d.flags}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(d)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(d => (
                <div key={d.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${d.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(d)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{d.business}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono mt-0.5">{d.id}</p>
                    </div>
                    <Badge variant={stageVariant(d.stage)} dot>{d.stage}</Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={ndaVariant(d.nda)}>NDA: {d.nda}</Badge>
                    <MilestonePip milestones={d.milestones} />
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono ml-auto">{d.lastActivity}</span>
                    {d.flags > 0 && (
                      <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: RISK_COLORS[d.risk] }}>
                        <IconAlertTriangle s={10} />{d.flags}
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
        <DealDrawer
          deal={drawer}
          onClose={() => setDrawer(null)}
          onRestrict={() => setShowRestrict(true)}
        />
      )}

      {/* Restrict modal */}
      {drawer && showRestrict && (
        <RestrictModal
          deal={drawer}
          onRestrict={() => applyRestrict(drawer.id)}
          onCancel={() => setShowRestrict(false)}
        />
      )}
    </div>
  );
}