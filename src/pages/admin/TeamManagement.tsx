import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { IconCheck, IconShield } from '../../components/layout/Icons';

type AdminRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Verification Ops';

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  'Super Admin':       ['users', 'verification', 'businesses', 'deals', 'reports', 'analytics', 'settings', 'audit', 'teams', 'matching', 'notifications'],
  'Admin':             ['users', 'verification', 'businesses', 'deals', 'reports', 'analytics', 'audit', 'notifications'],
  'Moderator':         ['users', 'businesses', 'reports', 'audit'],
  'Verification Ops':  ['verification', 'users', 'audit'],
};

const ALL_PERMISSIONS = [
  { key: 'users',         label: 'User Verification & Governance' },
  { key: 'verification',  label: 'KYC / KYB Verification Queue' },
  { key: 'businesses',    label: 'Business Governance' },
  { key: 'deals',         label: 'Deal Oversight & Milestone Audit' },
  { key: 'reports',       label: 'Dispute & Financial Reports' },
  { key: 'analytics',     label: 'Platform Capital Telemetry' },
  { key: 'settings',      label: 'Platform Policies' },
  { key: 'audit',         label: 'Audit Log Inspection' },
  { key: 'matching',      label: 'Deterministic Match Engine Architecture' },
  { key: 'notifications', label: 'Notification Dispatch Templates' },
];

const ROLE_CFG: Record<AdminRole, { color: string; bg: string; border: string }> = {
  'Super Admin':      { color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
  'Admin':            { color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  'Moderator':        { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  'Verification Ops': { color: '#22C55E', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
};

export default function AdminTeamManagement() {
  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Admin Role & Permission Matrix</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Platform role-based access control (RBAC) definitions and permission scopes.</p>
        </div>
        <Badge variant="neutral">Server-Side Authorization</Badge>
      </div>

      {/* Info notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-[10px]"
        style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.18)' }}
      >
        <IconShield s={16} className="text-[#C67A4E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-[color:var(--vv-text)]">Immutable Administrative Authorization</p>
          <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">
            Admin roles and permissions are enforced server-side via Laravel middleware and policy guards (<code className="text-[#C67A4E]">auth:sanctum</code> and <code className="text-[#C67A4E]">can:admin</code>). Staff provisioning is managed via backend administrative seeds and configuration.
          </p>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
        <div className="px-5 py-4 border-b border-[color:var(--vv-border)]">
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Role Permission Matrix</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Active capabilities per administrative role tier.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[color:var(--vv-border)]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest w-64">Permission Scope</th>
                {(['Super Admin', 'Admin', 'Moderator', 'Verification Ops'] as AdminRole[]).map(r => {
                  const cfg = ROLE_CFG[r];
                  return (
                    <th key={r} className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
                      {r}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p, i) => (
                <tr key={p.key} className={`border-b border-[#1c2a3e] last:border-0 ${i % 2 === 0 ? '' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]/20'}`}>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{p.label}</td>
                  {(['Super Admin', 'Admin', 'Moderator', 'Verification Ops'] as AdminRole[]).map(r => {
                    const allowed = ROLE_PERMISSIONS[r].includes(p.key);
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        {allowed
                          ? <IconCheck s={14} className="text-[#22C55E] mx-auto" />
                          : <span className="text-[#35446A] text-[12px]">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
