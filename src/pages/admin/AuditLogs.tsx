import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconFilter, IconEye, IconFileText, IconShield,
  IconAlertTriangle, IconCheck,
} from '../../components/layout/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type AuditResult = 'Success' | 'Failed' | 'Blocked';
type EntityType = 'User' | 'Business' | 'Application' | 'Team' | 'Deal' | 'Verification' | 'Report' | 'Reputation' | 'Settings' | 'System';
type ActorType = 'Admin' | 'System';

interface AuditChange {
  field: string;
  before: string;
  after: string;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  timestampExact: string;
  timestampRelative: string;
  actorType: ActorType;
  actorName: string;
  actorId?: string;
  action: string;
  entityType: EntityType;
  entityName: string;
  entityId: string;
  result: AuditResult;
  severity: AuditSeverity;
  reason?: string;
  changes?: AuditChange[];
  context?: { label: string; value: string; link?: boolean }[];
  isSecurity?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-10491',
    timestamp: 'Apr 20, 2026 · 14:32:18',
    timestampExact: 'Apr 20, 2026 · 14:32:18',
    timestampRelative: '2h ago',
    actorType: 'Admin',
    actorName: 'admin@vault.io',
    actorId: 'ADM-001',
    action: 'Verification Approved',
    entityType: 'Verification',
    entityName: 'Alex Morgan',
    entityId: 'USR-1042',
    result: 'Success',
    severity: 'Medium',
    reason: 'All documents verified against public registry.',
    changes: [{ field: 'status', before: 'Pending', after: 'Approved' }],
    context: [
      { label: 'Applicant', value: 'Alex Morgan', link: true },
      { label: 'Tier', value: 'Tier 1' },
      { label: 'Verification Case', value: 'VRF-0041', link: true },
    ],
  },
  {
    id: 'EVT-10490',
    timestamp: 'Apr 20, 2026 · 13:48:05',
    timestampExact: 'Apr 20, 2026 · 13:48:05',
    timestampRelative: '3h ago',
    actorType: 'Admin',
    actorName: 'compliance@vault.io',
    actorId: 'ADM-003',
    action: 'User Suspended',
    entityType: 'User',
    entityName: 'Unknown Account',
    entityId: 'USR-2105',
    result: 'Success',
    severity: 'High',
    reason: 'Suspected off-platform payment solicitation. Matched prior fraud pattern.',
    changes: [{ field: 'status', before: 'Active', after: 'Suspended' }],
    context: [
      { label: 'Related Report', value: 'R-1043', link: true },
      { label: 'Assigned Case', value: 'R-1043' },
    ],
    isSecurity: true,
  },
  {
    id: 'EVT-10489',
    timestamp: 'Apr 20, 2026 · 12:11:30',
    timestampExact: 'Apr 20, 2026 · 12:11:30',
    timestampRelative: '4h ago',
    actorType: 'Admin',
    actorName: 'admin@vault.io',
    actorId: 'ADM-001',
    action: 'Business Flagged',
    entityType: 'Business',
    entityName: 'NovaTech AI',
    entityId: 'BUS-0311',
    result: 'Success',
    severity: 'Medium',
    reason: 'Unverified certification claims. Under investigation.',
    changes: [{ field: 'flag_status', before: 'None', after: 'Flagged' }, { field: 'flag_severity', before: '—', after: 'High' }],
    context: [
      { label: 'Related Report', value: 'R-1042', link: true },
      { label: 'Business', value: 'NovaTech AI', link: true },
    ],
  },
  {
    id: 'EVT-10488',
    timestamp: 'Apr 20, 2026 · 11:55:00',
    timestampExact: 'Apr 20, 2026 · 11:55:00',
    timestampRelative: '5h ago',
    actorType: 'System',
    actorName: 'System',
    action: 'Application Status Changed',
    entityType: 'Application',
    entityName: 'Priya Nair → Orbit Analytics',
    entityId: 'APP-0772',
    result: 'Success',
    severity: 'Low',
    changes: [{ field: 'status', before: 'Submitted', after: 'Under Review' }],
    context: [
      { label: 'Applicant', value: 'Priya Nair', link: true },
      { label: 'Business', value: 'Orbit Analytics', link: true },
    ],
  },
  {
    id: 'EVT-10487',
    timestamp: 'Apr 20, 2026 · 10:40:22',
    timestampExact: 'Apr 20, 2026 · 10:40:22',
    timestampRelative: '6h ago',
    actorType: 'Admin',
    actorName: 'trust@vault.io',
    actorId: 'ADM-002',
    action: 'Report Resolved',
    entityType: 'Report',
    entityName: 'Inappropriate contact',
    entityId: 'RPT-1040',
    result: 'Success',
    severity: 'Low',
    reason: 'Warning issued. No further action required.',
    changes: [{ field: 'status', before: 'Under Review', after: 'Resolved' }, { field: 'outcome', before: '—', after: 'Issue resolved' }],
    context: [
      { label: 'Reporter', value: 'James Okafor', link: true },
      { label: 'Reported User', value: 'Priya Nair', link: true },
    ],
  },
  {
    id: 'EVT-10486',
    timestamp: 'Apr 20, 2026 · 09:15:44',
    timestampExact: 'Apr 20, 2026 · 09:15:44',
    timestampRelative: '7h ago',
    actorType: 'Admin',
    actorName: 'compliance@vault.io',
    actorId: 'ADM-003',
    action: 'Report Escalated',
    entityType: 'Report',
    entityName: 'Fraudulent activity',
    entityId: 'RPT-1043',
    result: 'Success',
    severity: 'Critical',
    reason: 'Fraud pattern detected matching prior case from Apr 2025.',
    changes: [{ field: 'status', before: 'Open', after: 'Escalated' }, { field: 'assigned', before: 'admin@vault.io', after: 'compliance@vault.io' }],
    context: [
      { label: 'Case', value: 'R-1043', link: true },
      { label: 'Reported User', value: 'Unknown Account', link: true },
    ],
    isSecurity: true,
  },
  {
    id: 'EVT-10485',
    timestamp: 'Apr 20, 2026 · 08:00:01',
    timestampExact: 'Apr 20, 2026 · 08:00:01',
    timestampRelative: '8h ago',
    actorType: 'System',
    actorName: 'System',
    action: 'Deal Stage Changed',
    entityType: 'Deal',
    entityName: 'GreenPath Logistics',
    entityId: 'DEAL-0033',
    result: 'Success',
    severity: 'Low',
    changes: [{ field: 'stage', before: 'Due Diligence', after: 'Term Sheet' }],
    context: [
      { label: 'Deal', value: 'DEAL-0033', link: true },
      { label: 'Business', value: 'GreenPath Logistics', link: true },
    ],
  },
  {
    id: 'EVT-10484',
    timestamp: 'Apr 19, 2026 · 17:22:10',
    timestampExact: 'Apr 19, 2026 · 17:22:10',
    timestampRelative: '1d ago',
    actorType: 'Admin',
    actorName: 'admin@vault.io',
    actorId: 'ADM-001',
    action: 'Reputation Restricted',
    entityType: 'Reputation',
    entityName: 'Sam Draper',
    entityId: 'USR-0814',
    result: 'Success',
    severity: 'High',
    reason: 'Multiple unresolved reports. Repeated policy violations.',
    changes: [{ field: 'rep_status', before: 'Under Review', after: 'Restricted' }],
    context: [
      { label: 'User', value: 'Sam Draper', link: true },
    ],
    isSecurity: true,
  },
  {
    id: 'EVT-10483',
    timestamp: 'Apr 19, 2026 · 14:05:33',
    timestampExact: 'Apr 19, 2026 · 14:05:33',
    timestampRelative: '1d ago',
    actorType: 'System',
    actorName: 'System',
    action: 'Admin Login',
    entityType: 'System',
    entityName: 'admin@vault.io',
    entityId: 'ADM-001',
    result: 'Success',
    severity: 'Low',
    context: [],
    isSecurity: true,
  },
  {
    id: 'EVT-10482',
    timestamp: 'Apr 19, 2026 · 13:50:11',
    timestampExact: 'Apr 19, 2026 · 13:50:11',
    timestampRelative: '1d ago',
    actorType: 'Admin',
    actorName: 'trust@vault.io',
    actorId: 'ADM-002',
    action: 'Team Suspended',
    entityType: 'Team',
    entityName: 'Nova Robotics Build',
    entityId: 'TEAM-0092',
    result: 'Success',
    severity: 'Medium',
    reason: 'Ongoing dispute between team members. Awaiting resolution.',
    changes: [{ field: 'status', before: 'Active', after: 'Suspended' }],
    context: [
      { label: 'Team', value: 'Nova Robotics Build', link: true },
      { label: 'Business', value: 'Nova Robotics', link: true },
    ],
  },
  {
    id: 'EVT-10480',
    timestamp: 'Apr 18, 2026 · 16:30:00',
    timestampExact: 'Apr 18, 2026 · 16:30:00',
    timestampRelative: '2d ago',
    actorType: 'Admin',
    actorName: 'compliance@vault.io',
    actorId: 'ADM-003',
    action: 'Privileged Action Failed',
    entityType: 'User',
    entityName: 'Riley Kim',
    entityId: 'USR-0299',
    result: 'Blocked',
    severity: 'High',
    reason: 'Attempted role change without required approval step.',
    context: [
      { label: 'User', value: 'Riley Kim', link: true },
    ],
    isSecurity: true,
  },
  {
    id: 'EVT-10479',
    timestamp: 'Apr 18, 2026 · 11:00:44',
    timestampExact: 'Apr 18, 2026 · 11:00:44',
    timestampRelative: '2d ago',
    actorType: 'Admin',
    actorName: 'admin@vault.io',
    actorId: 'ADM-001',
    action: 'Deal Restricted',
    entityType: 'Deal',
    entityName: 'Orbit Analytics Series A',
    entityId: 'DEAL-0041',
    result: 'Success',
    severity: 'High',
    reason: 'Compliance hold pending external review.',
    changes: [{ field: 'deal_status', before: 'Active', after: 'Restricted' }],
    context: [
      { label: 'Deal', value: 'DEAL-0041', link: true },
      { label: 'Business', value: 'Orbit Analytics', link: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resultVariant(r: AuditResult) {
  return r === 'Success' ? 'success' : r === 'Failed' ? 'danger' : 'warning';
}

function severityColor(s: AuditSeverity) {
  return s === 'Critical' ? '#F04438' : s === 'High' ? '#F59E0B' : s === 'Medium' ? '#3B82F6' : '#5E6D8F';
}

function severityBg(s: AuditSeverity) {
  return s === 'Critical' ? 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]' :
    s === 'High' ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' :
    s === 'Medium' ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]' :
    'bg-[#5E6D8F]/10 border-[#5E6D8F]/30 text-[color:var(--vv-text-tertiary)]';
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${severityBg(severity)}`}>
      {(severity === 'Critical' || severity === 'High') ? <IconAlertTriangle s={9} /> : null}
      {severity}
    </span>
  );
}

function ActorTag({ event }: { event: AuditEvent }) {
  if (event.actorType === 'System') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center shrink-0">
          <svg width="9" height="9" fill="none" viewBox="0 0 16 16" stroke="#5E6D8F" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
          </svg>
        </span>
        <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">System</span>
      </div>
    );
  }
  const initials = event.actorName.split('@')[0].slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/30 flex items-center justify-center shrink-0 text-[8px] font-bold text-[#C67A4E] font-mono">{initials}</span>
      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] font-mono truncate max-w-[100px]">{event.actorName}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
          <div className="space-y-1 shrink-0">
            <div className="h-2.5 w-28 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-12 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-3 w-24 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden sm:block" />
          <div className="flex-1 h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          <div className="h-5 w-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState<'csv' | 'json'>('csv');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="export-audit-logs-title">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <p id="export-audit-logs-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Export Audit Logs</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-4">Export based on current search and filter selection.</p>
        <div className="flex gap-2 mb-5">
          {(['csv', 'json'] as const).map(f => (
            <button key={f} onClick={() => setFmt(f)}
              className={`flex-1 h-9 rounded-md border text-[12px] font-semibold uppercase transition-colors ${
                fmt === f ? 'bg-[#C67A4E]/10 border-[#C67A4E]/50 text-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{f}</button>
          ))}
        </div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-4">Sensitive secrets and passwords are never included in exports.</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1" onClick={onClose}>Export {fmt.toUpperCase()}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

