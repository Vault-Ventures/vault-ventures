import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// --- Types --------------------------------------------------------------------

type ReputationLevel = 'emerging' | 'established' | 'trusted' | 'proven';
type VerificationTier = 0 | 1 | 2;

interface ReputationFactor {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
}

interface FeedbackItem {
  id: string;
  author: string;
  authorRole: string;
  authorInitials: string;
  relationship: string;
  completedDate: string;
  rating: number;
  text: string;
  dimensions: { label: string; rating: number }[];
}

interface HistoryEntry {
  id: string;
  type: 'deal' | 'milestone' | 'engagement' | 'feedback' | 'verification';
  title: string;
  detail: string;
  date: string;
  dot: string;
}

interface ReputationData {
  name: string;
  initials: string;
  role: string;
  headline: string;
  verificationTier: VerificationTier;
  reputationLevel: ReputationLevel;
  factors: ReputationFactor[];
  feedback: FeedbackItem[];
  history: HistoryEntry[];
}

// --- Level config --------------------------------------------------------------

const LEVEL_CFG: Record<ReputationLevel, { label: string; color: string; bg: string; border: string; description: string }> = {
  emerging:    { label: 'Emerging',    color: '#93A1BF', bg: 'rgba(93,101,127,0.08)',  border: 'rgba(93,101,127,0.2)',  description: 'Building reputation through early platform activity.' },
  established: { label: 'Established', color: '#C67A4E', bg: 'rgba(198,122,78,0.1)',   border: 'rgba(198,122,78,0.25)', description: 'Demonstrated through completed deals and verified activity.' },
  trusted:     { label: 'Trusted',     color: '#C9A24B', bg: 'rgba(201,162,75,0.1)',   border: 'rgba(201,162,75,0.25)', description: 'Consistent track record with strong partner feedback.' },
  proven:      { label: 'Proven',      color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   description: 'Extensive completed activity and consistently positive feedback.' },
};

// --- Seed data per role --------------------------------------------------------

const FOUNDER_DATA: ReputationData = {
  name: 'Rifat Ahsan',
  initials: 'RA',
  role: 'Founder - Nova Health',
  headline: 'HealthTech founder with a track record of milestone delivery and investor collaboration.',
  verificationTier: 2,
  reputationLevel: 'established',
  factors: [
    { label: 'Completed Deals',        value: 2,        detail: '2 investment deals successfully completed on-platform', icon: 'DEAL' },
    { label: 'Milestone Completions',  value: '5 of 5', detail: 'All 5 agreed milestones met; final confirmed Oct 2024', icon: 'MILESTONE' },
    { label: 'Verified Experience',    value: '7 yrs',  detail: '7 years in HealthTech, 3 prior startups on record', icon: 'VERIFY' },
    { label: 'Feedback Received',     value: '2',      detail: 'Average rating 4.6 / 5.0 from completed relationships', icon: 'FEEDBACK' },
  ],
  feedback: [
    {
      id: 'fb-1',
      author: 'Meridian Capital',
      authorRole: 'Investor',
      authorInitials: 'MC',
      relationship: 'Nova Health - Investment Deal',
      completedDate: 'Aug 26, 2026',
      rating: 5,
      text: 'Rifat communicated clearly throughout the deal process and delivered every agreed milestone on schedule. A founder with real accountability. Would engage again.',
      dimensions: [
        { label: 'Communication', rating: 5 },
        { label: 'Follow-through', rating: 5 },
        { label: 'Transparency', rating: 5 },
      ],
    },
    {
      id: 'fb-2',
      author: 'Tariq Hossain',
      authorRole: 'Growth Advisor',
      authorInitials: 'TH',
      relationship: 'Nova Health - Advisory Engagement',
      completedDate: 'Sep 1, 2026',
      rating: 4,
      text: 'Responsive and focused. The scope was well-defined and Rifat was collaborative throughout. Minor delays in document sharing early on, but overall a strong working relationship.',
      dimensions: [
        { label: 'Communication', rating: 4 },
        { label: 'Professionalism', rating: 5 },
        { label: 'Responsiveness', rating: 4 },
      ],
    },
  ],
  history: [
    { id: 'h-1', type: 'feedback',      title: 'Feedback received - Meridian Capital',         detail: '5 / 5 stars - Investment Deal',                  date: 'Aug 28, 2026', dot: '#C9A24B' },
    { id: 'h-2', type: 'deal',          title: 'Investment deal completed - Meridian Capital',  detail: 'BDT 52,50,000 simulated - 11% equity agreed',       date: 'Aug 26, 2026', dot: '#22C55E' },
    { id: 'h-3', type: 'milestone',     title: 'Milestone completed - Series A Bridge',         detail: 'Approved by Meridian Capital',                    date: 'Jun 2026',     dot: '#C67A4E' },
    { id: 'h-4', type: 'milestone',     title: 'Milestone completed - First 100 Customers',     detail: 'Approved Jan 2025',                               date: 'Jan 2025',     dot: '#C67A4E' },
    { id: 'h-5', type: 'milestone',     title: 'Milestone completed - Product MVP Launch',      detail: 'Confirmed Oct 2024',                              date: 'Oct 2024',     dot: '#C67A4E' },
    { id: 'h-6', type: 'verification',  title: 'Track-record Verified (Tier 2)',                detail: 'Admin verification completed',                    date: 'Aug 2024',     dot: '#C9A24B' },
    { id: 'h-7', type: 'verification',  title: 'Identity Verified (Tier 1)',                    detail: 'Document verification completed',                 date: 'Jan 2024',     dot: '#C9A24B' },
  ],
};

