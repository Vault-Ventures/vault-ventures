import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  api,
  ApiError,
  DealFeedbackItem,
  ReputationSummaryData,
} from '../../services/api';

// --- Types --------------------------------------------------------------------

type ReputationLevel = 'emerging' | 'established' | 'trusted' | 'proven';
type VerificationTier = 0 | 1 | 2;

// --- Level config --------------------------------------------------------------

const LEVEL_CFG: Record<ReputationLevel, { label: string; color: string; bg: string; border: string; description: string }> = {
  emerging: {
    label: 'Emerging',
    color: '#93A1BF',
    bg: 'rgba(93,101,127,0.08)',
    border: 'rgba(93,101,127,0.2)',
    description: 'Building verifiable track record through initial platform activity.',
  },
  established: {
    label: 'Established',
    color: '#C67A4E',
    bg: 'rgba(198,122,78,0.1)',
    border: 'rgba(198,122,78,0.25)',
    description: 'Demonstrated platform standing with verified identity and active deal history.',
  },
  trusted: {
    label: 'Trusted',
    color: '#C9A24B',
    bg: 'rgba(201,162,75,0.1)',
    border: 'rgba(201,162,75,0.25)',
    description: 'Consistent track record with completed milestones and positive counterparty reviews.',
  },
  proven: {
    label: 'Proven',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    description: 'Extensive completed deal activity, verified credentials, and high satisfaction ratings.',
  },
};

function deriveReputationLevel(data: ReputationSummaryData): ReputationLevel {
  const tier = data.verification?.tier ?? 0;
  const completedDeals = data.track_record?.completed_deals_count ?? 0;
  const reviewsCount = data.feedback?.reviews_count ?? 0;
  const avgRating = data.feedback?.average_rating ?? 0;

  if (tier >= 2 && completedDeals >= 2 && reviewsCount >= 2 && avgRating >= 4.5) {
    return 'proven';
  }
  if (tier >= 1 && (completedDeals >= 1 || reviewsCount >= 1)) {
    return 'trusted';
  }
  if (tier >= 1 || completedDeals >= 1) {
    return 'established';
  }
  return 'emerging';
}

// --- Star rating ---------------------------------------------------------------

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < rating ? '#C9A24B' : 'none'}
          stroke={i < rating ? '#C9A24B' : '#35446A'}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-[11px] text-[color:var(--vv-text-secondary)] ml-1 font-mono tabular-nums">
        {rating}.0
      </span>
    </div>
  );
}

// --- Verification tier panel ---------------------------------------------------

const TIER_INFO: Record<VerificationTier, { label: string; description: string; color: string }> = {
  0: {
    label: 'Tier 0 - Unverified',
    description: 'Identity and track record not yet confirmed.',
    color: '#5E6D8F',
  },
  1: {
    label: 'Tier 1 - Identity Verified',
    description: 'Government-issued ID and contact information verified by platform admin.',
    color: '#93A1BF',
  },
  2: {
    label: 'Tier 2 - Track-record Verified',
    description: 'Professional history, accreditation, or investment track record confirmed.',
    color: '#C9A24B',
  },
};

