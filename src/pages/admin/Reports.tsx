import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle,
  IconFilter, IconEye, IconFileText, IconShield,
} from '../../components/layout/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type CaseStatus = 'Open' | 'Under Review' | 'Awaiting Information' | 'Escalated' | 'Resolved' | 'Dismissed';
type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type ReportType = 'User' | 'Business' | 'Application' | 'Team' | 'Deal' | 'Content';
type CaseKind = 'Report' | 'Dispute';

interface Evidence {
  type: string;
  date: string;
  source: string;
}

interface AdminNote {
  admin: string;
  time: string;
  note: string;
}

interface AuditEntry {
  action: string;
  time: string;
  actor: string;
  reason?: string;
}

interface ReportCase {
  id: string;
  kind: CaseKind;
  entity: string;
  entityType: ReportType;
  entityDetail: string;
  reporter: string;
  reporterRole: string;
  reason: string;
  description: string;
  severity: Severity;
  status: CaseStatus;
  assigned: string;
  created: string;
  lastUpdated: string;
  evidence: Evidence[];
  related: { label: string; value: string }[];
  notes: AdminNote[];
  audit: AuditEntry[];
  // Dispute-specific
  parties?: string[];
  issueSummary?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_CASES: ReportCase[] = [
  {
    id: 'R-1042', kind: 'Report', entity: 'NovaTech AI', entityType: 'Business', entityDetail: 'Seed · FinTech',
    reporter: 'Sarah Chen', reporterRole: 'Professional', reason: 'Misrepresentation',
    description: 'The business listing claims compliance certifications that do not appear to exist on any public registry. Funding ask may be inflated based on the described product stage.',
    severity: 'High', status: 'Under Review', assigned: 'admin@vault.io',
    created: 'Apr 20, 2026', lastUpdated: '2h ago',
    evidence: [
      { type: 'Business profile screenshot', date: 'Apr 20 · 10:00', source: 'Platform capture' },
      { type: 'External registry link', date: 'Apr 20 · 10:05', source: 'Reporter provided' },
    ],
    related: [
      { label: 'Reported business', value: 'NovaTech AI' },
      { label: 'Founder', value: 'Alex Morgan' },
      { label: 'Reporter', value: 'Sarah Chen' },
    ],
    notes: [
      { admin: 'admin@vault.io', time: 'Apr 20 · 12:00', note: 'Verified external registry — no matching certification found. Escalation may be warranted if founder cannot provide documentation.' },
    ],
    audit: [
      { action: 'Case created', time: 'Apr 20 · 10:00', actor: 'system' },
      { action: 'Assigned to admin@vault.io', time: 'Apr 20 · 10:05', actor: 'admin@vault.io' },
      { action: 'Status changed to Under Review', time: 'Apr 20 · 10:06', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'R-1043', kind: 'Report', entity: 'Unknown Account', entityType: 'User', entityDetail: 'Founder · Unverified',
    reporter: 'Riley Kim', reporterRole: 'Founder', reason: 'Fraudulent activity',
    description: 'This account attempted to solicit funding directly via the messaging system, bypassing the deal room process, and requested bank transfers outside the platform.',
    severity: 'Critical', status: 'Escalated', assigned: 'compliance@vault.io',
    created: 'Apr 20, 2026', lastUpdated: '5h ago',
    evidence: [
      { type: 'Message thread screenshot', date: 'Apr 20 · 08:30', source: 'Reporter provided' },
      { type: 'External payment request screenshot', date: 'Apr 20 · 08:35', source: 'Reporter provided' },
    ],
    related: [
      { label: 'Reported user', value: 'Unknown Account' },
      { label: 'Reporter', value: 'Riley Kim' },
    ],
    notes: [
      { admin: 'compliance@vault.io', time: 'Apr 20 · 11:00', note: 'Account restricted pending full investigation. Pattern matches prior fraud case from Apr 2025.' },
    ],
    audit: [
      { action: 'Case created', time: 'Apr 20 · 09:00', actor: 'system' },
      { action: 'Severity raised to Critical', time: 'Apr 20 · 09:30', actor: 'admin@vault.io' },
      { action: 'Escalated to compliance@vault.io', time: 'Apr 20 · 09:35', actor: 'admin@vault.io', reason: 'Suspected fraud pattern' },
      { action: 'Associated account restricted', time: 'Apr 20 · 11:30', actor: 'compliance@vault.io' },
    ],
  },
  {
    id: 'D-0019', kind: 'Dispute', entity: 'GreenPath Logistics', entityType: 'Deal', entityDetail: 'Pre-Seed · Logistics',
    reporter: 'Elena Vasquez', reporterRole: 'Founder', reason: 'Agreement dispute',
    description: 'Founder claims investor verbally agreed to adjusted milestone terms but the investor disputes this and is citing the original signed agreement. No written amendment was filed.',
    severity: 'Medium', status: 'Awaiting Information', assigned: 'admin@vault.io',
    created: 'Apr 18, 2026', lastUpdated: '1d ago',
    parties: ['Elena Vasquez (Founder)', 'Marcus Williams (Investor)'],
    issueSummary: 'Milestone amendment dispute — verbal vs. written agreement',
    evidence: [
      { type: 'Original signed agreement', date: 'Apr 10', source: 'Platform record' },
      { type: 'Founder correspondence claim', date: 'Apr 17', source: 'Founder provided' },
    ],
    related: [
      { label: 'Business', value: 'GreenPath Logistics' },
      { label: 'Deal', value: 'DL-0033' },
      { label: 'Party A', value: 'Elena Vasquez' },
      { label: 'Party B', value: 'Marcus Williams' },
    ],
    notes: [
      { admin: 'admin@vault.io', time: 'Apr 18 · 14:00', note: 'Requested written evidence from both parties of any amendment communication.' },
    ],
    audit: [
      { action: 'Dispute created', time: 'Apr 18 · 11:00', actor: 'system' },
      { action: 'Assigned to admin@vault.io', time: 'Apr 18 · 11:05', actor: 'admin@vault.io' },
      { action: 'Information requested from both parties', time: 'Apr 18 · 14:00', actor: 'admin@vault.io' },
      { action: 'Status: Awaiting Information', time: 'Apr 18 · 14:01', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'R-1040', kind: 'Report', entity: 'Priya Nair', entityType: 'User', entityDetail: 'Professional · Unverified',
    reporter: 'James Okafor', reporterRole: 'Investor', reason: 'Inappropriate contact',
    description: 'User sent repeated unsolicited messages to an investor outside of any established connection or deal room context.',
    severity: 'Low', status: 'Resolved', assigned: 'admin@vault.io',
    created: 'Apr 16, 2026', lastUpdated: 'Apr 17, 2026',
    evidence: [
      { type: 'Message log extract', date: 'Apr 16', source: 'Platform system' },
    ],
    related: [
      { label: 'Reported user', value: 'Priya Nair' },
      { label: 'Reporter', value: 'James Okafor' },
    ],
    notes: [
      { admin: 'admin@vault.io', time: 'Apr 16 · 16:00', note: 'Warning issued to reported user. No further action required at this stage.' },
    ],
    audit: [
      { action: 'Case created', time: 'Apr 16 · 14:00', actor: 'system' },
      { action: 'Reviewed by admin@vault.io', time: 'Apr 16 · 15:30', actor: 'admin@vault.io' },
      { action: 'Warning issued to user', time: 'Apr 16 · 16:00', actor: 'admin@vault.io' },
      { action: 'Resolved: Issue resolved', time: 'Apr 17 · 09:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'R-1044', kind: 'Report', entity: 'Nova Robotics Team', entityType: 'Team', entityDetail: 'Pre-Seed · Robotics',
    reporter: 'Sara Lin', reporterRole: 'Professional', reason: 'Misrepresentation of role',
    description: 'The team listing advertises a CTO role as equity-compensated but the team lead privately disclosed it is unpaid advisory only with no written agreement.',
    severity: 'Medium', status: 'Open', assigned: '—',
    created: 'Apr 21, 2026', lastUpdated: '1h ago',
    evidence: [
      { type: 'Team listing screenshot', date: 'Apr 21 · 08:00', source: 'Platform capture' },
    ],
    related: [
      { label: 'Team', value: 'Nova Robotics Build' },
      { label: 'Business', value: 'Nova Robotics' },
      { label: 'Reporter', value: 'Sara Lin' },
    ],
    notes: [],
    audit: [
      { action: 'Case created', time: 'Apr 21 · 08:15', actor: 'system' },
    ],
  },
  {
    id: 'R-1039', kind: 'Report', entity: 'Orbit Analytics', entityType: 'Application', entityDetail: 'Series A · SaaS',
    reporter: 'Marcus Williams', reporterRole: 'Founder', reason: 'Duplicate / spam application',
    description: 'Same applicant submitted 4 near-identical applications to Orbit Analytics within 48 hours. All contain the same template message.',
    severity: 'Low', status: 'Dismissed', assigned: 'admin@vault.io',
    created: 'Apr 14, 2026', lastUpdated: 'Apr 15, 2026',
    evidence: [
      { type: 'Application list extract', date: 'Apr 14', source: 'Platform system' },
    ],
    related: [
      { label: 'Business', value: 'Orbit Analytics' },
      { label: 'Reporter', value: 'Marcus Williams' },
    ],
    notes: [
      { admin: 'admin@vault.io', time: 'Apr 14 · 15:00', note: 'Confirmed duplicate. Removed excess applications. No further violation.' },
    ],
    audit: [
      { action: 'Case created', time: 'Apr 14 · 10:00', actor: 'system' },
      { action: 'Duplicate applications removed', time: 'Apr 14 · 15:00', actor: 'admin@vault.io' },
      { action: 'Dismissed: Duplicate report', time: 'Apr 15 · 09:00', actor: 'admin@vault.io' },
    ],
  },
];

const ADMINS = ['—', 'admin@vault.io', 'trust@vault.io', 'compliance@vault.io'];
const RESOLVE_OUTCOMES = ['No violation found', 'Issue resolved', 'Action taken', 'Duplicate report', 'Insufficient evidence', 'Other'];
const DISMISS_REASONS = ['Duplicate', 'Invalid report', 'Insufficient evidence', 'No policy violation', 'Other'];
const ESCALATE_REASONS = ['Fraud pattern detected', 'Legal escalation required', 'Compliance review needed', 'Critical platform risk', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant = (s: CaseStatus) =>
  s === 'Resolved' ? 'success' : s === 'Dismissed' ? 'neutral' : s === 'Escalated' ? 'danger' :
  s === 'Under Review' ? 'info' : s === 'Awaiting Information' ? 'warning' : 'neutral';

const severityColor = (s: Severity) =>
  s === 'Critical' ? '#F04438' : s === 'High' ? '#F59E0B' : s === 'Medium' ? '#3B82F6' : '#5E6D8F';

const severityBg = (s: Severity) =>
  s === 'Critical' ? 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]' :
  s === 'High' ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' :
  s === 'Medium' ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]' :
  'bg-[#5E6D8F]/10 border-[#5E6D8F]/30 text-[color:var(--vv-text-tertiary)]';

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${severityBg(severity)}`}>
      {severity === 'Critical' || severity === 'High' ? <IconAlertTriangle s={9} /> : null}
      {severity}
    </span>
  );
}

function KindPill({ kind }: { kind: CaseKind }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
      kind === 'Dispute' ? 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8' : 'text-[color:var(--vv-text-tertiary)] border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'
    }`}>{kind}</span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="w-16 h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-28 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-12 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Action modals ─────────────────────────────────────────────────────────────

function RequestInfoModal({ cas, onSend, onCancel }: { cas: ReportCase; onSend: () => void; onCancel: () => void }) {
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="request-info-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <p id="request-info-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Request Information</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-4">{cas.id} · {cas.entity}</p>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">What information is needed</label>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Describe what the relevant party must provide…"
          className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none mb-4" />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1" onClick={() => msg.trim() && onSend()} disabled={!msg.trim()}>Send Request</Button>
        </div>
      </div>
    </div>
  );
}

function EscalateModal({ cas, onConfirm, onCancel }: { cas: ReportCase; onConfirm: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="escalate-case-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconAlertTriangle s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="escalate-case-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Escalate Case</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{cas.id}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Escalation reason <span className="text-[#F04438]">*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
              <option value="">Select a reason…</option>
              {ESCALATE_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional context for the escalation team…"
              className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#F04438]/10 hover:bg-[#F04438]/20 text-[#F04438] border border-[#F04438]/30" onClick={() => reason && onConfirm()} disabled={!reason}>Escalate</Button>
        </div>
      </div>
    </div>
  );
}

function ResolveModal({ cas, onConfirm, onCancel }: { cas: ReportCase; onConfirm: () => void; onCancel: () => void }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="resolve-case-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="resolve-case-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Resolve Case</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{cas.id} · {cas.entity}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Resolution outcome <span className="text-[#F04438]">*</span></label>
            <select value={outcome} onChange={e => setOutcome(e.target.value)}
              className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
              <option value="">Select an outcome…</option>
              {RESOLVE_OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Admin notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Resolution summary for the audit record…"
              className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={() => outcome && onConfirm()} disabled={!outcome}>Resolve Case</Button>
        </div>
      </div>
    </div>
  );
}

function DismissModal({ cas, onConfirm, onCancel }: { cas: ReportCase; onConfirm: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dismiss-case-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <p id="dismiss-case-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Dismiss Case</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-4">{cas.id}</p>
        <div className="mb-4">
          <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Reason <span className="text-[#F04438]">*</span></label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
            <option value="">Select a reason…</option>
            {DISMISS_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="ghost" size="sm" className="flex-1 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]" onClick={() => reason && onConfirm()} disabled={!reason}>Dismiss</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

function CaseDrawer({ cas, onClose, onAssign, onRequestInfo, onEscalate, onResolve, onDismiss }: {
  cas: ReportCase;
  onClose: () => void;
  onAssign: (admin: string) => void;
  onRequestInfo: () => void;
  onEscalate: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const [section, setSection] = useState<'overview' | 'evidence' | 'notes' | 'audit'>('overview');
  const [newNote, setNewNote] = useState('');
  const isFinal = cas.status === 'Resolved' || cas.status === 'Dismissed';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="case-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[480px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[12px] font-bold text-[#C67A4E]">{cas.id}</span>
                <KindPill kind={cas.kind} />
                <SeverityBadge severity={cas.severity} />
              </div>
              <p id="case-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{cas.entity}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{cas.entityType} · {cas.entityDetail}</p>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(cas.status)} dot>{cas.status}</Badge>
            <select defaultValue={cas.assigned} onChange={e => onAssign(e.target.value)} onClick={e => e.stopPropagation()}
              className="h-6 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[10.5px] text-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors ml-auto">
              {ADMINS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['overview', 'evidence', 'notes', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{t === 'notes' ? 'Admin Notes' : t === 'audit' ? 'Audit' : t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {section === 'overview' && (
            <div className="px-5 py-4 space-y-5">

              {/* Dispute parties */}
              {cas.kind === 'Dispute' && cas.parties && (
                <div>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Parties</p>
                  <div className="space-y-1.5">
                    {cas.parties.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#1c2a3e] last:border-0">
                        <span className="text-[10px] text-[color:var(--vv-text-tertiary)] w-6 shrink-0">{String.fromCharCode(65 + i)}</span>
                        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">{p}</span>
                      </div>
                    ))}
                  </div>
                  {cas.issueSummary && (
                    <p className="mt-2 text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">{cas.issueSummary}</p>
                  )}
                </div>
              )}

              {/* Report details */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">{cas.kind === 'Dispute' ? 'Issue' : 'Report'} Details</p>
                <div className="space-y-0 mb-3">
                  {[
                    { label: 'Reason', value: <span className="font-medium text-[color:var(--vv-text)]">{cas.reason}</span> },
                    { label: 'Type', value: cas.entityType },
                    { label: 'Reporter', value: <>{cas.reporter} <span className="text-[color:var(--vv-text-tertiary)]">· {cas.reporterRole}</span></> },
                    { label: 'Created', value: <span className="font-mono text-[10.5px]">{cas.created}</span> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
                    {cas.kind === 'Dispute' ? 'Dispute description' : "Reporter's statement"}
                  </p>
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{cas.description}</p>
                </div>
              </div>

              {/* Related records */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Related Records</p>
                <div className="space-y-0">
                  {cas.related.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
                      <button className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1">
                        {r.value} <IconEye s={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'evidence' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Evidence <span className="text-[#35446A] normal-case font-normal">({cas.evidence.length})</span>
              </p>
              {cas.evidence.length === 0 ? (
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] text-center py-8">No evidence submitted.</p>
              ) : (
                <div className="space-y-2">
                  {cas.evidence.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                      <IconFileText s={13} className="text-[#C67A4E] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{e.type}</p>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{e.source} · {e.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" icon={<IconEye s={11} />}>View</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'notes' && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Internal Admin Notes</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] rounded">Not visible to reporter</span>
              </div>
              <div className="space-y-3 mb-4">
                {cas.notes.length === 0 ? (
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)] italic">No notes yet.</p>
                ) : cas.notes.map((n, i) => (
                  <div key={i} className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10.5px] font-mono text-[#C67A4E]">{n.admin}</span>
                      <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono ml-auto">{n.time}</span>
                    </div>
                    <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
              {!isFinal && (
                <div>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
                    placeholder="Add an internal note…"
                    className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none mb-2" />
                  <Button size="sm" disabled={!newNote.trim()} onClick={() => setNewNote('')}>Add Note</Button>
                </div>
              )}
            </div>
          )}

          {section === 'audit' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Audit History</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {cas.audit.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{a.action}</p>
                      {a.reason && <p className="text-[10.5px] text-[#F59E0B] mt-0.5">Reason: {a.reason}</p>}
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
        {!isFinal ? (
          <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Case Actions</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button variant="secondary" size="sm" icon={<IconShield s={11} />} onClick={onRequestInfo}>Request Info</Button>
              <Button size="sm" className="bg-[#F04438]/10 hover:bg-[#F04438]/20 text-[#F04438] border border-[#F04438]/30"
                icon={<IconAlertTriangle s={11} />} onClick={onEscalate}>Escalate</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                icon={<IconCheck s={11} />} onClick={onResolve}>Resolve</Button>
              <Button variant="ghost" size="sm" className="text-[color:var(--vv-text-tertiary)]" onClick={onDismiss}>Dismiss</Button>
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">All actions are logged and auditable.</p>
          </div>
        ) : (
          <div className="shrink-0 px-5 py-3 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center">
              This case is <strong className="text-[color:var(--vv-text-secondary)]">{cas.status}</strong>. No further action required.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ReportCase[]>(ALL_CASES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<ReportCase | null>(null);
  const [modal, setModal] = useState<'requestInfo' | 'escalate' | 'resolve' | 'dismiss' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    open: cases.filter(c => c.status === 'Open').length,
    underReview: cases.filter(c => c.status === 'Under Review' || c.status === 'Awaiting Information').length,
    high: cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length,
    resolved: cases.filter(c => c.status === 'Resolved' || c.status === 'Dismissed').length,
  };

  const filtered = cases
    .filter(c => {
      const q = search.toLowerCase();
      if (q && !c.id.toLowerCase().includes(q) && !c.entity.toLowerCase().includes(q) && !c.reporter.toLowerCase().includes(q)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (severityFilter && c.severity !== severityFilter) return false;
      if (typeFilter && c.entityType !== typeFilter) return false;
      if (kindFilter && c.kind !== kindFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.severity] - order[b.severity];
      }
      return sortBy === 'oldest' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    });

  const hasFilters = !!(search || statusFilter || severityFilter || typeFilter || kindFilter);
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setSeverityFilter(''); setTypeFilter(''); setKindFilter(''); };

  const applyStatus = (id: string, status: CaseStatus) => {
    setCases(cs => cs.map(c => c.id === id ? { ...c, status } : c));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, status } : null);
    setModal(null);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Reports &amp; Disputes</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Review reported activity, disputes and platform safety issues.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Open Reports', value: summary.open, color: '#F59E0B' },
          { label: 'Under Review', value: summary.underReview, color: '#3B82F6' },
          { label: 'High Priority', value: summary.high, color: '#F04438' },
          { label: 'Resolved', value: summary.resolved, color: '#22C55E' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search case ID, entity or reporter…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
              <option value="">All statuses</option>
              {['Open', 'Under Review', 'Awaiting Information', 'Escalated', 'Resolved', 'Dismissed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={selCls}>
              <option value="">All severities</option>
              {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selCls}>
              <option value="">All types</option>
              {['User', 'Business', 'Application', 'Team', 'Deal', 'Content'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={kindFilter} onChange={e => setKindFilter(e.target.value)} className={selCls}>
              <option value="">Reports &amp; Disputes</option>
              <option>Report</option><option>Dispute</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selCls}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="severity">Severity</option>
            </select>
          </div>

          <button onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]">
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">Clear filters</button>}
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {cases.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All statuses</option>
              {['Open', 'Under Review', 'Awaiting Information', 'Escalated', 'Resolved', 'Dismissed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All severities</option>
              {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={kindFilter} onChange={e => setKindFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">Reports &amp; Disputes</option>
              <option>Report</option><option>Dispute</option>
            </select>
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
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">
              {hasFilters ? 'No reports found.' : 'No open cases require attention.'}
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
              {hasFilters ? 'Try adjusting your search or filters.' : 'New reports will appear here.'}
            </p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['Case', 'Reported Entity', 'Reporter', 'Type', 'Severity', 'Status', 'Assigned', 'Created', 'Updated', 'Action'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${
                        c.severity === 'Critical' ? 'border-l-2 border-l-[#F04438]' : c.severity === 'High' ? 'border-l-2 border-l-[#F59E0B]' : ''
                      }`}
                      onClick={() => setDrawer(c)}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11.5px] font-bold text-[#C67A4E]">{c.id}</span>
                          <KindPill kind={c.kind} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{c.entity}</p>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{c.entityDetail}</p>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{c.reporter}</td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{c.entityType}</td>
                      <td className="px-3 py-3"><SeverityBadge severity={c.severity} /></td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(c.status)} dot>{c.status}</Badge></td>
                      <td className="px-3 py-3 font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)] max-w-[110px] truncate">{c.assigned}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{c.created}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{c.lastUpdated}</td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(c)}>Review</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(c => (
                <div key={c.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${
                    c.severity === 'Critical' ? 'border-l-2 border-l-[#F04438]' : c.severity === 'High' ? 'border-l-2 border-l-[#F59E0B]' : ''
                  }`}
                  onClick={() => setDrawer(c)}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold text-[#C67A4E]">{c.id}</span>
                      <KindPill kind={c.kind} />
                      <SeverityBadge severity={c.severity} />
                    </div>
                    <Badge variant={statusVariant(c.status)} dot>{c.status}</Badge>
                  </div>
                  <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-0.5">{c.entity}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{c.entityType} · {c.reporter}</p>
                    <span className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)]">{c.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {drawer && (
        <CaseDrawer
          cas={drawer}
          onClose={() => setDrawer(null)}
          onAssign={admin => setCases(cs => cs.map(c => c.id === drawer.id ? { ...c, assigned: admin } : c))}
          onRequestInfo={() => setModal('requestInfo')}
          onEscalate={() => setModal('escalate')}
          onResolve={() => setModal('resolve')}
          onDismiss={() => setModal('dismiss')}
        />
      )}

      {/* Modals */}
      {drawer && modal === 'requestInfo' && (
        <RequestInfoModal cas={drawer} onSend={() => applyStatus(drawer.id, 'Awaiting Information')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'escalate' && (
        <EscalateModal cas={drawer} onConfirm={() => applyStatus(drawer.id, 'Escalated')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'resolve' && (
        <ResolveModal cas={drawer} onConfirm={() => applyStatus(drawer.id, 'Resolved')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'dismiss' && (
        <DismissModal cas={drawer} onConfirm={() => applyStatus(drawer.id, 'Dismissed')} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}