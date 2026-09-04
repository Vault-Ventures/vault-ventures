import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// --- Types --------------------------------------------------------------------

type FeedbackStatus = 'eligible' | 'submitted' | 'ineligible';

interface EligibleRelationship {
  id: string;
  counterpartName: string;
  counterpartInitials: string;
  counterpartRole: string;
  businessName: string;
  completedDate: string;
  type: 'investment' | 'professional';
  feedbackStatus: FeedbackStatus;
  dimensions: string[];
}

// --- Seed data per role --------------------------------------------------------

const FOUNDER_ELIGIBLE: EligibleRelationship[] = [
  {
    id: 'rel-1',
    counterpartName: 'Meridian Capital',
    counterpartInitials: 'MC',
    counterpartRole: 'Investor',
    businessName: 'Nova Health',
    completedDate: 'Aug 26, 2026',
    type: 'investment',
    feedbackStatus: 'submitted',
    dimensions: ['Professionalism', 'Constructiveness', 'Responsiveness'],
  },
  {
    id: 'rel-2',
    counterpartName: 'Tariq Hossain',
    counterpartInitials: 'TH',
    counterpartRole: 'Growth Strategy Advisor',
    businessName: 'Nova Health',
    completedDate: 'Sep 1, 2026',
    type: 'professional',
    feedbackStatus: 'eligible',
    dimensions: ['Expertise', 'Delivery', 'Communication'],
  },
];

const INVESTOR_ELIGIBLE: EligibleRelationship[] = [
  {
    id: 'rel-i-1',
    counterpartName: 'Rifat Ahsan',
    counterpartInitials: 'RA',
    counterpartRole: 'Founder - Nova Health',
    businessName: 'Nova Health',
    completedDate: 'Aug 26, 2026',
    type: 'investment',
    feedbackStatus: 'submitted',
    dimensions: ['Communication', 'Follow-through', 'Transparency'],
  },
];

const PROFESSIONAL_ELIGIBLE: EligibleRelationship[] = [
  {
    id: 'rel-p-1',
    counterpartName: 'Rifat Ahsan',
    counterpartInitials: 'RA',
    counterpartRole: 'Founder - Nova Health',
    businessName: 'Nova Health',
    completedDate: 'Sep 1, 2026',
    type: 'professional',
    feedbackStatus: 'eligible',
    dimensions: ['Communication', 'Scope Clarity', 'Collaboration'],
  },
];

// --- Star picker ---------------------------------------------------------------

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <svg width="24" height="24" viewBox="0 0 24 24"
            fill={(hover || value) >= star ? '#C9A24B' : 'none'}
            stroke={(hover || value) >= star ? '#C9A24B' : '#35446A'}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-[12px] text-[color:var(--vv-text-secondary)] ml-2 font-mono">{value}.0 / 5.0</span>
      )}
    </div>
  );
}

// --- Dimension rater -----------------------------------------------------------