function EventDrawer({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="event-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)]">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-[#C67A4E]">{event.id}</span>
                {event.isSecurity && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] flex items-center gap-1">
                    <IconShield s={9} /> Security Event
                  </span>
                )}
              </div>
              <p id="event-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display">{event.action}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0"><IconX s={15} /></button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={resultVariant(event.result)} dot>{event.result}</Badge>
            <SeverityBadge severity={event.severity} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Event */}
          <div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Event</p>
            <div className="space-y-0">
              {[
                { label: 'Timestamp', value: <span className="font-mono text-[11px]">{event.timestampExact}</span> },
                { label: 'Relative', value: <span className="font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{event.timestampRelative}</span> },
                { label: 'Action', value: <span className="font-medium text-[color:var(--vv-text)]">{event.action}</span> },
                { label: 'Result', value: <Badge variant={resultVariant(event.result)}>{event.result}</Badge> },
                { label: 'Severity', value: <SeverityBadge severity={event.severity} /> },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-[#1c2a3e] last:border-0">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">{r.label}</span>
                  <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actor */}
          <div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Actor</p>
            <div className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px] flex items-center gap-3">
              {event.actorType === 'System' ? (
                <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center shrink-0">
                  <svg width="13" height="13" fill="none" viewBox="0 0 16 16" stroke="#5E6D8F" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/30 flex items-center justify-center shrink-0 text-[11px] font-bold text-[#C67A4E] font-mono">
                  {event.actorName.split('@')[0].slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{event.actorName}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{event.actorType}{event.actorId ? ` · ${event.actorId}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Target */}
          <div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Target</p>
            <div className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] px-1.5 py-0.5 rounded">{event.entityType}</span>
                <span className="font-mono text-[10.5px] text-[#C67A4E]">{event.entityId}</span>
              </div>
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{event.entityName}</p>
            </div>
          </div>

          {/* Before / After */}
          {event.changes && event.changes.length > 0 && (
            <div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">State Change</p>
              <div className="space-y-2">
                {event.changes.map((c, i) => (
                  <div key={i} className="rounded-[8px] overflow-hidden border border-[color:var(--vv-border)]">
                    <div className="px-3 py-1.5 bg-[#121A2B] border-b border-[color:var(--vv-border)]">
                      <span className="text-[10px] font-mono text-[color:var(--vv-text-tertiary)]">{c.field}</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#24304A]">
                      <div className="px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)]">
                        <p className="text-[9px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider mb-1">Before</p>
                        <p className="text-[12px] font-mono text-[#F04438]">{c.before}</p>
                      </div>
                      <div className="px-3 py-2.5 bg-[#22C55E]/5">
                        <p className="text-[9px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider mb-1">After</p>
                        <p className="text-[12px] font-mono text-[#22C55E]">{c.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          {event.reason && (
            <div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Reason</p>
              <div className="p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{event.reason}</p>
              </div>
            </div>
          )}

          {/* Context / related */}
          {event.context && event.context.length > 0 && (
            <div>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Related Records</p>
              <div className="space-y-0">
                {event.context.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{c.label}</span>
                    {c.link ? (
                      <button className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1">
                        {c.value} <IconEye s={10} />
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] text-[color:var(--vv-text-secondary)]">{c.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ENTITY_TYPES: EntityType[] = ['User', 'Business', 'Application', 'Team', 'Deal', 'Verification', 'Report', 'Reputation', 'Settings', 'System'];
const SEVERITIES: AuditSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
const RESULTS: AuditResult[] = ['Success', 'Failed', 'Blocked'];
const ACTOR_OPTIONS = ['All actors', 'Admin', 'System', 'admin@vault.io', 'trust@vault.io', 'compliance@vault.io'];

export default function AdminAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [securityOnly, setSecurityOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<AuditEvent | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    today: ALL_EVENTS.filter(e => e.timestamp.startsWith('Apr 20')).length,
    admin: ALL_EVENTS.filter(e => e.actorType === 'Admin').length,
    security: ALL_EVENTS.filter(e => e.isSecurity).length,
    flagged: ALL_EVENTS.filter(e => e.severity === 'Critical' || e.severity === 'High').length,
  };

  const filtered = ALL_EVENTS.filter(e => {
    const q = search.toLowerCase();
    if (q && ![e.action, e.entityName, e.entityId, e.actorName, e.id].some(s => s.toLowerCase().includes(q))) return false;
    if (actorFilter && actorFilter !== 'All actors') {
      if (actorFilter === 'Admin' && e.actorType !== 'Admin') return false;
      if (actorFilter === 'System' && e.actorType !== 'System') return false;
      if (!['Admin', 'System'].includes(actorFilter) && e.actorName !== actorFilter) return false;
    }
    if (entityFilter && e.entityType !== entityFilter) return false;
    if (severityFilter && e.severity !== severityFilter) return false;
    if (resultFilter && e.result !== resultFilter) return false;
    if (securityOnly && !e.isSecurity) return false;
    return true;
  });

  const hasFilters = !!(search || actorFilter || entityFilter || severityFilter || resultFilter || securityOnly);
  const clearFilters = () => { setSearch(''); setActorFilter(''); setEntityFilter(''); setSeverityFilter(''); setResultFilter(''); setSecurityOnly(false); };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  if (error) return (
    <div className="p-5 max-w-[1400px] mx-auto flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto mb-3">
          <IconAlertTriangle s={18} className="text-[#F04438]" />
        </div>
        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">Audit logs couldn't be loaded.</p>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Please try again.</p>
        <Button size="sm" onClick={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 480); }}>Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Audit Logs</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Track administrative actions, security events and important platform changes.</p>
        </div>
        <Button variant="ghost" size="sm" icon={<IconFileText s={12} />} onClick={() => setShowExport(true)}>Export Logs</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Actions Today', value: summary.today, color: '#C67A4E' },
          { label: 'Admin Actions', value: summary.admin, color: '#93A1BF' },
          { label: 'Security Events', value: summary.security, color: '#F59E0B' },
          { label: 'Flagged Events', value: summary.flagged, color: '#F04438' },
        ].map(s => (
          <div key={s.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-3.5 py-2.5">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1 leading-none">{s.label}</p>
            <p className="font-mono text-[20px] font-semibold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action, entity, admin or event ID…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={actorFilter} onChange={e => setActorFilter(e.target.value)} className={selCls}>
              <option value="">All actors</option>
              {ACTOR_OPTIONS.slice(1).map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className={selCls}>
              <option value="">All entity types</option>
              {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={selCls}>
              <option value="">All severities</option>
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} className={selCls}>
              <option value="">All results</option>
              {RESULTS.map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={() => setSecurityOnly(s => !s)}
              className={`h-8 px-3 flex items-center gap-1.5 rounded-md border text-[11.5px] font-medium transition-colors ${
                securityOnly ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>
              <IconShield s={11} />Security only
            </button>
          </div>

          <button onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]">
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">Clear filters</button>}
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {ALL_EVENTS.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={actorFilter} onChange={e => setActorFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All actors</option>
              {ACTOR_OPTIONS.slice(1).map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All types</option>
              {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All severities</option>
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All results</option>
              {RESULTS.map(r => <option key={r}>{r}</option>)}
            </select>
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
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">
              {hasFilters ? 'No audit events found.' : 'No audit events yet.'}
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
              {hasFilters ? 'Try adjusting your search or filters.' : 'Events will appear as actions are taken.'}
            </p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID', 'Result', 'Severity', 'Details'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${
                        e.severity === 'Critical' ? 'border-l-2 border-l-[#F04438]' :
                        e.isSecurity && e.severity === 'High' ? 'border-l-2 border-l-[#F59E0B]' : ''
                      }`}
                      onClick={() => setDrawer(e)}>
                      <td className="px-3 py-3 shrink-0">
                        <p className="font-mono text-[10.5px] text-[color:var(--vv-text)] whitespace-nowrap">{e.timestampExact.split(' · ')[0]}</p>
                        <p className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)]">{e.timestampExact.split(' · ')[1]}</p>
                        <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)]/60 mt-0.5">{e.timestampRelative}</p>
                      </td>
                      <td className="px-3 py-3"><ActorTag event={e} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {e.isSecurity && <IconShield s={11} className="text-[#F59E0B] shrink-0" />}
                          <span className="text-[12px] text-[color:var(--vv-text)]">{e.action}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] rounded">{e.entityType}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[10.5px] text-[#C67A4E] whitespace-nowrap">{e.entityId}</td>
                      <td className="px-3 py-3"><Badge variant={resultVariant(e.result)} dot>{e.result}</Badge></td>
                      <td className="px-3 py-3"><SeverityBadge severity={e.severity} /></td>
                      <td className="px-3 py-3" onClick={ev => ev.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(e)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(e => (
                <div key={e.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${
                    e.severity === 'Critical' ? 'border-l-2 border-l-[#F04438]' : e.isSecurity ? 'border-l-2 border-l-[#F59E0B]' : ''
                  }`}
                  onClick={() => setDrawer(e)}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {e.isSecurity && <IconShield s={11} className="text-[#F59E0B] shrink-0" />}
                      <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{e.action}</span>
                    </div>
                    <Badge variant={resultVariant(e.result)} dot>{e.result}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] px-1.5 py-0.5 rounded font-semibold">{e.entityType}</span>
                    <span className="font-mono text-[10px] text-[#C67A4E]">{e.entityId}</span>
                    <SeverityBadge severity={e.severity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <ActorTag event={e} />
                    <span className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)]">{e.timestampRelative}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {drawer && <EventDrawer event={drawer} onClose={() => setDrawer(null)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}