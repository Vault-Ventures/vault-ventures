import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconAlertTriangle, IconCheck, IconShield, IconFileText, IconChevronRight, IconX } from '../../components/layout/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | 'general' | 'roles' | 'verification' | 'businesses'
  | 'applications' | 'deals' | 'reputation' | 'notifications'
  | 'security' | 'system';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SettingRow({
  label, description, children, highImpact,
}: {
  label: string; description?: string; children: React.ReactNode; highImpact?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b border-[#1c2a3e] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{label}</p>
          {highImpact && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/8 text-[#F59E0B] uppercase tracking-wide">
              High impact
            </span>
          )}
        </div>
        {description && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[#C67A4E] border-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 translate-y-[1px] ${
        checked ? 'translate-x-[17px]' : 'translate-x-[1px]'
      }`} />
    </button>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors min-w-[140px]">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors w-48" />
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">{title}</h2>
      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{description}</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-0">{title}</p>
      <div className="border border-[color:var(--vv-border)] rounded-[10px] bg-[#121A2B] mt-2 px-4 divide-y-0">
        {children}
      </div>
    </div>
  );
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, what, affected, reversible, onConfirm, onCancel,
}: {
  title: string; what: string; affected: string; reversible: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="maintenance-confirm-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-[400px] p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center shrink-0 mt-0.5">
            <IconAlertTriangle s={14} className="text-[#F59E0B]" />
          </div>
          <div>
            <p id="maintenance-confirm-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">{title}</p>
          </div>
        </div>
        <div className="space-y-2.5 mb-5">
          {[
            { label: 'What changes', value: what },
            { label: 'Who may be affected', value: affected },
            { label: 'Reversible', value: reversible },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-3 py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 w-32">{r.label}</span>
              <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30" onClick={onConfirm}>Confirm Change</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Section content panels ────────────────────────────────────────────────────

function GeneralSection({ dirty, onDirty }: { dirty: boolean; onDirty: () => void }) {
  const [platformName, setPlatformName] = useState('Vault Ventures');
  const [description, setDescription] = useState('The professional equity-free collaboration platform.');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('BDT');
  const [maintenance, setMaintenance] = useState(false);
  const [confirmMaint, setConfirmMaint] = useState(false);

  return (
    <>
      <SectionHeader title="General" description="Core platform configuration and operational preferences." />
      <Group title="Platform Identity">
        <SettingRow label="Platform Name" description="The public-facing name of the platform.">
          <TextInput value={platformName} onChange={v => { setPlatformName(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Platform Description" description="Short description shown in platform metadata.">
          <TextInput value={description} onChange={v => { setDescription(v); onDirty(); }} placeholder="Brief description…" />
        </SettingRow>
      </Group>
      <Group title="Locale">
        <SettingRow label="Default Time Zone" description="Used for audit timestamps and platform communications.">
          <Select value={timezone} onChange={v => { setTimezone(v); onDirty(); }}
            options={['UTC', 'UTC+1', 'UTC-5 (EST)', 'UTC-8 (PST)', 'UTC+8', 'UTC+10']} />
        </SettingRow>
        <SettingRow label="Default Currency" description="Currency used for deal and funding displays.">
          <Select value={currency} onChange={v => { setCurrency(v); onDirty(); }}
            options={['BDT']} />
        </SettingRow>
      </Group>
      <Group title="Availability">
        <SettingRow label="Maintenance Mode" description="Temporarily restricts platform access for all non-admin users." highImpact>
          <Toggle checked={maintenance} onChange={v => { if (v) setConfirmMaint(true); else { setMaintenance(false); onDirty(); } }} />
        </SettingRow>
      </Group>
      {confirmMaint && (
        <ConfirmModal
          title="Enable Maintenance Mode"
          what="Platform access will be restricted for all non-admin users immediately."
          affected="All active founders, investors and professionals."
          reversible="Yes — disable maintenance mode at any time."
          onConfirm={() => { setMaintenance(true); setConfirmMaint(false); onDirty(); }}
          onCancel={() => setConfirmMaint(false)} />
      )}
    </>
  );
}

function RolesSection({ onDirty }: { onDirty: () => void }) {
  const [founderSelfReg, setFounderSelfReg] = useState(true);
  const [investorSelfReg, setInvestorSelfReg] = useState(true);
  const [professionalSelfReg, setProfessionalSelfReg] = useState(true);
  const [multiRole, setMultiRole] = useState(true);

  return (
    <>
      <SectionHeader title="Users & Roles" description="Configure role availability and account model behavior." />
      <div className="p-3 bg-[#C67A4E]/5 border border-[#C67A4E]/20 rounded-[8px] mb-4">
        <p className="text-[11px] text-[color:var(--vv-text-secondary)] leading-snug">
          <strong className="text-[#C67A4E]">Multi-role model:</strong> One user account may hold multiple roles simultaneously — Founder, Investor, and Professional are not mutually exclusive. Admin accounts remain completely separate and are not configurable here.
        </p>
      </div>
      <Group title="Role Availability">
        <SettingRow label="Founder Self-Registration" description="Allow users to register the Founder role without Admin approval.">
          <Toggle checked={founderSelfReg} onChange={v => { setFounderSelfReg(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Investor Self-Registration" description="Allow users to register the Investor role without Admin approval.">
          <Toggle checked={investorSelfReg} onChange={v => { setInvestorSelfReg(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Professional Self-Registration" description="Allow users to register the Professional role without Admin approval.">
          <Toggle checked={professionalSelfReg} onChange={v => { setProfessionalSelfReg(v); onDirty(); }} />
        </SettingRow>
      </Group>
      <Group title="Account Model">
        <SettingRow label="Allow Multiple Roles Per Account" description="Permits a single account to activate more than one role." highImpact>
          <Toggle checked={multiRole} onChange={v => { setMultiRole(v); onDirty(); }} />
        </SettingRow>
      </Group>
    </>
  );
}

function VerificationSection({ onDirty }: { onDirty: () => void }) {
  const [t1Docs, setT1Docs] = useState('Government ID');
  const [t2Docs, setT2Docs] = useState('Government ID + Business Registration');
  const [autoAssign, setAutoAssign] = useState(true);
  const [reviewTimeout, setReviewTimeout] = useState('72 hours');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [changed, setChanged] = useState('');

  function requireConfirm(field: string, action: () => void) {
    setChanged(field);
    setConfirm(field);
  }

  return (
    <>
      <SectionHeader title="Verification" description="Configure verification tiers, requirements, and review workflows." />
      <Group title="Tier Definitions">
        {[
          { tier: 'Unverified', desc: 'No documents submitted. Default state for new accounts.', badge: 'neutral' as const },
          { tier: 'Tier 1', desc: 'Basic identity verified. Unlocks standard platform features.', badge: 'info' as const },
          { tier: 'Tier 2', desc: 'Full verification. Unlocks advanced deal participation.', badge: 'gold' as const },
        ].map(t => (
          <div key={t.tier} className="flex items-start justify-between gap-4 py-3 border-b border-[#1c2a3e] last:border-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5"><Badge variant={t.badge}>{t.tier}</Badge></div>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{t.desc}</p>
            </div>
          </div>
        ))}
      </Group>
      <Group title="Document Requirements">
        <SettingRow label="Tier 1 Requirements" description="Documents required for Tier 1 verification approval." highImpact>
          <Select value={t1Docs} onChange={v => requireConfirm('Tier 1 Requirements', () => { setT1Docs(v); onDirty(); })}
            options={['Government ID', 'Government ID + Selfie', 'Proof of Address']} />
        </SettingRow>
        <SettingRow label="Tier 2 Requirements" description="Documents required for Tier 2 verification approval." highImpact>
          <Select value={t2Docs} onChange={v => requireConfirm('Tier 2 Requirements', () => { setT2Docs(v); onDirty(); })}
            options={['Government ID + Business Registration', 'Full KYB Package', 'Government ID + Company Filing']} />
        </SettingRow>
      </Group>
      <Group title="Review Workflow">
        <SettingRow label="Auto-assign Reviews" description="Automatically assign incoming verification requests to available admins.">
          <Toggle checked={autoAssign} onChange={v => { setAutoAssign(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Review Timeout" description="Time before an unreviewed verification request escalates.">
          <Select value={reviewTimeout} onChange={v => { setReviewTimeout(v); onDirty(); }}
            options={['24 hours', '48 hours', '72 hours', '7 days', 'No timeout']} />
        </SettingRow>
      </Group>
      {confirm && (
        <ConfirmModal
          title={`Change ${changed}`}
          what={`Verification document requirement will be updated for all future submissions.`}
          affected="New verification applicants only. Existing approved verifications are not affected."
          reversible="Yes — requirements can be changed again at any time."
          onConfirm={() => { setConfirm(null); onDirty(); }}
          onCancel={() => setConfirm(null)} />
      )}
    </>
  );
}

function BusinessesSection({ onDirty }: { onDirty: () => void }) {
  const [requireVerif, setRequireVerif] = useState(true);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const stages = ['Pre-Idea', 'Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Established'];
  const industries = ['FinTech', 'HealthTech', 'EdTech', 'SaaS', 'Logistics', 'AI/ML', 'Consumer', 'CleanTech', 'BioTech', 'Other'];

  return (
    <>
      <SectionHeader title="Businesses" description="Configure business listing rules, stage options and industry categories." />
      <Group title="Business Rules">
        <SettingRow label="Require Founder Verification" description="Founders must be verified before creating a business listing.">
          <Toggle checked={requireVerif} onChange={v => { setRequireVerif(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Allow Multiple Businesses Per Founder" description="A single founder account may own more than one business listing.">
          <Toggle checked={allowMultiple} onChange={v => { setAllowMultiple(v); onDirty(); }} />
        </SettingRow>
      </Group>
      <Group title="Stage Options">
        <div className="py-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Active stages available for business listings:</p>
          <div className="flex flex-wrap gap-1.5">
            {stages.map(s => (
              <span key={s} className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{s}</span>
            ))}
          </div>
        </div>
      </Group>
      <Group title="Industry Categories">
        <div className="py-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Available industry categories:</p>
          <div className="flex flex-wrap gap-1.5">
            {industries.map(i => (
              <span key={i} className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{i}</span>
            ))}
          </div>
        </div>
      </Group>
    </>
  );
}

function ApplicationsSection({ onDirty }: { onDirty: () => void }) {
  const [autoReview, setAutoReview] = useState(false);
  const [withdrawable, setWithdrawable] = useState(true);
  const statuses = ['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'];

  return (
    <>
      <SectionHeader title="Applications" description="Configure application workflow, statuses and default behavior." />
      <Group title="Application Workflow">
        <SettingRow label="Auto-move to Under Review" description="Automatically transition submitted applications to Under Review after 24h.">
          <Toggle checked={autoReview} onChange={v => { setAutoReview(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Allow Applicant Withdrawal" description="Permit applicants to withdraw their own applications before a decision.">
          <Toggle checked={withdrawable} onChange={v => { setWithdrawable(v); onDirty(); }} />
        </SettingRow>
      </Group>
      <Group title="Status Lifecycle">
        <div className="py-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Active application statuses:</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{s}</span>
                {i < statuses.length - 1 && <span className="text-[#35446A] text-[10px]">→</span>}
              </div>
            ))}
          </div>
        </div>
      </Group>
    </>
  );
}

function DealsSection({ onDirty }: { onDirty: () => void }) {
  const [ndaRequired, setNdaRequired] = useState(true);
  const [milestoneRequired, setMilestoneRequired] = useState(true);
  const stages = [
    'Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed',
    'Negotiation', 'Agreement', 'Milestone Funding Active', 'Completed',
  ];

  return (
    <>
      <SectionHeader title="Deals" description="Configure deal lifecycle stages and required steps." />
      <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-[8px] mb-4">
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
          <strong className="text-[color:var(--vv-text-secondary)]">Note:</strong> Admin configuration does not make Admin a deal participant. Admins have oversight and moderation access only.
        </p>
      </div>
      <Group title="Deal Lifecycle">
        <div className="py-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-3">Active deal stages in lifecycle order:</p>
          <div className="space-y-1.5">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)] w-5 text-right shrink-0">{i + 1}</span>
                <div className="h-px flex-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] shrink-0">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Group>
      <Group title="Required Steps">
        <SettingRow label="NDA Required Before Deal Room" description="Parties must sign an NDA before accessing the Deal Room workspace." highImpact>
          <Toggle checked={ndaRequired} onChange={v => { setNdaRequired(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Milestone Plan Required" description="A milestone funding plan must be filed before deal completion." highImpact>
          <Toggle checked={milestoneRequired} onChange={v => { setMilestoneRequired(v); onDirty(); }} />
        </SettingRow>
      </Group>
    </>
  );
}

function ReputationSection({ onDirty }: { onDirty: () => void }) {
  const [autoFlag, setAutoFlag] = useState(true);
  const [reviewThreshold, setReviewThreshold] = useState('3 reports');
  const statuses = [
    { label: 'Healthy', color: '#22C55E' },
    { label: 'Under Review', color: '#3B82F6' },
    { label: 'Flagged', color: '#F59E0B' },
    { label: 'Restricted', color: '#F04438' },
  ];
  const severities = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <>
      <SectionHeader title="Reputation" description="Configure reputation states, flag severity thresholds and review triggers." />
      <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-[8px] mb-4">
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]"><strong className="text-[color:var(--vv-text-secondary)]">Note:</strong> Reputation is not gamified. Do not configure leaderboards, scores, or ranking systems.</p>
      </div>
      <Group title="Reputation States">
        <div className="py-3 flex flex-wrap gap-2">
          {statuses.map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-[color:var(--vv-text-secondary)]">{s.label}</span>
            </span>
          ))}
        </div>
      </Group>
      <Group title="Flag Severity Levels">
        <div className="py-3 flex flex-wrap gap-2">
          {severities.map(s => (
            <span key={s} className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{s}</span>
          ))}
        </div>
      </Group>
      <Group title="Auto-review Triggers">
        <SettingRow label="Auto-flag on Report Threshold" description="Automatically place an account under review when it reaches the report threshold.">
          <Toggle checked={autoFlag} onChange={v => { setAutoFlag(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Review Threshold" description="Number of open reports that triggers an auto-review flag.">
          <Select value={reviewThreshold} onChange={v => { setReviewThreshold(v); onDirty(); }}
            options={['2 reports', '3 reports', '5 reports', '10 reports', 'Disabled']} />
        </SettingRow>
      </Group>
    </>
  );
}

function NotificationsSection({ onDirty }: { onDirty: () => void }) {
  const [notifs, setNotifs] = useState({
    verificationNew: true, verificationApproved: true,
    applicationSubmitted: true, applicationDecision: true,
    dealStageChange: true, dealRestricted: true,
    reportOpen: true, reportEscalated: true,
    systemAlerts: true, maintenanceNotice: true,
  });

  const toggle = (key: keyof typeof notifs) => {
    setNotifs(n => ({ ...n, [key]: !n[key] }));
    onDirty();
  };

  const groups = [
    { label: 'Verification', rows: [
      { key: 'verificationNew' as const, label: 'New verification submitted', desc: 'Notify admin when a verification request arrives.' },
      { key: 'verificationApproved' as const, label: 'Verification approved/rejected', desc: 'Notify on verification decision.' },
    ]},
    { label: 'Applications', rows: [
      { key: 'applicationSubmitted' as const, label: 'New application submitted', desc: 'Notify when a new team or deal application is filed.' },
      { key: 'applicationDecision' as const, label: 'Application decision made', desc: 'Notify on acceptance or rejection.' },
    ]},
    { label: 'Deals', rows: [
      { key: 'dealStageChange' as const, label: 'Deal stage advanced', desc: 'Notify when a deal moves to a new lifecycle stage.' },
      { key: 'dealRestricted' as const, label: 'Deal restricted', desc: 'Notify when a deal is placed under admin restriction.' },
    ]},
    { label: 'Reports', rows: [
      { key: 'reportOpen' as const, label: 'New report opened', desc: 'Notify when a new report or dispute is filed.' },
      { key: 'reportEscalated' as const, label: 'Report escalated', desc: 'Notify on case escalation.' },
    ]},
    { label: 'System', rows: [
      { key: 'systemAlerts' as const, label: 'System alerts', desc: 'Critical platform operational notifications.' },
      { key: 'maintenanceNotice' as const, label: 'Maintenance notices', desc: 'Notify before scheduled maintenance windows.' },
    ]},
  ];

  return (
    <>
      <SectionHeader title="Notifications" description="Configure which platform events generate admin notifications." />
      {groups.map(g => (
        <Group key={g.label} title={g.label}>
          {g.rows.map(r => (
            <SettingRow key={r.key} label={r.label} description={r.desc}>
              <Toggle checked={notifs[r.key]} onChange={() => toggle(r.key)} />
            </SettingRow>
          ))}
        </Group>
      ))}
    </>
  );
}

function SecuritySection({ onDirty }: { onDirty: () => void }) {
  const [sessionTimeout, setSessionTimeout] = useState('2 hours');
  const [mfa, setMfa] = useState(true);
  const [confirmHigh, setConfirmHigh] = useState(true);
  const [loginLog, setLoginLog] = useState(true);

  return (
    <>
      <SectionHeader title="Security" description="Configure admin session policy, login security and privileged action behavior." />
      <div className="p-3 bg-[#F04438]/5 border border-[#F04438]/20 rounded-[8px] mb-4 flex items-start gap-2.5">
        <IconShield s={13} className="text-[#F04438] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[color:var(--vv-text-secondary)] leading-snug">
          Passwords, API secrets, authentication tokens and private keys are never displayed in Settings. Credentials are managed through secure infrastructure only.
        </p>
      </div>
      <Group title="Session Policy">
        <SettingRow label="Admin Session Timeout" description="Automatically expire inactive admin sessions." highImpact>
          <Select value={sessionTimeout} onChange={v => { setSessionTimeout(v); onDirty(); }}
            options={['30 minutes', '1 hour', '2 hours', '4 hours', '8 hours', 'No timeout']} />
        </SettingRow>
      </Group>
      <Group title="Login Security">
        <SettingRow label="Require MFA for Admin Login" description="All admin accounts must use multi-factor authentication." highImpact>
          <Toggle checked={mfa} onChange={v => { setMfa(v); onDirty(); }} />
        </SettingRow>
        <SettingRow label="Log All Admin Logins" description="Record every admin login event in the audit log.">
          <Toggle checked={loginLog} onChange={v => { setLoginLog(v); onDirty(); }} />
        </SettingRow>
      </Group>
      <Group title="Privileged Actions">
        <SettingRow label="Require Confirmation for High-impact Actions" description="Admins must explicitly confirm before taking high-impact platform actions." highImpact>
          <Toggle checked={confirmHigh} onChange={v => { setConfirmHigh(v); onDirty(); }} />
        </SettingRow>
      </Group>
    </>
  );
}

function SystemSection({ onDirty }: { onDirty: () => void }) {
  const [maintenance, setMaintenance] = useState(false);
  const [confirmMaint, setConfirmMaint] = useState(false);
  const [notice, setNotice] = useState('');

  const statusItems = [
    { label: 'API', status: 'Operational', ok: true },
    { label: 'Authentication', status: 'Operational', ok: true },
    { label: 'File Storage', status: 'Operational', ok: true },
    { label: 'Email Service', status: 'Degraded', ok: false },
    { label: 'Background Jobs', status: 'Operational', ok: true },
  ];

  return (
    <>
      <SectionHeader title="System" description="Platform availability, maintenance mode and operational notices." />
      <Group title="System Status">
        <div className="py-2 space-y-0">
          {statusItems.map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[12px] text-[color:var(--vv-text-secondary)]">{s.label}</span>
              <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${s.ok ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </Group>
      <Group title="Maintenance">
        <SettingRow label="Maintenance Mode" description="Restricts all non-admin platform access immediately when enabled." highImpact>
          <Toggle checked={maintenance} onChange={v => { if (v) setConfirmMaint(true); else { setMaintenance(false); onDirty(); } }} />
        </SettingRow>
        <SettingRow label="Operational Notice" description="Message displayed to users during maintenance or incidents.">
          <TextInput value={notice} onChange={v => { setNotice(v); onDirty(); }} placeholder="e.g. Scheduled maintenance in progress…" />
        </SettingRow>
      </Group>
      <div className="mt-3">
        <button className="flex items-center gap-1.5 text-[11.5px] text-[#C67A4E] hover:underline">
          <IconFileText s={11} /> View Audit History
        </button>
      </div>
      {confirmMaint && (
        <ConfirmModal
          title="Enable Maintenance Mode"
          what="All non-admin users will be blocked from accessing the platform immediately."
          affected="All active users: founders, investors, professionals."
          reversible="Yes — disable maintenance mode to restore access."
          onConfirm={() => { setMaintenance(true); setConfirmMaint(false); onDirty(); }}
          onCancel={() => setConfirmMaint(false)} />
      )}
    </>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'roles', label: 'Users & Roles' },
  { id: 'verification', label: 'Verification' },
  { id: 'businesses', label: 'Businesses' },
  { id: 'applications', label: 'Applications' },
  { id: 'deals', label: 'Deals' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'system', label: 'System' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [active, setActive] = useState<Section>('general');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  function onDirty() { setDirty(true); setSaved(false); }

  function save() {
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function discard() { setDirty(false); setSaved(false); }

  function navigate(s: Section) { setActive(s); setMobileNav(false); }

  const sectionMap: Record<Section, React.ReactNode> = {
    general: <GeneralSection dirty={dirty} onDirty={onDirty} />,
    roles: <RolesSection onDirty={onDirty} />,
    verification: <VerificationSection onDirty={onDirty} />,
    businesses: <BusinessesSection onDirty={onDirty} />,
    applications: <ApplicationsSection onDirty={onDirty} />,
    deals: <DealsSection onDirty={onDirty} />,
    reputation: <ReputationSection onDirty={onDirty} />,
    notifications: <NotificationsSection onDirty={onDirty} />,
    security: <SecuritySection onDirty={onDirty} />,
    system: <SystemSection onDirty={onDirty} />,
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Settings</h1>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Manage platform configuration, policies, permissions and operational preferences.</p>
      </div>

      {/* Unsaved / saved banner */}
      {(dirty || saved) && (
        <div className={`flex items-center justify-between gap-4 px-4 py-2.5 rounded-[8px] border mb-4 ${
          saved ? 'bg-[#22C55E]/8 border-[#22C55E]/30' : 'bg-[#F59E0B]/8 border-[#F59E0B]/30'
        }`}>
          <div className="flex items-center gap-2">
            {saved
              ? <IconCheck s={13} className="text-[#22C55E]" />
              : <IconAlertTriangle s={13} className="text-[#F59E0B]" />}
            <span className="text-[12px] font-medium text-[color:var(--vv-text)]">
              {saved ? 'Changes saved.' : 'Unsaved changes'}
            </span>
          </div>
          {dirty && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]" onClick={discard}>Discard</Button>
              <Button size="sm" onClick={save}>Save Changes</Button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-5 items-start">

        {/* Sidebar nav — desktop */}
        <nav className="hidden md:block w-44 shrink-0 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
          {NAV.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-[12px] transition-colors border-b border-[#1c2a3e] last:border-0 ${
                active === n.id
                  ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text)] font-medium'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
              }`}>
              {n.label}
              {active === n.id && <IconChevronRight s={10} className="text-[#C67A4E]" />}
            </button>
          ))}
        </nav>

        {/* Mobile nav trigger */}
        <div className="md:hidden mb-3 w-full">
          <button onClick={() => setMobileNav(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] text-[12px] text-[color:var(--vv-text-secondary)]">
            <span>{NAV.find(n => n.id === active)?.label}</span>
            <IconChevronRight s={11} className={`transition-transform ${mobileNav ? 'rotate-90' : ''}`} />
          </button>
          {mobileNav && (
            <div className="mt-1 bg-[#121A2B] border border-[color:var(--vv-border-strong)] rounded-[10px] overflow-hidden shadow-xl">
              {NAV.map(n => (
                <button key={n.id} onClick={() => navigate(n.id)}
                  className={`w-full px-4 py-2.5 text-left text-[12px] border-b border-[#1c2a3e] last:border-0 transition-colors ${
                    active === n.id ? 'text-[#C67A4E] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}>{n.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {sectionMap[active]}

          {/* Save footer */}
          <div className="flex gap-2 pt-4 mt-2 border-t border-[color:var(--vv-border)]">
            <Button onClick={save} disabled={!dirty}>Save Changes</Button>
            <Button variant="secondary" onClick={discard} disabled={!dirty}>Cancel</Button>
            <button className="ml-auto flex items-center gap-1.5 text-[11.5px] text-[#C67A4E] hover:underline">
              <IconFileText s={11} /> View Audit History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}