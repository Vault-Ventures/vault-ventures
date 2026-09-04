import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle, IconShield,
  IconFilter, IconChevronDown, IconEye, IconFileText,
} from '../../components/layout/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifStatus = 'Pending' | 'Under Review' | 'Needs Information' | 'Approved' | 'Rejected';
type VerifTier = 1 | 2;
type UserRole = 'Founder' | 'Investor' | 'Professional';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High';

interface VerifRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  headline: string;
  location: string;
  roles: UserRole[];
  tier: VerifTier;
  currentTier: 0 | 1 | 2;
  submitted: string;
  status: VerifStatus;
  flags: number;
  risk: RiskLevel;
  assigned: string;
  profileCompletion: number;
}

interface Evidence {
  name: string;
  category: string;
  submitted: string;
  status: 'Submitted' | 'Verified' | 'Queried';
}

interface HistoryEntry {
  action: string;
  time: string;
  actor: string;
  result?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUEUE: VerifRequest[] = [
  { id: 'VRQ-0041', userId: 'USR-0042', name: 'Sarah Chen', email: 'sarah@meridian.vc', headline: 'Partner at Meridian Capital · FinTech Seed Investor', location: 'New York, NY', roles: ['Investor'], tier: 2, currentTier: 1, submitted: 'Apr 14, 2026', status: 'Pending', flags: 0, risk: 'Low', assigned: '—', profileCompletion: 91 },
  { id: 'VRQ-0042', userId: 'USR-0103', name: 'Marcus Williams', email: 'marcus@nova.co', headline: 'Founder at Nova · Building logistics AI', location: 'Austin, TX', roles: ['Founder'], tier: 1, currentTier: 0, submitted: 'Apr 16, 2026', status: 'Pending', flags: 0, risk: 'None', assigned: '—', profileCompletion: 64 },
  { id: 'VRQ-0043', userId: 'USR-0088', name: 'Priya Nair', email: 'priya@nair.me', headline: 'Product Strategist · HealthTech · UX Research', location: 'Toronto, CA', roles: ['Professional', 'Investor'], tier: 2, currentTier: 0, submitted: 'Apr 17, 2026', status: 'Needs Information', flags: 2, risk: 'Medium', assigned: 'admin@vault.io', profileCompletion: 72 },
  { id: 'VRQ-0044', userId: 'USR-0055', name: 'James Okafor', email: 'james@apex.vc', headline: 'Principal at Apex Ventures · AI/ML portfolio', location: 'London, UK', roles: ['Investor'], tier: 1, currentTier: 0, submitted: 'Apr 18, 2026', status: 'Under Review', flags: 0, risk: 'None', assigned: 'admin@vault.io', profileCompletion: 80 },
  { id: 'VRQ-0045', userId: 'USR-0118', name: 'Elena Vasquez', email: 'elena@green.io', headline: 'Co-Founder at GreenPath Logistics', location: 'Chicago, IL', roles: ['Founder'], tier: 1, currentTier: 0, submitted: 'Apr 19, 2026', status: 'Pending', flags: 1, risk: 'Low', assigned: '—', profileCompletion: 55 },
  { id: 'VRQ-0046', userId: 'USR-0200', name: 'Riley Kim', email: 'riley@orbit.io', headline: 'CEO at Orbit Analytics · Data SaaS', location: 'Seattle, WA', roles: ['Founder'], tier: 1, currentTier: 0, submitted: 'Apr 20, 2026', status: 'Approved', flags: 0, risk: 'None', assigned: 'admin@vault.io', profileCompletion: 88 },
  { id: 'VRQ-0047', userId: 'USR-0199', name: 'Unknown Account', email: 'anon@shadytoken.co', headline: '—', location: '—', roles: ['Founder'], tier: 1, currentTier: 0, submitted: 'Apr 20, 2026', status: 'Rejected', flags: 3, risk: 'High', assigned: 'admin@vault.io', profileCompletion: 18 },
];

const EVIDENCE: Record<string, Evidence[]> = {
  'VRQ-0041': [
    { name: 'Passport / National ID', category: 'Identity Evidence', submitted: 'Apr 14 · 12:00', status: 'Submitted' },
    { name: 'Proof of professional accreditation', category: 'Professional Evidence', submitted: 'Apr 14 · 12:01', status: 'Submitted' },
    { name: 'LinkedIn profile export', category: 'Supporting Documents', submitted: 'Apr 14 · 12:02', status: 'Submitted' },
    { name: 'Fund registration document', category: 'Business Evidence', submitted: 'Apr 14 · 12:05', status: 'Submitted' },
  ],
  'VRQ-0043': [
    { name: 'Passport / National ID', category: 'Identity Evidence', submitted: 'Apr 17 · 10:00', status: 'Queried' },
    { name: 'Portfolio / work samples', category: 'Professional Evidence', submitted: 'Apr 17 · 10:02', status: 'Submitted' },
  ],
  default: [
    { name: 'Government-issued ID', category: 'Identity Evidence', submitted: 'On file', status: 'Submitted' },
    { name: 'Business registration', category: 'Business Evidence', submitted: 'On file', status: 'Submitted' },
  ],
};

const HISTORY: Record<string, HistoryEntry[]> = {
  'VRQ-0041': [
    { action: 'Tier 2 verification requested', time: 'Apr 14 · 11:58', actor: 'user', result: '—' },
    { action: 'Documents submitted', time: 'Apr 14 · 12:05', actor: 'user', result: '—' },
    { action: 'Request assigned to queue', time: 'Apr 14 · 12:06', actor: 'system', result: 'Pending' },
  ],
  'VRQ-0043': [
    { action: 'Tier 2 verification requested', time: 'Apr 17 · 09:55', actor: 'user', result: '—' },
    { action: 'Documents submitted', time: 'Apr 17 · 10:02', actor: 'user', result: '—' },
    { action: 'Assigned to admin@vault.io', time: 'Apr 17 · 11:00', actor: 'admin@vault.io', result: 'Under Review' },
    { action: 'Additional information requested', time: 'Apr 18 · 14:10', actor: 'admin@vault.io', result: 'Needs Information' },
  ],
  'VRQ-0046': [
    { action: 'Tier 1 verification requested', time: 'Apr 20 · 08:00', actor: 'user', result: '—' },
    { action: 'Documents submitted', time: 'Apr 20 · 08:05', actor: 'user', result: '—' },
    { action: 'Assigned to admin@vault.io', time: 'Apr 20 · 09:00', actor: 'admin@vault.io', result: 'Under Review' },
    { action: 'Tier 1 approved', time: 'Apr 20 · 11:30', actor: 'admin@vault.io', result: 'Approved' },
  ],
  default: [
    { action: 'Verification requested', time: 'On file', actor: 'user', result: '—' },
    { action: 'Documents submitted', time: 'On file', actor: 'user', result: '—' },
  ],
};

const CHECKLIST_ITEMS = [
  'Account information complete',
  'Email verified',
  'Identity evidence submitted',
  'Role-specific evidence submitted',
  'Supporting documents reviewed',
];

const ADMINS = ['—', 'admin@vault.io', 'trust@vault.io', 'compliance@vault.io'];
const REJECT_REASONS = ['Insufficient evidence', 'Information mismatch', 'Invalid submission', 'Policy issue', 'Suspicious activity', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant = (s: VerifStatus) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : s === 'Needs Information' ? 'warning' : s === 'Under Review' ? 'info' : 'neutral';

const riskColor = (r: RiskLevel) =>
  r === 'High' ? '#F04438' : r === 'Medium' ? '#F59E0B' : r === 'Low' ? '#C67A4E' : '#5E6D8F';

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

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="w-7 h-7 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Request Information modal ────────────────────────────────────────────────

function RequestInfoModal({ req, onSend, onCancel }: {
  req: VerifRequest;
  onSend: (msg: string) => void;
  onCancel: () => void;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="request-verification-info-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <p id="request-verification-info-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Request Additional Information</p>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
          For <strong className="text-[color:var(--vv-text-secondary)]">{req.name}</strong> — Tier {req.tier} request
        </p>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          What is needed
        </label>
        <textarea
          value={msg} onChange={e => setMsg(e.target.value)}
          rows={4} placeholder="Describe what information or documents are required, and any specific instructions for the applicant…"
          className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none"
        />
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1" onClick={() => msg.trim() && onSend(msg)} disabled={!msg.trim()}>
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({ req, onReject, onCancel }: {
  req: VerifRequest;
  onReject: (reason: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-verification-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="reject-verification-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Reject Verification</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{req.name} · Tier {req.tier} request</p>
          </div>
        </div>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          Rejection reason <span className="text-[#F04438]">*</span>
        </label>
        <select value={reason} onChange={e => setReason(e.target.value)}
          className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors mb-3">
          <option value="">Select a reason…</option>
          {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          Additional notes (optional)
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={3} placeholder="Any additional context for the applicant or for the audit record…"
          className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none mb-4"
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onReject(reason, notes)} disabled={!reason}>
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Approve modal ────────────────────────────────────────────────────────────

function ApproveModal({ req, onApprove, onCancel }: {
  req: VerifRequest;
  onApprove: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="approve-verification-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="approve-verification-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Approve Tier {req.tier} Verification</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">This action will be recorded in audit logs</p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {[
            { label: 'Applicant', value: req.name },
            { label: 'Email', value: req.email },
            { label: 'Requested Tier', value: `Tier ${req.tier}` },
            { label: 'Reviewer', value: 'admin@vault.io' },
            { label: 'Timestamp', value: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
              <span className="text-[11.5px] text-[color:var(--vv-text)] font-medium">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onApprove}>
            Approve Tier {req.tier}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Review drawer ────────────────────────────────────────────────────────────

function ReviewDrawer({ req, onClose, onApprove, onRequestInfo, onReject, onAssign }: {
  req: VerifRequest;
  onClose: () => void;
  onApprove: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
  onAssign: (admin: string) => void;
}) {
  const evidence = EVIDENCE[req.id] ?? EVIDENCE.default;
  const history = HISTORY[req.id] ?? HISTORY.default;
  const [section, setSection] = useState<'details' | 'evidence' | 'history'>('details');

  const checklist = CHECKLIST_ITEMS.map((item, i) => ({
    label: item,
    done: req.profileCompletion > 60 ? i < 3 : i < 2,
  }));

  const isFinal = req.status === 'Approved' || req.status === 'Rejected';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="verification-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] bg-[#0D1626] sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[13px] font-bold text-[color:var(--vv-text)] shrink-0">
                {req.name[0]}
              </div>
              <div className="min-w-0">
                <p id="verification-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{req.name}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{req.id} · Tier {req.tier} request</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0 mt-0.5">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(req.status)} dot>{req.status}</Badge>
            <RolePills roles={req.roles} />
            {req.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: riskColor(req.risk) }}>
                <IconAlertTriangle s={10} />{req.flags} flag{req.flags > 1 ? 's' : ''} · {req.risk} risk
              </span>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['details', 'evidence', 'history'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{t === 'details' ? 'Applicant Details' : t === 'evidence' ? 'Evidence' : 'History'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {section === 'details' && (
            <div className="px-5 py-4 space-y-5">
              {/* Identity */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Applicant Identity</p>
                <div className="space-y-2">
                  {[
                    { label: 'Name', value: req.name },
                    { label: 'Headline', value: <span className="italic text-[color:var(--vv-text-tertiary)]">{req.headline || '—'}</span> },
                    { label: 'Location', value: req.location },
                    { label: 'Email', value: <span className="font-mono text-[10.5px]">{req.email}</span> },
                    { label: 'Roles', value: <RolePills roles={req.roles} /> },
                    { label: 'Current tier', value: req.currentTier === 0 ? <Badge variant="neutral">Unverified</Badge> : <VerificationBadge tier={req.currentTier as 1|2} /> },
                    { label: 'Profile completion', value: `${req.profileCompletion}%` },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 pt-0.5">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right leading-snug">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-3 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                  <IconEye s={11} /> View full profile
                </button>
              </div>

              {/* Request info */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Verification Request</p>
                <div className="space-y-0">
                  {[
                    { label: 'Requested tier', value: <><VerificationBadge tier={req.tier} /> <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] ml-1">Tier {req.tier}</span></> },
                    { label: 'Submitted', value: req.submitted },
                    { label: 'Status', value: <Badge variant={statusVariant(req.status)} dot>{req.status}</Badge> },
                    { label: 'Assigned to', value: (
                      <select
                        defaultValue={req.assigned}
                        onChange={e => onAssign(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="h-7 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors"
                      >
                        {ADMINS.map(a => <option key={a}>{a}</option>)}
                      </select>
                    )},
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] flex items-center gap-1">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Review Checklist</p>
                <div className="space-y-2">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        item.done ? 'bg-[#22C55E]/10 border-[#22C55E]/50' : 'border-[color:var(--vv-border-strong)]'
                      }`}>
                        {item.done && <IconCheck s={8} className="text-[#22C55E]" />}
                      </div>
                      <span className={`text-[11.5px] ${item.done ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk */}
              {req.flags > 0 && (
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F59E0B]/20 rounded-md">
                  <p className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold mb-1.5">Flags / Risk</p>
                  <div className="flex items-center gap-2 mb-1">
                    <IconAlertTriangle s={12} className="text-[#F59E0B]" />
                    <span className="text-[12px] text-[#F59E0B] font-medium">{req.flags} active flag{req.flags > 1 ? 's' : ''}</span>
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">· {req.risk} risk</span>
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">Review flags before approving. Flagged accounts must meet a higher evidence threshold.</p>
                </div>
              )}
            </div>
          )}

          {section === 'evidence' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Submitted Evidence</p>
              {evidence.length === 0 ? (
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] text-center py-6">No evidence submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {evidence.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                      <IconFileText s={14} className="text-[#C67A4E] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{e.name}</p>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{e.category} · {e.submitted}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={e.status === 'Verified' ? 'success' : e.status === 'Queried' ? 'warning' : 'info'}>{e.status}</Badge>
                        <Button variant="ghost" size="sm" icon={<IconEye s={11} />}>View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'history' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Verification History</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 relative z-10" />
                    <div className="min-w-0">
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{h.action}</p>
                      {h.result && h.result !== '—' && (
                        <span className="text-[10px] text-[#C67A4E] font-medium">→ {h.result}</span>
                      )}
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{h.time} · {h.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                View in Audit Logs <IconFileText s={11} />
              </button>
            </div>
          )}
        </div>

        {/* Action footer */}
        {!isFinal && (
          <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Admin Decision</p>
            <div className="space-y-2">
              <Button
                size="sm" className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent"
                icon={<IconCheck s={12} />} onClick={onApprove}
              >
                Approve Tier {req.tier}
              </Button>
              <Button
                variant="secondary" size="sm" className="w-full"
                icon={<IconShield s={12} />} onClick={onRequestInfo}
              >
                Request Information
              </Button>
              <Button
                variant="destructive" size="sm" className="w-full"
                icon={<IconX s={12} />} onClick={onReject}
              >
                Reject
              </Button>
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center leading-snug">
              All decisions are logged and auditable.
            </p>
          </div>
        )}
        {isFinal && (
          <div className="shrink-0 px-5 py-3 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center">
              This request is <strong className="text-[color:var(--vv-text-secondary)]">{req.status}</strong>. No further action required.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VerificationQueue() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<VerifRequest[]>(QUEUE);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [sortBy, setSortBy] = useState('oldest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<VerifRequest | null>(null);
  const [modal, setModal] = useState<'approve' | 'reject' | 'requestInfo' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    pending: queue.filter(r => r.status === 'Pending').length,
    underReview: queue.filter(r => r.status === 'Under Review').length,
    needsInfo: queue.filter(r => r.status === 'Needs Information').length,
    approvedToday: queue.filter(r => r.status === 'Approved').length,
  };

  const filtered = queue
    .filter(r => {
      const q = search.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      if (tierFilter && r.tier !== parseInt(tierFilter)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (roleFilter && !r.roles.includes(roleFilter as UserRole)) return false;
      if (flagFilter === 'flagged' && r.flags === 0) return false;
      if (flagFilter === 'clean' && r.flags > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return a.id.localeCompare(b.id);
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'flags') return b.flags - a.flags;
      if (sortBy === 'tier') return b.tier - a.tier;
      return 0;
    });

  const hasFilters = !!(search || tierFilter || statusFilter || roleFilter || flagFilter);
  const clearFilters = () => { setSearch(''); setTierFilter(''); setStatusFilter(''); setRoleFilter(''); setFlagFilter(''); };

  const applyDecision = (id: string, newStatus: VerifStatus, newTier?: 0|1|2) => {
    setQueue(q => q.map(r => r.id === id ? { ...r, status: newStatus, ...(newTier !== undefined ? { currentTier: newTier } : {}) } : r));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, status: newStatus } : null);
    setModal(null);
  };

  const selectClassName = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Verification Queue</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Review and manage user verification requests.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Pending', value: summary.pending, color: '#F59E0B', status: 'Pending' },
          { label: 'Under Review', value: summary.underReview, color: '#3B82F6', status: 'Under Review' },
          { label: 'Needs Information', value: summary.needsInfo, color: '#F59E0B', status: 'Needs Information' },
          { label: 'Approved Today', value: summary.approvedToday, color: '#22C55E', status: 'Approved' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(v => v === s.status ? '' : s.status)}
            className={`text-left bg-[#121A2B] border rounded-[10px] px-3.5 py-2.5 transition-colors hover:border-[color:var(--vv-border-strong)] ${statusFilter === s.status ? 'border-[color:var(--vv-border-strong)]' : 'border-[color:var(--vv-border)]'}`}
          >
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1 leading-none">{s.label}</p>
            <p className="font-mono text-[20px] font-semibold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────────────── */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={selectClassName}>
              <option value="">All tiers</option>
              <option value="1">Tier 1</option><option value="2">Tier 2</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName}>
              <option value="">All statuses</option>
              <option>Pending</option><option>Under Review</option><option>Needs Information</option><option>Approved</option><option>Rejected</option>
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName}>
              <option value="">All roles</option>
              <option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selectClassName}>
              <option value="">All flags</option>
              <option value="flagged">Flagged</option><option value="clean">No flags</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClassName}>
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="flags">Most flagged</option>
              <option value="tier">Tier (high→low)</option>
            </select>
          </div>

          <button onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]">
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">
              Clear filters
            </button>
          )}

          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">
            {filtered.length} of {queue.length}
          </span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All tiers</option><option value="1">Tier 1</option><option value="2">Tier 2</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All statuses</option>
              <option>Pending</option><option>Under Review</option><option>Needs Information</option><option>Approved</option><option>Rejected</option>
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All roles</option><option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClassName + " w-full"}>
              <option value="oldest">Oldest first</option><option value="newest">Newest first</option>
              <option value="flags">Most flagged</option><option value="tier">Tier</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <IconShield s={28} className="text-[#35446A] mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">
              {hasFilters ? 'No requests match your filters' : 'No pending verification requests'}
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
              {hasFilters ? 'Try adjusting your search or filters.' : 'New verification submissions will appear here.'}
            </p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['Applicant', 'Role(s)', 'Requested Tier', 'Submitted', 'Status', 'Flags', 'Assigned', 'Action'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr
                      key={r.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${r.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                      onClick={() => setDrawer(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                            {r.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{r.name}</p>
                            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RolePills roles={r.roles} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <VerificationBadge tier={r.tier} />
                          <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">Tier {r.tier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{r.submitted}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant(r.status)} dot>{r.status}</Badge></td>
                      <td className="px-4 py-3">
                        {r.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>
                          : <span className="flex items-center gap-1 font-medium" style={{ color: riskColor(r.risk) }}>
                              <IconAlertTriangle s={11} />{r.flags}
                            </span>
                        }
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{r.assigned}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(r)}>Review</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${r.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(r)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0 mt-0.5">
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{r.name}</p>
                        <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <RolePills roles={r.roles} />
                        <div className="flex items-center gap-1">
                          <VerificationBadge tier={r.tier} />
                          <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Tier {r.tier}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{r.submitted}</p>
                        {r.flags > 0 && (
                          <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: riskColor(r.risk) }}>
                            <IconAlertTriangle s={10} />{r.flags} flag{r.flags > 1 ? 's' : ''} · {r.risk}
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

      {/* ── Review drawer ───────────────────────────────────────────────── */}
      {drawer && (
        <ReviewDrawer
          req={drawer}
          onClose={() => setDrawer(null)}
          onApprove={() => setModal('approve')}
          onRequestInfo={() => setModal('requestInfo')}
          onReject={() => setModal('reject')}
          onAssign={admin => setQueue(q => q.map(r => r.id === drawer.id ? { ...r, assigned: admin } : r))}
        />
      )}

      {/* ── Modals (above drawer) ────────────────────────────────────────── */}
      {drawer && modal === 'approve' && (
        <ApproveModal
          req={drawer}
          onApprove={() => applyDecision(drawer.id, 'Approved', drawer.tier)}
          onCancel={() => setModal(null)}
        />
      )}
      {drawer && modal === 'reject' && (
        <RejectModal
          req={drawer}
          onReject={() => applyDecision(drawer.id, 'Rejected')}
          onCancel={() => setModal(null)}
        />
      )}
      {drawer && modal === 'requestInfo' && (
        <RequestInfoModal
          req={drawer}
          onSend={() => applyDecision(drawer.id, 'Needs Information')}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}