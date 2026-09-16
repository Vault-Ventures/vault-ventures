import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { IconShield, IconChevronRight, IconFileText } from '../../components/layout/Icons';

type Section =
  | 'general' | 'roles' | 'verification' | 'businesses'
  | 'applications' | 'deals' | 'reputation' | 'security';

function SettingRow({
  label, description, value, highImpact,
}: {
  label: string; description?: string; value: React.ReactNode; highImpact?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b border-[#1c2a3e] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{label}</p>
          {highImpact && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/8 text-[#F59E0B] uppercase tracking-wide">
              Immutable Policy
            </span>
          )}
        </div>
        {description && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{description}</p>}
      </div>
      <div className="shrink-0 text-xs text-[color:var(--vv-text-secondary)] font-mono">{value}</div>
    </div>
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

function GeneralSection() {
  return (
    <>
      <SectionHeader title="General Configuration" description="Platform locale, currency parameters, and ecosystem identity." />
      <Group title="Platform Identity">
        <SettingRow label="Platform Name" description="The public-facing name of the platform." value="Vault Ventures" />
        <SettingRow label="Platform Description" description="Short description shown in platform metadata." value="Professional equity-free collaboration & investment platform" />
      </Group>
      <Group title="Locale & Financial Unit">
        <SettingRow label="Default Time Zone" description="Used for audit timestamps and platform communications." value="UTC+6 (Asia/Dhaka)" />
        <SettingRow label="Platform Currency" description="Authoritative currency used for deal milestones, valuations, and payouts." value={<Badge variant="gold">BDT (৳)</Badge>} highImpact />
      </Group>
    </>
  );
}

function RolesSection() {
  return (
    <>
      <SectionHeader title="Users & Roles" description="Role configuration and account architecture model." />
      <div className="p-3 bg-[#C67A4E]/5 border border-[#C67A4E]/20 rounded-[8px] mb-4">
        <p className="text-[11px] text-[color:var(--vv-text-secondary)] leading-snug">
          <strong className="text-[#C67A4E]">Multi-Role Architecture:</strong> Users may hold multiple verified roles (Founder, Investor, Professional) within a single account. Administrative roles are segregated server-side.
        </p>
      </div>
      <Group title="Role Definitions">
        <SettingRow label="Founder Role" description="Enables business creation, pitch publishing, readiness scoring, and Deal Room origination." value={<Badge variant="info">Active</Badge>} />
        <SettingRow label="Investor Role" description="Enables investment preferences, deal exploration, and milestone commitment." value={<Badge variant="gold">Active</Badge>} />
        <SettingRow label="Professional Role" description="Enables expertise verification, consulting applications, and fractional engagements." value={<Badge variant="accent">Active</Badge>} />
      </Group>
    </>
  );
}

function VerificationSection() {
  return (
    <>
      <SectionHeader title="Verification Policies" description="Authoritative KYC and KYB compliance requirements." />
      <Group title="Verification Tiers">
        <SettingRow label="Tier 1 (Identity KYC)" description="Government National ID / Passport + biometric selfie validation." value="Required for Deal Room Access" highImpact />
        <SettingRow label="Tier 2 (Entity KYB)" description="Trade License, Certificate of Incorporation, and bank statements." value="Required for Milestone Disbursements" highImpact />
      </Group>
      <Group title="Queue Workflow">
        <SettingRow label="Administrative Review SLA" description="Target turnaround time for compliance evidence evaluation." value="48 Hours" />
        <SettingRow label="Audit Requirement" description="Every verification decision (approve/reject/request-info) requires admin notes and audit logging." value={<Badge variant="success">Enforced</Badge>} />
      </Group>
    </>
  );
}

function BusinessesSection() {
  const stages = ['Pre-Idea', 'Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Established'];
  const industries = ['FinTech', 'HealthTech', 'EdTech', 'SaaS', 'Logistics', 'AI/ML', 'Consumer', 'CleanTech', 'BioTech', 'Other'];

  return (
    <>
      <SectionHeader title="Business Directory Policies" description="Listing guidelines, funding stages, and industry categories." />
      <Group title="Stages & Categories">
        <div className="py-3 space-y-3">
          <div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Supported Business Stages:</p>
            <div className="flex flex-wrap gap-1.5">
              {stages.map(s => (
                <span key={s} className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Supported Industry Taxonomies:</p>
            <div className="flex flex-wrap gap-1.5">
              {industries.map(i => (
                <span key={i} className="text-[10.5px] px-2 py-0.5 rounded border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-secondary)]">{i}</span>
              ))}
            </div>
          </div>
        </div>
      </Group>
    </>
  );
}

function ApplicationsSection() {
  const statuses = ['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'];

  return (
    <>
      <SectionHeader title="Application Lifecycle" description="Standardized application workflow for opportunities." />
      <Group title="Status Flow">
        <div className="py-3">
          <div className="flex flex-wrap gap-2 items-center">
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

function DealsSection() {
  const stages = [
    'Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed',
    'Negotiation', 'Agreement Finalized', 'Milestones Active', 'Completed',
  ];

  return (
    <>
      <SectionHeader title="Deal Governance & Lifecycle" description="Authoritative Deal Room workflow constraints." />
      <Group title="Deal Room Stages">
        <div className="py-3 space-y-1.5">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)] w-5 text-right shrink-0">{i + 1}</span>
              <div className="h-px flex-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
              <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] shrink-0">{s}</span>
            </div>
          ))}
        </div>
      </Group>
      <Group title="Governance Enforcements">
        <SettingRow label="NDA Execution" description="Mutual digital NDA execution required prior to Deal Room document decryption." value={<Badge variant="success">Enforced</Badge>} highImpact />
        <SettingRow label="Milestone Funding Equality" description="All committed milestone tranches (৳) must equal released tranches prior to completion." value={<Badge variant="success">Enforced</Badge>} highImpact />
      </Group>
    </>
  );
}

function ReputationSection() {
  return (
    <>
      <SectionHeader title="Reputation & Feedback Policies" description="Mutual reputation and score governance." />
      <Group title="Reputation Standards">
        <SettingRow label="Calculation Model" description="Deterministic weighted scoring across deal completion, milestones, and verified reviews." value="Backend ReputationService" highImpact />
        <SettingRow label="Gamification Policy" description="No artificial leaderboards or unverified score inflations." value={<Badge variant="neutral">Strictly Professional</Badge>} />
      </Group>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionHeader title="Security & Authentication Policies" description="Sanctum token policy, RBAC enforcement, and audit rules." />
      <div className="p-3 bg-[#F04438]/5 border border-[#F04438]/20 rounded-[8px] mb-4 flex items-start gap-2.5">
        <IconShield s={13} className="text-[#F04438] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[color:var(--vv-text-secondary)] leading-snug">
          Secret tokens, database credentials, and signing keys are strictly stored in server-side environment variables and never rendered on the frontend.
        </p>
      </div>
      <Group title="Authentication Policy">
        <SettingRow label="Token Engine" description="Stateful session & Bearer API authentication." value="Laravel Sanctum" />
        <SettingRow label="Access Control" description="Role-based middleware (Admin, Founder, Investor, Professional)." value="Enforced" highImpact />
      </Group>
    </>
  );
}

const NAV: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'roles', label: 'Users & Roles' },
  { id: 'verification', label: 'Verification' },
  { id: 'businesses', label: 'Businesses' },
  { id: 'applications', label: 'Applications' },
  { id: 'deals', label: 'Deals' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'security', label: 'Security' },
];

