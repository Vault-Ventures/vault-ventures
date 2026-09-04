import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle,
  IconFilter, IconEye, IconFileText, IconShield,
} from '../../components/layout/Icons';

// ─── Types ───────────────────────────────────────────────────────────────────

type RepStatus = 'Healthy' | 'Under Review' | 'Flagged' | 'Restricted';
type RepLabel = 'Strong' | 'Good' | 'Moderate' | 'Poor' | 'Under Review' | 'Restricted';
type UserRole = 'Founder' | 'Investor' | 'Professional';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

interface TrustSignal {
  label: string;
  value: string;
  positive: boolean;
}

interface FlagEntry {
  reason: string;
  severity: RiskLevel;
  date: string;
  status: 'Active' | 'Resolved';
}

interface ReportEntry {
  subject: string;
  filed: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  resolution?: string;
}

interface RepRecord {
  id: string;
  name: string;
  headline: string;
  location: string;
  roles: UserRole[];
  verification: 0 | 1 | 2;
  accountStatus: 'Active' | 'Suspended' | 'Restricted';
  repLabel: RepLabel;
  repStatus: RepStatus;
  flags: number;
  reports: number;
  risk: RiskLevel;
  lastUpdated: string;
  trustSignals: TrustSignal[];
  flagEntries: FlagEntry[];
  reportEntries: ReportEntry[];
  history: { event: string; time: string; actor: string; reason?: string }[];
  audit: { action: string; time: string; actor: string }[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ALL_RECORDS: RepRecord[] = [
  {
    id: 'REP-USR-0042', name: 'Alex Morgan', headline: 'Founder at NovaTech AI · FinTech Compliance',
    location: 'New York, NY', roles: ['Founder', 'Investor'], verification: 1,
    accountStatus: 'Active', repLabel: 'Strong', repStatus: 'Healthy',
    flags: 0, reports: 0, risk: 'None', lastUpdated: 'Apr 20, 2026',
    trustSignals: [
      { label: 'Tier 1 verified', value: 'Verified Apr 2026', positive: true },
      { label: 'Active deal room', value: '1 active', positive: true },
      { label: 'Collaborations completed', value: '2', positive: true },
      { label: 'Reports filed against', value: '0', positive: true },
    ],
    flagEntries: [],
    reportEntries: [],
    history: [
      { event: 'Verification upgraded to Tier 1', time: 'Apr 14 · 12:00', actor: 'admin@vault.io' },
      { event: 'Account reviewed — no issues', time: 'Mar 10 · 09:00', actor: 'admin@vault.io' },
    ],
    audit: [
      { action: 'Account reviewed', time: 'Mar 10 · 09:00', actor: 'admin@vault.io' },
      { action: 'Verification approved', time: 'Apr 14 · 12:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'REP-USR-0088', name: 'Priya Nair', headline: 'Product Strategist · HealthTech · UX Research',
    location: 'Toronto, CA', roles: ['Professional', 'Investor'], verification: 0,
    accountStatus: 'Active', repLabel: 'Under Review', repStatus: 'Under Review',
    flags: 2, reports: 1, risk: 'Medium', lastUpdated: 'Apr 18, 2026',
    trustSignals: [
      { label: 'Verification status', value: 'Unverified', positive: false },
      { label: 'Reports filed against', value: '1 open', positive: false },
      { label: 'Active flags', value: '2 flags', positive: false },
      { label: 'Collaborations completed', value: '0', positive: false },
    ],
    flagEntries: [
      { reason: 'Duplicate application submission', severity: 'Medium', date: 'Apr 17', status: 'Active' },
      { reason: 'Reported by another user', severity: 'Low', date: 'Apr 18', status: 'Active' },
    ],
    reportEntries: [
      { subject: 'Inappropriate contact attempt', filed: 'Apr 18', status: 'Under Review' },
    ],
    history: [
      { event: 'Report filed against account', time: 'Apr 18 · 10:30', actor: 'user-submitted', reason: 'Inappropriate contact' },
      { event: 'Flag added: duplicate application', time: 'Apr 17 · 09:00', actor: 'system' },
      { event: 'Reputation placed Under Review', time: 'Apr 18 · 11:00', actor: 'admin@vault.io', reason: 'Open report and flags' },
    ],
    audit: [
      { action: 'Account flagged (duplicate application)', time: 'Apr 17 · 09:00', actor: 'system' },
      { action: 'Reputation placed Under Review', time: 'Apr 18 · 11:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'REP-USR-0055', name: 'James Okafor', headline: 'Principal at Apex Ventures · AI/ML',
    location: 'London, UK', roles: ['Investor'], verification: 1,
    accountStatus: 'Active', repLabel: 'Good', repStatus: 'Healthy',
    flags: 0, reports: 0, risk: 'None', lastUpdated: 'Apr 15, 2026',
    trustSignals: [
      { label: 'Tier 1 verified', value: 'Verified Mar 2026', positive: true },
      { label: 'Active deal rooms', value: '2', positive: true },
      { label: 'Reports filed against', value: '0', positive: true },
      { label: 'Account standing', value: 'Good', positive: true },
    ],
    flagEntries: [],
    reportEntries: [],
    history: [
      { event: 'Verification upgraded to Tier 1', time: 'Mar 22 · 14:00', actor: 'admin@vault.io' },
    ],
    audit: [
      { action: 'Verification approved', time: 'Mar 22 · 14:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'REP-USR-0200', name: 'Unknown Account', headline: '—',
    location: '—', roles: ['Founder'], verification: 0,
    accountStatus: 'Restricted', repLabel: 'Restricted', repStatus: 'Restricted',
    flags: 3, reports: 2, risk: 'Critical', lastUpdated: 'Apr 20, 2026',
    trustSignals: [
      { label: 'Verification status', value: 'Unverified', positive: false },
      { label: 'Active flags', value: '3 flags (Critical)', positive: false },
      { label: 'Reports filed against', value: '2 open reports', positive: false },
      { label: 'Account restricted', value: 'Apr 20, 2026', positive: false },
    ],
    flagEntries: [
      { reason: 'Fraudulent business listing', severity: 'Critical', date: 'Apr 20', status: 'Active' },
      { reason: 'Identity mismatch', severity: 'High', date: 'Apr 20', status: 'Active' },
      { reason: 'Suspicious funding request', severity: 'High', date: 'Apr 20', status: 'Active' },
    ],
    reportEntries: [
      { subject: 'Fraudulent listing', filed: 'Apr 20', status: 'Open' },
      { subject: 'Attempted fund solicitation without verification', filed: 'Apr 20', status: 'Open' },
    ],
    history: [
      { event: 'Account restricted', time: 'Apr 20 · 11:30', actor: 'admin@vault.io', reason: 'Fraudulent activity' },
      { event: 'Multiple flags raised', time: 'Apr 20 · 11:00', actor: 'admin@vault.io' },
      { event: 'Reports received', time: 'Apr 20 · 10:30', actor: 'user-submitted' },
    ],
    audit: [
      { action: 'Flags raised (3)', time: 'Apr 20 · 11:00', actor: 'admin@vault.io' },
      { action: 'Account restricted', time: 'Apr 20 · 11:30', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'REP-USR-0118', name: 'Elena Vasquez', headline: 'Co-Founder at GreenPath Logistics',
    location: 'Chicago, IL', roles: ['Founder'], verification: 0,
    accountStatus: 'Active', repLabel: 'Moderate', repStatus: 'Flagged',
    flags: 1, reports: 0, risk: 'Low', lastUpdated: 'Apr 3, 2026',
    trustSignals: [
      { label: 'Verification status', value: 'Unverified', positive: false },
      { label: 'Active flags', value: '1 flag (Low)', positive: false },
      { label: 'Reports filed against', value: '0', positive: true },
      { label: 'Profile completion', value: '55%', positive: false },
    ],
    flagEntries: [
      { reason: 'Incomplete business profile', severity: 'Low', date: 'Apr 3', status: 'Active' },
    ],
    reportEntries: [],
    history: [
      { event: 'Flag added: incomplete profile', time: 'Apr 3 · 09:05', actor: 'system' },
      { event: 'Account created', time: 'Apr 2 · 11:00', actor: 'system' },
    ],
    audit: [
      { action: 'Account created', time: 'Apr 2 · 11:00', actor: 'system' },
      { action: 'Auto-flagged (incomplete profile)', time: 'Apr 3 · 09:05', actor: 'system' },
    ],
  },
  {
    id: 'REP-USR-0200B', name: 'Riley Kim', headline: 'CEO at Orbit Analytics · Data SaaS',
    location: 'Seattle, WA', roles: ['Founder'], verification: 2,
    accountStatus: 'Active', repLabel: 'Strong', repStatus: 'Healthy',
    flags: 0, reports: 0, risk: 'None', lastUpdated: 'Apr 20, 2026',
    trustSignals: [
      { label: 'Tier 2 verified', value: 'Verified Apr 2026', positive: true },
      { label: 'Active deal room', value: '1 active (Series A)', positive: true },
      { label: 'Collaborations completed', value: '3', positive: true },
      { label: 'Reports filed against', value: '0', positive: true },
    ],
    flagEntries: [],
    reportEntries: [],
    history: [
      { event: 'Verification upgraded to Tier 2', time: 'Apr 20 · 11:30', actor: 'admin@vault.io' },
      { event: 'Tier 1 verification approved', time: 'Jan 10 · 14:00', actor: 'admin@vault.io' },
    ],
    audit: [
      { action: 'Tier 1 verification approved', time: 'Jan 10 · 14:00', actor: 'admin@vault.io' },
      { action: 'Tier 2 verification approved', time: 'Apr 20 · 11:30', actor: 'admin@vault.io' },
    ],
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  None: '#5E6D8F', Low: '#C67A4E', Medium: '#F59E0B', High: '#F04438', Critical: '#F04438',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant = (s: RepStatus) =>
  s === 'Healthy' ? 'success' : s === 'Restricted' ? 'danger' : s === 'Flagged' ? 'warning' : 'info';

const repLabelColor = (l: RepLabel) =>
  l === 'Strong' ? '#22C55E' : l === 'Good' ? '#C67A4E' : l === 'Moderate' ? '#F59E0B' : '#F04438';

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
            <div className="h-2.5 w-28 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Under Review modal ───────────────────────────────────────────────────────

function UnderReviewModal({ rec, onConfirm, onCancel }: { rec: RepRecord; onConfirm: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="review-account-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center shrink-0">
            <IconShield s={14} className="text-[#3B82F6]" />
          </div>
          <div>
            <p id="review-account-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Place Under Review</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{rec.name} · {rec.id}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
              Reason <span className="text-[#F04438]">*</span>
            </label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
              <option value="">Select a reason…</option>
              {['Open reports', 'Suspicious activity', 'Policy investigation', 'Compliance review', 'Flag escalation', 'Other'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Admin notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Context for the audit record…"
              className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1" onClick={() => reason && onConfirm()} disabled={!reason}>
            Place Under Review
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Restrict modal ───────────────────────────────────────────────────────────

function RestrictModal({ rec, onConfirm, onCancel }: { rec: RepRecord; onConfirm: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="restrict-account-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="restrict-account-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Restrict Account</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{rec.name}</p>
          </div>
        </div>
        <div className="p-3 bg-[#F04438]/8 border border-[#F04438]/20 rounded-md mb-4">
          <p className="text-[12px] text-[#F04438] leading-snug">Restricting this account will prevent all platform activity until restored by an admin. This action is logged.</p>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Reason <span className="text-[#F04438]">*</span></label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
            <option value="">Select a reason…</option>
            {['Fraudulent activity', 'Policy violation', 'Multiple verified reports', 'Legal hold', 'Compliance requirement', 'Other'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onConfirm()} disabled={!reason}>
            Restrict Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore modal ────────────────────────────────────────────────────────────

function RestoreModal({ rec, onConfirm, onCancel }: { rec: RepRecord; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="restore-account-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="restore-account-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Restore Account</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{rec.name}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] mb-5 leading-snug">
          Restoring this account will return it to active standing. The action and timestamp will be recorded in the audit log.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onConfirm}>
            Restore Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function RepDrawer({ rec, onClose, onUnderReview, onRestrict, onRestore }: {
  rec: RepRecord;
  onClose: () => void;
  onUnderReview: () => void;
  onRestrict: () => void;
  onRestore: () => void;
}) {
  const [section, setSection] = useState<'reputation' | 'flags' | 'reports' | 'history' | 'audit'>('reputation');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="reputation-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[13px] font-bold text-[color:var(--vv-text)] shrink-0">
                {rec.name[0]}
              </div>
              <div className="min-w-0">
                <p id="reputation-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{rec.name}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{rec.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(rec.repStatus)} dot>{rec.repStatus}</Badge>
            <VerificationBadge tier={rec.verification} />
            <RolePills roles={rec.roles} />
            {rec.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[rec.risk] }}>
                <IconAlertTriangle s={10} />{rec.flags}f · {rec.reports}r
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['reputation', 'flags', 'reports', 'history', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-3.5 py-2.5 text-[11.5px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>
              {t === 'audit' ? 'Audit' : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {section === 'reputation' && (
            <div className="px-5 py-4 space-y-5">
              {/* Identity */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Identity</p>
                <div className="space-y-0">
                  {[
                    { label: 'Headline', value: <span className="italic text-[color:var(--vv-text-tertiary)] text-[11px]">{rec.headline || '—'}</span> },
                    { label: 'Location', value: rec.location },
                    { label: 'Account status', value: <Badge variant={rec.accountStatus === 'Active' ? 'success' : 'danger'} dot>{rec.accountStatus}</Badge> },
                    { label: 'Verification', value: <><VerificationBadge tier={rec.verification} /> <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-1">{rec.verification === 0 ? 'Unverified' : `Tier ${rec.verification}`}</span></> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0 gap-4">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] flex items-center gap-1 text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                  <IconEye s={11} /> View user profile
                </button>
              </div>

              {/* Reputation */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Reputation</p>
                <div className="flex items-center gap-3 mb-3 p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-[8px]">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: repLabelColor(rec.repLabel) }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: repLabelColor(rec.repLabel) }}>{rec.repLabel}</p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Overall reputation standing</p>
                  </div>
                  <Badge variant={statusVariant(rec.repStatus)} dot className="ml-auto">{rec.repStatus}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1c2a3e]">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Flags</span>
                  <span className="font-mono text-[12px] tabular-nums" style={{ color: rec.flags > 0 ? RISK_COLORS[rec.risk] : '#5E6D8F' }}>{rec.flags}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1c2a3e]">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Reports</span>
                  <span className="font-mono text-[12px] tabular-nums" style={{ color: rec.reports > 0 ? '#F59E0B' : '#5E6D8F' }}>{rec.reports}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Last updated</span>
                  <span className="font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{rec.lastUpdated}</span>
                </div>
              </div>

              {/* Trust signals */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Trust Signals</p>
                <div className="space-y-2">
                  {rec.trustSignals.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.positive ? 'bg-[#22C55E]' : 'bg-[#F04438]'}`} />
                        <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{s.label}</span>
                      </div>
                      <span className={`text-[11.5px] font-medium ${s.positive ? 'text-[color:var(--vv-text-secondary)]' : 'text-[#F59E0B]'}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'flags' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Active Flags <span className="text-[#35446A] normal-case font-normal">({rec.flagEntries.length})</span>
              </p>
              {rec.flagEntries.length === 0 ? (
                <div className="text-center py-8">
                  <IconCheck s={20} className="text-[#22C55E] mx-auto mb-2" />
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">No active flags on this account.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rec.flagEntries.map((f, i) => (
                    <div key={i} className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-[12px] font-medium text-[color:var(--vv-text)] leading-snug">{f.reason}</p>
                        <Badge variant={f.status === 'Active' ? 'warning' : 'success'}>{f.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10.5px] font-medium" style={{ color: RISK_COLORS[f.severity] }}>
                          {f.severity} severity
                        </span>
                        <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{f.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'reports' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Reports <span className="text-[#35446A] normal-case font-normal">({rec.reportEntries.length})</span>
              </p>
              {rec.reportEntries.length === 0 ? (
                <div className="text-center py-8">
                  <IconCheck s={20} className="text-[#22C55E] mx-auto mb-2" />
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">No reports filed against this account.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rec.reportEntries.map((r, i) => (
                    <div key={i} className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="text-[12px] font-medium text-[color:var(--vv-text)]">{r.subject}</p>
                        <Badge variant={r.status === 'Resolved' ? 'success' : r.status === 'Under Review' ? 'info' : 'warning'}>{r.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">Filed {r.filed}</span>
                        {r.resolution && <span className="text-[10.5px] text-[#22C55E]">→ {r.resolution}</span>}
                      </div>
                      <button className="mt-2 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                        <IconEye s={10} /> View in Reports
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'history' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Reputation History</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {rec.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{h.event}</p>
                      {h.reason && <p className="text-[10.5px] text-[#F59E0B] mt-0.5">Reason: {h.reason}</p>}
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{h.time} · {h.actor}</p>
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
                {rec.audit.map((a, i) => (
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
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconEye s={12} />}>Review Profile</Button>
              <Button variant="ghost" size="sm" className="flex-1" icon={<IconFileText s={12} />}>View Reports</Button>
            </div>
            {rec.repStatus === 'Restricted' ? (
              <Button size="sm" className="w-full bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                icon={<IconCheck s={12} />} onClick={onRestore}>
                Restore Account
              </Button>
            ) : (
              <>
                {rec.repStatus !== 'Under Review' && (
                  <Button size="sm" className="w-full bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30"
                    icon={<IconShield s={12} />} onClick={onUnderReview}>
                    Place Under Review
                  </Button>
                )}
                <Button variant="destructive" size="sm" className="w-full" icon={<IconX s={12} />} onClick={onRestrict}>
                  Restrict Account
                </Button>
              </>
            )}
          </div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">All actions are logged and auditable.</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReputation() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RepRecord[]>(ALL_RECORDS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<RepRecord | null>(null);
  const [modal, setModal] = useState<'underReview' | 'restrict' | 'restore' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    healthy: records.filter(r => r.repStatus === 'Healthy').length,
    underReview: records.filter(r => r.repStatus === 'Under Review').length,
    flagged: records.filter(r => r.repStatus === 'Flagged').length,
    restricted: records.filter(r => r.repStatus === 'Restricted').length,
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.name.toLowerCase().includes(q) && !r.headline.toLowerCase().includes(q)) return false;
    if (roleFilter && !r.roles.includes(roleFilter as UserRole)) return false;
    if (statusFilter && r.repStatus !== statusFilter) return false;
    if (flagFilter === 'Flagged' && r.flags === 0) return false;
    if (flagFilter === 'No flags' && r.flags > 0) return false;
    return true;
  });

  const hasFilters = !!(search || roleFilter || statusFilter || flagFilter !== 'All');
  const clearFilters = () => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setFlagFilter('All'); };

  const applyStatus = (id: string, repStatus: RepStatus, repLabel: RepLabel) => {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, repStatus, repLabel } : r));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, repStatus, repLabel } : null);
    setModal(null);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Reputation</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Monitor trust, reputation signals, verification and reported activity across the platform.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Healthy', value: summary.healthy, color: '#22C55E' },
          { label: 'Under Review', value: summary.underReview, color: '#3B82F6' },
          { label: 'Flagged', value: summary.flagged, color: '#F59E0B' },
          { label: 'Restricted', value: summary.restricted, color: '#F04438' },
        ].map(s => (
          <button key={s.label} onClick={() => setStatusFilter(v => v === s.label ? '' : s.label)}
            className={`text-left bg-[#121A2B] border rounded-[10px] px-3.5 py-2.5 transition-colors hover:border-[color:var(--vv-border-strong)] ${statusFilter === s.label ? 'border-[color:var(--vv-border-strong)]' : 'border-[color:var(--vv-border)]'}`}>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1 leading-none">{s.label}</p>
            <p className="font-mono text-[20px] font-semibold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selCls}>
              <option value="">All roles</option>
              {['Founder', 'Investor', 'Professional'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
              <option value="">All statuses</option>
              {['Healthy', 'Under Review', 'Flagged', 'Restricted'].map(s => <option key={s}>{s}</option>)}
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
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {records.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All roles</option>
              {['Founder', 'Investor', 'Professional'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All statuses</option>
              {['Healthy', 'Under Review', 'Flagged', 'Restricted'].map(s => <option key={s}>{s}</option>)}
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
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No reputation records found.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['User', 'Role(s)', 'Verification', 'Reputation', 'Status', 'Flags', 'Reports', 'Last Updated', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${r.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                      onClick={() => setDrawer(r)}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                            {r.name[0]}
                          </div>
                          <div>
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.name}</p>
                            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><RolePills roles={r.roles} /></td>
                      <td className="px-3 py-3"><VerificationBadge tier={r.verification} /></td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-semibold" style={{ color: repLabelColor(r.repLabel) }}>{r.repLabel}</span>
                      </td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(r.repStatus)} dot>{r.repStatus}</Badge></td>
                      <td className="px-3 py-3">
                        {r.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)]">0</span>
                          : <span className="flex items-center gap-1 font-medium text-[12px]" style={{ color: RISK_COLORS[r.risk] }}>
                              <IconAlertTriangle s={11} />{r.flags}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px] tabular-nums" style={{ color: r.reports > 0 ? '#F59E0B' : '#5E6D8F' }}>{r.reports}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{r.lastUpdated}</td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
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
                <div key={r.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${r.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(r)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{r.name}</p>
                        <Badge variant={statusVariant(r.repStatus)} dot>{r.repStatus}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <RolePills roles={r.roles} />
                        <VerificationBadge tier={r.verification} />
                        <span className="text-[11px] font-semibold" style={{ color: repLabelColor(r.repLabel) }}>{r.repLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{r.lastUpdated}</span>
                        {r.flags > 0 && (
                          <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[r.risk] }}>
                            <IconAlertTriangle s={10} />{r.flags}f · {r.reports}r
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

      {/* Drawer */}
      {drawer && (
        <RepDrawer
          rec={drawer}
          onClose={() => setDrawer(null)}
          onUnderReview={() => setModal('underReview')}
          onRestrict={() => setModal('restrict')}
          onRestore={() => setModal('restore')}
        />
      )}

      {/* Modals */}
      {drawer && modal === 'underReview' && (
        <UnderReviewModal rec={drawer} onConfirm={() => applyStatus(drawer.id, 'Under Review', 'Under Review')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'restrict' && (
        <RestrictModal rec={drawer} onConfirm={() => applyStatus(drawer.id, 'Restricted', 'Restricted')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'restore' && (
        <RestoreModal rec={drawer} onConfirm={() => applyStatus(drawer.id, 'Healthy', 'Good')} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}