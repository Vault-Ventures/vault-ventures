import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../components/layout/AppShell';
import { api, DealTermProposalData, NegotiationData, ProposeTermsPayload } from '../../services/api';

// --- Types --------------------------------------------------------------------

type NegStatus = 'draft' | 'proposed' | 'countered' | 'accepted' | 'declined' | 'expired' | string;
type ViewRole = 'founder' | 'investor' | 'professional' | 'admin' | string;

interface Term {
  key: string;
  label: string;
  value: string;
  negotiable: boolean;
}

// --- Status config ------------------------------------------------------------

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Draft',     color: '#5E6D8F', bg: 'rgba(93,101,127,0.08)',  border: 'rgba(93,101,127,0.2)'  },
  proposed:  { label: 'Proposed',  color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)'  },
  countered: { label: 'Countered', color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
  accepted:  { label: 'Accepted',  color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)'   },
  declined:  { label: 'Declined',  color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)'   },
  expired:   { label: 'Expired',   color: '#5E6D8F', bg: 'rgba(36,48,74,0.4)',    border: 'rgba(36,48,74,0.8)'    },
};

// --- Helpers ------------------------------------------------------------------

function StatusBadge({ status }: { status: NegStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.proposed;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold tracking-wide capitalize"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label || status}
    </span>
  );
}

function roleAvatar(role: ViewRole, label?: string) {
  const isFdr = role === 'founder';
  const isInv = role === 'investor';
  const color = isFdr ? '#C67A4E' : isInv ? '#38BDF8' : '#A78BFA';
  const bg = isFdr ? 'rgba(198,122,78,0.1)' : isInv ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)';
  const border = isFdr ? 'rgba(198,122,78,0.22)' : isInv ? 'rgba(56,189,248,0.22)' : 'rgba(167,139,250,0.22)';
  const initials = isFdr ? 'FD' : isInv ? 'IN' : 'PR';

  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
      style={{ background: bg, border: `1px solid ${border}`, color }}>
      {initials}
    </div>
  );
}

function formatTerms(proposal: DealTermProposalData): Term[] {
  const terms: Term[] = [];

  if (proposal.investment_type === 'micro_profit_sharing') {
    terms.push({ key: 'type', label: 'Investment Model', value: 'Micro Investment (Profit & Loss Sharing)', negotiable: false });
    if (proposal.amount !== null && proposal.amount !== undefined) {
      terms.push({ key: 'amount', label: 'Investment Amount', value: `BDT ${Number(proposal.amount).toLocaleString('en-IN')}`, negotiable: true });
    }
    terms.push({ key: 'profit_sharing_percentage', label: 'Profit Sharing %', value: `${proposal.profit_sharing_percentage}%`, negotiable: true });
    if (proposal.loss_sharing_terms) {
      terms.push({ key: 'loss_sharing_terms', label: 'Loss Terms', value: proposal.loss_sharing_terms, negotiable: true });
    }
    if (proposal.proposed_terms) {
      terms.push({ key: 'proposed_terms', label: 'Proposed Terms', value: proposal.proposed_terms, negotiable: true });
    }
  } else if (proposal.investment_type === 'standard_equity') {
    terms.push({ key: 'type', label: 'Investment Model', value: 'Standard Equity Investment', negotiable: false });
    if (proposal.amount !== null && proposal.amount !== undefined) {
      terms.push({ key: 'amount', label: 'Investment Amount', value: `BDT ${Number(proposal.amount).toLocaleString('en-IN')}`, negotiable: true });
    }
    terms.push({ key: 'equity_percentage', label: 'Equity Stake %', value: `${proposal.equity_percentage}%`, negotiable: true });
    if (proposal.proposed_terms) {
      terms.push({ key: 'proposed_terms', label: 'Proposed Terms', value: proposal.proposed_terms, negotiable: true });
    }
  } else {
    terms.push({ key: 'type', label: 'Collaboration Model', value: 'Professional Collaboration', negotiable: false });
    if (proposal.amount !== null && proposal.amount !== undefined) {
      terms.push({ key: 'amount', label: 'Compensation', value: `BDT ${Number(proposal.amount).toLocaleString('en-IN')}`, negotiable: true });
    }
    if (proposal.equity_percentage !== null && proposal.equity_percentage !== undefined) {
      terms.push({ key: 'equity_percentage', label: 'Equity Advisory %', value: `${proposal.equity_percentage}%`, negotiable: true });
    }
    if (proposal.proposed_terms) {
      terms.push({ key: 'proposed_terms', label: 'Scope & Terms', value: proposal.proposed_terms, negotiable: true });
    }
  }

  return terms;
}

