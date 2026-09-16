import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { StagedDisclosure } from '../../components/ui/StagedDisclosure';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../utils/permissions';
import {
  api,
  ApiError,
  type BusinessNdaData,
  type NegotiationData,
  type DealAgreementData,
  type DealMilestoneData,
  type FundingSummaryData,
} from '../../services/api';
import {
  IconCheck, IconLock, IconFileText, IconMessageSquare, IconAlertTriangle, IconShield, IconChevronDown, IconChevronLeft
} from '../../components/layout/Icons';

// --- Constants ----------------------------------------------------------------

const STAGES = ['Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed', 'Negotiation', 'Agreement', 'Milestone Funding Active', 'Completed'];

export interface DealData {
  id: number;
  connection_id: number;
  business_id: number;
  founder_user_id: number;
  counterparty_user_id: number;
  counterparty_role: string;
  stage: string;
  stage_label: string;
  stage_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DealHistoryItem {
  id: number;
  deal_id: number;
  previous_state: string | null;
  previous_state_label: string | null;
  new_state: string;
  new_state_label: string;
  changed_by_user_id: number;
  changed_at: string;
  created_at: string;
}

export interface BusinessInfo {
  id: number;
  name: string;
  industry?: string;
  location?: string;
  funding_amount?: number;
}

type DocAccess = 'available' | 'nda_required' | 'locked' | 'pending' | 'finalized';

interface Doc {
  name: string;
  stage: number;
  access: DocAccess;
  type: string;
  size: string;
  date: string;
}

const DOCS: Doc[] = [
  { name: 'Executive Summary',       stage: 1, access: 'available',     type: 'PDF',  size: '2.4 MB', date: 'Mar 14' },
  { name: 'Pitch Deck v3',           stage: 1, access: 'available',     type: 'PDF',  size: '8.1 MB', date: 'Mar 14' },
  { name: 'Business Model Canvas',   stage: 2, access: 'available',     type: 'PDF',  size: '1.1 MB', date: 'Mar 18' },
  { name: 'Market Research Report',  stage: 2, access: 'available',     type: 'PDF',  size: '4.7 MB', date: 'Mar 18' },
  { name: 'Audited Financials FY2023', stage: 3, access: 'available',   type: 'XLSX', size: '512 KB', date: 'Mar 21' },
  { name: 'Cap Table (Full)',         stage: 3, access: 'available',     type: 'XLSX', size: '280 KB', date: 'Mar 21' },
  { name: 'Full Data Room',           stage: 3, access: 'available',     type: 'ZIP',  size: '142 MB', date: 'Mar 21' },
  { name: 'Term Sheet Draft',         stage: 4, access: 'pending',       type: 'PDF',  size: '-',      date: '-' },
  { name: 'Shareholders Agreement',   stage: 4, access: 'pending',       type: 'PDF',  size: '-',      date: '-' },
];

const ACCESS_CFG: Record<DocAccess, { label: string; color: string; icon: string }> = {
  available:    { label: 'Available',     color: '#22C55E', icon: 'OK' },
  nda_required: { label: 'NDA Required',  color: '#A78BFA', icon: 'NDA' },
  locked:       { label: 'Restricted',    color: '#5E6D8F', icon: 'LOCK' },
  pending:      { label: 'Pending',       color: '#C67A4E', icon: 'WAIT' },
  finalized:    { label: 'Finalized',     color: '#C67A4E', icon: 'DONE' },
};

type ChatEntry = {
  kind: 'message';
  from: string;
  fromRole: 'founder' | 'investor';
  time: string;
  text: string;
} | {
  kind: 'event';
  text: string;
  time: string;
  dot: string;
};

const CHAT_ENTRIES: ChatEntry[] = [
  { kind: 'event',   text: 'Deal Room opened',                   time: 'Mar 17 - 09:00', dot: '#5E6D8F' },
  { kind: 'event',   text: 'NDA sent to both parties',           time: 'Mar 20 - 10:00', dot: '#3B82F6' },
  { kind: 'event',   text: 'NDA signed by NovaTech AI',          time: 'Mar 21 - 14:15', dot: '#22C55E' },
  { kind: 'event',   text: 'NDA signed by Meridian Capital',     time: 'Mar 21 - 15:42', dot: '#22C55E' },
  { kind: 'event',   text: 'Stage 3 documents unlocked',         time: 'Mar 21 - 15:42', dot: '#C67A4E' },
  { kind: 'message', from: 'Meridian Capital', fromRole: 'investor', time: '10:42',
    text: "We've reviewed the extended information and are very interested. The AI credit risk angle aligns well with our FinTech thesis." },
  { kind: 'message', from: 'NovaTech AI', fromRole: 'founder', time: '11:15',
    text: "Great to hear. Full data room is now accessible under Stage 3 documents - cap table and FY2023 financials are in there." },
  { kind: 'event',   text: 'Negotiation terms submitted - Version 1',  time: 'Mar 23 - 09:30', dot: '#A78BFA' },
  { kind: 'message', from: 'Meridian Capital', fromRole: 'investor', time: '14:03',
    text: 'One question on the CAC/LTV ratio breakdown - can you clarify how the 18-month LTV is projected?' },
];

type Tab = 'overview' | 'documents' | 'terms' | 'milestones' | 'investment' | 'chat' | 'agreement';
type InvestmentModel = 'large' | 'micro';

// --- Sub-components -----------------------------------------------------------

function ActivityLog({ histories }: { histories: DealHistoryItem[] }) {
  const getDotColor = (state: string) => {
    switch (state) {
      case 'completed':
      case 'nda_signed':
      case 'agreement':
        return '#22C55E';
      case 'negotiation':
      case 'milestone_funding_active':
        return '#C67A4E';
      case 'interest_confirmed':
        return '#3B82F6';
      default:
        return '#5E6D8F';
    }
  };

  return (
    <div className="px-5 py-5">
      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3.5">Activity Log</p>
      {histories.length === 0 ? (
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">No state transitions recorded yet.</p>
      ) : (
        <div className="space-y-3.5">
          {histories.map((e) => {
            const timeStr = e.changed_at
              ? new Date(e.changed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Recently';
            const label = e.previous_state_label
              ? `Transitioned: ${e.previous_state_label} → ${e.new_state_label}`
              : `Deal initialized in ${e.new_state_label}`;
            return (
              <div key={e.id} className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getDotColor(e.new_state) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">{label}</p>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono tabular-nums">{timeStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DealSummaryPanel({
  deal,
  business,
  dealStage,
  currentUserId,
}: {
  deal: DealData | null;
  business: BusinessInfo | null;
  dealStage: number;
  currentUserId?: number;
}) {
  const isFounder = deal && currentUserId === deal.founder_user_id;
  const isCounterparty = deal && currentUserId === deal.counterparty_user_id;

  const founderName = business?.name ? `${business.name} (Founder)` : 'Founder';
  const counterpartyRoleLabel = deal?.counterparty_role === 'investor' ? 'Investor' : 'Professional';
  const counterpartyName = isCounterparty ? `You (${counterpartyRoleLabel})` : `Counterparty (${counterpartyRoleLabel})`;

  const openedDate = deal?.created_at
    ? new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Participants</p>
        <div className="mb-4 pb-4 border-b border-[#1c2a3e]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11.5px] font-bold text-[color:var(--vv-text)] shrink-0">
              {business?.name?.[0] || 'F'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">{founderName}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Founder / Business Owner</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <VerificationBadge tier={1} />
          </div>
        </div>

        <div className="mb-4 pb-4 border-b border-[#1c2a3e] last:border-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11.5px] font-bold text-[color:var(--vv-text)] shrink-0">
              {counterpartyRoleLabel[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">{counterpartyName}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{counterpartyRoleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <VerificationBadge tier={1} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Deal Details</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] shrink-0">Opened</span>
            <span className="text-[12px] text-[color:var(--vv-text-secondary)]">{openedDate}</span>
          </div>
          {business?.funding_amount ? (
            <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] shrink-0">Ask</span>
              <span className="text-[12px] font-mono tabular-nums font-semibold text-[#C67A4E]">
                ৳{business.funding_amount.toLocaleString('en-IN')}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Status</span>
            <Badge variant={dealStage >= 8 ? 'success' : dealStage >= 6 ? 'accent' : 'warning'}>
              {deal?.stage_label || STAGES[dealStage - 1] || 'Active'}
            </Badge>
          </div>
          <p className="text-[10.5px] text-[#F59E0B] pt-1">✦ Simulated — no real capital transfer</p>
        </div>
      </div>

      <div className="pt-2">
        <StagedDisclosure currentStage={dealStage >= 4 ? 3 : 2} compact />
      </div>
    </div>
  );
}

// --- Document access badge ----------------------------------------------------

function AccessBadge({ access }: { access: DocAccess }) {
  const cfg = ACCESS_CFG[access];
  const variantMap: Record<DocAccess, 'success' | 'accent' | 'neutral' | 'warning' | 'info'> = {
    available: 'success', nda_required: 'info', locked: 'neutral', pending: 'warning', finalized: 'accent',
  };
  return <Badge variant={variantMap[access]}>{cfg.label}</Badge>;
}

// --- Locked document card -----------------------------------------------------

function LockedDocCard({ doc, onNDA }: { doc: Doc; onNDA: () => void }) {
  const isNDA = doc.access === 'nda_required';
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0 opacity-70">
      <IconLock s={14} className={isNDA ? 'text-[#A78BFA] shrink-0' : 'text-[color:var(--vv-text-tertiary)] shrink-0'} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[color:var(--vv-text-tertiary)] truncate">{doc.name}</p>
        <p className="text-[10.5px] text-[#35446A] font-mono mt-0.5">{doc.type}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <AccessBadge access={doc.access} />
        {isNDA && (
          <button onClick={onNDA} className="text-[10.5px] text-[#A78BFA] hover:underline whitespace-nowrap">
            Review NDA
          </button>
        )}
      </div>
    </div>
  );
}

// --- Completion view ----------------------------------------------------------

function CompletionView({
  businessName,
  milestones = [],
  onReputation,
  onSummary,
}: {
  businessName?: string;
  milestones?: DealMilestoneData[];
  onReputation: () => void;
  onSummary: () => void;
}) {
  const completedCount = milestones.filter((m) => m.status === 'funded').length;
  const milestonesValue = milestones.length > 0
    ? `${completedCount} of ${milestones.length} completed`
    : 'All milestones completed';

  return (
    <div className="max-w-3xl space-y-6">
      {/* Banner */}
      <div className="rounded-[14px] border p-6 text-center"
        style={{ background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.22)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <svg width="26" height="26" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Deal Completed</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-1">{businessName || 'Deal Completed'}</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">All milestones verified & executed</p>
      </div>

      {/* Summary */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Deal Summary</p>
        </div>
        {[
          { label: 'Final Status', value: 'Agreement Executed', highlight: true },
          { label: 'Milestones', value: milestonesValue, highlight: false },
          { label: 'Investment', value: 'Simulated', highlight: false },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E2C44] last:border-b-0">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
            <span className={`text-[12px] font-semibold ${row.highlight ? 'text-[#22C55E]' : 'text-[color:var(--vv-text-secondary)]'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Reputation prompt */}
      <div className="rounded-[12px] border p-4 flex items-start gap-3"
        style={{ background: 'rgba(198,122,78,0.04)', borderColor: 'rgba(198,122,78,0.16)' }}>
        <svg width="18" height="18" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-0.5">Leave Feedback</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">Share your experience to help build trust across the platform.</p>
          <Button size="sm" variant="secondary" onClick={onReputation}>Leave Feedback →</Button>
        </div>
      </div>

      <Button variant="ghost" className="w-full" onClick={onSummary}>View Full Activity Log</Button>
    </div>
  );
}

// --- Agreement tab ------------------------------------------------------------

interface AgreementTabProps {
  deal: DealData | null;
  business: BusinessInfo | null;
  currentUserId?: number;
  userRole?: string;
  dealStage: number;
  agreement: DealAgreementData | null;
  negotiation: NegotiationData | null;
  onGenerateAgreement: () => void;
  onSignAgreement: () => void;
  onActivateMilestones?: () => void;
  isGenerating: boolean;
  isSigning: boolean;
  isActivatingMilestones?: boolean;
  agreementError: string | null;
  milestoneActivationError?: string | null;
  onNavigateToNegotiation: () => void;
}

function AgreementTab({
  deal,
  business,
  currentUserId,
  userRole,
  dealStage,
  agreement,
  negotiation,
  onGenerateAgreement,
  onSignAgreement,
  onActivateMilestones,
  isGenerating,
  isSigning,
  isActivatingMilestones,
  agreementError,
  milestoneActivationError,
  onNavigateToNegotiation,
}: AgreementTabProps) {
  const isFounder = deal && currentUserId === deal.founder_user_id;
  const isCounterparty = deal && currentUserId === deal.counterparty_user_id;
  const isParticipant = Boolean(isFounder || isCounterparty);
  const isAdmin = userRole === 'admin';

  const isFinalized = agreement ? (agreement.status === 'accepted' && Boolean(agreement.finalized_at)) : false;
  const hasCurrentUserSigned = agreement
    ? (isFounder && Boolean(agreement.founder_signed_at)) || (isCounterparty && Boolean(agreement.counterparty_signed_at))
    : false;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Agreement Error Banner */}
      {agreementError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[10px]">
          <IconAlertTriangle s={15} className="shrink-0" />
          <span>{agreementError}</span>
        </div>
      )}

      {agreement ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">
              {agreement.title || 'Deal Agreement'}
            </p>
            <Badge
              variant={isFinalized ? 'success' : agreement.status === 'declined' ? 'danger' : 'warning'}
              dot
            >
              {isFinalized ? 'Finalized' : agreement.status === 'pending_signatures' ? 'Pending Signatures' : agreement.status}
            </Badge>
          </div>

          {/* Finalized Banner */}
          {isFinalized && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-[10px]"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-[12px] font-semibold text-[#22C55E]">Agreement Finalized & Immutable</p>
                {agreement.finalized_at && (
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Executed on {new Date(agreement.finalized_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Terms Snapshot */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Agreed Terms Snapshot</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                ✦ Simulated {agreement.terms_snapshot?.proposal_version ? `• Proposal v${agreement.terms_snapshot.proposal_version}` : ''}
              </p>
            </div>
            <div className="divide-y divide-[color:var(--vv-border)]">
              {agreement.terms_snapshot?.investment_type && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Investment Type</span>
                  <span className="text-[12px] font-semibold text-[color:var(--vv-text)] capitalize">
                    {agreement.terms_snapshot.investment_type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {agreement.terms_snapshot?.amount !== null && agreement.terms_snapshot?.amount !== undefined && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Investment Amount</span>
                  <span className="text-[12px] font-semibold text-[color:var(--vv-text)] font-mono">
                    BDT {Number(agreement.terms_snapshot.amount).toLocaleString('en-IN')} (Simulated)
                  </span>
                </div>
              )}
              {agreement.terms_snapshot?.equity_percentage !== null && agreement.terms_snapshot?.equity_percentage !== undefined && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Equity Stake</span>
                  <span className="text-[12px] font-semibold text-[#22C55E] font-mono">
                    {agreement.terms_snapshot.equity_percentage}%
                  </span>
                </div>
              )}
              {agreement.terms_snapshot?.profit_sharing_percentage !== null && agreement.terms_snapshot?.profit_sharing_percentage !== undefined && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Profit Sharing</span>
                  <span className="text-[12px] font-semibold text-[#C9A24B] font-mono">
                    {agreement.terms_snapshot.profit_sharing_percentage}%
                  </span>
                </div>
              )}
              {agreement.terms_snapshot?.loss_sharing_terms && (
                <div className="flex items-start justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Loss Sharing Terms</span>
                  <span className="text-[12px] text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                    {agreement.terms_snapshot.loss_sharing_terms}
                  </span>
                </div>
              )}
              {agreement.terms_snapshot?.proposed_terms && (
                <div className="flex items-start justify-between px-4 py-2.5">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Collaboration Terms</span>
                  <span className="text-[12px] text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                    {agreement.terms_snapshot.proposed_terms}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Agreement Document Text Preview */}
          {agreement.agreement_text && (
            <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
              <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Agreement Document</p>
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Platform Standard Terms</span>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)] font-mono text-[11.5px] leading-relaxed text-[color:var(--vv-text-secondary)] whitespace-pre-line select-text border-t border-[color:var(--vv-border)]/40">
                {agreement.agreement_text}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Participant Signatures</p>
            </div>
            <div className="divide-y divide-[color:var(--vv-border)]">
              {/* Founder */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] shrink-0">
                  {(business?.name || 'F')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[color:var(--vv-text)]">
                    {business?.name ? `${business.name} (Founder)` : 'Founder / Business Owner'}
                  </p>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Founder / Business Owner</p>
                </div>
                {agreement.founder_signed_at ? (
                  <Badge variant="success" dot>
                    Signed ({new Date(agreement.founder_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                  </Badge>
                ) : (
                  <Badge variant="warning" dot>Awaiting signature</Badge>
                )}
              </div>

              {/* Counterparty */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] shrink-0">
                  {deal?.counterparty_role === 'investor' ? 'I' : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[color:var(--vv-text)]">
                    {deal?.counterparty_role === 'investor' ? 'Investor' : 'Professional Partner'}
                  </p>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] capitalize">
                    Counterparty ({deal?.counterparty_role || 'Participant'})
                  </p>
                </div>
                {agreement.counterparty_signed_at ? (
                  <Badge variant="success" dot>
                    Signed ({new Date(agreement.counterparty_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                  </Badge>
                ) : (
                  <Badge variant="warning" dot>Awaiting signature</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Area */}
          {isFinalized ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[10px] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text-secondary)] text-center">
                This agreement is fully executed and immutable. Milestone funding stage is now accessible.
              </div>
              {deal?.stage === 'agreement' && onActivateMilestones && (
                isAdmin ? (
                  <div className="px-3.5 py-3 rounded-md border border-[color:var(--vv-border)] text-[11.5px] text-[color:var(--vv-text-tertiary)] text-center">
                    Admin oversight: milestone activation is disabled.
                  </div>
                ) : isParticipant ? (
                  <div className="space-y-2">
                    {milestoneActivationError && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[10px]">
                        <IconAlertTriangle s={15} className="shrink-0" />
                        <span>{milestoneActivationError}</span>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={isActivatingMilestones}
                      onClick={onActivateMilestones}
                    >
                      {isActivatingMilestones ? 'Activating Milestone Funding...' : 'Activate Milestone Funding Stage'}
                    </Button>
                  </div>
                ) : null
              )}
            </div>
          ) : agreement.status === 'pending_signatures' ? (
            isAdmin ? (
              <div className="px-3.5 py-3 rounded-md border border-[color:var(--vv-border)] text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                Admin oversight: participant signing actions are disabled.
              </div>
            ) : hasCurrentUserSigned ? (
              <div
                className="flex items-center gap-3 p-4 rounded-[10px] border"
                style={{ background: 'rgba(198,122,78,0.05)', borderColor: 'rgba(198,122,78,0.2)' }}
              >
                <IconCheck s={16} className="text-[#22C55E] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">You have signed this agreement</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Waiting for the counterparty to sign. The agreement will finalize automatically once both parties sign.
                  </p>
                </div>
              </div>
            ) : isParticipant ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  disabled={isSigning}
                  onClick={onSignAgreement}
                >
                  {isSigning ? 'Signing Agreement...' : 'Sign Agreement'}
                </Button>
              </div>
            ) : (
              <div className="px-3.5 py-3 rounded-md border border-[color:var(--vv-border)] text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                Signing is only available to the designated deal participants.
              </div>
            )
          ) : null}
        </>
      ) : (
        /* Null Agreement State */
        (() => {
          const hasAcceptedProposal =
            negotiation?.active_proposal?.status === 'accepted' ||
            negotiation?.proposals?.some((p) => p.status === 'accepted');

          if (hasAcceptedProposal) {
            return (
              <div className="rounded-[12px] border border-[color:var(--vv-border)] p-6 bg-[#121A2B] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] mx-auto">
                  <IconFileText s={22} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">Proposal Accepted — Agreement Ready to Draft</p>
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mt-1">
                    The negotiation terms have been agreed upon. Generate the deal agreement draft to begin the execution and signing process.
                  </p>
                </div>
                {isAdmin ? (
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">
                    Admin oversight: agreement draft generation is disabled.
                  </p>
                ) : isParticipant ? (
                  <Button disabled={isGenerating} onClick={onGenerateAgreement}>
                    {isGenerating ? 'Generating Draft...' : 'Generate Agreement Draft'}
                  </Button>
                ) : (
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">
                    Only deal participants can generate the agreement draft.
                  </p>
                )}
              </div>
            );
          }

          return (
            <div className="rounded-[12px] border border-[color:var(--vv-border)] p-6 bg-[#121A2B] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[color:var(--vv-text-tertiary)] mx-auto">
                <IconLock s={20} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">No Agreement Available</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mt-1">
                  An agreement draft can only be generated once negotiation terms have been proposed and accepted by both parties in the Negotiation Panel.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={onNavigateToNegotiation}>
                Go to Negotiation Panel
              </Button>
            </div>
          );
        })()
      )}
    </div>
  );
}

// --- Investment tab -----------------------------------------------------------

const MICRO_PL = [
  { period: 'Aug 2026', revenue: 480000, expenses: 310000 },
  { period: 'Jul 2026', revenue: 420000, expenses: 295000 },
  { period: 'Jun 2026', revenue: 375000, expenses: 280000 },
  { period: 'May 2026', revenue: 310000, expenses: 268000 },
];

function fmtBDT(n: number) {
  return 'BDT ' + n.toLocaleString('en-IN');
}

function InvestmentTab({ model }: { model: InvestmentModel }) {
  const [viewModel, setViewModel] = React.useState<InvestmentModel>(model);

  const microTerms = [
    { label: 'Investment Amount (Simulated)', value: 'BDT 12,00,000' },
    { label: 'Profit/Loss Share', value: '22% of Net P/L' },
    { label: 'Sharing Period', value: '18 months from deployment' },
    { label: 'Reporting Frequency', value: 'Monthly' },
    { label: 'Minimum Revenue Target', value: 'BDT 3,00,000/month' },
  ];
  const largeTerms = [
    { label: 'Investment Amount (Simulated)', value: 'BDT 52,50,000' },
    { label: 'Equity Stake', value: '11%' },
    { label: 'Pre-money Valuation', value: 'BDT 4,77,00,000 (Simulated)' },
    { label: 'Board Rights', value: 'Observer seat' },
    { label: 'Pro-rata Rights', value: 'Yes, for next round' },
    { label: 'Liquidation Preference', value: '1- non-participating' },
    { label: 'Lock-up Period', value: '24 months' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Simulation boundary notice */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-[12px] font-medium"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span><strong>SIMULATION</strong> - All investment figures, equity terms, and P/L data shown here are simulated. No real capital transfers, equity settlement, or financial obligations exist on this platform.</span>
      </div>

      {/* Model toggle */}
      <div className="flex items-center gap-1 p-1 rounded-[10px] inline-flex bg-[#121A2B] border border-[color:var(--vv-border)]">
        {(['large', 'micro'] as InvestmentModel[]).map(m => (
          <button
            key={m}
            onClick={() => setViewModel(m)}
            className="px-4 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
            style={viewModel === m
              ? { background: 'rgba(198,122,78,0.2)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
              : { color: 'var(--vv-text-tertiary)' }}
          >
            {m === 'large' ? '? Standard - Equity/Ownership' : '? Micro - P/L Sharing'}
          </button>
        ))}
      </div>

      {/* Large / Equity model */}
      {viewModel === 'large' && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Equity / Ownership Terms</p>
              <Badge variant="warning">Simulated</Badge>
            </div>
            {largeTerms.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[color:var(--vv-border)] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{t.label}</span>
                <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{t.value}</span>
              </div>
            ))}
          </div>

          {/* Ownership visual */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Simulated Ownership Breakdown</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 rounded-l-full" style={{ width: '11%', background: '#C67A4E' }} title="Meridian Capital 11%" />
              <div className="h-3 rounded-r-full flex-1" style={{ background: 'color-mix(in srgb, var(--vv-raised) 90%, transparent)' }} title="Founders + Reserved 89%" />
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#C67A4E' }} /> <span className="text-[color:var(--vv-text-secondary)]">Meridian Capital - 11%</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'color-mix(in srgb, var(--vv-raised) 90%, transparent)' }} /> <span className="text-[color:var(--vv-text-secondary)]">Founders + Reserved - 89%</span></div>
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-2">? Simulated - no real equity settlement occurs on this platform.</p>
          </div>
        </div>
      )}

      {/* Micro / P/L Sharing model */}
      {viewModel === 'micro' && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Profit/Loss Sharing Terms</p>
              <Badge variant="warning">Simulated</Badge>
            </div>
            {microTerms.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[color:var(--vv-border)] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{t.label}</span>
                <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{t.value}</span>
              </div>
            ))}
          </div>

          {/* P/L table */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Simulated P/L Report</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Net P/L = Revenue - Expenses. Returns are not guaranteed.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['Period', 'Revenue', 'Expenses', 'Net P/L', 'Your Share (22%)'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MICRO_PL.map((row, i) => {
                    const net = row.revenue - row.expenses;
                    const share = Math.round(net * 0.22);
                    const isPos = net >= 0;
                    return (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                        <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{row.period}</td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#22C55E]">{fmtBDT(row.revenue)}</td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#C67A4E]">{fmtBDT(row.expenses)}</td>
                        <td className="px-4 py-2.5 font-mono text-[12px] font-bold" style={{ color: isPos ? '#22C55E' : '#EF4444' }}>
                          {isPos ? '+' : ''}{fmtBDT(net)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] font-semibold" style={{ color: isPos ? '#C9A24B' : '#5E6D8F' }}>
                          {isPos ? '+' : ''}{fmtBDT(share)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[color:var(--vv-border)]">
                    <td className="px-4 py-3 text-[11px] font-bold text-[color:var(--vv-text)]">Total (4 months)</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#22C55E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + r.revenue, 0))}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C67A4E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + r.expenses, 0))}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#22C55E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + (r.revenue - r.expenses), 0))}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C9A24B]">{fmtBDT(Math.round(MICRO_PL.reduce((a, r) => a + (r.revenue - r.expenses), 0) * 0.22))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
              <p className="text-[10px] text-[#35446A]">? Simulated figures. Past performance does not guarantee future results. No returns are guaranteed on this platform.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export function submitDealTransition(dealId: number, targetState: string | undefined, role: string) {
  const participantRole = role === 'investor' || role === 'professional' ? role : undefined;
  return api.post(`/api/me/deals/${dealId}/transition`, {
    ...(targetState ? { target_state: targetState } : {}),
    ...(participantRole ? { role: participantRole } : {}),
  });
}

export default function DealRoom() {
  const navigate = useNavigate();
  const { dealId } = useParams<{ dealId?: string }>();
  const { user } = useAuth();
  const { role } = useRole();
  const isAdmin = role === 'admin';
  const canFounderAct = canAccess(role, 'deal.founderActions');
  const canInvestorAct = canAccess(role, 'deal.investorActions');
  const canParticipantAct = canFounderAct || canInvestorAct;

  const [deal, setDeal] = useState<DealData | null>(null);
  const [histories, setHistories] = useState<DealHistoryItem[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [ndaStatus, setNdaStatus] = useState<BusinessNdaData | null>(null);
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [agreement, setAgreement] = useState<DealAgreementData | null>(null);
  const [milestones, setMilestones] = useState<DealMilestoneData[]>([]);
  const [fundingSummary, setFundingSummary] = useState<FundingSummaryData | null>(null);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState<string | null>(null);
  const [isActivatingMilestones, setIsActivatingMilestones] = useState(false);
  const [milestoneActivationError, setMilestoneActivationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isGeneratingAgreement, setIsGeneratingAgreement] = useState(false);
  const [isSigningAgreement, setIsSigningAgreement] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [isCompletingDeal, setIsCompletingDeal] = useState(false);
  const [dealCompletionError, setDealCompletionError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('overview');
  const [msg, setMsg] = useState('');
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>(CHAT_ENTRIES);
  const [activityOpen, setActivityOpen] = useState(false);
  const [investmentModel] = useState<InvestmentModel>('large');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingTab = useRef(false);
  const dragStartX = useRef(0);
  const scrollLeftStart = useRef(0);

  const dealStage = deal ? deal.stage_order : 1;

  const isDealCompletionEligible =
    deal?.stage === 'milestone_funding_active' &&
    Boolean(agreement?.finalized_at) &&
    milestones.length > 0 &&
    milestones.every((m) => m.status === 'funded') &&
    (fundingSummary
      ? fundingSummary.total_committed_bdt === 0 ||
        fundingSummary.total_released_bdt === fundingSummary.total_committed_bdt
      : true);

  const activeMilestone = milestones.find((m) => m.status === 'active' || m.status === 'submitted');
  const pendingMilestones = milestones.filter((m) => m.status === 'pending');
  const currentMilestone = activeMilestone || pendingMilestones[0] || milestones[milestones.length - 1] || null;
  const currentMilestoneIndex = currentMilestone ? milestones.findIndex((m) => m.id === currentMilestone.id) : -1;
  const nextMilestone = currentMilestoneIndex >= 0 && currentMilestoneIndex < milestones.length - 1 ? milestones[currentMilestoneIndex + 1] : null;

  const fetchDealData = useCallback(async () => {
    if (!dealId) {
      setError('No Deal ID provided in route. Please open a Deal from Connections.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      const dealData = await api.deals.get(dealId, roleParam);
      setDeal(dealData);

      try {
        const historyData = await api.get<DealHistoryItem[]>(`/api/me/deals/${dealId}/history`, { params: roleParam ? { role: roleParam } : undefined });
        setHistories(Array.isArray(historyData) ? historyData : []);
      } catch {
        setHistories([]);
      }

      if (dealData.id) {
        const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
        try {
          const neg = await api.deals.getNegotiation(dealData.id, roleParam);
          setNegotiation(neg);
        } catch {
          setNegotiation(null);
        }

        try {
          const agr = await api.deals.getAgreement(dealData.id, roleParam);
          setAgreement(agr);
        } catch {
          setAgreement(null);
        }

        try {
          setMilestonesLoading(true);
          const milestonesRes = await api.deals.milestones.list(dealData.id, roleParam);
          setMilestones(milestonesRes.milestones || []);
          setFundingSummary(milestonesRes.summary || null);
          setMilestonesError(null);
        } catch (mErr: any) {
          setMilestones([]);
          setFundingSummary(null);
          setMilestonesError(mErr?.message || 'Failed to load milestones for this deal.');
        } finally {
          setMilestonesLoading(false);
        }
      }

      if (dealData.business_id) {
        try {
          const bus = await api.get<BusinessInfo>(`/api/businesses/${dealData.business_id}`);
          setBusiness(bus);
        } catch {
          // Non-blocking business metadata load
        }

        try {
          const isFounderCaller = user && user.id === dealData.founder_user_id;
          const ndaParams: Record<string, string | number> = {};
          if (isFounderCaller && dealData.counterparty_user_id) {
            ndaParams.counterparty_user_id = dealData.counterparty_user_id;
          }
          const nda = await api.get<BusinessNdaData>(`/api/me/businesses/${dealData.business_id}/nda`, { params: ndaParams });
          setNdaStatus(nda);
        } catch {
          // Non-blocking NDA status load
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal room data from server.');
    } finally {
      setLoading(false);
    }
  }, [dealId, user, role]);

  useEffect(() => {
    fetchDealData();
  }, [fetchDealData]);

  const handleTransition = async (targetState?: string) => {
    if (!deal) return;
    setTransitioning(true);
    setTransitionError(null);
    try {
      await submitDealTransition(deal.id, targetState, role);
      await fetchDealData();
    } catch (err: any) {
      setTransitionError(err?.message || 'Lifecycle transition rejected by server.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleGenerateAgreement = async () => {
    if (!deal) return;
    setIsGeneratingAgreement(true);
    setAgreementError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      const res = await api.deals.generateAgreement(deal.id, roleParam);
      setAgreement(res);
      await fetchDealData();
    } catch (err: any) {
      setAgreementError(err?.message || 'Failed to generate agreement draft.');
    } finally {
      setIsGeneratingAgreement(false);
    }
  };

  const handleSignAgreement = async () => {
    if (!deal) return;
    setIsSigningAgreement(true);
    setAgreementError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      const res = await api.deals.signAgreement(deal.id, roleParam);
      setAgreement(res);
      await fetchDealData();
    } catch (err: any) {
      setAgreementError(err?.message || 'Failed to sign agreement.');
    } finally {
      setIsSigningAgreement(false);
    }
  };

  const handleActivateMilestones = async () => {
    if (!deal) return;
    setIsActivatingMilestones(true);
    setMilestoneActivationError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      await api.deals.activateMilestones(deal.id, roleParam);
      await fetchDealData();
    } catch (err: any) {
      setMilestoneActivationError(err?.message || 'Failed to activate milestone funding.');
    } finally {
      setIsActivatingMilestones(false);
    }
  };

  const handleCompleteDeal = async () => {
    if (!deal || isCompletingDeal) return;
    setIsCompletingDeal(true);
    setDealCompletionError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      await api.deals.complete(deal.id, roleParam);
      await fetchDealData();
    } catch (err: any) {
      setDealCompletionError(err?.message || 'Failed to complete deal.');
    } finally {
      setIsCompletingDeal(false);
    }
  };

  function handleTabMouseDown(e: React.MouseEvent) {
    if (!tabScrollRef.current) return;
    isDraggingTab.current = true;
    dragStartX.current = e.pageX - tabScrollRef.current.offsetLeft;
    scrollLeftStart.current = tabScrollRef.current.scrollLeft;
  }

  function handleTabMouseLeave() {
    isDraggingTab.current = false;
  }

  function handleTabMouseUp() {
    isDraggingTab.current = false;
  }

  function handleTabMouseMove(e: React.MouseEvent) {
    if (!isDraggingTab.current || !tabScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabScrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    tabScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  }

  // scroll chat to bottom when new message added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatEntries]);

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'terms',     label: 'Negotiation Terms' },
    { id: 'milestones',  label: 'Milestones' },
    { id: 'investment',  label: investmentModel === 'micro' ? 'Investment - P/L' : 'Investment - Equity' },
    { id: 'agreement',   label: 'Agreement', badge: agreement && agreement.status === 'accepted' ? 'Signed' : undefined },
    { id: 'chat',        label: 'Chat', badge: '3' },
  ];

  function handleSendMessage() {
    if (!msg.trim() || !canParticipantAct) return;
    setChatEntries(prev => [...prev, {
      kind: 'message',
      from: `You (${canFounderAct ? business?.name || 'Founder' : 'Counterparty'})`,
      fromRole: canFounderAct ? 'founder' : 'investor',
      time: 'Just now',
      text: msg.trim(),
    }]);
    setMsg('');
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#0D1626]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mb-4" />
        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">Loading Deal Room...</p>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Retrieving authoritative deal state</p>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#0D1626] text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <IconAlertTriangle s={24} />
        </div>
        <p className="text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">Unable to Load Deal Room</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mb-6">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/connections')}>Go to Connections</Button>
          <Button onClick={fetchDealData}>Retry</Button>
        </div>
      </div>
    );
  }

  const dealTitle = business?.name
    ? `${business.name} — ${deal?.counterparty_role === 'investor' ? 'Investor Deal' : 'Professional Deal'}`
    : `Deal #${deal?.id || dealId}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* -- Back nav -- */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 py-3 border-b border-[#1c2a3e] bg-[#0D1626]">
        <button
          onClick={() => navigate('/app/connections')}
          className="flex items-center gap-1 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <IconChevronLeft s={13} />
          Connections
        </button>
        <span className="text-[color:var(--vv-text-tertiary)] text-[11px]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{dealTitle}</span>
      </div>

      <div className="flex-shrink-0 px-6 py-3 border-b border-[color:var(--vv-border)] bg-[#121A2B]">
        <div className="flex items-start gap-3">
          <IconShield s={15} className="text-[#C67A4E] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">
              {isAdmin ? 'Admin oversight view' : canFounderAct ? 'Founder deal view' : canInvestorAct ? 'Investor deal view' : 'Deal Room view'}
            </p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
              {isAdmin
                ? 'Review deal activity and governance signals. Participant actions are unavailable in the Admin Console.'
                : canFounderAct
                  ? `Manage founder-side responses, business disclosures, and agreement progression for ${business?.name || 'your business'}.`
                  : canInvestorAct
                    ? 'Review investor-side terms, protected documents, and responses for this deal.'
                    : 'Your workspace can view this Deal Room but has no participant actions here.'}
            </p>
          </div>
        </div>
      </div>

      {/* Transition error banner */}
      {transitionError && (
        <div className="flex items-center justify-between gap-3 px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-[12px]">
          <div className="flex items-center gap-2">
            <IconAlertTriangle s={15} className="shrink-0" />
            <span>{transitionError}</span>
          </div>
          <button onClick={() => setTransitionError(null)} className="text-red-400/80 hover:text-red-300 text-[11px] underline">Dismiss</button>
        </div>
      )}

      {/* -- Lifecycle stepper -- */}
      <div className="flex-shrink-0 bg-[#0D1626] border-b border-[color:var(--vv-border)]">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center px-6 py-4 min-w-max gap-0">
            {STAGES.map((s, i) => {
              const stageNum = i + 1;
              const done    = stageNum < dealStage;
              const current = stageNum === dealStage;
              return (
                <div key={s} className="flex items-center">
                  <div
                    className="flex flex-col items-center group cursor-default"
                    title={`Stage ${stageNum}: ${s}`}>
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                      done    ? 'bg-[#22C55E] border-[#22C55E] text-white shadow-sm' :
                      current ? 'bg-[#C67A4E] border-[#C67A4E] text-white shadow-md' :
                                'bg-transparent border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
                    }`}>
                      {done ? <IconCheck s={11} /> : stageNum}
                    </div>
                    <span className={`text-[10px] mt-1.5 whitespace-nowrap tracking-wide font-medium transition-colors ${
                      current ? 'text-[#C67A4E]' : done ? 'text-[color:var(--vv-text-secondary)]' : 'text-[color:var(--vv-text-tertiary)]'
                    }`}>{s}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-10 sm:w-14 h-px mx-2 mb-4 shrink-0 transition-colors ${done ? 'bg-[#22C55E]' : 'bg-[color:var(--vv-border-strong)]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* -- Body -- */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left sidebar */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-[color:var(--vv-border)] bg-[#0D1626] overflow-y-auto">
          <DealSummaryPanel deal={deal} business={business} dealStage={dealStage} currentUserId={user?.id} />
        </aside>

        {/* Center workspace */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Mobile deal summary toggle */}
          <div className="lg:hidden border-b border-[color:var(--vv-border)] bg-[#0D1626]">
            <button
              onClick={() => setActivityOpen(a => !a)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] text-[color:var(--vv-text-secondary)]">
              <span className="font-medium">{dealTitle}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant={dealStage >= 8 ? 'success' : 'accent'}>
                  {deal?.stage_label || STAGES[dealStage - 1]}
                </Badge>
                <IconChevronDown s={13} className={`text-[color:var(--vv-text-tertiary)] transition-transform ${activityOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {activityOpen && (
              <div className="border-t border-[#1c2a3e]">
                <DealSummaryPanel deal={deal} business={business} dealStage={dealStage} currentUserId={user?.id} />
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div 
            ref={tabScrollRef}
            onMouseDown={handleTabMouseDown}
            onMouseLeave={handleTabMouseLeave}
            onMouseUp={handleTabMouseUp}
            onMouseMove={handleTabMouseMove}
            className="shrink-0 border-b border-[color:var(--vv-border)] bg-[#121A2B] overflow-x-auto select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center px-6 min-w-max">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.id ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}>
                  {t.label}
                  {t.badge && <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[#C67A4E] text-[color:var(--vv-on-copper)]">{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8">

            {/* -- OVERVIEW -- */}
            {tab === 'overview' && (
              dealStage >= 8 ? (
                <CompletionView
                  businessName={business?.name}
                  milestones={milestones}
                  onReputation={() => navigate('/app/feedback')}
                  onSummary={() => setActivityOpen(true)}
                />
              ) : (
                <div className="space-y-6 max-w-4xl">

                  {/* NDA status card */}
                  {!(ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) ? (
                    <div className="flex items-start gap-3 p-4 rounded-[10px] border"
                      style={{ background: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.22)' }}>
                      <IconLock s={15} className="text-[#A78BFA] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#A78BFA] mb-0.5">
                          {ndaStatus?.status === 'pending' ? 'NDA Pending Acceptance' : ndaStatus?.status === 'declined' ? 'NDA Declined' : 'NDA Required'}
                        </p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
                          {ndaStatus?.status === 'pending'
                            ? (ndaStatus.current_user_accepted ? 'Waiting for the counterparty to accept the NDA.' : 'An NDA is pending your review and signature.')
                            : ndaStatus?.status === 'declined'
                            ? 'The previous NDA was declined. A new agreement must be initiated.'
                            : 'Protected information is unavailable until both parties have signed the mutual NDA.'}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => navigate(deal?.business_id ? `/app/nda/${deal.business_id}?return=/app/deals/${deal.id}${user?.id === deal.founder_user_id && deal.counterparty_user_id ? `&counterparty_user_id=${deal.counterparty_user_id}` : ''}` : '/app/nda')}>
                        {ndaStatus?.status === 'pending' && !ndaStatus?.current_user_accepted ? 'Review & Sign' : ndaStatus?.status === 'declined' ? 'Request New NDA' : 'Review NDA'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-[10px]"
                      style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)' }}>
                      <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                      </svg>
                      <p className="text-[12px] text-[#22C55E] font-medium">NDA Completed — both parties signed</p>
                    </div>
                  )}

                  {/* Action required */}
                  {dealStage === 5 && canParticipantAct && (
                    <div className="flex items-start gap-3 p-4 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px]">
                      <IconAlertTriangle s={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">Action required: Review negotiation terms</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{canFounderAct ? 'Review and respond to the investor proposal.' : 'Counterparty submitted preliminary terms. Review and respond.'}</p>
                      </div>
                      <Button size="sm" onClick={() => setTab('terms')}>Review</Button>
                    </div>
                  )}

                  {dealStage === 6 && (
                    <div className="flex items-start gap-3 p-4 rounded-[10px]"
                      style={{ background: 'rgba(198,122,78,0.05)', border: '1px solid rgba(198,122,78,0.2)' }}>
                      <IconFileText s={15} className="text-[#C67A4E] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">Agreement ready to sign</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Both parties agreed on terms. Review and sign the shareholders agreement.</p>
                      </div>
                      <Button size="sm" onClick={() => setTab('agreement')}>Review Agreement</Button>
                    </div>
                  )}

                  {/* Deal status table */}
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Deal Status</p>
                    </div>
                    <div>
                      {[
                        { label: 'Current stage',      value: deal?.stage_label || STAGES[dealStage - 1], badge: null },
                        {
                          label: 'NDA status',
                          value: null,
                          badge: (ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4)
                            ? { v: 'success', text: 'Both parties signed' }
                            : ndaStatus?.status === 'pending'
                            ? { v: 'warning', text: 'Pending acceptance' }
                            : ndaStatus?.status === 'declined'
                            ? { v: 'neutral', text: 'Declined' }
                            : { v: 'warning', text: 'Not requested' },
                        },
                        { label: 'Data room access',   value: null, badge: { v: (ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) ? 'accent' : 'neutral', text: (ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) ? 'Stage 3 unlocked' : 'Stage 1 only' } },
                        { label: 'Documents',          value: (ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) ? '7 accessible — 2 locked' : '4 accessible — 5 locked', badge: null },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                          <span className="text-[12px] text-[color:var(--vv-text-tertiary)] shrink-0">{row.label}</span>
                          {row.badge ? (
                            <Badge variant={row.badge.v as any} dot>{row.badge.text}</Badge>
                          ) : (
                            <span className="text-[12px] text-[color:var(--vv-text-secondary)] text-right">{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone summary */}
                  {dealStage >= 7 && (
                    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
                        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Current Milestone</p>
                        <button onClick={() => setTab('milestones')}
                          className="text-[11px] text-[#C67A4E] hover:underline">
                          Full Tracking →
                        </button>
                      </div>
                      <div className="px-4 py-3">
                        {milestonesLoading ? (
                          <div className="py-3 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">
                            Loading milestone summary...
                          </div>
                        ) : milestonesError ? (
                          <div className="py-2 text-[12px] text-red-400 flex items-center gap-2">
                            <IconAlertTriangle s={14} className="shrink-0" />
                            <span>{milestonesError}</span>
                          </div>
                        ) : currentMilestone ? (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{currentMilestone.title}</p>
                              <span className="text-[14px] font-bold text-[#C67A4E] font-mono">
                                {fundingSummary ? `${fundingSummary.funding_progress_percentage}%` : `${currentMilestone.progress_percentage}%`}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(43,45,47,0.8)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, fundingSummary ? fundingSummary.funding_progress_percentage : currentMilestone.progress_percentage))}%`,
                                  background: 'linear-gradient(90deg,#C67A4E,#C67A4E)',
                                }}
                              />
                            </div>
                            {nextMilestone ? (
                              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Next: {nextMilestone.title}</p>
                            ) : (
                              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                                {fundingSummary
                                  ? `Released: ৳${fundingSummary.total_released_bdt.toLocaleString('en-IN')} / ৳${fundingSummary.total_committed_bdt.toLocaleString('en-IN')}`
                                  : 'Final milestone in progress'}
                              </p>
                            )}
                          </>
                        ) : milestones.length > 0 ? (
                          <div className="text-[12px] text-[color:var(--vv-text-secondary)]">
                            All {milestones.length} milestones funded ({fundingSummary ? `${fundingSummary.funding_progress_percentage}%` : '100%'} complete)
                          </div>
                        ) : (
                          <div className="py-2 text-[12px] text-[color:var(--vv-text-tertiary)] italic">
                            No milestones defined for this deal yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deal completion banner if all milestones funded */}
                  {isDealCompletionEligible && (
                    <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[#22C55E]/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                            <IconCheck s={16} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                              All Milestones Funded — Ready to Complete Deal
                            </p>
                            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                              Agreement is finalized, all tranches are released, and the milestone schedule is 100% fulfilled.
                            </p>
                          </div>
                        </div>
                        {isAdmin ? (
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                            Admin oversight: completion action disabled
                          </span>
                        ) : canParticipantAct ? (
                          <Button
                            disabled={isCompletingDeal}
                            onClick={handleCompleteDeal}
                            className="shrink-0"
                          >
                            {isCompletingDeal ? 'Completing Deal...' : 'Complete Deal'}
                          </Button>
                        ) : null}
                      </div>
                      {dealCompletionError && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] rounded-md">
                          <IconAlertTriangle s={14} className="shrink-0" />
                          <span>{dealCompletionError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="lg:hidden">
                    <StagedDisclosure currentStage={dealStage >= 4 ? 3 : 2} />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-[color:var(--vv-border)] rounded-md">
                    <IconShield s={13} className="text-[color:var(--vv-text-tertiary)] shrink-0" />
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Staying on-platform provides verified history, milestone protection, and dispute support.</p>
                  </div>
                </div>
              )
            )}

            {/* -- DOCUMENTS -- */}
            {tab === 'documents' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">
                    Data Room — {dealStage >= 4 ? 'Stage 3 Active' : 'Stage 1 Active'}
                  </p>
                  <Button variant="ghost" size="sm">Download accessible</Button>
                </div>

                {!(ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) && (
                  <div className="flex items-start gap-3 p-3.5 rounded-[10px] mb-3"
                    style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <IconLock s={13} className="text-[#A78BFA] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#A78BFA]">NDA completion is required to access protected documents.</p>
                      <button onClick={() => navigate(deal?.business_id ? `/app/nda/${deal.business_id}?return=/app/deals/${deal.id}${user?.id === deal.founder_user_id && deal.counterparty_user_id ? `&counterparty_user_id=${deal.counterparty_user_id}` : ''}` : '/app/nda')}
                        className="text-[11px] text-[#A78BFA] underline mt-1">Review NDA →</button>
                    </div>
                  </div>
                )}

                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-[color:var(--vv-border)]">
                          {['Document', 'Stage', 'Access', 'Type', 'Date', ''].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DOCS.map((doc, i) => {
                          const effectiveAccess: DocAccess = !(ndaStatus ? ndaStatus.status === 'active' : dealStage >= 4) && doc.stage >= 3
                            ? 'nda_required'
                            : doc.access;
                          const isOpen = effectiveAccess === 'available' || effectiveAccess === 'finalized';
                          return (
                            <tr key={i} className={`border-b border-[#1c2a3e] last:border-0 ${isOpen ? 'hover:bg-[color:var(--vv-raised)]/50 cursor-pointer' : 'opacity-60'}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isOpen
                                    ? <IconFileText s={14} className="text-[#C67A4E] shrink-0" />
                                    : <IconLock s={14} className={`shrink-0 ${effectiveAccess === 'nda_required' ? 'text-[#A78BFA]' : 'text-[color:var(--vv-text-tertiary)]'}`} />}
                                  <span className={`text-[12.5px] font-medium ${isOpen ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{doc.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={doc.stage <= 2 ? 'success' : doc.stage === 3 ? 'accent' : 'neutral'}>
                                  S{doc.stage}
                                </Badge>
                              </td>
                              <td className="px-4 py-3"><AccessBadge access={effectiveAccess} /></td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{doc.type}</td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{doc.date}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {isOpen
                                  ? <Button variant="ghost" size="sm">Download</Button>
                                  : effectiveAccess === 'nda_required'
                                    ? <button onClick={() => navigate(deal?.business_id ? `/app/nda/${deal.business_id}?return=/app/deals/${deal.id}${user?.id === deal.founder_user_id && deal.counterparty_user_id ? `&counterparty_user_id=${deal.counterparty_user_id}` : ''}` : '/app/nda')} className="text-[10.5px] text-[#A78BFA] hover:underline">Review NDA</button>
                                    : <span className="text-[10.5px] text-[#35446A]">{ACCESS_CFG[effectiveAccess].label}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile stacked */}
                  <div className="sm:hidden">
                    {DOCS.map((doc, i) => {
                      const effectiveAccess: DocAccess = dealStage < 4 && doc.stage >= 3 ? 'nda_required' : doc.access;
                      const isOpen = effectiveAccess === 'available' || effectiveAccess === 'finalized';
                      return (
                        <div key={i} className={`px-4 py-3 border-b border-[#1c2a3e] last:border-0 ${!isOpen ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {isOpen ? <IconFileText s={13} className="text-[#C67A4E] shrink-0" /> : <IconLock s={13} className={effectiveAccess === 'nda_required' ? 'text-[#A78BFA] shrink-0' : 'text-[color:var(--vv-text-tertiary)] shrink-0'} />}
                            <p className={`text-[12px] font-medium truncate ${isOpen ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{doc.name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <AccessBadge access={effectiveAccess} />
                            <span className="text-[10px] text-[#35446A] font-mono">{doc.type} — {doc.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* -- TERMS -- */}
            {tab === 'terms' && (
              <div className="max-w-4xl space-y-6">
                {/* Negotiation panel link */}
                <div className="flex items-center justify-between p-4.5 rounded-[12px] border"
                  style={{ background: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.2)' }}>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)]">Negotiation Panel</p>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Review, counter, and finalize proposal terms</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deal-room/${deal?.id || ''}`)}>
                    Open Negotiation →
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Summary — Negotiation Terms</p>
                  <Badge variant={negotiation?.active_proposal?.status === 'accepted' || dealStage >= 6 ? 'success' : 'warning'}>
                    {negotiation?.active_proposal ? `v${negotiation.active_proposal.version} — ${negotiation.active_proposal.status}` : (deal?.stage_label || 'In Negotiation')}
                  </Badge>
                </div>

                {negotiation?.active_proposal ? (
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[color:var(--vv-border)] flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] capitalize">
                          {negotiation.active_proposal.investment_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5 capitalize">
                          Proposed by <span className="text-[color:var(--vv-text-secondary)] font-medium">{negotiation.active_proposal.proposed_by_role}</span>
                          {negotiation.active_proposal.created_at && ` • ${new Date(negotiation.active_proposal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </p>
                      </div>
                      <Badge variant={negotiation.active_proposal.status === 'accepted' ? 'success' : 'warning'}>
                        {negotiation.active_proposal.status}
                      </Badge>
                    </div>

                    <div className="divide-y divide-[color:var(--vv-border)]">
                      {negotiation.active_proposal.amount !== null && negotiation.active_proposal.amount !== undefined && (
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Financial Amount</span>
                          <span className="font-mono text-[13px] font-semibold text-[color:var(--vv-text)]">
                            BDT {Number(negotiation.active_proposal.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {negotiation.active_proposal.equity_percentage !== null && negotiation.active_proposal.equity_percentage !== undefined && (
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Equity Stake</span>
                          <span className="font-mono text-[13px] font-semibold text-[#22C55E]">
                            {negotiation.active_proposal.equity_percentage}%
                          </span>
                        </div>
                      )}

                      {negotiation.active_proposal.profit_sharing_percentage !== null && negotiation.active_proposal.profit_sharing_percentage !== undefined && (
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Profit Sharing</span>
                          <span className="font-mono text-[13px] font-semibold text-[#C9A24B]">
                            {negotiation.active_proposal.profit_sharing_percentage}%
                          </span>
                        </div>
                      )}

                      {negotiation.active_proposal.loss_sharing_terms && (
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Loss Sharing Terms</span>
                          <span className="text-[12.5px] text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                            {negotiation.active_proposal.loss_sharing_terms}
                          </span>
                        </div>
                      )}

                      {negotiation.active_proposal.proposed_terms && (
                        <div className="flex items-start justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Deliverables & Milestone Terms</span>
                          <span className="text-[12.5px] text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                            {negotiation.active_proposal.proposed_terms}
                          </span>
                        </div>
                      )}

                      {negotiation.active_proposal.note && (
                        <div className="flex items-start justify-between px-5 py-3.5">
                          <span className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Note</span>
                          <span className="text-[12px] text-[color:var(--vv-text-tertiary)] italic text-right max-w-[60%]">
                            "{negotiation.active_proposal.note}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-6 text-center">
                    <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">No Active Term Proposal</p>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mb-4">
                      Proposals submitted in the Negotiation Panel will appear here as the deal terms summary.
                    </p>
                    <Button size="sm" onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deal-room/${deal?.id || ''}`)}>
                      Open Negotiation Panel
                    </Button>
                  </div>
                )}

                {canParticipantAct ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deal-room/${deal?.id || ''}`)}>
                      {canFounderAct ? 'Review / Counter Proposal' : 'Negotiate Terms'}
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={transitioning}
                      onClick={() => handleTransition('agreement')}>
                      {transitioning ? 'Transitioning...' : canFounderAct ? 'Approve Terms' : 'Accept Terms'}
                    </Button>
                  </div>
                ) : (
                  <div className="px-3.5 py-3 rounded-md border border-[color:var(--vv-border)] text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                    {isAdmin ? 'Admin oversight: participant negotiation actions are disabled.' : 'Negotiation actions are unavailable in this workspace.'}
                  </div>
                )}
              </div>
            )}

            {/* -- MILESTONES -- */}
            {tab === 'milestones' && (
              <div className="max-w-4xl space-y-4">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Milestone Funding Schedule</p>
                  <button
                    onClick={() => navigate(deal?.id ? `/app/milestones?deal_id=${deal.id}&return=/app/deals/${deal.id}` : '/app/milestones')}
                    className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1"
                  >
                    Full Tracking View
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                {/* Funding Summary Banner if available */}
                {fundingSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[12px] bg-[#121A2B] border border-[color:var(--vv-border)]">
                    <div>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Committed</p>
                      <p className="text-[13px] font-mono font-bold text-[color:var(--vv-text)] mt-0.5">
                        ৳{fundingSummary.total_committed_bdt.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Allocated</p>
                      <p className="text-[13px] font-mono font-bold text-[#C67A4E] mt-0.5">
                        ৳{fundingSummary.total_allocated_bdt.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Released</p>
                      <p className="text-[13px] font-mono font-bold text-[#22C55E] mt-0.5">
                        ৳{fundingSummary.total_released_bdt.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Progress</p>
                      <p className="text-[13px] font-mono font-bold text-[#C9A24B] mt-0.5">
                        {fundingSummary.funding_progress_percentage}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Activation CTA if deal is in agreement stage and agreement is finalized */}
                {deal?.stage === 'agreement' && agreement && agreement.status === 'accepted' && agreement.finalized_at && (
                  <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[#C67A4E]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Agreement Finalized — Ready to Activate Milestones</p>
                        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                          Begin active milestone execution and simulated tranche funding.
                        </p>
                      </div>
                      {canParticipantAct && !isAdmin && (
                        <Button
                          size="sm"
                          disabled={isActivatingMilestones}
                          onClick={handleActivateMilestones}
                        >
                          {isActivatingMilestones ? 'Activating...' : 'Activate Milestone Funding'}
                        </Button>
                      )}
                    </div>
                    {milestoneActivationError && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] rounded-md">
                        <IconAlertTriangle s={14} className="shrink-0" />
                        <span>{milestoneActivationError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Deal Completion CTA in Milestones tab */}
                {isDealCompletionEligible && (
                  <div className="p-4 rounded-[12px] bg-[#121A2B] border border-[#22C55E]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                          <IconCheck s={16} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                            All Milestones Funded — Ready to Complete Deal
                          </p>
                          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                            Agreement is finalized, all tranches are released, and the milestone schedule is 100% fulfilled.
                          </p>
                        </div>
                      </div>
                      {isAdmin ? (
                        <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                          Admin oversight: completion action disabled
                        </span>
                      ) : canParticipantAct ? (
                        <Button
                          disabled={isCompletingDeal}
                          onClick={handleCompleteDeal}
                          className="shrink-0"
                        >
                          {isCompletingDeal ? 'Completing Deal...' : 'Complete Deal'}
                        </Button>
                      ) : null}
                    </div>
                    {dealCompletionError && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] rounded-md">
                        <IconAlertTriangle s={14} className="shrink-0" />
                        <span>{dealCompletionError}</span>
                      </div>
                    )}
                  </div>
                )}

                {milestonesLoading ? (
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-8 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">
                    <div className="w-6 h-6 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto mb-2" />
                    Loading milestone schedule...
                  </div>
                ) : milestonesError ? (
                  <div className="bg-[#121A2B] border border-red-500/20 rounded-[12px] p-6 text-center space-y-3">
                    <IconAlertTriangle s={20} className="text-red-400 mx-auto" />
                    <p className="text-[13px] font-medium text-red-400">{milestonesError}</p>
                    <Button size="sm" variant="secondary" onClick={fetchDealData}>Retry Loading</Button>
                  </div>
                ) : milestones.length === 0 ? (
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-8 text-center space-y-2">
                    <p className="text-[13px] font-medium text-[color:var(--vv-text)]">No Milestones Defined Yet</p>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
                      Milestones will be scheduled during the agreement execution or milestone funding phase.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] overflow-hidden">
                    {milestones.map((m, i) => {
                      const isCompleted = m.status === 'funded';
                      const isActive = m.status === 'active' || m.status === 'submitted';
                      const isPending = m.status === 'pending';
                      const formattedAmount = m.target_amount !== undefined && m.target_amount !== null
                        ? `BDT ${Number(m.target_amount).toLocaleString('en-IN')}`
                        : '—';
                      const formattedDate = m.target_date
                        ? new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '—';
                      const statusLabel = m.status === 'funded'
                        ? 'Funded'
                        : m.status === 'submitted'
                        ? 'Submitted'
                        : m.status === 'active'
                        ? 'Active'
                        : 'Pending';

                      return (
                        <div
                          key={m.id || i}
                          className={`flex items-center gap-4 px-5 py-4 border-b border-[#1c2a3e] last:border-0 ${
                            isActive ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)]' : ''
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? 'bg-[#22C55E] border-[#22C55E]'
                                : isActive
                                ? 'bg-[#C67A4E] border-[#C67A4E]'
                                : 'border-[color:var(--vv-border-strong)]'
                            }`}
                          >
                            {isCompleted ? (
                              <IconCheck s={11} className="text-white" />
                            ) : (
                              <span
                                className={`text-[10px] font-bold ${
                                  isActive ? 'text-white' : 'text-[color:var(--vv-text-tertiary)]'
                                }`}
                              >
                                {m.sequence_order || i + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-[13px] font-medium ${
                                isPending ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'
                              }`}
                            >
                              {m.title}
                            </p>
                            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">
                              {formattedDate} {m.description ? `• ${m.description}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`font-mono text-[12.5px] font-semibold tabular-nums ${
                                isCompleted
                                  ? 'text-[#22C55E]'
                                  : isActive
                                  ? 'text-[#C67A4E]'
                                  : 'text-[color:var(--vv-text-tertiary)]'
                              }`}
                            >
                              {formattedAmount}
                            </p>
                            <Badge
                              variant={
                                isCompleted
                                  ? 'success'
                                  : m.status === 'submitted'
                                  ? 'warning'
                                  : isActive
                                  ? 'accent'
                                  : 'neutral'
                              }
                              dot
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* -- INVESTMENT -- */}
            {tab === 'investment' && <InvestmentTab model={investmentModel} />}

            {/* -- AGREEMENT -- */}
            {tab === 'agreement' && (
              <AgreementTab
                deal={deal}
                business={business}
                currentUserId={user?.id}
                userRole={role}
                dealStage={dealStage}
                agreement={agreement}
                negotiation={negotiation}
                onGenerateAgreement={handleGenerateAgreement}
                onSignAgreement={handleSignAgreement}
                onActivateMilestones={handleActivateMilestones}
                isGenerating={isGeneratingAgreement}
                isSigning={isSigningAgreement}
                isActivatingMilestones={isActivatingMilestones}
                agreementError={agreementError}
                milestoneActivationError={milestoneActivationError}
                onNavigateToNegotiation={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deal-room/${deal?.id || ''}`)}
              />
            )}

            {/* -- CHAT -- */}
            {tab === 'chat' && (
              <div className="flex flex-col max-w-4xl h-full min-h-[400px]">
                <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
                  {chatEntries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <IconMessageSquare s={24} className="text-[#35446A] mb-3" />
                      <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No messages yet.</p>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Start the conversation with the deal participants.</p>
                    </div>
                  )}
                  {chatEntries.map((entry, i) => {
                    if (entry.kind === 'event') {
                      return (
                        <div key={i} className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px" style={{ background: 'rgba(43,45,47,0.5)' }} />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.dot }} />
                            <p className="text-[10.5px] text-[#35446A]">{entry.text}</p>
                            <p className="text-[10px] text-[#2A3A52] font-mono">— {entry.time}</p>
                          </div>
                          <div className="flex-1 h-px" style={{ background: 'rgba(43,45,47,0.5)' }} />
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex gap-3 py-1">
                        <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0 mt-0.5">{entry.from[0]}</div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{entry.from}</span>
                            <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{entry.time}</span>
                          </div>
                          <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg px-3.5 py-2.5">{entry.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-[#1E2C44]">
                  <input value={msg} onChange={e => setMsg(e.target.value)} disabled={!canParticipantAct}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Message deal participants…"
                    className="flex-1 min-w-0 h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors" />
                  <Button size="sm" icon={<IconMessageSquare s={13} />} onClick={handleSendMessage} disabled={!canParticipantAct}>Send</Button>
                </div>
              </div>
            )}

            {/* Mobile activity log */}
            <div className="xl:hidden mt-6 pt-4 border-t border-[color:var(--vv-border)]">
              <div className="bg-[#0D1626] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <ActivityLog histories={histories} />
              </div>
            </div>

          </div>
        </div>

        {/* Right: activity log (desktop) */}
        <aside className="hidden xl:flex flex-col w-60 xl:w-64 shrink-0 border-l border-[color:var(--vv-border)] bg-[#0D1626] overflow-y-auto">
          <ActivityLog histories={histories} />
        </aside>

      </div>
    </div>
  );
}
