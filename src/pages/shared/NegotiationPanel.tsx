import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useRole } from '../../components/layout/AppShell';

// --- Types --------------------------------------------------------------------

type NegStatus = 'draft' | 'proposed' | 'countered' | 'accepted' | 'declined' | 'expired';
type ViewRole = 'professional' | 'founder';

interface Term {
  key: string;
  label: string;
  value: string;
  negotiable: boolean;
}

interface Proposal {
  version: number;
  label: string;
  by: string;
  byRole: ViewRole;
  date: string;
  time: string;
  status: NegStatus;
  terms: Term[];
  note?: string;
}

interface Comment {
  id: string;
  author: string;
  role: ViewRole;
  text: string;
  ts: string;
}

// --- Seed data -----------------------------------------------------------------

const CONTEXT = {
  business: 'Nova Health',
  businessInitials: 'NH',
  professional: 'Tariq Hossain',
  professionalInitials: 'TH',
  type: 'Professional Collaboration',
  dealId: 'nova-health',
};

const INITIAL_PROPOSALS: Proposal[] = [
  {
    version: 1,
    label: 'Original Terms',
    by: 'Nova Health',
    byRole: 'founder',
    date: 'Aug 22, 2026',
    time: '10:32 AM',
    status: 'proposed',
    terms: [
      { key: 'role', label: 'Role / Contribution', value: 'Growth Strategy Advisor', negotiable: true },
      { key: 'scope', label: 'Scope of Work', value: 'Investor relations, go-to-market strategy, fundraising documentation', negotiable: true },
      { key: 'availability', label: 'Availability', value: '8-10 hours/week for 6 months', negotiable: true },
      { key: 'compensation', label: 'Compensation', value: 'BDT 1,20,000 / month', negotiable: true },
      { key: 'equity', label: 'Equity', value: '0.50%', negotiable: true },
      { key: 'timeline', label: 'Timeline', value: 'Sep 1, 2026 - Feb 28, 2027', negotiable: true },
      { key: 'milestones', label: 'Milestone Expectations', value: 'Series A deck ready by Oct 15; investor outreach by Nov 1', negotiable: false },
    ],
    note: 'We are excited to partner with you on our Series A journey. These initial terms reflect our current budget and equity pool.',
  },
  {
    version: 2,
    label: 'Counter Offer',
    by: 'Tariq Hossain',
    byRole: 'professional',
    date: 'Aug 23, 2026',
    time: '11:04 AM',
    status: 'countered',
    terms: [
      { key: 'role', label: 'Role / Contribution', value: 'Growth Strategy Advisor', negotiable: true },
      { key: 'scope', label: 'Scope of Work', value: 'Investor relations, go-to-market strategy, fundraising documentation, board meeting preparation', negotiable: true },
      { key: 'availability', label: 'Availability', value: '10-12 hours/week for 6 months', negotiable: true },
      { key: 'compensation', label: 'Compensation', value: 'BDT 1,60,000 / month', negotiable: true },
      { key: 'equity', label: 'Equity', value: '0.75%', negotiable: true },
      { key: 'timeline', label: 'Timeline', value: 'Sep 15, 2026 - Mar 14, 2027', negotiable: true },
      { key: 'milestones', label: 'Milestone Expectations', value: 'Series A deck ready by Oct 15; investor outreach by Nov 1', negotiable: false },
    ],
    note: 'I have expanded the scope to include board prep and adjusted compensation and equity to reflect the additional responsibilities.',
  },
  {
    version: 3,
    label: 'Revised Offer',
    by: 'Nova Health',
    byRole: 'founder',
    date: 'Aug 24, 2026',
    time: '12:15 PM',
    status: 'proposed',
    terms: [
      { key: 'role', label: 'Role / Contribution', value: 'Growth Strategy Advisor', negotiable: true },
      { key: 'scope', label: 'Scope of Work', value: 'Investor relations, go-to-market strategy, fundraising documentation, board meeting preparation', negotiable: true },
      { key: 'availability', label: 'Availability', value: '10 hours/week for 6 months', negotiable: true },
      { key: 'compensation', label: 'Compensation', value: 'BDT 1,40,000 / month', negotiable: true },
      { key: 'equity', label: 'Equity', value: '0.65%', negotiable: true },
      { key: 'timeline', label: 'Timeline', value: 'Sep 10, 2026 - Mar 9, 2027', negotiable: true },
      { key: 'milestones', label: 'Milestone Expectations', value: 'Series A deck ready by Oct 15; investor outreach by Nov 1', negotiable: false },
    ],
    note: 'Revised to meet you in the middle on compensation and equity. We believe this reflects the scope expansion fairly.',
  },
];