const INVESTOR_DATA: ReputationData = {
  name: 'Rahim Chowdhury',
  initials: 'RC',
  role: 'Investor - Meridian Capital',
  headline: 'Seed-stage investor focused on HealthTech and FinTech in Bangladesh.',
  verificationTier: 2,
  reputationLevel: 'established',
  factors: [
    { label: 'Completed Deals',     value: 1,        detail: '1 investment deal fully completed on-platform', icon: 'DEAL' },
    { label: 'Investment History',  value: 'BDT 52.5L', detail: 'Total simulated capital deployed via Vault Ventures', icon: 'HISTORY' },
    { label: 'Verified Experience', value: '11 yrs', detail: '11 years in venture investing, 3 portfolio companies on record', icon: 'VERIFY' },
    { label: 'Feedback Received',   value: '1',      detail: 'Rating 4.8 / 5.0 from completed founder relationship', icon: 'FEEDBACK' },
  ],
  feedback: [
    {
      id: 'fb-i-1',
      author: 'Rifat Ahsan',
      authorRole: 'Founder - Nova Health',
      authorInitials: 'RA',
      relationship: 'Nova Health - Investment Deal',
      completedDate: 'Aug 26, 2026',
      rating: 5,
      text: 'Rahim was a constructive investment partner. He asked thoughtful questions, gave clear feedback on terms, and respected the agreed timeline. The milestone-based structure worked well.',
      dimensions: [
        { label: 'Professionalism', rating: 5 },
        { label: 'Constructiveness', rating: 5 },
        { label: 'Responsiveness', rating: 4 },
      ],
    },
  ],
  history: [
    { id: 'h-1', type: 'feedback',     title: 'Feedback received - Rifat Ahsan (Nova Health)', detail: '5 / 5 stars - Investment Deal',              date: 'Aug 28, 2026', dot: '#C9A24B' },
    { id: 'h-2', type: 'deal',         title: 'Investment deal completed - Nova Health',        detail: 'BDT 52,50,000 simulated - Seed stage',          date: 'Aug 26, 2026', dot: '#22C55E' },
    { id: 'h-3', type: 'verification', title: 'Track-record Verified (Tier 2)',                 detail: 'Accredited investor status confirmed',       date: 'Jul 2026',     dot: '#C9A24B' },
    { id: 'h-4', type: 'verification', title: 'Identity Verified (Tier 1)',                     detail: 'Document verification completed',            date: 'Feb 2026',     dot: '#C9A24B' },
  ],
};

const PROFESSIONAL_DATA: ReputationData = {
  name: 'Tariq Hossain',
  initials: 'TH',
  role: 'Growth Strategy Advisor',
  headline: 'Fractional advisor helping early-stage startups scale go-to-market and investor relations.',
  verificationTier: 1,
  reputationLevel: 'emerging',
  factors: [
    { label: 'Completed Engagements', value: 1,       detail: '1 advisory engagement completed on-platform', icon: 'ENGAGEMENT' },
    { label: 'Previous Projects',     value: 4,       detail: '4 prior startup projects verified on profile', icon: 'PROJECTS' },
    { label: 'Verified Experience',   value: '9 yrs', detail: '9 years in growth and investor relations strategy', icon: 'VERIFY' },
    { label: 'Feedback Received',     value: '1',     detail: 'Rating 4.0 / 5.0 from completed startup engagement', icon: 'FEEDBACK' },
  ],
  feedback: [
    {
      id: 'fb-p-1',
      author: 'Rifat Ahsan',
      authorRole: 'Founder - Nova Health',
      authorInitials: 'RA',
      relationship: 'Nova Health - Advisory Engagement',
      completedDate: 'Sep 1, 2026',
      rating: 4,
      text: "Tariq brought a clear go-to-market framework and relevant FinTech network. Execution was mostly on schedule. We'd work with him again in a future fundraise.",
      dimensions: [
        { label: 'Expertise', rating: 4 },
        { label: 'Delivery', rating: 4 },
        { label: 'Communication', rating: 4 },
      ],
    },
  ],
  history: [
    { id: 'h-1', type: 'feedback',     title: 'Feedback received - Nova Health',               detail: '4 / 5 stars - Advisory Engagement',          date: 'Sep 2, 2026',  dot: '#C9A24B' },
    { id: 'h-2', type: 'engagement',   title: 'Advisory engagement completed - Nova Health',   detail: 'Growth Strategy Advisor - 6-month engagement', date: 'Sep 1, 2026',  dot: '#22C55E' },
    { id: 'h-3', type: 'verification', title: 'Identity Verified (Tier 1)',                    detail: 'Document verification completed',             date: 'Aug 2026',     dot: '#C9A24B' },
  ],
};