function VerificationPanel({ tier }: { tier: VerificationTier }) {
  const info = TIER_INFO[tier] || TIER_INFO[0];
  const tiers: VerificationTier[] = [0, 1, 2];
  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Verification Status</p>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Separate from reputation</p>
      </div>
      <div className="px-5 py-4">
        {/* Current tier */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] mb-4"
          style={{
            background: `rgba(${tier === 2 ? '201,162,75' : tier === 1 ? '147,161,191' : '94,109,143'},0.08)`,
            border: `1px solid ${info.color}30`,
          }}
        >
          <VerificationBadge tier={tier} />
          <div>
            <p className="text-[12px] font-semibold" style={{ color: info.color }}>
              {info.label}
            </p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{info.description}</p>
          </div>
        </div>

        {/* Tier ladder */}
        <div className="space-y-2">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">
            Tier Progression
          </p>
          {tiers.map(t => {
            const tInfo = TIER_INFO[t];
            const done = t <= tier;
            return (
              <div key={t} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    borderColor: done ? tInfo.color : 'var(--vv-border-strong)',
                    background: done ? tInfo.color + '20' : 'transparent',
                  }}
                >
                  {done && (
                    <svg width="8" height="8" fill="none" stroke={tInfo.color} strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[11.5px] font-medium" style={{ color: done ? tInfo.color : 'var(--vv-text-tertiary)' }}>
                    {tInfo.label}
                  </p>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{tInfo.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-3">
          Verification tiers are granted by platform administration. Reputation is separate and based strictly on completed deal performance.
        </p>
      </div>
    </div>
  );
}

// --- Reputation overview card --------------------------------------------------

function ReputationOverviewCard({ level }: { level: ReputationLevel }) {
  const cfg = LEVEL_CFG[level];
  return (
    <div className="rounded-[14px] border overflow-hidden bg-[#121A2B]" style={{ borderColor: cfg.border }}>
      <div className="px-5 py-4 border-b border-[color:var(--vv-border)] flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1">
            Reputation Standing
          </p>
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
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Authority</p>
          <p className="text-[11px] text-[color:var(--vv-text-secondary)] font-medium">Platform Trust Ledger</p>
        </div>
      </div>
      <div className="px-5 py-3.5">
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3">
          {cfg.description}
        </p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
          Reputation on Vault Ventures is built entirely through verified, completed on-platform activity — not profile views, arbitrary scoring, or unverified claims.
        </p>
      </div>
    </div>
  );
}

// --- Reputation Track Record Breakdown -----------------------------------------

function TrackRecordPanel({ data }: { data: ReputationSummaryData }) {
  const bdtFormatted = Number(data.track_record?.total_simulated_bdt || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const factors = [
    {
      label: 'Completed Deals',
      value: data.track_record?.completed_deals_count ?? 0,
      detail: `${data.track_record?.completed_deals_count ?? 0} deals successfully completed on-platform`,
      icon: '🤝',
    },
    {
      label: 'Milestones Funded & Released',
      value: data.track_record?.completed_milestones_count ?? 0,
      detail: `${data.track_record?.completed_milestones_count ?? 0} agreed deal milestones successfully funded and confirmed`,
      icon: '🎯',
    },
    {
      label: 'Total Simulated Capital Volume',
      value: `৳ ${bdtFormatted}`,
      detail: 'Cumulative simulated BDT volume transacted across completed deals',
      icon: '৳',
    },
    {
      label: 'Feedback Received',
      value: `${data.feedback?.reviews_count ?? 0}`,
      detail: data.feedback?.average_rating
        ? `Average rating ${data.feedback.average_rating.toFixed(1)} / 5.0 from counterparties`
        : 'No counterparty feedback ratings submitted yet',
      icon: '⭐',
    },
  ];

  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Verifiable Track Record</p>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5">
          All metrics calculated directly by backend reputation services from completed deals.
        </p>
      </div>
      <div className="divide-y divide-[color:var(--vv-border)]">
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3.5">
            <span className="text-[16px] text-[#C67A4E] shrink-0 mt-0.5">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{f.label}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{f.detail}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[13.5px] font-bold text-[#C67A4E] font-mono">{f.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Profile Evidence Panel ----------------------------------------------------

function ProfileEvidencePanel({ data, role }: { data: ReputationSummaryData; role: string }) {
  const evidence = data.profile_evidence || {};

  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">
          Profile & Role Evidence
        </p>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5">
          Verified platform registry data associated with this {role} account.
        </p>
      </div>
      <div className="p-5 space-y-4">
        {role === 'founder' && (
          <div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider mb-2">
              Registered Businesses ({evidence.businesses_count ?? 0})
            </p>
            {evidence.businesses && evidence.businesses.length > 0 ? (
              <div className="space-y-2">
                {evidence.businesses.map((b: any) => (
                  <div key={b.id} className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)] flex items-center justify-between">
                    <div>
                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{b.name}</p>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                        {b.industry} • {b.stage || b.business_stage} • {b.location}
                      </p>
                    </div>
                    <Badge variant={b.status === 'approved' ? 'success' : 'neutral'}>{b.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">No registered businesses found.</p>
            )}

            {data.financial_transparency && (
              <div className="mt-4 pt-4 border-t border-[color:var(--vv-border)]">
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider mb-2">
                  Financial Governance & Reporting
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="p-2.5 rounded-[6px] bg-[#1A2338]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Submitted Reports: </span>
                    <strong className="text-[color:var(--vv-text)]">{data.financial_transparency.submitted_reports_count}</strong>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-[#1A2338]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Verified Reports: </span>
                    <strong className="text-[#22C55E]">{data.financial_transparency.verified_reports_count}</strong>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-[#1A2338]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Evidence-Backed: </span>
                    <strong className="text-[color:var(--vv-text)]">{data.financial_transparency.evidence_backed_reports_count}</strong>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-[#1A2338]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Active Discrepancies: </span>
                    <strong className={data.financial_transparency.active_discrepancies_count > 0 ? 'text-red-400' : 'text-[#22C55E]'}>
                      {data.financial_transparency.active_discrepancies_count}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {role === 'investor' && (
          <div className="space-y-3">
            <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Target Industry Focus</p>
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mt-0.5">{evidence.industry || 'All Sectors'}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Investment Types</p>
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mt-0.5">
                {evidence.investment_types && evidence.investment_types.length > 0 ? evidence.investment_types.join(', ') : 'Standard Equity, Micro Profit-Sharing'}
              </p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Investment Range (BDT)</p>
              <p className="text-[12.5px] font-medium text-[#C67A4E] mt-0.5 font-mono">
                ৳{evidence.minimum_investment_bdt ? Number(evidence.minimum_investment_bdt).toLocaleString('en-IN') : '0'} — ৳{evidence.maximum_investment_bdt ? Number(evidence.maximum_investment_bdt).toLocaleString('en-IN') : 'Open'}
              </p>
            </div>
          </div>
        )}

        {role === 'professional' && (
          <div className="space-y-3">
            <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Verified Skills</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {evidence.skills && evidence.skills.length > 0 ? (
                  evidence.skills.map((s: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[color:var(--vv-border)] text-[11px] text-[color:var(--vv-text-secondary)]">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">No specialized skills listed</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)]">
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Experience & Availability</p>
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mt-0.5 capitalize">
                {evidence.experience_level || 'Professional'} • {evidence.availability || 'Available for advisory'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Feedback Received Panel ---------------------------------------------------

function FeedbackPanel({ reviews }: { reviews: DealFeedbackItem[] }) {
  const navigate = useNavigate();

  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
        <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Feedback Received</p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-1">No feedback received yet.</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
            Feedback becomes visible after completed deals and engagements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)] flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">
          Feedback Received
          <span className="ml-2 text-[11px] text-[color:var(--vv-text-tertiary)] font-normal">
            {reviews.length} from completed deals
          </span>
        </p>
        <Button size="sm" variant="ghost" onClick={() => navigate('/app/feedback')}>
          Leave feedback
        </Button>
      </div>
      <div className="divide-y divide-[color:var(--vv-border)]">
        {reviews.map(fb => (
          <div key={fb.id} className="px-5 py-4">
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0"
                style={{ background: 'rgba(198,122,78,0.12)', border: '1px solid rgba(198,122,78,0.2)' }}
              >
                {fb.reviewer_name ? fb.reviewer_name.slice(0, 2).toUpperCase() : 'CP'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">
                      {fb.reviewer_name || 'Verified Counterparty'}
                    </p>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] capitalize">
                      {fb.reviewer_role} {fb.business_name ? `• ${fb.business_name}` : ''}
                    </p>
                  </div>
                  <StarRow rating={fb.rating} />
                </div>
                {fb.deal_id && (
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">
                    Deal #{fb.deal_id} {fb.submitted_at ? `• Completed on ${new Date(fb.submitted_at).toLocaleDateString()}` : ''}
                  </p>
                )}
              </div>
            </div>

            {fb.comment && (
              <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed pl-11 italic">
                &ldquo;{fb.comment}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Reputation Page ------------------------------------------------------

export default function Reputation({ profileRole }: { profileRole?: 'founder' | 'investor' | 'professional' }) {
  const { role: activeRole } = useRole();
  const role = profileRole ?? activeRole;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();

  const targetUserId = searchParams.get('userId') || params.userId;

  const [data, setData] = useState<ReputationSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (targetUserId) {
        const res = await api.reputation.getUser(targetUserId, role);
        setData(res);
      } else {
        const res = await api.reputation.get(role);
        setData(res);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load reputation summary.');
      } else {
        setError('Unable to connect to reputation service.');
      }
    } finally {
      setLoading(false);
    }
  }, [role, targetUserId]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading verified reputation ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-[720px] mx-auto">
        <div className="p-4 rounded-[12px] bg-red-950/40 border border-red-800/60 text-red-300 text-[13px] mb-4">
          {error || 'Failed to load reputation data.'}
        </div>
        <Button onClick={fetchReputation} size="sm">Retry</Button>
      </div>
    );
  }

  const level = deriveReputationLevel(data);
  const cfg = LEVEL_CFG[level];
  const displayName = user?.name || `Participant #${data.user_id}`;
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'VV';
  const tier = (data.verification?.tier as VerificationTier) ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-[color:var(--vv-text)] shrink-0"
          style={{ background: 'rgba(198,122,78,0.12)', border: '2px solid rgba(198,122,78,0.25)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="font-display text-[20px] sm:text-[24px] font-semibold text-[color:var(--vv-text)] tracking-tight">
              {displayName}
            </h1>
            <VerificationBadge tier={tier} />
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-bold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] capitalize">
            {data.role} Account • ID #{data.user_id}
          </p>
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

      {/* Clarifying Trust Notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-5 text-[11.5px]"
        style={{ background: 'rgba(53,68,106,0.12)', border: '1px solid rgba(53,68,106,0.25)', color: '#93A1BF' }}
      >
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          className="shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4m0-4h.01" strokeLinecap="round" />
        </svg>
        <span>
          Reputation on Vault Ventures is based entirely on verified platform activity — completed deals, milestone disbursements, and bilateral reviews. Verification tiers and reputation are tracked separately.
        </span>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Left: main content */}
        <div className="space-y-4">
          <ReputationOverviewCard level={level} />
          <TrackRecordPanel data={data} />
          <ProfileEvidencePanel data={data} role={data.role || role} />
          <FeedbackPanel reviews={data.feedback?.reviews || []} />
        </div>

        {/* Right: verification & quick stats */}
        <div className="space-y-4">
          <VerificationPanel tier={tier} />

          {/* Quick Stats */}
          <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Trust Ledger Summary</p>
            </div>
            <div className="divide-y divide-[color:var(--vv-border)]">
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Completed Deals</span>
                <span className="text-[12px] font-bold text-[#C67A4E] font-mono">
                  {data.track_record?.completed_deals_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Funded Milestones</span>
                <span className="text-[12px] font-bold text-[#C67A4E] font-mono">
                  {data.track_record?.completed_milestones_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Reviews Count</span>
                <span className="text-[12px] font-bold text-[#C67A4E] font-mono">
                  {data.feedback?.reviews_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Average Rating</span>
                <span className="text-[12px] font-bold text-[#C9A24B] font-mono">
                  {data.feedback?.average_rating ? `${data.feedback.average_rating.toFixed(1)} / 5.0` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
