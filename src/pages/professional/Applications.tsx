import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// --- Types & Data -------------------------------------------------------------

type AppStatus = 'submitted' | 'under_review' | 'interview' | 'offer' | 'joined' | 'accepted' | 'rejected' | 'withdrawn';

interface AppItem {
  id: string;
  business: string;
  businessInitials: string;
  industry: string;
  opportunity: string;
  role: string;
  appliedDate: string;
  lastUpdated: string;
  status: AppStatus;
  timeline: { action: string; ts: string }[];
  note: string;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string; step: number; terminal?: boolean }> = {
  submitted:    { label: 'Applied',           color: '#93A1BF', bg: 'rgba(93,101,127,0.08)',  border: 'rgba(93,101,127,0.2)',  step: 0 },
  under_review: { label: 'Under Review',      color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)',  step: 1 },
  interview:    { label: 'Interview / Neg.',  color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', step: 2 },
  offer:        { label: 'Offer Received',    color: '#C9A24B', bg: 'rgba(201,162,75,0.08)', border: 'rgba(201,162,75,0.2)',  step: 3 },
  joined:       { label: 'Joined',            color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)',   step: 4, terminal: true },
  accepted:     { label: 'Accepted',          color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)',   step: 4, terminal: true },
  rejected:     { label: 'Not Selected',      color: '#5E6D8F', bg: 'rgba(36,48,74,0.3)',    border: 'rgba(36,48,74,0.6)',    step: 4, terminal: true },
  withdrawn:    { label: 'Withdrawn',         color: '#5E6D8F', bg: 'rgba(36,48,74,0.4)',    border: 'rgba(36,48,74,0.8)',    step: 4, terminal: true },
};

const STEPS = ['Applied', 'Under Review', 'Interview', 'Offer', 'Decision'];

const APPLICATIONS: AppItem[] = [
  {
    id: 'app-1',
    business: 'Nova Health',
    businessInitials: 'NH',
    industry: 'HealthTech',
    opportunity: 'Growth Strategy Advisor',
    role: 'Advisory / Fractional',
    appliedDate: 'Aug 20, 2026',
    lastUpdated: 'Aug 25, 2026',
    status: 'under_review',
    note: 'Highlighted your experience scaling FinTech products as directly relevant.',
    timeline: [
      { action: 'Application submitted', ts: 'Aug 20, 2026 - 10:14 AM' },
      { action: 'Application received by Nova Health', ts: 'Aug 20, 2026 - 10:15 AM' },
      { action: 'Status updated to Under Review', ts: 'Aug 25, 2026 - 2:31 PM' },
    ],
  },
  {
    id: 'app-2',
    business: 'AgriLink BD',
    businessInitials: 'AL',
    industry: 'AgriTech',
    opportunity: 'Market Entry Consultant',
    role: 'Fractional / Project',
    appliedDate: 'Aug 18, 2026',
    lastUpdated: 'Aug 18, 2026',
    status: 'submitted',
    note: 'Expressed interest in the rural distribution channel challenge.',
    timeline: [
      { action: 'Application submitted', ts: 'Aug 18, 2026 - 3:05 PM' },
      { action: 'Application received by AgriLink BD', ts: 'Aug 18, 2026 - 3:06 PM' },
    ],
  },
  {
    id: 'app-3',
    business: 'FinFlow',
    businessInitials: 'FF',
    industry: 'FinTech',
    opportunity: 'Investor Relations Lead',
    role: 'Advisory',
    appliedDate: 'Jul 30, 2026',
    lastUpdated: 'Aug 12, 2026',
    status: 'accepted',
    note: 'Matched on Series A fundraising expertise and FinTech network.',
    timeline: [
      { action: 'Application submitted', ts: 'Jul 30, 2026 - 11:00 AM' },
      { action: 'Status updated to Under Review', ts: 'Aug 5, 2026 - 9:22 AM' },
      { action: 'Application accepted', ts: 'Aug 12, 2026 - 4:15 PM' },
    ],
  },
  {
    id: 'app-4',
    business: 'EdgeVision AI',
    businessInitials: 'EV',
    industry: 'AI / ML',
    opportunity: 'Go-to-Market Strategist',
    role: 'Fractional',
    appliedDate: 'Jul 15, 2026',
    lastUpdated: 'Jul 28, 2026',
    status: 'rejected',
    note: 'Applied for strategic go-to-market for their enterprise pivot.',
    timeline: [
      { action: 'Application submitted', ts: 'Jul 15, 2026 - 8:47 AM' },
      { action: 'Status updated to Under Review', ts: 'Jul 20, 2026 - 11:30 AM' },
      { action: 'Application not selected', ts: 'Jul 28, 2026 - 5:00 PM' },
    ],
  },
  {
    id: 'app-5',
    business: 'Nova Health',
    businessInitials: 'NH',
    industry: 'HealthTech',
    opportunity: 'Growth Strategy Advisor',
    role: 'Advisory / Fractional',
    appliedDate: 'Aug 20, 2026',
    lastUpdated: 'Sep 1, 2026',
    status: 'interview',
    note: 'Interview scheduled. Negotiation panel open in Vault Ventures.',
    timeline: [
      { action: 'Application submitted', ts: 'Aug 20, 2026 - 10:14 AM' },
      { action: 'Status updated to Under Review', ts: 'Aug 25, 2026 - 2:31 PM' },
      { action: 'Interview / Negotiation stage reached', ts: 'Sep 1, 2026 - 9:00 AM' },
    ],
  },
  {
    id: 'app-6',
    business: 'FinFlow',
    businessInitials: 'FF',
    industry: 'FinTech',
    opportunity: 'Investor Relations Lead',
    role: 'Advisory',
    appliedDate: 'Jul 30, 2026',
    lastUpdated: 'Aug 28, 2026',
    status: 'offer',
    note: 'Offer received from FinFlow. Review terms and respond.',
    timeline: [
      { action: 'Application submitted', ts: 'Jul 30, 2026 - 11:00 AM' },
      { action: 'Status updated to Under Review', ts: 'Aug 5, 2026 - 9:22 AM' },
      { action: 'Application accepted - Interview stage', ts: 'Aug 12, 2026 - 4:15 PM' },
      { action: 'Offer extended by FinFlow', ts: 'Aug 28, 2026 - 3:40 PM' },
    ],
  },
];

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'joined', label: 'Joined' },
  { key: 'rejected', label: 'Not Selected' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

// --- Status components --------------------------------------------------------

function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function StatusStepper({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status];
  const activeStep = cfg.step;
  const isTerminal = cfg.terminal ?? false;

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, idx) => {
        const done = idx < activeStep || (idx === 4 && isTerminal);
        const current = idx === activeStep && !isTerminal;
        const isFinalSlot = idx === 4;
        const stepLabel = isFinalSlot && isTerminal ? cfg.label : step;
        const stepColor = isFinalSlot && isTerminal ? cfg.color : done || current ? '#C67A4E' : '#35446A';

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: stepColor,
                  background: done || current ? stepColor + '22' : 'transparent',
                }}>
                {done && (
                  <svg width="9" height="9" fill="none" stroke={stepColor} strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                  </svg>
                )}
                {current && <div className="w-2 h-2 rounded-full" style={{ background: stepColor }} />}
              </div>
              <p className="text-[8.5px] mt-1 whitespace-nowrap" style={{ color: done || current ? stepColor : '#35446A' }}>
                {stepLabel}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="h-[2px] w-6 sm:w-10 mb-3 mx-0.5 flex-shrink-0 rounded-full"
                style={{ background: idx < activeStep ? '#C67A4E44' : '#2B2D2F' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- Application card ---------------------------------------------------------

function AppCard({ item, onSelect, onWithdraw, onViewOpportunity }: {
  item: AppItem;
  onSelect: (item: AppItem) => void;
  onWithdraw: (id: string) => void;
  onViewOpportunity: (business: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden transition-all hover:border-[#2E3E5E]"
      style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="p-5">
        {/* Top */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-[#C67A4E]"
              style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.16)' }}>
              {item.businessInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{item.business}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5 truncate">{item.opportunity}</p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-[10.5px] text-[#35446A]">Role: <span className="text-[color:var(--vv-text-secondary)]">{item.role}</span></span>
          <span className="text-[10.5px] text-[#35446A]">Applied: <span className="text-[color:var(--vv-text-secondary)]">{item.appliedDate}</span></span>
          <span className="text-[10.5px] text-[#35446A]">Updated: <span className="text-[color:var(--vv-text-secondary)]">{item.lastUpdated}</span></span>
        </div>

        {/* Stepper */}
        <div className="mb-1">
          <StatusStepper status={item.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#2B2D2F] px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onSelect(item)}>View Application</Button>
          <Button size="sm" variant="secondary" onClick={() => onViewOpportunity(item.business)}>View Opportunity</Button>
        </div>
        {(item.status === 'submitted' || item.status === 'under_review' || item.status === 'interview') && (
          <button onClick={() => onWithdraw(item.id)}
            className="text-[11px] text-[#35446A] hover:text-[#C67A4E] transition-colors">
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}

// --- Application detail drawer ------------------------------------------------

function AppDrawer({ item, onClose, onWithdraw }: { item: AppItem; onClose: () => void; onWithdraw: (id: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false);

  function handleWithdraw() {
    onWithdraw(item.id);
    setShowConfirm(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-labelledby="application-detail-title">
      <div className="flex-1" onClick={onClose} style={{ background: 'rgba(4,8,15,0.6)' }} />
      <div className="w-full max-w-[420px] h-full overflow-y-auto border-l border-[color:var(--vv-border)] flex flex-col"
        style={{ background: 'rgba(10,15,26,0.98)', backdropFilter: 'blur(32px)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2B2D2F] flex-shrink-0">
          <div>
            <p id="application-detail-title" className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Application Detail</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{item.business} - {item.opportunity}</p>
          </div>
          <button onClick={onClose} aria-label="Close application detail" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors mt-0.5">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">

          {/* Status */}
          <div className="p-4 rounded-[12px] border border-[color:var(--vv-border)]" style={{ background: 'rgba(26,28,29,0.6)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Current Status</p>
              <StatusBadge status={item.status} />
            </div>
            <StatusStepper status={item.status} />
          </div>

          {/* Details */}
          <div>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-3">Application Details</p>
            <div className="space-y-2">
              {[
                ['Business', item.business],
                ['Industry', item.industry],
                ['Opportunity', item.opportunity],
                ['Role Type', item.role],
                ['Applied', item.appliedDate],
                ['Last Updated', item.lastUpdated],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#2B2D2F]">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{label}</span>
                  <span className="text-[11.5px] text-[color:var(--vv-text)] font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Application note */}
          {item.note && (
            <div>
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-2">Your Application Note</p>
              <div className="p-3.5 rounded-[10px] border border-[color:var(--vv-border)]" style={{ background: 'rgba(26,28,29,0.6)' }}>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed">{item.note}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-3">Application Timeline</p>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: 'rgba(36,48,74,0.8)' }} />
              <div className="space-y-4">
                {item.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-[#C67A4E]"
                      style={{ background: idx === item.timeline.length - 1 ? '#C67A4E' : 'rgba(198,122,78,0.2)' }} />
                    <p className="text-[12px] text-[color:var(--vv-text)] font-medium">{event.action}</p>
                    <p className="text-[10.5px] text-[#35446A] mt-0.5">{event.ts}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-[#2B2D2F] flex-shrink-0 space-y-2">
          {(item.status === 'submitted' || item.status === 'under_review') && !showConfirm && (
            <Button variant="secondary" className="w-full" onClick={() => setShowConfirm(true)}>
              Withdraw Application
            </Button>
          )}
          {showConfirm && (
            <div className="rounded-[10px] border border-[color:var(--vv-border-strong)] p-4" style={{ background: 'rgba(26,28,29,0.9)' }}>
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">Withdraw Application?</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">This action cannot be undone. The business will be notified.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
                <Button size="sm" variant="secondary" onClick={handleWithdraw} className="flex-1">Withdraw</Button>
              </div>
            </div>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// --- Skeleton -----------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] p-5 animate-pulse" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-[10px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
          <div className="h-2.5 w-40 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        </div>
        <div className="h-5 w-20 rounded-md bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-2.5 w-24 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
        <div className="h-2.5 w-24 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 w-32 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]" />
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function ProfessionalApplications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState<AppItem[]>(APPLICATIONS);
  const [selected, setSelected] = useState<AppItem | null>(null);
  const [loading] = useState(false);

  function handleWithdraw(id: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'withdrawn' as AppStatus } : a));
  }

  const filtered = apps.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    const lc = search.toLowerCase();
    return !lc || a.business.toLowerCase().includes(lc) || a.opportunity.toLowerCase().includes(lc);
  });

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">

      {selected && (
        <AppDrawer item={selected} onClose={() => setSelected(null)} onWithdraw={handleWithdraw} />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/professional/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Applications</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Applications
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Track opportunities you have applied to.
          </p>
        </div>
        {/* Search */}
        <div className="relative flex-shrink-0">
          <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="pl-9 pr-4 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none w-full sm:w-52" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[10px] mb-6 overflow-x-auto"
        style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid #2B2D2F' }}>
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all' ? apps.length : apps.filter(a => a.status === tab.key).length;
          const active = filter === tab.key;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={active ? {
                background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)',
              } : { color: '#5E6D8F', border: '1px solid transparent' }}>
              {tab.label}
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={active ? { background: 'rgba(198,122,78,0.18)', color: '#C67A4E' } : { background: 'rgba(36,48,74,0.8)', color: '#5E6D8F' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.14)' }}>
            <svg width="22" height="22" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">
            {apps.length === 0 ? 'No applications yet.' : 'No matching applications.'}
          </p>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-xs mb-5">
            {apps.length === 0
              ? 'Explore opportunities that match your skills and interests.'
              : 'Try a different filter or search term.'}
          </p>
          {apps.length === 0 ? (
            <Button onClick={() => navigate('/app/professional/discover')}>Explore Opportunities</Button>
          ) : (
            <Button variant="secondary" onClick={() => { setFilter('all'); setSearch(''); }}>Clear Filters</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => (
            <AppCard
              key={item.id}
              item={item}
              onSelect={setSelected}
              onWithdraw={handleWithdraw}
              onViewOpportunity={business => navigate(`/app/businesses/${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