const INITIAL_COMMENTS: Comment[] = [
  { id: 'c1', author: 'Nova Health', role: 'founder', text: 'Please review our initial terms. We are flexible on the start date if needed.', ts: 'Aug 22, 10:35 AM' },
  { id: 'c2', author: 'Tariq Hossain', role: 'professional', text: 'Thanks for sharing. I have sent a counter with updated scope and adjusted compensation. Happy to discuss the equity range further.', ts: 'Aug 23, 11:06 AM' },
  { id: 'c3', author: 'Nova Health', role: 'founder', text: 'We have revised our offer. The adjusted rate and equity should work within our current cap table. Looking forward to working together.', ts: 'Aug 24, 12:18 PM' },
];

// --- Status config ------------------------------------------------------------

const STATUS_CFG: Record<NegStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Draft',     color: '#5E6D8F', bg: 'rgba(93,101,127,0.08)',  border: 'rgba(93,101,127,0.2)'  },
  proposed:  { label: 'Proposed',  color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)'  },
  countered: { label: 'Countered', color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
  accepted:  { label: 'Accepted',  color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)'   },
  declined:  { label: 'Declined',  color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)'   },
  expired:   { label: 'Expired',   color: '#5E6D8F', bg: 'rgba(36,48,74,0.4)',    border: 'rgba(36,48,74,0.8)'    },
};

// --- Helpers ------------------------------------------------------------------

