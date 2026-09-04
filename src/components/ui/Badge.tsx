import React from 'react';

// --- Core Badge ---------------------------------------------------------------

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'gold' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/10 text-red-400 border-red-500/20',
  info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accent:  'bg-[rgba(198,122,78,0.10)] text-[#C67A4E] border-[rgba(198,122,78,0.20)]',
  gold:    'bg-amber-500/10 text-[#C9A24B] border-amber-500/20',
  neutral: 'bg-white/5 vv-text-secondary border-white/8',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  accent:  'bg-[#C67A4E]',
  gold:    'bg-[#C9A24B]',
  neutral: 'bg-[#5E6D8F]',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'neutral', children, className = '', dot }: BadgeProps) {
  return (
    <span className={`vv-focus inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border leading-none ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// --- Verification badge -------------------------------------------------------

export function VerificationBadge({ tier }: { tier: 0 | 1 | 2 | 3 }) {
  if (tier === 0) return null;
  const labels: Record<number, string> = { 1: 'Identity Verified', 2: 'Track-record Verified', 3: 'Verified' };
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C9A24B] text-[color:var(--vv-on-copper)] leading-none">
      <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
        <path d="M5 0.5L6.18 3.27L9.18 3.51L7.05 5.35L7.7 8.27L5 6.74L2.3 8.27L2.95 5.35L0.82 3.51L3.82 3.27L5 0.5Z"/>
      </svg>
      {labels[tier]}
    </span>
  );
}

// --- Status badge -------------------------------------------------------------
// Covers all platform status vocabularies consistently.

type ApplicationStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected' | 'Withdrawn';
type DealStatus = 'Matched' | 'Interest Confirmed' | 'Deal Room' | 'NDA Signed' | 'Negotiation' | 'Agreement' | 'Milestone Funding Active' | 'Completed';
type ReportStatus = 'Open' | 'Under Review' | 'Awaiting Information' | 'Escalated' | 'Resolved' | 'Dismissed';
type VerificationStatus = 'Unverified' | 'Tier 1' | 'Tier 2' | 'Tier 3';

export type AnyStatus = ApplicationStatus | DealStatus | ReportStatus | VerificationStatus | string;

const STATUS_MAP: Record<string, { variant: BadgeVariant; dot?: boolean }> = {
  // Applications
  'Submitted':           { variant: 'info',    dot: true },
  'Under Review':        { variant: 'warning', dot: true },
  'Accepted':            { variant: 'success', dot: true },
  'Rejected':            { variant: 'danger',  dot: true },
  'Withdrawn':           { variant: 'neutral' },
  // Deals
  'Matched':             { variant: 'accent',  dot: true },
  'Interest Confirmed':  { variant: 'accent',  dot: true },
  'Deal Room':           { variant: 'warning', dot: true },
  'NDA Signed':          { variant: 'warning', dot: true },
  'Negotiation':         { variant: 'warning', dot: true },
  'Agreement':           { variant: 'success', dot: true },
  'Milestone Funding Active': { variant: 'success', dot: true },
  'Completed':           { variant: 'success' },
  // Reports
  'Open':                { variant: 'danger',  dot: true },
  'Awaiting Information':{ variant: 'warning', dot: true },
  'Escalated':           { variant: 'danger',  dot: true },
  'Resolved':            { variant: 'success' },
  'Dismissed':           { variant: 'neutral' },
  // Verification
  'Unverified':          { variant: 'neutral' },
  'Tier 1':              { variant: 'gold' },
  'Tier 2':              { variant: 'gold' },
  'Tier 3':              { variant: 'gold' },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { variant: 'neutral' as BadgeVariant };
  return (
    <Badge variant={config.variant} dot={config.dot} className={className}>
      {status}
    </Badge>
  );
}

// --- Role badge ---------------------------------------------------------------

type NormalRole = 'founder' | 'investor' | 'professional';

const ROLE_CONFIG: Record<NormalRole, { label: string; color: string }> = {
  founder:      { label: 'Founder',      color: '#C67A4E' },
  investor:     { label: 'Investor',     color: '#C9A24B' },
  professional: { label: 'Professional', color: '#22C55E' },
};

interface RoleBadgeProps {
  role: NormalRole;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const { label, color } = ROLE_CONFIG[role];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide border leading-none ${className}`}
      style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
      {label}
    </span>
  );
}