// --- Star rating ---------------------------------------------------------------

function StarRow({ rating, max = 5, size = 14 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rating ? '#C9A24B' : 'none'} stroke={i < rating ? '#C9A24B' : '#35446A'} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-[11px] text-[color:var(--vv-text-secondary)] ml-1 font-mono tabular-nums">{rating}.0</span>
    </div>
  );
}

// --- Verification tier panel ---------------------------------------------------

const TIER_INFO: Record<VerificationTier, { label: string; description: string; color: string }> = {
  0: { label: 'Tier 0 - Unverified',          description: 'Identity and track record not yet confirmed.',                              color: '#5E6D8F' },
  1: { label: 'Tier 1 - Identity Verified',   description: 'Government-issued ID and contact information verified by platform admin.', color: '#93A1BF' },
  2: { label: 'Tier 2 - Track-record Verified', description: 'Professional history, accreditation, or investment track record confirmed.', color: '#C9A24B' },
};

function VerificationPanel({ tier }: { tier: VerificationTier }) {
  const info = TIER_INFO[tier];
  const tiers: VerificationTier[] = [0, 1, 2];
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Verification Status</p>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Separate from reputation</p>
      </div>
      <div className="px-5 py-4">
        {/* Current tier */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] mb-4"
          style={{ background: `rgba(${tier === 2 ? '201,162,75' : tier === 1 ? '147,161,191' : '94,109,143'},0.08)`, border: `1px solid ${info.color}30` }}
        >
          <VerificationBadge tier={tier} />
          <div>
            <p className="text-[12px] font-semibold" style={{ color: info.color }}>{info.label}</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{info.description}</p>
          </div>
        </div>

        {/* Tier ladder */}
        <div className="space-y-2">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Tier Progression</p>
          {tiers.map(t => {
            const tInfo = TIER_INFO[t];
            const done = t <= tier;
            return (
              <div key={t} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                  style={{ borderColor: done ? tInfo.color : '#35446A', background: done ? tInfo.color + '20' : 'transparent' }}
                >
                  {done && <svg width="8" height="8" fill="none" stroke={tInfo.color} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>}
                </div>
                <div>
                  <p className="text-[11.5px] font-medium" style={{ color: done ? tInfo.color : '#35446A' }}>{tInfo.label}</p>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{tInfo.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#35446A] mt-3">Verification tiers are granted by the platform admin. Reputation is separate and based on completed activity.</p>
      </div>
    </div>
  );
}

// --- Reputation overview card --------------------------------------------------

function ReputationOverviewCard({ data }: { data: ReputationData }) {
  const cfg = LEVEL_CFG[data.reputationLevel];
  return (
    <div className="rounded-[14px] border overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)', borderColor: cfg.border }}>
      <div className="px-5 py-4 border-b border-[color:var(--vv-border)] flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1">Reputation Level</p>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[#35446A]">Based on</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">verified completed activity</p>
        </div>
      </div>
      <div className="px-5 py-3.5">
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3">{cfg.description}</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
          Reputation on Vault Ventures is built entirely through verified, completed on-platform activity - not profile views, connections, or AI scoring. The factors below explain this user's standing.
        </p>
      </div>
    </div>
  );
}

// --- Reputation factors --------------------------------------------------------

function FactorsPanel({ factors }: { factors: ReputationFactor[] }) {
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Reputation Breakdown</p>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1">All factors sourced from verifiable completed activity.</p>
      </div>
      <div className="divide-y divide-[#2B2D2F]">
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3.5">
            <span className="text-[16px] text-[#C67A4E] shrink-0 mt-0.5">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{f.label}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{f.detail}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[14px] font-bold text-[#C67A4E] font-mono">{f.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Feedback section ----------------------------------------------------------

function FeedbackPanel({ feedback, onLeave }: { feedback: FeedbackItem[]; onLeave?: () => void }) {
  const navigate = useNavigate();

  if (feedback.length === 0) {
    return (
      <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
        <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Feedback</p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-1">No feedback yet.</p>
          <p className="text-[11.5px] text-[#35446A]">Feedback becomes visible after completed deals or engagements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">
          Feedback Received
          <span className="ml-2 text-[11px] text-[color:var(--vv-text-tertiary)] font-normal">{feedback.length} from completed relationships</span>
        </p>
        {onLeave && (
          <Button size="sm" variant="ghost" onClick={() => navigate('/app/feedback')}>Leave feedback</Button>
        )}
      </div>
      <div className="divide-y divide-[#2B2D2F]">
        {feedback.map(fb => (
          <div key={fb.id} className="px-5 py-4">
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0"
                style={{ background: 'rgba(198,122,78,0.12)', border: '1px solid rgba(198,122,78,0.2)' }}
              >
                {fb.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{fb.author}</p>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{fb.authorRole}</p>
                  </div>
                  <StarRow rating={fb.rating} />
                </div>
                <p className="text-[10.5px] text-[#35446A] mt-0.5">{fb.relationship} - Completed {fb.completedDate}</p>
              </div>
            </div>

            <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3 pl-11">&ldquo;{fb.text}&rdquo;</p>

            {/* Dimension ratings */}
            <div className="flex flex-wrap gap-3 pl-11">
              {fb.dimensions.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{d.label}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: j < d.rating ? '#C9A24B' : '#35446A' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Reputation history --------------------------------------------------------

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? history : history.slice(0, 4);

  const typeLabels: Record<HistoryEntry['type'], string> = {
    deal: 'Deal',
    milestone: 'Milestone',
    engagement: 'Engagement',
    feedback: 'Feedback',
    verification: 'Verification',
  };

  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Reputation History</p>
        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Traceable record of activity that contributes to this reputation.</p>
      </div>
      <div className="px-5 py-4">
        <div className="space-y-3">
          {shown.map((e, i) => (
            <div key={e.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.dot }} />
                {i < shown.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(53,68,106,0.4)', minHeight: 18 }} />}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{e.title}</p>
                  <span
                    className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: `${e.dot}18`, color: e.dot, border: `1px solid ${e.dot}30` }}
                  >
                    {typeLabels[e.type]}
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{e.detail}</p>
                <p className="text-[10px] text-[#35446A] mt-0.5 font-mono">{e.date}</p>
              </div>
            </div>
          ))}
        </div>

        {history.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[11.5px] text-[#C67A4E] hover:underline mt-2"
          >
            {expanded ? '? Show less' : `? Show ${history.length - 4} more entries`}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main page ----------------------------------------------------------------

export default function Reputation() {
  const { role } = useRole();
  const navigate = useNavigate();

  const data =
    role === 'founder' ? FOUNDER_DATA :
    role === 'investor' ? INVESTOR_DATA :
    PROFESSIONAL_DATA;

  const cfg = LEVEL_CFG[data.reputationLevel];

  return (
    <div className="p-4 sm:p-6 max-w-[960px] mx-auto">

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-[color:var(--vv-text)] shrink-0"
          style={{ background: 'rgba(198,122,78,0.12)', border: '2px solid rgba(198,122,78,0.25)' }}
        >
          {data.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="font-display text-[20px] sm:text-[24px] font-semibold text-[color:var(--vv-text)] tracking-tight">{data.name}</h1>
            <VerificationBadge tier={data.verificationTier} />
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-bold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">{data.role}</p>
          <p className="text-[12px] text-[color:var(--vv-text-secondary)] mt-1 leading-relaxed">{data.headline}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/app/feedback')}
          className="shrink-0"
        >
          Leave Feedback
        </Button>
      </div>

      {/* Clarifying note */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-5 text-[11.5px]"
        style={{ background: 'rgba(53,68,106,0.12)', border: '1px solid rgba(53,68,106,0.25)', color: '#93A1BF' }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" strokeLinecap="round"/>
        </svg>
        <span>
          Reputation on Vault Ventures is based entirely on completed, verifiable platform activity - not AI scoring, profile views, or social signals. Verification tier and reputation are tracked separately.
        </span>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

        {/* Left: main content */}
        <div className="space-y-4">
          <ReputationOverviewCard data={data} />
          <FactorsPanel factors={data.factors} />
          <FeedbackPanel feedback={data.feedback} onLeave={() => navigate('/app/feedback')} />
          <HistoryPanel history={data.history} />
        </div>

        {/* Right: verification */}
        <div className="space-y-4">
          <VerificationPanel tier={data.verificationTier} />

          {/* Quick stats */}
          <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Quick Stats</p>
            </div>
            <div className="divide-y divide-[#2B2D2F]">
              {data.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{f.label}</span>
                  <span className="text-[12px] font-bold text-[#C67A4E] font-mono">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