function StatusBadge({ status }: { status: NegStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold tracking-wide"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function roleAvatar(role: ViewRole, label: string, initials: string) {
  const isFdr = role === 'founder';
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
      style={{
        background: isFdr ? 'rgba(198,122,78,0.1)' : 'rgba(167,139,250,0.1)',
        border: `1px solid ${isFdr ? 'rgba(198,122,78,0.22)' : 'rgba(167,139,250,0.22)'}`,
        color: isFdr ? '#C67A4E' : '#A78BFA',
      }}>
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

// --- Counter offer modal ------------------------------------------------------

function CounterModal({
  current, viewRole, onClose, onSubmit,
}: {
  current: Proposal;
  viewRole: ViewRole;
  onClose: () => void;
  onSubmit: (overrides: Record<string, string>, note: string) => void;
}) {
  const negotiable = current.terms.filter(t => t.negotiable);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(negotiable.map(t => [t.key, t.value]))
  );
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  function handleSend() {
    setSending(true);
    setTimeout(() => { onSubmit(values, note); }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="counter-offer-title"
      style={{ background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-[520px] rounded-t-[20px] sm:rounded-[18px] border border-[color:var(--vv-border-strong)] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'rgba(10,15,26,0.98)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2C44] flex-shrink-0">
          <div>
            <p id="counter-offer-title" className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Counter Offer</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Proposal #{current.version} - edit negotiable terms only</p>
          </div>
          <button onClick={onClose} aria-label="Close counter offer" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {negotiable.map(term => (
            <div key={term.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)]">{term.label}</label>
                <span className="text-[10.5px] text-[#35446A]">
                  Current: <span className="text-[color:var(--vv-text-tertiary)]">{term.value}</span>
                </span>
              </div>
              <input type="text" value={values[term.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [term.key]: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50" />
            </div>
          ))}

          <div>
            <label className="block text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">Note (optional)</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Explain your counter offer..."
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#1E2C44] flex-shrink-0">
          <Button className="flex-1" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending-' : 'Send Counter Offer'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Term row -----------------------------------------------------------------

function TermRow({ term, prevValue }: { term: Term; prevValue?: string }) {
  const changed = prevValue !== undefined && prevValue !== term.value;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#1E2C44] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{term.label}</p>
        {changed && prevValue && (
          <p className="text-[10px] text-[#35446A] line-through mt-0.5">{prevValue}</p>
        )}
      </div>
      <p className={`text-[12.5px] font-semibold text-right flex-shrink-0 max-w-[55%] ${changed ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text)]'}`}>
        {term.value}
        {!term.negotiable && (
          <span className="block text-[9.5px] font-normal text-[#35446A] mt-0.5">Fixed term</span>
        )}
      </p>
    </div>
  );
}

// --- History sidebar ----------------------------------------------------------

function ProposalHistory({
  proposals, activeIdx, onSelect,
}: { proposals: Proposal[]; activeIdx: number; onSelect: (i: number) => void }) {
  return (
    <div className="space-y-2">
      {proposals.map((p, idx) => {
        const cfg = STATUS_CFG[p.status];
        const isCurrent = idx === proposals.length - 1;
        const isActive = idx === activeIdx;
        return (
          <button key={p.version} onClick={() => onSelect(idx)}
            className="w-full text-left rounded-[10px] border p-3 transition-all"
            style={isActive ? {
              background: 'rgba(198,122,78,0.06)',
              borderColor: 'rgba(198,122,78,0.22)',
            } : {
              background: 'rgba(26,28,29,0.7)',
              borderColor: '#24304A',
            }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[color:var(--vv-text)]">#{p.version}</span>
                {isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: 'rgba(198,122,78,0.12)', color: '#C67A4E' }}>
                    CURRENT
                  </span>
                )}
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{p.label}</p>
            <p className="text-[10px] text-[#35446A] mt-1">{p.by} - {p.date}</p>
          </button>
        );
      })}
    </div>
  );
}

// --- Comments panel -----------------------------------------------------------

function CommentsPanel({
  comments, viewRole, onSend,
}: { comments: Comment[]; viewRole: ViewRole; onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  const myInitials = viewRole === 'professional' ? 'TH' : 'NH';

  return (
    <div>
      <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-3">Discussion</p>
      <div className="space-y-3 mb-3">
        {comments.map(c => {
          const isMe = c.role === viewRole;
          return (
            <div key={c.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              {roleAvatar(c.role, c.author, c.role === 'founder' ? 'NH' : 'TH')}
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className="px-3.5 py-2.5 rounded-[12px] rounded-tl-[4px]"
                  style={isMe ? {
                    background: 'rgba(198,122,78,0.09)',
                    border: '1px solid rgba(198,122,78,0.16)',
                  } : {
                    background: 'rgba(33,35,36,0.8)',
                    border: '1px solid #24304A',
                  }}>
                  <p className="text-[12px] text-[color:var(--vv-text)] leading-relaxed">{c.text}</p>
                </div>
                <p className="text-[9.5px] text-[#35446A] px-1">{c.author} - {c.ts}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input type="text" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Add a note..."
          className="flex-1 px-3.5 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none focus:border-[#C67A4E]/50" />
        <Button size="sm" variant="secondary" onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}

// --- Accepted view ------------------------------------------------------------

function AcceptedView({ proposal, onContinue }: { proposal: Proposal; onContinue: () => void }) {
  return (
    <div className="rounded-[16px] border p-6 text-center"
      style={{ background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.2)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
        <svg width="26" height="26" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Terms Accepted</p>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">Both parties have agreed to the following terms.</p>
      <div className="text-left rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden mb-5" style={{ background: 'rgba(26,28,29,0.8)' }}>
        {proposal.terms.map(term => (
          <div key={term.key} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E2C44] last:border-b-0">
            <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
            </svg>
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] flex-shrink-0 w-36">{term.label}</span>
            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{term.value}</span>
          </div>
        ))}
      </div>
      <Button onClick={onContinue}>Continue to Agreement ?</Button>
    </div>
  );
}

// --- Declined view ------------------------------------------------------------

function DeclinedBanner({ by }: { by: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-[12px] mb-4"
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <svg width="15" height="15" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
      </svg>
      <div>
        <p className="text-[12.5px] font-semibold text-[#EF4444]">Proposal Declined</p>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{by} declined the current proposal. Previous proposals remain in history.</p>
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function NegotiationPanel() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/app/deal-room';

  const viewRole: ViewRole = role === 'founder' ? 'founder' : 'professional';
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [activeIdx, setActiveIdx] = useState(proposals.length - 1);
  const [showCounter, setShowCounter] = useState(false);
  const [negStatus, setNegStatus] = useState<NegStatus>('proposed');
  const [mobileTab, setMobileTab] = useState<'proposal' | 'history' | 'discussion'>('proposal');

  const current = proposals[proposals.length - 1];
  const viewing = proposals[activeIdx];
  const isCurrentView = activeIdx === proposals.length - 1;
  const prevProposal = proposals[activeIdx - 1];

  const canAct = negStatus !== 'accepted' && negStatus !== 'declined' && negStatus !== 'expired';
  // The actor alternates: last proposal was by founder ? professional can act, and vice versa
  const lastByRole = current.byRole;
  const myTurn = lastByRole !== viewRole;

  function handleAccept() {
    setNegStatus('accepted');
    setProposals(prev => prev.map((p, i) => i === prev.length - 1 ? { ...p, status: 'accepted' } : p));
  }

  function handleDecline() {
    setNegStatus('declined');
    setProposals(prev => prev.map((p, i) => i === prev.length - 1 ? { ...p, status: 'declined' } : p));
  }

  function handleCounter(overrides: Record<string, string>, note: string) {
    const newTerms = current.terms.map(t => ({ ...t, value: overrides[t.key] ?? t.value }));
    const myName = viewRole === 'professional' ? CONTEXT.professional : CONTEXT.business;
    const newProposal: Proposal = {
      version: proposals.length + 1,
      label: 'Counter Offer',
      by: myName,
      byRole: viewRole,
      date: 'Aug 26, 2026',
      time: 'Just now',
      status: 'countered',
      terms: newTerms,
      note: note || undefined,
    };
    const updated = [...proposals.map(p => ({ ...p, status: 'proposed' as NegStatus })), newProposal];
    setProposals(updated);
    setActiveIdx(updated.length - 1);
    setNegStatus('countered');
    setShowCounter(false);
  }

  function handleCommentSend(text: string) {
    const myName = viewRole === 'professional' ? CONTEXT.professional : CONTEXT.business;
    setComments(prev => [...prev, {
      id: `c${Date.now()}`,
      author: myName,
      role: viewRole,
      text,
      ts: 'Just now',
    }]);
  }

  const roundNumber = proposals.length;

  if (role === 'investor') {
    return (
      <div className="p-6 max-w-[720px] mx-auto text-center">
        <p className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-2">Negotiation workspace unavailable</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">This negotiation is scoped to Founder and Professional workspaces.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/app/investor/dashboard')}>Back to workspace</Button>
      </div>
    );
  }

  // -- Layout ------------------------------------------------------------------
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">

      {showCounter && (
        <CounterModal
          current={current}
          viewRole={viewRole}
          onClose={() => setShowCounter(false)}
          onSubmit={handleCounter}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(returnTo)}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Deal Room
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Negotiation</span>
      </div>

      {/* Header card */}
      <div className="rounded-[16px] border border-[color:var(--vv-border)] p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: 'rgba(26,28,29,0.85)' }}>
        <div className="flex items-center gap-4">
          {/* Business avatar */}
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-[13px] font-bold text-[#C67A4E] flex-shrink-0"
            style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.18)' }}>
            {CONTEXT.businessInitials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">{CONTEXT.business}</p>
              <span className="text-[#35446A] hidden sm:inline">-</span>
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)] hidden sm:block">{CONTEXT.professional}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{CONTEXT.type}</span>
              <span className="text-[#35446A]">-</span>
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Round {roundNumber}</span>
              <StatusBadge status={negStatus} />
            </div>
          </div>
        </div>

        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Viewing as <span className="font-medium text-[#C67A4E] capitalize">{viewRole}</span></span>
      </div>

      {/* Declined banner */}
      {negStatus === 'declined' && <DeclinedBanner by={viewRole === 'professional' ? CONTEXT.business : CONTEXT.professional} />}

      {/* Accepted view replaces main panel */}
      {negStatus === 'accepted' ? (
        <AcceptedView proposal={current} onContinue={() => navigate(returnTo)} />
      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* -- Left: Current proposal + actions -- */}
          <div className="space-y-4">

            {/* Mobile tab bar */}
            <div className="flex lg:hidden items-center gap-1 p-1 rounded-[10px] border border-[#1E2C44]"
              style={{ background: 'rgba(26,28,29,0.9)' }}>
              {([['proposal', 'Proposal'], ['history', 'History'], ['discussion', 'Discussion']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setMobileTab(tab)}
                  className="flex-1 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
                  style={mobileTab === tab ? {
                    background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)',
                  } : { color: '#5E6D8F' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Proposal panel */}
            <div className={`${mobileTab !== 'proposal' ? 'hidden lg:block' : ''}`}>
              <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
                {/* Proposal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2C44]">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)]">
                        Proposal #{viewing.version} - {viewing.label}
                      </p>
                      {!isCurrentView && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold text-[#C67A4E]"
                          style={{ background: 'rgba(198,122,78,0.1)', border: '1px solid rgba(198,122,78,0.2)' }}>
                          HISTORY
                        </span>
                      )}
                      {isCurrentView && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold text-[#C67A4E]"
                          style={{ background: 'rgba(198,122,78,0.1)', border: '1px solid rgba(198,122,78,0.2)' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                      Proposed by <span className="text-[color:var(--vv-text-secondary)]">{viewing.by}</span> - {viewing.date} at {viewing.time}
                    </p>
                  </div>
                  <StatusBadge status={viewing.status} />
                </div>

                {/* Terms */}
                <div className="px-5 py-1">
                  {viewing.terms.map(term => {
                    const prev = prevProposal?.terms.find(t => t.key === term.key)?.value;
                    return <TermRow key={term.key} term={term} prevValue={isCurrentView && activeIdx > 0 ? prev : undefined} />;
                  })}
                </div>

                {/* Note */}
                {viewing.note && (
                  <div className="mx-5 mb-4 mt-1 p-3.5 rounded-[10px] border border-[color:var(--vv-border)]"
                    style={{ background: 'rgba(33,35,36,0.5)' }}>
                    <p className="text-[10.5px] text-[#35446A] mb-1 font-semibold tracking-wide uppercase">Note from {viewing.by}</p>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed">{viewing.note}</p>
                  </div>
                )}
              </div>

              {/* Actions - only for current proposal when it's your turn */}
              {isCurrentView && canAct && (
                <div className="mt-3">
                  {myTurn ? (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleAccept}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mr-1.5 inline">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                        </svg>
                        Accept Terms
                      </Button>
                      <Button variant="secondary" onClick={() => setShowCounter(true)}>Counter Offer</Button>
                      <Button variant="ghost" onClick={handleDecline}>Decline</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px]"
                      style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.12)' }}>
                      <svg width="14" height="14" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                      </svg>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
                        Awaiting response from <span className="text-[#C67A4E]">{current.by}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile: History */}
            <div className={`lg:hidden ${mobileTab !== 'history' ? 'hidden' : ''}`}>
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-3">Proposal History</p>
              <ProposalHistory proposals={proposals} activeIdx={activeIdx} onSelect={setActiveIdx} />
            </div>

            {/* Mobile: Discussion */}
            <div className={`lg:hidden ${mobileTab !== 'discussion' ? 'hidden' : ''}`}>
              <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4" style={{ background: 'rgba(26,28,29,0.85)' }}>
                <CommentsPanel comments={comments} viewRole={viewRole} onSend={handleCommentSend} />
              </div>
            </div>
          </div>

          {/* -- Right: history + discussion (desktop) -- */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* History */}
            <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4" style={{ background: 'rgba(26,28,29,0.85)' }}>
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-3">Proposal History</p>
              <ProposalHistory proposals={proposals} activeIdx={activeIdx} onSelect={setActiveIdx} />
            </div>

            {/* Discussion */}
            <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4" style={{ background: 'rgba(26,28,29,0.85)' }}>
              <CommentsPanel comments={comments} viewRole={viewRole} onSend={handleCommentSend} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