// --- Proposal Modal (for Initial Proposal or Counter-Offer) --------------------

interface ProposalModalProps {
  title: string;
  subtitle: string;
  defaultType: 'micro_profit_sharing' | 'standard_equity' | 'professional_collaboration';
  currentProposal?: DealTermProposalData;
  counterpartyRole?: string;
  onClose: () => void;
  onSubmit: (payload: ProposeTermsPayload) => Promise<void>;
  isCounter?: boolean;
}

function ProposalModal({
  title,
  subtitle,
  defaultType,
  currentProposal,
  counterpartyRole,
  onClose,
  onSubmit,
  isCounter = false,
}: ProposalModalProps) {
  const [investmentType, setInvestmentType] = useState<'micro_profit_sharing' | 'standard_equity' | 'professional_collaboration'>(
    (currentProposal?.investment_type as any) || defaultType
  );
  const [amount, setAmount] = useState<string>(currentProposal?.amount ? String(currentProposal.amount) : '');
  const [equity, setEquity] = useState<string>(currentProposal?.equity_percentage ? String(currentProposal.equity_percentage) : '');
  const [profitShare, setProfitShare] = useState<string>(currentProposal?.profit_sharing_percentage ? String(currentProposal.profit_sharing_percentage) : '');
  const [lossTerms, setLossTerms] = useState<string>(currentProposal?.loss_sharing_terms || '');
  const [proposedTerms, setProposedTerms] = useState<string>(currentProposal?.proposed_terms || '');
  const [note, setNote] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSend() {
    setValidationError(null);

    // Client validation aligned with backend rules
    if (investmentType === 'micro_profit_sharing') {
      const psNum = parseFloat(profitShare);
      if (isNaN(psNum) || psNum < 0.01 || psNum > 100) {
        setValidationError('Profit sharing percentage is required and must be between 0.01% and 100.00%.');
        return;
      }
    } else if (investmentType === 'standard_equity') {
      const eqNum = parseFloat(equity);
      if (isNaN(eqNum) || eqNum < 0.01 || eqNum > 100) {
        setValidationError('Equity percentage is required and must be between 0.01% and 100.00%.');
        return;
      }
    } else if (investmentType === 'professional_collaboration') {
      const amtNum = parseFloat(amount);
      const eqNum = parseFloat(equity);
      const hasAmt = !isNaN(amtNum) && amtNum > 0;
      const hasEq = !isNaN(eqNum) && eqNum > 0;
      const hasTerms = proposedTerms.trim().length > 0;
      if (!hasAmt && !hasEq && !hasTerms) {
        setValidationError('Professional collaboration proposal must include compensation amount, equity percentage, or terms description.');
        return;
      }
    }

    const payload: ProposeTermsPayload = {
      investment_type: investmentType,
      amount: amount.trim() !== '' ? parseFloat(amount) : null,
      equity_percentage: (investmentType !== 'micro_profit_sharing' && equity.trim() !== '') ? parseFloat(equity) : null,
      profit_sharing_percentage: (investmentType === 'micro_profit_sharing' && profitShare.trim() !== '') ? parseFloat(profitShare) : null,
      loss_sharing_terms: investmentType === 'micro_profit_sharing' ? (lossTerms.trim() || null) : null,
      proposed_terms: proposedTerms.trim() || null,
      note: note.trim() || null,
    };

    setSending(true);
    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit proposal.');
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="proposal-modal-title">
      <div className="w-full sm:max-w-[540px] rounded-t-[20px] sm:rounded-[18px] border border-[color:var(--vv-border)] overflow-hidden flex flex-col max-h-[90vh] bg-[#121A2B]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)] flex-shrink-0">
          <div>
            <p id="proposal-modal-title" className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">{title}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {validationError && (
            <div className="px-3.5 py-2.5 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[12px] text-[#EF4444]">
              {validationError}
            </div>
          )}

          {/* Investment Type Selector (disabled in counter offer to preserve agreement framework) */}
          {!isCounter && (
            <div>
              <label className="block text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">Investment / Collaboration Model</label>
              <select
                value={investmentType}
                onChange={e => setInvestmentType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50"
              >
                {counterpartyRole !== 'professional' && (
                  <>
                    <option value="micro_profit_sharing">Micro Investment (Profit & Loss Sharing)</option>
                    <option value="standard_equity">Standard Investment (Direct Equity)</option>
                  </>
                )}
                {counterpartyRole === 'professional' && (
                  <option value="professional_collaboration">Professional Collaboration (Advisory / Services)</option>
                )}
              </select>
            </div>
          )}

          {/* Amount (BDT) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)]">
                {investmentType === 'professional_collaboration' ? 'Compensation Amount (BDT, optional)' : 'Investment Amount (BDT, optional)'}
              </label>
              {isCounter && currentProposal?.amount !== null && (
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                  Previous: <span className="text-[color:var(--vv-text-secondary)]">BDT {Number(currentProposal?.amount).toLocaleString()}</span>
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 500000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50"
            />
          </div>

          {/* Micro Profit Sharing Percentage */}
          {investmentType === 'micro_profit_sharing' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)]">Profit Sharing Percentage (%) *</label>
                {isCounter && currentProposal?.profit_sharing_percentage !== null && (
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                    Previous: <span className="text-[color:var(--vv-text-secondary)]">{currentProposal?.profit_sharing_percentage}%</span>
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 7.5"
                value={profitShare}
                onChange={e => setProfitShare(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50"
              />
            </div>
          )}

          {/* Loss Sharing Terms (Micro) */}
          {investmentType === 'micro_profit_sharing' && (
            <div>
              <label className="block text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">Loss Sharing Terms (optional)</label>
              <input
                type="text"
                placeholder="e.g. Pro-rata capital loss absorption"
                value={lossTerms}
                onChange={e => setLossTerms(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50"
              />
            </div>
          )}

          {/* Equity Percentage (Standard / Professional) */}
          {investmentType !== 'micro_profit_sharing' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)]">
                  {investmentType === 'standard_equity' ? 'Equity Percentage (%) *' : 'Advisory Equity Percentage (%, optional)'}
                </label>
                {isCounter && currentProposal?.equity_percentage !== null && (
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                    Previous: <span className="text-[color:var(--vv-text-secondary)]">{currentProposal?.equity_percentage}%</span>
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.05"
                placeholder="e.g. 10.0"
                value={equity}
                onChange={e => setEquity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none transition-colors focus:border-[#C67A4E]/50"
              />
            </div>
          )}

          {/* Proposed Terms / Milestone Expectations */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">
              {investmentType === 'professional_collaboration' ? 'Scope & Collaboration Terms' : 'Proposed Terms / Milestone Tranches'}
            </label>
            <textarea
              rows={3}
              value={proposedTerms}
              onChange={e => setProposedTerms(e.target.value)}
              placeholder="Describe funding tranches, milestone expectations, or deliverable scope..."
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">Note to Counterparty (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add context or rationale for these terms..."
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[color:var(--vv-border)] flex-shrink-0">
          <Button className="flex-1" onClick={handleSend} disabled={sending}>
            {sending ? 'Submitting...' : isCounter ? 'Send Counter Offer' : 'Submit Proposal'}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Term row -----------------------------------------------------------------

function TermRow({ term, prevValue }: { term: Term; prevValue?: string }) {
  const changed = prevValue !== undefined && prevValue !== term.value;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[color:var(--vv-border)] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{term.label}</p>
        {changed && prevValue && (
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] line-through mt-0.5">{prevValue}</p>
        )}
      </div>
      <p className={`text-[12.5px] font-semibold text-right flex-shrink-0 max-w-[55%] ${changed ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text)]'}`}>
        {term.value}
        {!term.negotiable && (
          <span className="block text-[9.5px] font-normal text-[color:var(--vv-text-tertiary)] mt-0.5">Fixed term</span>
        )}
      </p>
    </div>
  );
}

// --- History sidebar ----------------------------------------------------------

function ProposalHistory({
  proposals, activeIdx, onSelect,
}: { proposals: DealTermProposalData[]; activeIdx: number; onSelect: (i: number) => void }) {
  if (!proposals || proposals.length === 0) {
    return <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">No proposals submitted yet.</p>;
  }

  return (
    <div className="space-y-2">
      {proposals.map((p, idx) => {
        const isCurrent = idx === proposals.length - 1;
        const isActive = idx === activeIdx;
        const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        return (
          <button key={p.id || p.version} onClick={() => onSelect(idx)}
            className={`w-full text-left rounded-[10px] border p-3 transition-all ${
              isActive
                ? 'bg-[color:rgba(198,122,78,0.1)] border-[#C67A4E]/30'
                : 'bg-[#121A2B] border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[color:var(--vv-text)]">v{p.version}</span>
                {isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-[#C67A4E] bg-[#C67A4E]/10 border border-[#C67A4E]/20">
                    LATEST
                  </span>
                )}
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] capitalize">{p.investment_type.replace(/_/g, ' ')}</p>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1 capitalize">By {p.proposed_by_role} {dateStr ? `• ${dateStr}` : ''}</p>
          </button>
        );
      })}
    </div>
  );
}

// --- Notes / Timeline panel ---------------------------------------------------

function TimelineNotesPanel({ proposals }: { proposals: DealTermProposalData[] }) {
  const notes = proposals.filter(p => p.note && p.note.trim() !== '');

  return (
    <div>
      <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-3">Proposal Notes</p>
      {notes.length === 0 ? (
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">No notes attached to proposals in this negotiation.</p>
      ) : (
        <div className="space-y-3 mb-3">
          {notes.map(p => {
            const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div key={p.id} className="flex gap-2.5 items-start">
                {roleAvatar(p.proposed_by_role)}
                <div className="max-w-[85%] flex flex-col gap-0.5">
                  <div className="px-3.5 py-2.5 rounded-[12px] rounded-tl-[4px] border bg-[#121A2B] border-[color:var(--vv-border)]">
                    <p className="text-[10.5px] font-semibold text-[#C67A4E] uppercase tracking-wider mb-1">v{p.version} Note</p>
                    <p className="text-[12px] text-[color:var(--vv-text)] leading-relaxed">{p.note}</p>
                  </div>
                  <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)] px-1 capitalize">{p.proposed_by_role} {dateStr ? `• ${dateStr}` : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Accepted view ------------------------------------------------------------

function AcceptedView({ proposal, onContinue }: { proposal: DealTermProposalData; onContinue: () => void }) {
  const terms = formatTerms(proposal);

  return (
    <div className="rounded-[16px] border p-6 text-center bg-[#121A2B]"
      style={{ borderColor: 'rgba(34,197,94,0.22)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
        <svg width="26" height="26" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Negotiation Terms Accepted</p>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
        Both parties have accepted proposal v{proposal.version}. These terms anchor the binding deal agreement.
      </p>
      <div className="text-left rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden mb-5 bg-[#121A2B]">
        {terms.map(term => (
          <div key={term.key} className="flex items-center gap-3 px-4 py-2.5 border-b border-[color:var(--vv-border)] last:border-b-0">
            <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
            </svg>
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] flex-shrink-0 w-36">{term.label}</span>
            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{term.value}</span>
          </div>
        ))}
      </div>
      <Button onClick={onContinue}>Return to Deal Room</Button>
    </div>
  );
}

// --- Declined view ------------------------------------------------------------

function DeclinedBanner({ onNewProposal }: { onNewProposal?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5 rounded-[12px] mb-4 bg-[#121A2B]"
      style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
      <div className="flex items-start gap-3">
        <svg width="15" height="15" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
        </svg>
        <div>
          <p className="text-[12.5px] font-semibold text-[#EF4444]">Proposal Declined</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">The last proposal was declined. A revised proposal can be submitted to continue discussions.</p>
        </div>
      </div>
      {onNewProposal && (
        <Button size="sm" variant="secondary" onClick={onNewProposal}>New Proposal</Button>
      )}
    </div>
  );
}

// --- Main Component -----------------------------------------------------------

export default function NegotiationPanel() {
  const navigate = useNavigate();
  const { id: dealId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || (dealId ? `/app/deal-room/${dealId}` : '/app/deal-room');

  const { user, isAdmin } = useAuth();
  const { role } = useRole();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const [showCounterModal, setShowCounterModal] = useState<boolean>(false);
  const [showInitialModal, setShowInitialModal] = useState<boolean>(false);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'proposal' | 'history' | 'discussion'>('proposal');

  const fetchNegotiation = useCallback(async () => {
    if (!dealId) {
      setError('No Deal ID specified.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;

      const [dealData, negData] = await Promise.all([
        api.deals.get(dealId, roleParam),
        api.deals.getNegotiation(dealId, roleParam),
      ]);

      setDeal(dealData);
      setNegotiation(negData);
      if (negData.proposals && negData.proposals.length > 0) {
        setActiveIdx(negData.proposals.length - 1);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load negotiation details.');
    } finally {
      setLoading(false);
    }
  }, [dealId, role]);

  useEffect(() => {
    fetchNegotiation();
  }, [fetchNegotiation]);

  const proposals = negotiation?.proposals || [];
  const current = negotiation?.active_proposal || (proposals.length > 0 ? proposals[proposals.length - 1] : null);
  const viewing = proposals[activeIdx] || current;
  const isCurrentView = viewing && current ? viewing.id === current.id : false;
  const prevProposal = activeIdx > 0 ? proposals[activeIdx - 1] : undefined;

  const isProposer = Boolean(current && user && current.proposed_by_user_id === user.id);
  const canAct = Boolean(current && current.status === 'proposed' && !isProposer && !isAdmin);

  async function handleAccept() {
    if (!current || !dealId) return;
    try {
      setSubmittingAction(true);
      setActionError(null);
      await api.deals.respondNegotiation(dealId, current.id, {
        action: 'accept',
        role: role === 'investor' || role === 'professional' ? role : undefined,
      });
      await fetchNegotiation();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to accept terms.');
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleDecline() {
    if (!current || !dealId) return;
    try {
      setSubmittingAction(true);
      setActionError(null);
      await api.deals.respondNegotiation(dealId, current.id, {
        action: 'decline',
        role: role === 'investor' || role === 'professional' ? role : undefined,
      });
      await fetchNegotiation();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to decline proposal.');
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleCounterSubmit(payload: ProposeTermsPayload) {
    if (!current || !dealId) return;
    setActionError(null);
    await api.deals.respondNegotiation(dealId, current.id, {
      action: 'counter',
      counter_terms: payload,
      role: role === 'investor' || role === 'professional' ? role : undefined,
    });
    setShowCounterModal(false);
    await fetchNegotiation();
  }

  async function handleInitialSubmit(payload: ProposeTermsPayload) {
    if (!dealId) return;
    setActionError(null);
    await api.deals.proposeNegotiation(dealId, {
      ...payload,
      role: role === 'investor' || role === 'professional' ? role : undefined,
    });
    setShowInitialModal(false);
    await fetchNegotiation();
  }

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading negotiation workspace...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-10 text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1">Negotiation Unavailable</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">{error || 'Could not load deal negotiation.'}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(returnTo)}>Back to Deal Room</Button>
          <Button onClick={fetchNegotiation}>Retry</Button>
        </div>
      </div>
    );
  }

  const defaultInvestmentType = deal.counterparty_role === 'professional'
    ? 'professional_collaboration'
    : 'micro_profit_sharing';

  const viewingTerms = viewing ? formatTerms(viewing) : [];
  const prevTerms = prevProposal ? formatTerms(prevProposal) : [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">

      {/* Counter Offer Modal */}
      {showCounterModal && current && (
        <ProposalModal
          title={`Counter Offer — Proposal v${current.version}`}
          subtitle="Submit revised financial or collaboration terms"
          defaultType={current.investment_type as any}
          currentProposal={current}
          counterpartyRole={deal.counterparty_role}
          onClose={() => setShowCounterModal(false)}
          onSubmit={handleCounterSubmit}
          isCounter={true}
        />
      )}

      {/* Initial Proposal Modal */}
      {showInitialModal && (
        <ProposalModal
          title="Submit Initial Term Proposal"
          subtitle="Define proposed investment or advisory collaboration terms"
          defaultType={defaultInvestmentType}
          counterpartyRole={deal.counterparty_role}
          onClose={() => setShowInitialModal(false)}
          onSubmit={handleInitialSubmit}
          isCounter={false}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(returnTo)}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Deal Room #{deal.id}
        </button>
        <span className="text-[color:var(--vv-text-tertiary)]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Negotiation</span>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[12.5px] text-[#EF4444] flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#EF4444] hover:underline text-[11.5px] ml-3">Dismiss</button>
        </div>
      )}

      {/* Header card */}
      <div className="rounded-[16px] border border-[color:var(--vv-border)] p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#121A2B]">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-[13px] font-bold text-[#C67A4E] flex-shrink-0"
            style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.18)' }}>
            D#{deal.id}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">Deal Room #{deal.id}</p>
              <span className="text-[color:var(--vv-text-tertiary)] hidden sm:inline">•</span>
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)] capitalize">{deal.stage_label || deal.stage}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)] capitalize">
                Counterparty: {deal.counterparty_role}
              </span>
              <span className="text-[color:var(--vv-text-tertiary)]">•</span>
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{proposals.length} Proposal{proposals.length === 1 ? '' : 's'}</span>
              {current && <StatusBadge status={current.status} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
            Viewing as <span className="font-medium text-[#C67A4E] capitalize">{role}</span>
          </span>
          <Button size="sm" variant="secondary" onClick={fetchNegotiation}>Refresh</Button>
        </div>
      </div>

      {/* Declined Banner */}
      {current?.status === 'declined' && (
        <DeclinedBanner onNewProposal={!isAdmin ? () => setShowInitialModal(true) : undefined} />
      )}

      {/* Accepted View Replaces Main Panel if accepted */}
      {current?.status === 'accepted' ? (
        <AcceptedView proposal={current} onContinue={() => navigate(returnTo)} />
      ) : proposals.length === 0 ? (
        /* Empty Negotiation State */
        <div className="rounded-[16px] border border-[color:var(--vv-border)] p-8 text-center bg-[#121A2B]">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#C67A4E]/10 border border-[#C67A4E]/20 text-[#C67A4E]">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1">No Proposals Submitted</p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            Negotiate deal terms, equity percentages, profit sharing, and milestone deliverables inside this tracked workspace.
          </p>
          {!isAdmin ? (
            <Button onClick={() => setShowInitialModal(true)}>Propose Initial Terms</Button>
          ) : (
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Admin oversight: proposals can be created by deal participants.</p>
          )}
        </div>
      ) : (
        /* Negotiation Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Left Column: Active Proposal & Actions */}
          <div className="space-y-4">

            {/* Mobile tab bar */}
            <div className="flex lg:hidden items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B]">
              {([['proposal', 'Proposal'], ['history', 'History'], ['discussion', 'Notes']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setMobileTab(tab)}
                  className="flex-1 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
                  style={mobileTab === tab ? {
                    background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)',
                  } : { color: 'var(--vv-text-tertiary)' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Proposal Panel */}
            <div className={`${mobileTab !== 'proposal' ? 'hidden lg:block' : ''}`}>
              {viewing && (
                <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
                  {/* Proposal header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)]">
                          Proposal v{viewing.version} — <span className="capitalize">{viewing.investment_type.replace(/_/g, ' ')}</span>
                        </p>
                        {!isCurrentView ? (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold text-[#C67A4E]"
                            style={{ background: 'rgba(198,122,78,0.1)', border: '1px solid rgba(198,122,78,0.2)' }}>
                            HISTORY
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold text-[#C67A4E]"
                            style={{ background: 'rgba(198,122,78,0.1)', border: '1px solid rgba(198,122,78,0.2)' }}>
                            LATEST
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5 capitalize">
                        Proposed by <span className="text-[color:var(--vv-text-secondary)] font-medium">{viewing.proposed_by_role}</span>
                        {viewing.created_at && ` • ${new Date(viewing.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <StatusBadge status={viewing.status} />
                  </div>

                  {/* Terms */}
                  <div className="px-5 py-1">
                    {viewingTerms.map(term => {
                      const prev = prevTerms.find(t => t.key === term.key)?.value;
                      return <TermRow key={term.key} term={term} prevValue={isCurrentView && activeIdx > 0 ? prev : undefined} />;
                    })}
                  </div>

                  {/* Note */}
                  {viewing.note && (
                    <div className="mx-5 mb-4 mt-2 p-3.5 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 font-semibold tracking-wide uppercase">Note from {viewing.proposed_by_role}</p>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed">{viewing.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for latest proposal */}
              {isCurrentView && current?.status === 'proposed' && (
                <div className="mt-3">
                  {canAct ? (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleAccept} disabled={submittingAction}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mr-1.5 inline">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                        </svg>
                        {submittingAction ? 'Processing...' : 'Accept Terms'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowCounterModal(true)} disabled={submittingAction}>
                        Counter Offer
                      </Button>
                      <Button variant="ghost" onClick={handleDecline} disabled={submittingAction} className="text-[#EF4444] hover:text-[#EF4444]/90">
                        Decline
                      </Button>
                    </div>
                  ) : isProposer ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px]"
                      style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.12)' }}>
                      <svg width="14" height="14" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                      </svg>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
                        Your proposal v{current.version} has been submitted. Awaiting response from counterparty.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Mobile: History */}
            <div className={`lg:hidden ${mobileTab !== 'history' ? 'hidden' : ''}`}>
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-3">Proposal History</p>
              <ProposalHistory proposals={proposals} activeIdx={activeIdx} onSelect={setActiveIdx} />
            </div>

            {/* Mobile: Notes */}
            <div className={`lg:hidden ${mobileTab !== 'discussion' ? 'hidden' : ''}`}>
              <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
                <TimelineNotesPanel proposals={proposals} />
              </div>
            </div>
          </div>

          {/* Right Column: History & Notes (Desktop) */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* History */}
            <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Proposal History</p>
                {!isAdmin && (current?.status === 'countered' || current?.status === 'declined') && (
                  <button
                    onClick={() => setShowInitialModal(true)}
                    className="text-[11px] text-[#C67A4E] hover:underline"
                  >
                    + New
                  </button>
                )}
              </div>
              <ProposalHistory proposals={proposals} activeIdx={activeIdx} onSelect={setActiveIdx} />
            </div>

            {/* Notes */}
            <div className="rounded-[14px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
              <TimelineNotesPanel proposals={proposals} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