function DimensionRater({ dimensions, ratings, onChange }: {
  dimensions: string[];
  ratings: Record<string, number>;
  onChange: (dim: string, val: number) => void;
}) {
  return (
    <div className="space-y-3">
      {dimensions.map(dim => (
        <div key={dim} className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-[color:var(--vv-text-secondary)] shrink-0 w-36">{dim}</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(dim, v)}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all"
                style={ratings[dim] >= v
                  ? { background: '#C9A24B', borderColor: '#C9A24B', color: '#0B1220' }
                  : { borderColor: '#35446A', color: '#35446A' }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Relationship card ---------------------------------------------------------

function RelationshipCard({ rel, onSelect }: { rel: EligibleRelationship; onSelect: (r: EligibleRelationship) => void }) {
  const isSubmitted = rel.feedbackStatus === 'submitted';
  return (
    <div
      className="rounded-[14px] border transition-all"
      style={{
        background: 'rgba(26,28,29,0.85)',
        borderColor: isSubmitted ? 'rgba(34,197,94,0.2)' : 'rgba(43,45,47,0.9)',
        opacity: isSubmitted ? 0.8 : 1,
      }}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0"
            style={{ background: 'rgba(198,122,78,0.12)', border: '1.5px solid rgba(198,122,78,0.25)' }}
          >
            {rel.counterpartInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{rel.counterpartName}</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{rel.counterpartRole} - {rel.businessName}</p>
            <p className="text-[10.5px] text-[#35446A] mt-0.5 font-mono">Completed {rel.completedDate}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {isSubmitted ? (
            <Badge variant="success" dot>Feedback submitted</Badge>
          ) : (
            <Button size="sm" onClick={() => onSelect(rel)}>Leave Feedback</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Feedback form -------------------------------------------------------------

function FeedbackForm({ rel, onBack, onSubmit }: {
  rel: EligibleRelationship;
  onBack: () => void;
  onSubmit: (id: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [dimRatings, setDimRatings] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleDimChange(dim: string, val: number) {
    setDimRatings(prev => ({ ...prev, [dim]: val }));
  }

  function handleSubmit() {
    if (rating === 0) { setError('Please select an overall rating.'); return; }
    if (text.trim().length < 20) { setError('Please write at least 20 characters of feedback.'); return; }
    setError('');
    setSubmitted(true);
    setTimeout(() => onSubmit(rel.id), 1200);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <svg width="24" height="24" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Feedback submitted</p>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Thank you. Your feedback contributes to the trust system on Vault Ventures.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Context */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-[12px]"
        style={{ background: 'rgba(26,28,29,0.85)', border: '1px solid rgba(43,45,47,0.9)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0"
          style={{ background: 'rgba(198,122,78,0.12)', border: '1.5px solid rgba(198,122,78,0.25)' }}
        >
          {rel.counterpartInitials}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{rel.counterpartName}</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{rel.counterpartRole} - {rel.businessName}</p>
          <p className="text-[10.5px] text-[#35446A] mt-0.5 font-mono">Completed {rel.completedDate}</p>
        </div>
      </div>

      {/* Overall rating */}
      <div>
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-2">Overall Rating <span className="text-[#C67A4E]">*</span></p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Dimension ratings */}
      <div>
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-2.5">Dimension Ratings</p>
        <DimensionRater dimensions={rel.dimensions} ratings={dimRatings} onChange={handleDimChange} />
      </div>

      {/* Written feedback */}
      <div>
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-1.5">Your Feedback <span className="text-[#C67A4E]">*</span></p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">Be honest, constructive, and specific. Feedback is associated with this completed relationship.</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="Describe your experience working with this person-"
          className="w-full px-4 py-3 rounded-[10px] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] resize-none focus:outline-none focus:ring-1 focus:ring-[#C67A4E]"
          style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid rgba(43,45,47,0.5)' }}
        />
        <p className="text-[10px] text-[#35446A] mt-1 text-right">{text.length} / 600</p>
      </div>

      {/* Guidelines */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-[8px]" style={{ background: 'rgba(53,68,106,0.1)', border: '1px solid rgba(53,68,106,0.2)' }}>
        <svg width="13" height="13" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" strokeLinecap="round"/>
        </svg>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Feedback is visible to the recipient and the Vault Ventures platform. Self-reviews and reviews for incomplete relationships are not permitted. Feedback cannot be edited after submission.</p>
      </div>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1">Submit Feedback</Button>
      </div>
    </div>
  );
}

// --- Main page -----------------------------------------------------------------

export default function FeedbackFlow() {
  const { role } = useRole();
  const navigate = useNavigate();

  const allEligible =
    role === 'founder' ? FOUNDER_ELIGIBLE :
    role === 'investor' ? INVESTOR_ELIGIBLE :
    PROFESSIONAL_ELIGIBLE;

  const [eligible, setEligible] = useState(allEligible);
  const [selected, setSelected] = useState<EligibleRelationship | null>(null);

  function handleSubmit(id: string) {
    setEligible(prev => prev.map(r => r.id === id ? { ...r, feedbackStatus: 'submitted' as const } : r));
    setTimeout(() => setSelected(null), 600);
  }

  const pendingCount = eligible.filter(r => r.feedbackStatus === 'eligible').length;
  const submittedCount = eligible.filter(r => r.feedbackStatus === 'submitted').length;

  return (
    <div className="p-4 sm:p-6 max-w-[720px] mx-auto">

      {selected ? (
        <>
          {/* Back */}
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-5"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5m7-7l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to feedback list
          </button>
          <h2 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-5">Leave Feedback</h2>
          <FeedbackForm rel={selected} onBack={() => setSelected(null)} onSubmit={handleSubmit} />
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight">Feedback</h1>
              <button
                onClick={() => navigate('/app/' + role + '/reputation')}
                className="text-[11.5px] text-[#C67A4E] hover:underline"
              >
                View your reputation ?
              </button>
            </div>
            <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">
              Leave feedback for people you have completed a deal or engagement with. Feedback is verified, traceable, and contributes to platform trust.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-5">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#C67A4E' }} />
                <span className="text-[12px] text-[color:var(--vv-text-secondary)]"><strong className="text-[color:var(--vv-text)]">{pendingCount}</strong> awaiting feedback</span>
              </div>
            )}
            {submittedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-[12px] text-[color:var(--vv-text-secondary)]"><strong className="text-[color:var(--vv-text)]">{submittedCount}</strong> submitted</span>
              </div>
            )}
          </div>

          {/* Eligibility note */}
          <div
            className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-4 text-[11.5px]"
            style={{ background: 'rgba(53,68,106,0.1)', border: '1px solid rgba(53,68,106,0.2)', color: '#93A1BF' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" strokeLinecap="round"/>
            </svg>
            <span>Only completed, on-platform relationships are eligible for feedback. You cannot review your own profile, submit duplicate feedback for the same relationship, or review incomplete deals.</span>
          </div>

          {/* List */}
          {eligible.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(53,68,106,0.12)', border: '1.5px solid rgba(53,68,106,0.25)' }}
              >
                <svg width="22" height="22" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1.5">No feedback eligible yet</p>
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-xs leading-relaxed">
                Feedback becomes available after you complete a deal, investment, or engagement on-platform.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligible.map(rel => (
                <RelationshipCard key={rel.id} rel={rel} onSelect={setSelected} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}