export default function AdminSettings() {
  const [active, setActive] = useState<Section>('general');
  const [mobileNav, setMobileNav] = useState(false);

  const sectionMap: Record<Section, React.ReactNode> = {
    general: <GeneralSection />,
    roles: <RolesSection />,
    verification: <VerificationSection />,
    businesses: <BusinessesSection />,
    applications: <ApplicationsSection />,
    deals: <DealsSection />,
    reputation: <ReputationSection />,
    security: <SecuritySection />,
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Platform Governance & Policy Settings</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">
            Authoritative platform policies, compliance tiers, financial units (BDT ৳), and system architectures.
          </p>
        </div>
        <Badge variant="neutral">Authoritative Policies</Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Desktop Sidebar nav */}
        <nav className="hidden md:block w-48 shrink-0 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-[12px] transition-colors border-b border-[#1c2a3e] last:border-0 ${
                active === n.id
                  ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text)] font-medium'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
              }`}
            >
              {n.label}
              {active === n.id && <IconChevronRight s={10} className="text-[#C67A4E]" />}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <button
            onClick={() => setMobileNav(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] text-[12px] text-[color:var(--vv-text-secondary)]"
          >
            <span>{NAV.find(n => n.id === active)?.label}</span>
            <IconChevronRight s={11} className={`transition-transform ${mobileNav ? 'rotate-90' : ''}`} />
          </button>
          {mobileNav && (
            <div className="mt-1 bg-[#121A2B] border border-[color:var(--vv-border-strong)] rounded-[10px] overflow-hidden shadow-xl">
              {NAV.map(n => (
                <button
                  key={n.id}
                  onClick={() => { setActive(n.id); setMobileNav(false); }}
                  className={`w-full px-4 py-2.5 text-left text-[12px] border-b border-[#1c2a3e] last:border-0 transition-colors ${
                    active === n.id ? 'text-[#C67A4E] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0 w-full">
          {sectionMap[active]}
        </div>
      </div>
    </div>
  );
}