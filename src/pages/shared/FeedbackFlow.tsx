import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  api,
  ApiError,
  DealFeedbackItem,
  DealFeedbackStatusData,
  ReputationSummaryData,
} from '../../services/api';

// --- Star picker ---------------------------------------------------------------

function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star)}
          className={`transition-transform ${disabled ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={(hover || value) >= star ? '#C9A24B' : 'none'}
            stroke={(hover || value) >= star ? '#C9A24B' : '#35446A'}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-[12px] text-[color:var(--vv-text-secondary)] ml-2 font-mono">
          {value}.0 / 5.0
        </span>
      )}
    </div>
  );
}

// --- Star row for display ------------------------------------------------------

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

// --- Deal Feedback Form Component ----------------------------------------------

interface DealFeedbackFormProps {
  dealId: number | string;
  role: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function DealFeedbackForm({ dealId, role, onSuccess, onCancel }: DealFeedbackFormProps) {
  const [dealStatus, setDealStatus] = useState<DealFeedbackStatusData | null>(null);
  const [dealInfo, setDealInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const fetchDealFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, dealRes] = await Promise.all([
        api.deals.feedback.getStatus(dealId, role),
        api.deals.get(dealId, role).catch(() => null),
      ]);
      setDealStatus(statusRes);
      if (dealRes) {
        setDealInfo(dealRes);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load feedback details for this deal.');
      } else {
        setError('Unable to communicate with the server.');
      }
    } finally {
      setLoading(false);
    }
  }, [dealId, role]);

  useEffect(() => {
    fetchDealFeedback();
  }, [fetchDealFeedback]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.deals.feedback.submit(dealId, {
        rating,
        comment: comment.trim() ? comment.trim() : null,
        role,
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.details) {
          const detailMsgs = Object.values(err.details).flat().join(' ');
          setError(detailMsgs || err.message);
        } else {
          setError(err.message || 'Failed to submit feedback.');
        }
      } else {
        setError('An unexpected error occurred while submitting feedback.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading deal feedback information...</p>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
        >
          <svg width="24" height="24" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Feedback Submitted</p>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-md">
          Thank you. Your feedback has been recorded and verified on the Vault Ventures trust ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Deal Context Header */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-[12px]"
        style={{ background: 'rgba(26,28,29,0.85)', border: '1px solid rgba(43,45,47,0.9)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0"
          style={{ background: 'rgba(198,122,78,0.12)', border: '1.5px solid rgba(198,122,78,0.25)' }}
        >
          #{dealId}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">
              Deal #{dealId} {dealInfo?.business_name ? `— ${dealInfo.business_name}` : ''}
            </p>
            <Badge variant={dealStatus?.deal_stage === 'completed' ? 'success' : 'neutral'}>
              {dealStatus?.deal_stage ? dealStatus.deal_stage.toUpperCase() : 'DEAL'}
            </Badge>
          </div>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Role: <span className="capitalize text-[color:var(--vv-text-secondary)]">{role}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
          {error}
        </div>
      )}

      {/* If feedback already submitted */}
      {dealStatus?.has_submitted_feedback ? (
        <div className="p-5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
          <div className="flex items-center gap-2 text-[#22C55E]">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] font-semibold">You have already submitted feedback for this deal</span>
          </div>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
            Per platform governance, feedback is submitted once upon deal completion and is immutable.
          </p>
          {dealStatus.reviews && dealStatus.reviews.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[color:var(--vv-border)] space-y-3">
              <p className="text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] uppercase tracking-wider">
                Recorded Reviews for Deal #{dealId}
              </p>
              {dealStatus.reviews.map(rev => (
                <div key={rev.id} className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)] text-[12px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[color:var(--vv-text)] capitalize">
                      {rev.reviewer_role} Review
                    </span>
                    <StarRow rating={rev.rating} />
                  </div>
                  {rev.comment && <p className="text-[color:var(--vv-text-secondary)] italic">&ldquo;{rev.comment}&rdquo;</p>}
                  {rev.submitted_at && (
                    <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1 font-mono">
                      {new Date(rev.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="pt-2">
            <Button variant="ghost" onClick={onCancel}>Back to Overview</Button>
          </div>
        </div>
      ) : dealStatus?.deal_stage !== 'completed' ? (
        <div className="p-5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] space-y-3">
          <div className="flex items-center gap-2 text-[#C67A4E]">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-semibold">Deal In Progress</span>
          </div>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
            Feedback can only be submitted once the deal has completed all agreed milestones and funding stages. Current stage is{' '}
            <strong className="text-[color:var(--vv-text)] capitalize">{dealStatus?.deal_stage || 'In Progress'}</strong>.
          </p>
          <div className="pt-2">
            <Button variant="ghost" onClick={onCancel}>Back to Overview</Button>
          </div>
        </div>
      ) : (
        /* Feedback Submission Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Overall rating */}
          <div>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-2">
              Overall Rating <span className="text-[#C67A4E]">*</span>
            </p>
            <StarPicker value={rating} onChange={setRating} disabled={submitting} />
          </div>

          {/* Written feedback */}
          <div>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-1.5">
              Your Review & Comments
            </p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">
              Be honest, constructive, and specific. Feedback is verified and recorded for this completed deal.
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={submitting}
              placeholder="Describe your experience collaborating on this deal..."
              className="w-full px-4 py-3 rounded-[10px] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] resize-none focus:outline-none focus:ring-1 focus:ring-[#C67A4E]"
              style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid rgba(43,45,47,0.5)' }}
            />
            <p className="text-[10px] text-[#35446A] mt-1 text-right">{comment.length} / 2000</p>
          </div>

          {/* Guidelines */}
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-[8px]"
            style={{ background: 'rgba(53,68,106,0.1)', border: '1px solid rgba(53,68,106,0.2)' }}
          >
            <svg
              width="13"
              height="13"
              fill="none"
              stroke="#5E6D8F"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" strokeLinecap="round" />
            </svg>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              Feedback is bilateral and immutable once submitted. It directly contributes to the platform's verifiable track record.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || rating === 0} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// --- Main FeedbackFlow Page ----------------------------------------------------

export default function FeedbackFlow() {
  const { role } = useRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryDealId = searchParams.get('dealId') || searchParams.get('deal');

  const [selectedDealId, setSelectedDealId] = useState<string | number | null>(queryDealId || null);
  const [manualDealInput, setManualDealInput] = useState('');
  const [reputationData, setReputationData] = useState<ReputationSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rep = await api.reputation.get(role);
      setReputationData(rep);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load feedback track record.');
      } else {
        setError('Unable to connect to reputation service.');
      }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  useEffect(() => {
    if (queryDealId) {
      setSelectedDealId(queryDealId);
    }
  }, [queryDealId]);

  function handleSelectDeal(dealId: number | string) {
    setSelectedDealId(dealId);
  }

  function handleManualDealSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualDealInput.trim()) return;
    setSelectedDealId(manualDealInput.trim());
  }

  const reviewsList = reputationData?.feedback?.reviews || [];

  return (
    <div className="p-4 sm:p-6 max-w-[760px] mx-auto">
      {selectedDealId ? (
        <>
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedDealId(null);
              navigate('/app/feedback', { replace: true });
            }}
            className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-5"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5m7-7l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to feedback overview
          </button>
          <h2 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-5">
            Leave Feedback
          </h2>
          <DealFeedbackForm
            dealId={selectedDealId}
            role={role}
            onSuccess={() => {
              fetchReputation();
              setSelectedDealId(null);
              navigate('/app/feedback', { replace: true });
            }}
            onCancel={() => {
              setSelectedDealId(null);
              navigate('/app/feedback', { replace: true });
            }}
          />
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight">
                Deal Feedback
              </h1>
              <button
                onClick={() => navigate(`/app/${role}/reputation`)}
                className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1"
              >
                <span>View your reputation</span>
                <span>→</span>
              </button>
            </div>
            <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">
              Submit bilateral, verifiable feedback on completed deals. Feedback directly updates platform trust scores and reputation track records.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 mb-5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
              {error}
            </div>
          )}

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">
                Completed Deals
              </p>
              <p className="text-[18px] font-bold text-[color:var(--vv-text)] font-mono mt-0.5">
                {reputationData?.track_record?.completed_deals_count ?? 0}
              </p>
            </div>
            <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">
                Reviews Received
              </p>
              <p className="text-[18px] font-bold text-[#C67A4E] font-mono mt-0.5">
                {reputationData?.feedback?.reviews_count ?? 0}
              </p>
            </div>
            <div className="p-3.5 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">
                Average Rating
              </p>
              <p className="text-[18px] font-bold text-[#C9A24B] font-mono mt-0.5">
                {reputationData?.feedback?.average_rating
                  ? `${reputationData.feedback.average_rating.toFixed(1)} / 5.0`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Feedback by Deal Lookup Box */}
          <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)] mb-6">
            <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-1">
              Leave Feedback for a Deal
            </p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">
              Enter the ID of a completed deal you participated in as {role} to review your counterparty.
            </p>
            <form onSubmit={handleManualDealSubmit} className="flex gap-2">
              <input
                type="number"
                min="1"
                value={manualDealInput}
                onChange={e => setManualDealInput(e.target.value)}
                placeholder="Enter Deal ID (e.g. 1)"
                className="flex-1 px-3.5 py-2 rounded-[8px] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] focus:outline-none focus:ring-1 focus:ring-[#C67A4E]"
                style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid rgba(43,45,47,0.5)' }}
              />
              <Button type="submit" size="sm" disabled={!manualDealInput.trim()}>
                Review Deal
              </Button>
            </form>
          </div>

          {/* Feedback Governance Notice */}
          <div
            className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-6 text-[11.5px]"
            style={{ background: 'rgba(53,68,106,0.1)', border: '1px solid rgba(53,68,106,0.2)', color: '#93A1BF' }}
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
              Only completed, on-platform deals are eligible for feedback. Self-reviews, duplicate reviews, and reviews for incomplete deals are blocked by backend platform governance.
            </span>
          </div>

          {/* Recent Reviews List from Real Backend */}
          <div>
            <h2 className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-3">
              Recent Verifiable Feedback
            </h2>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-2 border-[color:var(--vv-border-strong)] border-t-[#C67A4E] rounded-full animate-spin mb-3" />
                <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading verified feedback records...</p>
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(53,68,106,0.12)', border: '1.5px solid rgba(53,68,106,0.25)' }}
                >
                  <svg width="20" height="20" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-1">
                  No feedback records yet
                </p>
                <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm leading-relaxed px-4">
                  Feedback becomes available once you and your counterparty successfully complete all milestones of a deal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewsList.map(rev => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0"
                          style={{ background: 'rgba(198,122,78,0.12)', border: '1px solid rgba(198,122,78,0.25)' }}
                        >
                          {rev.reviewer_name ? rev.reviewer_name.slice(0, 2).toUpperCase() : 'CP'}
                        </div>
                        <div>
                          <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">
                            {rev.reviewer_name || 'Verified Counterparty'}
                          </p>
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                            <span className="capitalize">{rev.reviewer_role}</span>
                            {rev.business_name ? ` • ${rev.business_name}` : ''}
                            {rev.deal_id ? ` (Deal #${rev.deal_id})` : ''}
                          </p>
                        </div>
                      </div>
                      <StarRow rating={rev.rating} />
                    </div>
                    {rev.comment && (
                      <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed pl-10 mb-1 italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                    {rev.submitted_at && (
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] pl-10 font-mono">
                        Submitted on {new Date(rev.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}