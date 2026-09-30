import React from 'react';
import { Badge } from '../../components/ui/Badge';

type Capability = { name: string; status: 'Available' | 'Restricted' | 'Not Implemented'; detail: string };

// Implementation reference only: these rows do not grant or determine access.
const capabilities: Capability[] = [
  { name: 'User governance / directory', status: 'Available', detail: 'View persisted user records and participant roles. Staff access assignment is not provided.' },
  { name: 'Tier 1 verification review', status: 'Restricted', detail: 'Review Tier 1 requests and evidence; approve, reject, or request information subject to backend checks.' },
  { name: 'Business governance', status: 'Restricted', detail: 'Inspect businesses and approve or reject submissions. Administrators cannot approve their own business.' },
  { name: 'Deal oversight', status: 'Restricted', detail: 'Inspect deal information under existing access rules. Admin oversight does not authorize participant deal actions.' },
  { name: 'Financial reports / discrepancies', status: 'Restricted', detail: 'Inspect and review persisted financial reports and resolve discrepancies under existing service rules.' },
  { name: 'Governance analytics', status: 'Available', detail: 'View backend financial aggregates and reporting-period comparisons from persisted reports.' },
  { name: 'Financial / verification audit inspection', status: 'Restricted', detail: 'Read history scoped to financial reports and Tier 1 verification requests, including recorded evidence access.' },
];
const unavailable: Capability[] = [
  { name: 'Platform policy editing', status: 'Not Implemented', detail: 'The policies page is documentation only; it does not update backend policies.' },
  { name: 'Staff-tier RBAC', status: 'Not Implemented', detail: 'No separate staff-tier permission model or permission matrix is enforced.' },
  { name: 'Staff role assignment', status: 'Not Implemented', detail: 'No staff role assignment or administrative access-change UI/API is provided.' },
  { name: 'Match-engine administration', status: 'Not Implemented', detail: 'The architecture page is documentation only; it does not administer matching rules.' },
  { name: 'Notification-template administration', status: 'Not Implemented', detail: 'The template catalogue is a static reference, not a template-editing or dispatch workflow.' },
  { name: 'Staff permission audit history', status: 'Not Implemented', detail: 'No dedicated administrative grant or permission-change audit history is exposed. Financial and verification logs cover different operations.' },
];

function CapabilityTable({ id, title, description, rows }: { id: string; title: string; description: string; rows: Capability[] }) {
  return <section aria-labelledby={id} className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
    <div className="px-5 py-4 border-b border-[color:var(--vv-border)]">
      <h2 id={id} className="text-[13px] font-semibold text-[color:var(--vv-text)]">{title}</h2>
      <p id={`${id}-description`} className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{description}</p>
    </div>
    <div className="overflow-x-auto" role="region" aria-label={`${title} table scroll area`} tabIndex={0}>
      <table aria-labelledby={id} aria-describedby={`${id}-description`} className="w-full min-w-[640px] text-left">
        <thead><tr className="border-b border-[color:var(--vv-border)]">
          {['Capability', 'Status', 'Scope / limitation'].map(name => <th scope="col" key={name} className="px-4 py-3 text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">{name}</th>)}
        </tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.name} className={`border-b border-[#1c2a3e] last:border-0 ${index % 2 ? 'bg-[#121A2B]' : ''}`}>
          <th scope="row" className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] font-medium w-64">{row.name}</th>
          <td className="px-4 py-3 text-xs whitespace-nowrap"><Badge variant={row.status === 'Available' ? 'success' : row.status === 'Restricted' ? 'warning' : 'neutral'}>{row.status}</Badge></td>
          <td className="px-4 py-3 text-xs text-[color:var(--vv-text-tertiary)] leading-relaxed">{row.detail}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export default function AdminTeamManagement() {
  return <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Administrative Access & Capabilities</h1>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Implementation reference, not a staff directory or editable permission matrix.</p>
      </div>
      <Badge variant="neutral">Current access model</Badge>
    </div>
    <section aria-labelledby="access-model" className="p-4 rounded-[10px] text-xs space-y-2" style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.18)' }}>
      <h2 id="access-model" className="font-semibold text-[color:var(--vv-text)]">How administrative access works</h2>
      <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">Administrative access is controlled by persisted <code className="text-[#C67A4E]">admin_access</code> membership: admin-access users versus non-admin users. All admin-access users pass the common backend admin authorization gate after authentication.</p>
      <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">The current system does not implement separate Super Admin, Admin, Moderator, or Verification Ops permission tiers. Additional operation-specific policies and services may still restrict individual actions.</p>
      <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">Available means an implemented capability for admin-access users. Restricted means additional scope or action constraints apply; it does not indicate a separate staff role. This reference does not grant access or change permissions.</p>
    </section>
    <CapabilityTable id="implemented-capabilities" title="Implemented administrative capabilities" description="Backend authorization remains authoritative for every request." rows={capabilities} />
    <CapabilityTable id="unavailable-capabilities" title="Documentation-only and unavailable areas" description="These areas are not implemented administrative permissions or change workflows." rows={unavailable} />
  </div>;
}
