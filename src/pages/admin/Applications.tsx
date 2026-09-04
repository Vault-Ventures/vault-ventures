import React, { useEffect, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle,
  IconFilter, IconEye, IconFileText, IconChevronDown,
} from '../../components/layout/Icons';

// ─── Types ─────────────────────────────────────────────────────────────────

type AppStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected' | 'Withdrawn';
type UserRole = 'Founder' | 'Investor' | 'Professional';
type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

interface Application {
  id: string;
  applicant: string;
  applicantRole: UserRole;
  applicantHeadline: string;
  applicantLocation: string;
  applicantVerification: 0 | 1 | 2;
  business: string;
  businessIndustry: string;
  businessStage: string;
  businessFounder: string;
  businessReadiness: number;
  opportunity: string;
  skills: string[];
  experience: string;
  message: string;
  submitted: string;
  lastActivity: string;
  status: AppStatus;
  flags: number;
  risk: RiskLevel;
  history: { action: string; time: string; actor: string; result?: string }[];
  audit: { action: string; time: string; actor: string }[];
}

// ─── Data ──────────────────────────────────────────────────────────────────

const ALL_APPS: Application[] = [
  {
    id: 'APP-0081', applicant: 'Sarah Chen', applicantRole: 'Professional',
    applicantHeadline: 'Product Strategist · HealthTech · UX Research', applicantLocation: 'Toronto, CA',
    applicantVerification: 1, business: 'NovaTech AI', businessIndustry: 'FinTech', businessStage: 'Seed',
    businessFounder: 'Alex Morgan', businessReadiness: 78,
    opportunity: 'AI/ML Product Strategy', skills: ['Product Strategy', 'UX Research', 'AI/ML'],
    experience: '5 years in product at HealthTech and FinTech companies.',
    message: 'I believe my background in AI-driven product development at FinTech firms aligns closely with NovaTech\'s compliance automation mission.',
    submitted: 'Apr 20, 2026', lastActivity: '2h ago', status: 'Under Review', flags: 0, risk: 'None',
    history: [
      { action: 'Application submitted', time: 'Apr 20 · 10:12', actor: 'Sarah Chen' },
      { action: 'Viewed by business', time: 'Apr 20 · 13:40', actor: 'NovaTech AI' },
      { action: 'Marked under review', time: 'Apr 21 · 09:15', actor: 'admin@vault.io', result: 'Under Review' },
    ],
    audit: [
      { action: 'Application received', time: 'Apr 20 · 10:12', actor: 'system' },
      { action: 'Marked Under Review', time: 'Apr 21 · 09:15', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'APP-0082', applicant: 'James Okafor', applicantRole: 'Investor',
    applicantHeadline: 'Principal at Apex Ventures · AI/ML portfolio', applicantLocation: 'London, UK',
    applicantVerification: 1, business: 'Orbit Analytics', businessIndustry: 'SaaS', businessStage: 'Series A',
    businessFounder: 'Riley Kim', businessReadiness: 91,
    opportunity: 'Lead Investment — Series A', skills: ['Venture Capital', 'AI/ML', 'SaaS Growth'],
    experience: 'Led 12 investments in AI SaaS companies at Apex Ventures.',
    message: 'Orbit Analytics is exactly the kind of product-led, data-native company we look for at Series A stage.',
    submitted: 'Apr 19, 2026', lastActivity: '1d ago', status: 'Submitted', flags: 0, risk: 'None',
    history: [
      { action: 'Application submitted', time: 'Apr 19 · 14:00', actor: 'James Okafor' },
      { action: 'Viewed by founder', time: 'Apr 19 · 16:30', actor: 'Riley Kim' },
    ],
    audit: [{ action: 'Application received', time: 'Apr 19 · 14:00', actor: 'system' }],
  },
  {
    id: 'APP-0083', applicant: 'Marcus Williams', applicantRole: 'Professional',
    applicantHeadline: 'Founder at Nova · Building logistics AI', applicantLocation: 'Austin, TX',
    applicantVerification: 0, business: 'GreenPath Logistics', businessIndustry: 'Logistics', businessStage: 'Pre-Seed',
    businessFounder: 'Elena Vasquez', businessReadiness: 55,
    opportunity: 'Operations Advisor', skills: ['Logistics', 'Operations', 'Lean Startup'],
    experience: 'Built and scaled a last-mile delivery network in the Southwest.',
    message: 'Happy to contribute operational expertise as an unpaid advisor during your pre-seed phase.',
    submitted: 'Apr 18, 2026', lastActivity: '3d ago', status: 'Accepted', flags: 0, risk: 'None',
    history: [
      { action: 'Application submitted', time: 'Apr 18 · 09:00', actor: 'Marcus Williams' },
      { action: 'Marked under review', time: 'Apr 18 · 11:00', actor: 'admin@vault.io', result: 'Under Review' },
      { action: 'Accepted by business', time: 'Apr 18 · 14:30', actor: 'Elena Vasquez', result: 'Accepted' },
    ],
    audit: [
      { action: 'Application received', time: 'Apr 18 · 09:00', actor: 'system' },
      { action: 'Marked Under Review', time: 'Apr 18 · 11:00', actor: 'admin@vault.io' },
      { action: 'Accepted', time: 'Apr 18 · 14:30', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'APP-0084', applicant: 'Riley Kim', applicantRole: 'Founder',
    applicantHeadline: 'CEO at Orbit Analytics · Data SaaS', applicantLocation: 'Seattle, WA',
    applicantVerification: 2, business: 'Meridian Health', businessIndustry: 'HealthTech', businessStage: 'Seed',
    businessFounder: 'Priya Nair', businessReadiness: 66,
    opportunity: 'Strategic Partnership — Data Infrastructure',
    skills: ['Data Infrastructure', 'SaaS Architecture', 'Partnership Strategy'],
    experience: 'Built Orbit Analytics from 0 to ৳2M ARR. Experience with HealthTech data pipelines.',
    message: 'Orbit\'s event ingestion layer could power Meridian\'s wearable data platform at 1/10th the cost of custom solutions.',
    submitted: 'Apr 17, 2026', lastActivity: '4d ago', status: 'Rejected', flags: 1, risk: 'Low',
    history: [
      { action: 'Application submitted', time: 'Apr 17 · 10:00', actor: 'Riley Kim' },
      { action: 'Flagged for review', time: 'Apr 17 · 12:00', actor: 'admin@vault.io' },
      { action: 'Rejected — conflict of interest', time: 'Apr 18 · 09:00', actor: 'admin@vault.io', result: 'Rejected' },
    ],
    audit: [
      { action: 'Application received', time: 'Apr 17 · 10:00', actor: 'system' },
      { action: 'Flagged (Low)', time: 'Apr 17 · 12:00', actor: 'admin@vault.io' },
      { action: 'Rejected: Policy issue', time: 'Apr 18 · 09:00', actor: 'admin@vault.io' },
    ],
  },
  {
    id: 'APP-0085', applicant: 'Priya Nair', applicantRole: 'Professional',
    applicantHeadline: 'Product Strategist · HealthTech', applicantLocation: 'Toronto, CA',
    applicantVerification: 0, business: 'NovaTech AI', businessIndustry: 'FinTech', businessStage: 'Seed',
    businessFounder: 'Alex Morgan', businessReadiness: 78,
    opportunity: 'UX Researcher — Compliance Onboarding',
    skills: ['UX Research', 'Compliance UX', 'HealthTech'],
    experience: '3 years in regulated-industry UX. Published research on compliance onboarding flows.',
    message: 'I can run a full compliance onboarding UX audit and deliver a prioritized recommendation report within 3 weeks.',
    submitted: 'Apr 21, 2026', lastActivity: '1h ago', status: 'Submitted', flags: 2, risk: 'Medium',
    history: [
      { action: 'Application submitted', time: 'Apr 21 · 08:40', actor: 'Priya Nair' },
      { action: 'Flag raised (conflict of interest)', time: 'Apr 21 · 09:10', actor: 'system' },
    ],
    audit: [
      { action: 'Application received', time: 'Apr 21 · 08:40', actor: 'system' },
      { action: 'Auto-flagged (duplicate applicant domain)', time: 'Apr 21 · 08:41', actor: 'system' },
    ],
  },
  {
    id: 'APP-0086', applicant: 'Elena Vasquez', applicantRole: 'Founder',
    applicantHeadline: 'Co-Founder at GreenPath Logistics', applicantLocation: 'Chicago, IL',
    applicantVerification: 0, business: 'Nova Robotics', businessIndustry: 'Robotics', businessStage: 'Pre-Seed',
    businessFounder: 'Marcus Williams', businessReadiness: 48,
    opportunity: 'Joint Pilot — Warehouse Robotics',
    skills: ['Logistics Operations', 'Fleet Management', 'Pilot Design'],
    experience: 'Operating 40 electric cargo vehicles across 3 cities. Seeking robotics integration for warehouse efficiency.',
    message: 'We want to pilot Nova\'s picking system in our Chicago fulfillment hub. This is a mutual pilot opportunity.',
    submitted: 'Apr 16, 2026', lastActivity: '5d ago', status: 'Withdrawn', flags: 0, risk: 'None',
    history: [
      { action: 'Application submitted', time: 'Apr 16 · 11:00', actor: 'Elena Vasquez' },
      { action: 'Viewed by founder', time: 'Apr 16 · 14:00', actor: 'Marcus Williams' },
      { action: 'Withdrawn by applicant', time: 'Apr 17 · 08:00', actor: 'Elena Vasquez', result: 'Withdrawn' },
    ],
    audit: [
      { action: 'Application received', time: 'Apr 16 · 11:00', actor: 'system' },
      { action: 'Withdrawn by applicant', time: 'Apr 17 · 08:00', actor: 'system' },
    ],
  },
];

const REJECT_REASONS = ['Not a fit', 'Insufficient information', 'Opportunity closed', 'Policy issue', 'Conflict of interest', 'Other'];
const RISK_COLORS: Record<RiskLevel, string> = {
  None: '#5E6D8F', Low: '#C67A4E', Medium: '#F59E0B', High: '#F04438', Critical: '#F04438',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusVariant = (s: AppStatus) =>
  s === 'Accepted' ? 'success' : s === 'Rejected' ? 'danger' : s === 'Withdrawn' ? 'neutral' : s === 'Under Review' ? 'info' : 'warning';

function RolePill({ role }: { role: UserRole }) {
  const color: Record<UserRole, string> = {
    Founder: 'text-[#C67A4E] border-[#C67A4E]/30 bg-[#C67A4E]/8',
    Investor: 'text-[#C9A24B] border-[#C9A24B]/30 bg-[#C9A24B]/8',
    Professional: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8',
  };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color[role]}`}>{role}</span>;
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
          <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Accept modal ─────────────────────────────────────────────────────────

function AcceptModal({ app, onAccept, onCancel }: { app: Application; onAccept: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="accept-application-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="accept-application-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Accept Application</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{app.id}</p>
          </div>
        </div>
        <div className="space-y-0 mb-5">
          {[
            { label: 'Applicant', value: app.applicant },
            { label: 'Role', value: <RolePill role={app.applicantRole} /> },
            { label: 'Business', value: app.business },
            { label: 'Opportunity', value: app.opportunity },
            { label: 'Reviewer', value: 'admin@vault.io' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{r.label}</span>
              <span className="text-[11.5px] text-[color:var(--vv-text)]">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onAccept}>
            Accept Application
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────

function RejectModal({ app, onReject, onCancel }: { app: Application; onReject: (reason: string, notes: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-application-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="reject-application-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Reject Application</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{app.applicant} → {app.business}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
              Rejection reason <span className="text-[#F04438]">*</span>
            </label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors">
              <option value="">Select a reason…</option>
              {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Additional notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Context for the audit record…"
              className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onReject(reason, notes)} disabled={!reason}>
            Reject Application
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ───────────────────────────────────────────────────────────

function AppDrawer({ app, onClose, onMarkReview, onAccept, onReject }: {
  app: Application;
  onClose: () => void;
  onMarkReview: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [section, setSection] = useState<'application' | 'business' | 'history' | 'audit'>('application');
  const isFinal = app.status === 'Accepted' || app.status === 'Rejected' || app.status === 'Withdrawn';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="application-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] sticky top-0 z-10 bg-[#0D1626]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[13px] font-bold text-[color:var(--vv-text)] shrink-0">
                {app.applicant[0]}
              </div>
              <div className="min-w-0">
                <p id="application-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{app.applicant}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{app.id} · {app.submitted}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close application" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0 mt-0.5">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(app.status)} dot>{app.status}</Badge>
            <RolePill role={app.applicantRole} />
            <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">→ {app.business}</span>
            {app.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium ml-auto" style={{ color: RISK_COLORS[app.risk] }}>
                <IconAlertTriangle s={10} />{app.flags} flag{app.flags > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['application', 'business', 'history', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}>{t === 'audit' ? 'Audit' : t === 'application' ? 'Application' : t === 'history' ? 'History' : 'Business'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {section === 'application' && (
            <div className="px-5 py-4 space-y-5">
              {/* Applicant */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Applicant</p>
                <div className="space-y-0">
                  {[
                    { label: 'Name', value: app.applicant },
                    { label: 'Role (this application)', value: <RolePill role={app.applicantRole} /> },
                    { label: 'Headline', value: <span className="italic text-[color:var(--vv-text-tertiary)] text-[11px]">{app.applicantHeadline}</span> },
                    { label: 'Location', value: app.applicantLocation },
                    { label: 'Verification', value: <VerificationBadge tier={app.applicantVerification} /> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 pt-0.5">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
                  <IconEye s={11} /> View user profile
                </button>
              </div>

              {/* Contribution */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Opportunity</p>
                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-2">{app.opportunity}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {app.skills.map(s => (
                    <span key={s} className="text-[10.5px] px-2 py-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[color:var(--vv-text-secondary)]">{s}</span>
                  ))}
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2"><strong className="text-[color:var(--vv-text-secondary)]">Experience:</strong> {app.experience}</p>
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-[8px]">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">Application message</p>
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{app.message}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Status</p>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(app.status)} dot>{app.status}</Badge>
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Last activity: {app.lastActivity}</span>
                </div>
              </div>

              {/* Flags */}
              {app.flags > 0 && (
                <div className="p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F59E0B]/20 rounded-md">
                  <p className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold mb-1">Active Flags</p>
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle s={12} className="text-[#F59E0B]" />
                    <span className="text-[12px] font-medium" style={{ color: RISK_COLORS[app.risk] }}>
                      {app.flags} flag{app.flags > 1 ? 's' : ''} · {app.risk} risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'business' && (
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Business</p>
                <div className="space-y-0">
                  {[
                    { label: 'Name', value: app.business },
                    { label: 'Industry', value: app.businessIndustry },
                    { label: 'Stage', value: <Badge variant="neutral">{app.businessStage}</Badge> },
                    { label: 'Founder', value: app.businessFounder },
                    { label: 'Readiness', value: <span className="font-mono text-[12px] tabular-nums text-[#C67A4E]">{app.businessReadiness}</span> },
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
            </div>
          )}

          {section === 'history' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Application History</p>
              <div className="space-y-3 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]" />
                {app.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{h.action}</p>
                      {h.result && <span className="text-[10px] text-[#C67A4E] font-medium">→ {h.result}</span>}
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
                {app.audit.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative pl-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#35446A] border border-[color:var(--vv-border)] shrink-0 mt-1.5 z-10" />
                    <div>
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{h.action}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{h.time} · {h.actor}</p>
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

        {/* Action footer */}
        {!isFinal ? (
          <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Admin Actions</p>
            <div className="space-y-2">
              {app.status === 'Submitted' && (
                <Button variant="secondary" size="sm" className="w-full" onClick={onMarkReview}>
                  Mark Under Review
                </Button>
              )}
              <Button size="sm" className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent"
                icon={<IconCheck s={12} />} onClick={onAccept}>
                Accept
              </Button>
              <Button variant="destructive" size="sm" className="w-full" icon={<IconX s={12} />} onClick={onReject}>
                Reject
              </Button>
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]/60 mt-3 text-center">All decisions are logged and auditable.</p>
          </div>
        ) : (
          <div className="shrink-0 px-5 py-3 border-t border-[color:var(--vv-border)] bg-[#0D1626]">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center">
              This application is <strong className="text-[color:var(--vv-text-secondary)]">{app.status}</strong>. No further action required.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function AdminApplications() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>(ALL_APPS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<Application | null>(null);
  const [modal, setModal] = useState<'accept' | 'reject' | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const summary = {
    total: apps.length,
    pending: apps.filter(a => a.status === 'Submitted').length,
    underReview: apps.filter(a => a.status === 'Under Review').length,
    accepted: apps.filter(a => a.status === 'Accepted').length,
    flagged: apps.filter(a => a.flags > 0).length,
  };

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.applicant.toLowerCase().includes(q) && !a.business.toLowerCase().includes(q)) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (roleFilter && a.applicantRole !== roleFilter) return false;
    if (flagFilter === 'Flagged' && a.flags === 0) return false;
    if (flagFilter === 'No flags' && a.flags > 0) return false;
    return true;
  });

  const hasFilters = !!(search || statusFilter || roleFilter || flagFilter !== 'All');
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setRoleFilter(''); setFlagFilter('All'); };

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(a => a.id)));

  const applyStatus = (id: string, status: AppStatus) => {
    setApps(as => as.map(a => a.id === id ? { ...a, status } : a));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, status } : null);
    setModal(null);
  };

  const selCls = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Applications</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Monitor collaboration applications across the Vault Ventures platform.</p>
        </div>
        <Button variant="ghost" size="sm">Export CSV</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total', value: summary.total, color: '#EAF0FA' },
          { label: 'Submitted', value: summary.pending, color: '#F59E0B' },
          { label: 'Under Review', value: summary.underReview, color: '#3B82F6' },
          { label: 'Accepted', value: summary.accepted, color: '#22C55E' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicant or business…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={12} /></button>}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
              <option value="">All statuses</option>
              {['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selCls}>
              <option value="">All roles</option>
              {['Founder', 'Investor', 'Professional'].map(r => <option key={r}>{r}</option>)}
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
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">{filtered.length} of {apps.length}</span>
        </div>

        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All statuses</option>
              {['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selCls + " w-full"}>
              <option value="">All roles</option>
              {['Founder', 'Investor', 'Professional'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selCls + " w-full"}>
              {['All', 'Flagged', 'No flags'].map(f => <option key={f}>{f}</option>)}
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
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No applications found.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            {hasFilters && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                    </th>
                    {['Applicant', 'Role', 'Business', 'Opportunity', 'Submitted', 'Status', 'Last Activity', 'Flags', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${a.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                      onClick={() => setDrawer(a)}>
                      <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(a.id); }}>
                        <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)}
                          className="w-3.5 h-3.5 rounded border border-[color:var(--vv-border-strong)] accent-[#C67A4E] cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                            {a.applicant[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{a.applicant}</p>
                            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{a.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><RolePill role={a.applicantRole} /></td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{a.business}</td>
                      <td className="px-3 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)] max-w-[140px] truncate">{a.opportunity}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{a.submitted}</td>
                      <td className="px-3 py-3"><Badge variant={statusVariant(a.status)} dot>{a.status}</Badge></td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{a.lastActivity}</td>
                      <td className="px-3 py-3">
                        {a.flags === 0
                          ? <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>
                          : <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: RISK_COLORS[a.risk] }}>
                              <IconAlertTriangle s={11} />{a.flags}
                            </span>
                        }
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => setDrawer(a)}>Review</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map(a => (
                <div key={a.id}
                  className={`px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${a.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(a)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {a.applicant[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{a.applicant}</p>
                        <RolePill role={a.applicantRole} />
                        <Badge variant={statusVariant(a.status)} dot>{a.status}</Badge>
                      </div>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-0.5">{a.business} · {a.opportunity}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{a.submitted}</p>
                        {a.flags > 0 && (
                          <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: RISK_COLORS[a.risk] }}>
                            <IconAlertTriangle s={10} />{a.flags} flag{a.flags > 1 ? 's' : ''}
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
        <AppDrawer
          app={drawer}
          onClose={() => setDrawer(null)}
          onMarkReview={() => applyStatus(drawer.id, 'Under Review')}
          onAccept={() => setModal('accept')}
          onReject={() => setModal('reject')}
        />
      )}

      {/* Modals */}
      {drawer && modal === 'accept' && (
        <AcceptModal app={drawer} onAccept={() => applyStatus(drawer.id, 'Accepted')} onCancel={() => setModal(null)} />
      )}
      {drawer && modal === 'reject' && (
        <RejectModal app={drawer} onReject={() => applyStatus(drawer.id, 'Rejected')} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}