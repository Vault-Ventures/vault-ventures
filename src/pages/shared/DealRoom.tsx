import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StagedDisclosure } from '../../components/ui/StagedDisclosure';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../utils/permissions';
import {
  api,
  type BusinessNdaData,
  type NegotiationData,
  type DealAgreementData,
  type DealMilestoneData,
  type FundingSummaryData,
  type DealMessageItem,
  type DealFeedbackStatusData,
} from '../../services/api';
import {
  IconCheck,
  IconLock,
  IconFileText,
  IconMessageSquare,
  IconAlertTriangle,
  IconShield,
  IconChevronLeft,
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconUsers,
  IconActivity,
  IconAward,
} from '../../components/layout/Icons';

// --- Constants & Enums --------------------------------------------------------

const STAGES = [
  'Matched',
  'Interest Confirmed',
  'Deal Room',
  'NDA Signed',
  'Negotiation',
  'Agreement',
  'Milestone Funding Active',
  'Completed',
];

export interface DealData {
  id: number;
  connection_id: number;
  business_id: number;
  founder_user_id: number;
  counterparty_user_id: number;
  counterparty_role: 'investor' | 'professional';
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

type Tab = 'overview' | 'negotiation' | 'agreement' | 'milestones' | 'communication';

export function submitDealTransition(dealId: number, targetState: string | undefined, role: string) {
  const participantRole = role === 'investor' || role === 'professional' ? role : undefined;
  return api.post(`/api/me/deals/${dealId}/transition`, {
    ...(targetState ? { target_state: targetState } : {}),
    ...(participantRole ? { role: participantRole } : {}),
  });
}

// --- Completion View ----------------------------------------------------------

function CompletionView({
  businessName,
  milestones = [],
  feedbackStatus,
  feedbackStatusLoading = false,
  feedbackStatusError = null,
  onReputation,
  onActivityTab,
}: {
  businessName?: string;
  milestones?: DealMilestoneData[];
  feedbackStatus?: DealFeedbackStatusData | null;
  feedbackStatusLoading?: boolean;
  feedbackStatusError?: string | null;
  onReputation: () => void;
  onActivityTab: () => void;
}) {
  const completedCount = milestones.filter((m) => m.status === 'funded').length;
  const milestonesValue =
    milestones.length > 0 ? `${completedCount} of ${milestones.length} completed` : 'All milestones completed';

  let ctaLabel = 'Leave Feedback';
  if (feedbackStatusLoading) {
    ctaLabel = 'View Feedback';
  } else if (feedbackStatusError) {
    ctaLabel = 'View Feedback';
  } else if (feedbackStatus?.has_submitted_feedback) {
    ctaLabel = 'View Submitted Feedback';
  } else {
    ctaLabel = 'Leave Feedback';
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Completion Banner */}
      <div
        className="rounded-2xl border p-8 text-center bg-[#121A2B]"
        style={{ borderColor: 'rgba(34,197,94,0.3)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)' }}
        >
          <IconCheck s={28} className="text-[#22C55E]" />
        </div>
        <h2 className="font-display text-xl font-bold text-[#22C55E] mb-1">Deal Completed</h2>
        <p className="text-sm font-medium text-[color:var(--vv-text)] mb-1">{businessName || 'Business Deal'}</p>
        <p className="text-xs text-[color:var(--vv-text-tertiary)]">
          All milestones verified, agreement executed, and deal lifecycle completed.
        </p>
      </div>

      {/* Summary Box */}
      <div className="rounded-xl border border-[#1c2a3e] overflow-hidden bg-[#121A2B]">
        <div className="px-5 py-3.5 border-b border-[#1c2a3e]">
          <h3 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
            Deal Execution Summary
          </h3>
        </div>
        <div className="divide-y divide-[#1c2a3e] text-xs">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[color:var(--vv-text-tertiary)]">Final Status</span>
            <span className="font-semibold text-[#22C55E]">Agreement Executed & Completed</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[color:var(--vv-text-tertiary)]">Milestones Schedule</span>
            <span className="font-medium text-[color:var(--vv-text-secondary)]">{milestonesValue}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[color:var(--vv-text-tertiary)]">Platform Settlement</span>
            <span className="font-medium text-[color:var(--vv-text-secondary)]">Simulated Tranche Funding</span>
          </div>
        </div>
      </div>

      {/* Reputation CTA */}
      <div className="rounded-xl border border-[#C67A4E]/20 bg-[#C67A4E]/5 p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] shrink-0 mt-0.5">
          <IconAward s={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[color:var(--vv-text)] mb-0.5">Counterparty Review</h4>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-3 leading-relaxed">
            Share your experience with this counterparty to build trust and strengthen reputation scores across the platform.
          </p>
          <Button size="sm" variant="secondary" onClick={onReputation}>
            {ctaLabel}
          </Button>
        </div>
      </div>

      <Button variant="ghost" className="w-full text-xs text-[color:var(--vv-text-tertiary)]" onClick={onActivityTab}>
        View Full Deal Activity & Event History →
      </Button>
    </div>
  );
}

// --- Main Deal Room Component -------------------------------------------------

export default function DealRoom() {
  const navigate = useNavigate();
  const { dealId } = useParams<{ dealId?: string }>();
  const { user } = useAuth();
  const { role } = useRole();

  const isAdmin = role === 'admin';
  const canFounderAct = canAccess(role, 'deal.founderActions');
  const canInvestorAct = canAccess(role, 'deal.investorActions');
  const canParticipantAct = canFounderAct || canInvestorAct;

  // Data states
  const [deal, setDeal] = useState<DealData | null>(null);
  const [histories, setHistories] = useState<DealHistoryItem[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [ndaStatus, setNdaStatus] = useState<BusinessNdaData | null>(null);
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [agreement, setAgreement] = useState<DealAgreementData | null>(null);
  const [milestones, setMilestones] = useState<DealMilestoneData[]>([]);
  const [fundingSummary, setFundingSummary] = useState<FundingSummaryData | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<DealFeedbackStatusData | null>(null);
  const [feedbackStatusLoading, setFeedbackStatusLoading] = useState<boolean>(false);
  const [feedbackStatusError, setFeedbackStatusError] = useState<string | null>(null);

  // UI & Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  // Action states
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState<boolean>(false);
  const [negotiationActionError, setNegotiationActionError] = useState<string | null>(null);
  const [isGeneratingAgreement, setIsGeneratingAgreement] = useState<boolean>(false);
  const [isSigningAgreement, setIsSigningAgreement] = useState<boolean>(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [isActivatingMilestones, setIsActivatingMilestones] = useState<boolean>(false);
  const [milestoneActivationError, setMilestoneActivationError] = useState<string | null>(null);
  const [isCompletingDeal, setIsCompletingDeal] = useState<boolean>(false);
  const [dealCompletionError, setDealCompletionError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [milestonesLoading, setMilestonesLoading] = useState<boolean>(false);
  const [milestonesError, setMilestonesError] = useState<string | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState<number | string>('');
  const [newMilestoneDate, setNewMilestoneDate] = useState<string>('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState<string>('');
  const [isAddingMilestone, setIsAddingMilestone] = useState<boolean>(false);
  const [addMilestoneError, setAddMilestoneError] = useState<string | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(null);

  // Real Database-Persisted Deal Room Messaging State
  const [messages, setMessages] = useState<DealMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Stable ref tracking current deal — avoids putting `deal` state in useCallback deps
  const dealRef = useRef<DealData | null>(null);
  // Track whether the first successful load has completed (suppresses full-page spinner on refresh)
  const hasInitiallyLoaded = useRef<boolean>(false);
  // Guard against overlapping concurrent fetchDealData calls
  const isFetchingRef = useRef<boolean>(false);

  const dealStage = deal ? deal.stage_order : 1;

  // Fetch deal data — NOTE: `deal` state is intentionally NOT in the dep array.
  // We use dealRef.current (a stable ref) to read the current deal inside the callback
  // without causing the callback to be recreated every time deal changes, which would
  // trigger the useEffect and cause an infinite fetch loop.
  const fetchDealData = useCallback(async (isBackgroundRefresh = false) => {
    if (!dealId) {
      setError('No Deal ID provided in route. Please open a Deal from Connections or Deal Hub.');
      setLoading(false);
      return;
    }

    // Prevent concurrent overlapping calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Only show full-page loading spinner on the very first load.
    // Background refreshes (after actions) must not reset the page to loading.
    const showFullPageLoading = !hasInitiallyLoaded.current && !isBackgroundRefresh;
    if (showFullPageLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      // Use dealRef.current (not `deal` state) to determine initial role — avoids dep-array loop
      const currentDeal = dealRef.current;
      const isInitialFounder = user && currentDeal && Number(user.id) === Number(currentDeal.founder_user_id);
      const initialRoleParam = isInitialFounder ? undefined : (role === 'investor' || role === 'professional' ? role : undefined);
      const dealData = await api.deals.get(dealId, initialRoleParam);
      // Update both state and ref
      setDeal(dealData);
      dealRef.current = dealData;

      const isFounderCaller = user && Number(user.id) === Number(dealData.founder_user_id);
      const isCounterpartyCaller = user && Number(user.id) === Number(dealData.counterparty_user_id);
      const effectiveRole = isFounderCaller
        ? undefined
        : isCounterpartyCaller
        ? dealData.counterparty_role
        : role === 'investor' || role === 'professional'
        ? role
        : undefined;

      try {
        const historyData = await api.get<DealHistoryItem[]>(`/api/me/deals/${dealId}/history`, {
          params: effectiveRole ? { role: effectiveRole } : undefined,
        });
        setHistories(Array.isArray(historyData) ? historyData : []);
      } catch {
        setHistories([]);
      }

      if (dealData.id) {
        try {
          const neg = await api.deals.getNegotiation(dealData.id, effectiveRole);
          setNegotiation(neg);
        } catch {
          setNegotiation(null);
        }

        try {
          const agr = await api.deals.getAgreement(dealData.id, effectiveRole);
          setAgreement(agr);
        } catch {
          setAgreement(null);
        }

        try {
          setMilestonesLoading(true);
          const milestonesRes = await api.deals.milestones.list(dealData.id, effectiveRole);
          setMilestones(milestonesRes.milestones || []);
          setFundingSummary(milestonesRes.summary || null);
          setMilestonesError(null);
        } catch (mErr: any) {
          setMilestones([]);
          setFundingSummary(null);
          setMilestonesError(mErr?.message || 'Failed to load milestones.');
        } finally {
          setMilestonesLoading(false);
        }

        try {
          setMessagesLoading(true);
          const msgRes = await api.deals.messages.list(dealData.id, effectiveRole);
          const msgList = Array.isArray(msgRes) ? msgRes : (msgRes as any)?.messages || [];
          setMessages(msgList);
          setMessagesError(null);
        } catch (msgErr: any) {
          setMessages([]);
          setMessagesError(msgErr?.message || 'Failed to load deal messages.');
        } finally {
          setMessagesLoading(false);
        }

        if (dealData.stage === 'completed' || dealData.stage_order >= 8) {
          try {
            setFeedbackStatusLoading(true);
            const fbRes = await api.deals.feedback.getStatus(dealData.id, effectiveRole);
            setFeedbackStatus(fbRes);
            setFeedbackStatusError(null);
          } catch (fbErr: any) {
            setFeedbackStatus(null);
            setFeedbackStatusError(fbErr?.message || 'Failed to load feedback status.');
          } finally {
            setFeedbackStatusLoading(false);
          }
        }
      }

      if (dealData.business_id) {
        try {
          const bus = await api.get<BusinessInfo>(`/api/businesses/${dealData.business_id}`);
          setBusiness(bus);
        } catch {
          // Non-blocking business metadata
        }

        try {
          const ndaParams: Record<string, string | number> = {
            deal_id: dealData.id,
          };
          if (isFounderCaller && dealData.counterparty_user_id) {
            ndaParams.counterparty_user_id = dealData.counterparty_user_id;
          }
          if (dealData.counterparty_role) {
            ndaParams.role = dealData.counterparty_role;
          }
          const nda = await api.get<BusinessNdaData>(`/api/me/businesses/${dealData.business_id}/nda`, ndaParams);
          setNdaStatus(nda);
        } catch {
          // Non-blocking NDA status
        }
      }

      // Mark initial load as complete so background refreshes won't show full-page spinner
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal room data from server.');
    } finally {
      if (showFullPageLoading) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  // IMPORTANT: `deal` is deliberately excluded — use dealRef.current instead.
  // Including `deal` in deps would cause: setDeal() → deal changes → new fetchDealData → useEffect fires → infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, user, role]);

  useEffect(() => {
    // Reset refs when dealId changes so we re-show the initial loading screen for a new deal
    hasInitiallyLoaded.current = false;
    dealRef.current = null;
    setDeal(null);
    fetchDealData();
  }, [dealId, fetchDealData]);

  // Separate effect: re-fetch when user/role identity changes but dealId stays the same
  // This handles workspace switching (founder → investor) without looping on deal data
  const prevUserIdRef = useRef<number | undefined>(undefined);
  const prevRoleRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const userId = user?.id;
    const prevUserId = prevUserIdRef.current;
    const prevRole = prevRoleRef.current;
    // Only re-fetch if user or role genuinely changed (not on the initial mount — that's handled above)
    if (prevUserId !== undefined && (prevUserId !== userId || prevRole !== role)) {
      hasInitiallyLoaded.current = false;
      dealRef.current = null;
      setDeal(null);
      fetchDealData();
    }
    prevUserIdRef.current = userId;
    prevRoleRef.current = role;
  // We only want this to fire when user.id or role changes, not on fetchDealData identity change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);

  // Actions
  const handleTransition = async (targetState?: string) => {
    if (!deal) return;
    setTransitioning(true);
    setTransitionError(null);
    try {
      const actionRole = isFounder ? 'founder' : (isCounterparty ? deal.counterparty_role : role);
      await submitDealTransition(deal.id, targetState, actionRole);
      await fetchDealData(true);
    } catch (err: any) {
      setTransitionError(err?.message || 'Lifecycle transition rejected by server.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleAcceptProposalInDealRoom = async () => {
    if (!deal || !negotiation?.active_proposal) return;
    setIsAcceptingTerms(true);
    setNegotiationActionError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      await api.deals.respondNegotiation(deal.id, negotiation.active_proposal.id, {
        action: 'accept',
        role: actionRole,
      });
      await fetchDealData(true);
    } catch (err: any) {
      setNegotiationActionError(err?.message || 'Failed to accept proposal terms.');
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  const handleGenerateAgreement = async () => {
    if (!deal) return;
    setIsGeneratingAgreement(true);
    setAgreementError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      const res = await api.deals.generateAgreement(deal.id, actionRole);
      setAgreement(res);
      await fetchDealData(true);
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
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      const res = await api.deals.signAgreement(deal.id, actionRole);
      setAgreement(res);
      await fetchDealData(true);
    } catch (err: any) {
      setAgreementError(err?.message || 'Failed to sign agreement.');
    } finally {
      setIsSigningAgreement(false);
    }
  };

  const handleActivateMilestones = async () => {
    if (!deal || isActivatingMilestones) return;
    setIsActivatingMilestones(true);
    setMilestoneActivationError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      await api.deals.activateMilestones(deal.id, actionRole);
      await fetchDealData(true);
    } catch (err: any) {
      setMilestoneActivationError(err?.message || 'Failed to activate milestone funding.');
    } finally {
      setIsActivatingMilestones(false);
    }
  };

  const handleCreateMilestone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deal || isAddingMilestone) return;
    if (!newMilestoneTitle.trim()) {
      setAddMilestoneError('Milestone title is required.');
      return;
    }
    const amt = Number(newMilestoneAmount);
    if (isNaN(amt) || amt < 0) {
      setAddMilestoneError('Target amount must be a valid non-negative number.');
      return;
    }
    setIsAddingMilestone(true);
    setAddMilestoneError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      await api.deals.milestones.create(
        deal.id,
        {
          title: newMilestoneTitle.trim(),
          target_amount: amt,
          target_date: newMilestoneDate.trim() || undefined,
          description: newMilestoneDesc.trim() || undefined,
        },
        actionRole
      );
      setNewMilestoneTitle('');
      setNewMilestoneAmount('');
      setNewMilestoneDate('');
      setNewMilestoneDesc('');
      setShowAddMilestone(false);
      await fetchDealData(true);
    } catch (err: any) {
      setAddMilestoneError(err?.message || 'Failed to create milestone.');
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!deal || deletingMilestoneId !== null) return;
    setDeletingMilestoneId(milestoneId);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      await api.deals.milestones.delete(deal.id, milestoneId, actionRole);
      await fetchDealData(true);
    } catch (err: any) {
      setMilestoneActivationError(err?.message || 'Failed to delete milestone.');
    } finally {
      setDeletingMilestoneId(null);
    }
  };

  const handleCompleteDeal = async () => {
    if (!deal || isCompletingDeal) return;
    setIsCompletingDeal(true);
    setDealCompletionError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      await api.deals.complete(deal.id, actionRole);
      setShowCompleteModal(false);
      await fetchDealData(true);
    } catch (err: any) {
      setDealCompletionError(err?.message || 'Failed to complete deal.');
    } finally {
      setIsCompletingDeal(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed || !canParticipantAct || !deal?.id || sendingMessage) return;
    setSendingMessage(true);
    setSendMessageError(null);
    try {
      const actionRole = isFounder ? undefined : (isCounterparty ? deal.counterparty_role : undefined);
      const newMsg = await api.deals.messages.send(deal.id, trimmed, actionRole);
      setMessages((prev) => [...prev, newMsg]);
      setChatMessage('');
    } catch (err: any) {
      setSendMessageError(err?.message || 'Failed to persist message to server.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, tab]);

  // Eligibility helpers
  const isDealCompletionEligible =
    deal?.stage === 'milestone_funding_active' &&
    Boolean(agreement?.finalized_at) &&
    milestones.length > 0 &&
    milestones.every((m) => m.status === 'funded') &&
    (fundingSummary
      ? fundingSummary.total_committed_bdt === 0 ||
        fundingSummary.total_released_bdt === fundingSummary.total_committed_bdt
      : true);

  const isFounder = deal && user?.id === deal.founder_user_id;
  const isCounterparty = deal && user?.id === deal.counterparty_user_id;
  const isParticipant = Boolean(isFounder || isCounterparty);

  const founderName = business?.name ? `${business.name} (Founder)` : 'Founder';
  const counterpartyRoleLabel = deal?.counterparty_role === 'investor' ? 'Investor' : 'Professional';
  const counterpartyName = isCounterparty
    ? `You (${counterpartyRoleLabel})`
    : `Counterparty (${counterpartyRoleLabel})`;

  const dealTitle = business?.name
    ? `${business.name} — ${deal?.counterparty_role === 'investor' ? 'Investor Deal' : 'Professional Deal'}`
    : `Deal #${deal?.id || dealId}`;

  const isAgreementFinalized = agreement ? agreement.status === 'accepted' && Boolean(agreement.finalized_at) : false;
  const hasCurrentUserSignedAgreement = agreement
    ? (isFounder && Boolean(agreement.founder_signed_at)) || (isCounterparty && Boolean(agreement.counterparty_signed_at))
    : false;

  const committedAmount = Number(agreement?.terms_snapshot?.amount) || 0;
  const totalAllocated = milestones.reduce((sum, m) => sum + (Number(m.target_amount) || 0), 0);
  const isAllocationComplete = committedAmount > 0 ? Math.abs(totalAllocated - committedAmount) < 0.01 : milestones.length > 0;
  const isAllocationUnder = committedAmount > 0 && totalAllocated < committedAmount;
  const remainingToAllocate = Math.max(0, committedAmount - totalAllocated);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#0D1626]" data-testid="deal-room-loading">
        <div className="w-8 h-8 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-[color:var(--vv-text)]">Loading Deal Room...</p>
        <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">Retrieving deal data and workspace</p>
      </div>
    );
  }

  // Error State
  if (error && !deal) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#0D1626] text-center" data-testid="deal-room-error">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <IconAlertTriangle s={24} />
        </div>
        <h2 className="text-base font-semibold text-[color:var(--vv-text)] mb-1">Unable to Load Deal Room</h2>
        <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mb-6">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/deal-room')}>Deal Hub</Button>
          <Button variant="secondary" onClick={() => navigate('/app/connections')}>Connections</Button>
          <Button onClick={() => fetchDealData()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Tab Definitions
  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'negotiation',
      label: 'Negotiation Terms',
      badge: negotiation?.active_proposal?.status === 'pending' ? 'Active' : undefined,
    },
    {
      id: 'agreement',
      label: 'Agreement',
      badge: isAgreementFinalized ? 'Executed' : agreement?.status === 'pending_signatures' ? 'Pending' : undefined,
    },
    {
      id: 'milestones',
      label: 'Milestones',
      badge: milestones.length > 0 ? `${milestones.filter((m) => m.status === 'funded').length}/${milestones.length}` : undefined,
    },
    { id: 'communication', label: 'Communication & Activity' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D1626] text-[color:var(--vv-text)] overflow-hidden">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. COMPACT UNIFIED DEAL HEADER                                         */}
      {/* ---------------------------------------------------------------------- */}
      <div className="shrink-0 bg-[#0F1728] border-b border-[#1c2a3e] px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Navigation, Identity, Stage */}
          <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Back to Deal Hub button */}
            <button
              onClick={() => navigate('/app/deal-room')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] px-2 py-1 -ml-1 rounded hover:bg-[#1C283E] transition-colors shrink-0"
              title="Return to Deal Hub"
            >
              <IconChevronLeft s={14} />
              <span className="font-semibold">Deal Hub</span>
            </button>

            <span className="text-[#1c2a3e] hidden sm:inline">|</span>

            {/* Business / Deal Identity */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#1C283E] border border-[#2a3c57] flex items-center justify-center text-xs font-bold text-[#C67A4E] shrink-0">
                {(business?.name || 'D')[0]}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[color:var(--vv-text)] truncate font-display">
                {business?.name || `Deal #${deal?.id}`}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1C283E] text-[color:var(--vv-text-secondary)] border border-[#1c2a3e] shrink-0">
                #{deal?.id}
              </span>
              <Badge variant={dealStage >= 8 ? 'success' : dealStage >= 6 ? 'accent' : 'warning'} dot>
                {deal?.stage_label || STAGES[dealStage - 1]}
              </Badge>
            </div>

            {/* Counterparty subtle tag */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[color:var(--vv-text-secondary)] bg-[#121A2B] px-2.5 py-1 rounded-md border border-[#1c2a3e] shrink-0">
              <IconUsers s={12} className="text-[#C67A4E]" />
              <span className="truncate max-w-[200px]">{counterpartyName}</span>
            </div>
          </div>

          {/* Right: Target ask, Role context, Environment */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            {business?.funding_amount ? (
              <div className="px-2.5 py-1 rounded-md bg-[#121A2B] border border-[#1c2a3e] text-xs flex items-center gap-1.5">
                <span className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Target</span>
                <span className="font-mono text-xs font-bold text-[#C67A4E]">
                  ৳{business.funding_amount.toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}

            <div className="px-2.5 py-1 rounded-md bg-[#121A2B] border border-[#1c2a3e] text-xs flex items-center gap-1.5">
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Workspace</span>
              <span className="font-semibold text-xs text-[color:var(--vv-text-secondary)]">
                {isAdmin ? 'Admin' : canFounderAct ? 'Founder' : canInvestorAct ? 'Investor' : 'Viewer'}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Simulated environment for safety & testing">
              ✦ Simulated
            </span>
          </div>
        </div>
      </div>

      {/* Transition error banner */}
      {transitionError && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <IconAlertTriangle s={14} className="shrink-0" />
            <span>{transitionError}</span>
          </div>
          <button onClick={() => setTransitionError(null)} className="text-red-400 hover:text-red-300 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. COMPACT STAGE PROGRESS TRACKER                                      */}
      {/* ---------------------------------------------------------------------- */}
      <div className="shrink-0 bg-[#0D1626] border-b border-[#1c2a3e] py-2 px-4 sm:px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center min-w-max">
          {STAGES.map((stageName, index) => {
            const stageNum = index + 1;
            const isDone = stageNum < dealStage;
            const isCurrent = stageNum === dealStage;

            return (
              <div key={stageName} className="flex items-center">
                <div className="flex items-center gap-1.5 group cursor-default">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9.5px] font-bold transition-all shrink-0 ${
                      isDone
                        ? 'bg-[#22C55E] border-[#22C55E] text-white'
                        : isCurrent
                        ? 'bg-[#C67A4E] border-[#C67A4E] text-white shadow-sm'
                        : 'border-[#1c2a3e] bg-[#121A2B] text-[color:var(--vv-text-tertiary)]'
                    }`}
                  >
                    {isDone ? <IconCheck s={9} /> : stageNum}
                  </div>
                  <span
                    className={`text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'text-[#C67A4E] font-semibold'
                        : isDone
                        ? 'text-[color:var(--vv-text-secondary)]'
                        : 'text-[color:var(--vv-text-tertiary)]'
                    }`}
                  >
                    {stageName}
                  </span>
                </div>

                {index < STAGES.length - 1 && (
                  <div
                    className={`w-4 sm:w-6 h-px mx-1.5 shrink-0 transition-colors ${
                      isDone ? 'bg-[#22C55E]/60' : 'bg-[#1c2a3e]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. PRIMARY TAB NAVIGATION                                              */}
      {/* ---------------------------------------------------------------------- */}
      <div className="shrink-0 bg-[#121A2B] border-b border-[#1c2a3e] px-4 sm:px-6 overflow-x-auto select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-label={t.label}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-[#C67A4E] text-[color:var(--vv-text)]'
                  : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              <span>{t.label}</span>
              {t.badge && (
                <span aria-hidden="true" className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#C67A4E] text-white">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. ACTIVE WORKSPACE TAB CONTENT                                        */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW                                                      */}
        {/* ==================================================================== */}
        {tab === 'overview' && (
          dealStage >= 8 ? (
            <CompletionView
              businessName={business?.name}
              milestones={milestones}
              feedbackStatus={feedbackStatus}
              feedbackStatusLoading={feedbackStatusLoading}
              feedbackStatusError={feedbackStatusError}
              onReputation={() => navigate(`/app/feedback?dealId=${deal?.id || dealId}`)}
              onActivityTab={() => setTab('communication')}
            />
          ) : (
            <div className="max-w-5xl space-y-5">
              {/* Next Required Action Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] shrink-0 mt-0.5">
                    <IconActivity s={18} />
                  </div>
                  <div>
                    <h2 className="text-xs uppercase font-semibold tracking-wider text-[#C67A4E] mb-0.5">
                      Next Step / Stage Focus
                    </h2>
                    <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">
                      {dealStage === 1
                        ? 'Mutual Connection Established — Confirm Interest'
                        : dealStage === 2
                        ? 'Interest Confirmed — Open Deal Room'
                        : dealStage === 3
                        ? 'Review & Sign Mutual NDA'
                        : dealStage === 4
                        ? 'Mutual NDA Signed — Proceed to Negotiation'
                        : dealStage === 5
                        ? 'Commercial Terms Negotiation Active'
                        : dealStage === 6
                        ? isAgreementFinalized
                          ? 'Activate Milestone Funding Schedule'
                          : 'Review & Sign Bilateral Agreement'
                        : dealStage === 7
                        ? isDealCompletionEligible
                          ? 'All Milestones Funded — Ready to Complete Deal'
                          : 'Execute Active Milestone Tranches'
                        : 'Review Connection & Deal Details'}
                    </h3>
                    <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">
                      {dealStage === 1
                        ? 'Both parties have connected. Confirm mutual interest to advance the deal to formal review.'
                        : dealStage === 2
                        ? 'Interest has been confirmed by both participants. Open the formal deal room workspace to proceed.'
                        : dealStage === 3
                        ? 'Protected documents and data room remain restricted until both parties execute the NDA.'
                        : dealStage === 4
                        ? 'Protected disclosures and mutual NDA are signed. Advance to Negotiation to propose commercial terms.'
                        : dealStage === 5
                        ? 'Propose, counteroffer, and approve commercial terms in the Negotiation workspace.'
                        : dealStage === 6
                        ? 'Review agreement text snapshot and submit digital signature to finalize terms.'
                        : dealStage === 7
                        ? 'Submit milestone deliverables and release simulated funding tranches.'
                        : 'Manage deal workspace and participant communications.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {dealStage === 1 ? (
                    <Button size="sm" onClick={() => handleTransition('interest_confirmed')} disabled={transitioning}>
                      {transitioning ? 'Confirming…' : 'Confirm Interest'}
                    </Button>
                  ) : dealStage === 2 ? (
                    <Button size="sm" onClick={() => handleTransition('deal_room_opened')} disabled={transitioning}>
                      {transitioning ? 'Opening…' : 'Open Deal Room'}
                    </Button>
                  ) : dealStage === 3 ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          deal?.business_id
                            ? `/app/nda/${deal.business_id}?deal_id=${deal.id}&return=/app/deals/${deal.id}${
                                Number(user?.id) === Number(deal.founder_user_id) && deal.counterparty_user_id
                                  ? `&counterparty_user_id=${deal.counterparty_user_id}`
                                  : ''
                              }${deal.counterparty_role ? `&role=${deal.counterparty_role}` : ''}`
                            : '/app/nda'
                        )
                      }
                    >
                      Review NDA
                    </Button>
                  ) : dealStage === 4 ? (
                    <Button size="sm" onClick={() => handleTransition('negotiation')} disabled={transitioning}>
                      {transitioning ? 'Proceeding…' : 'Proceed to Negotiation'}
                    </Button>
                  ) : dealStage === 5 ? (
                    <Button size="sm" onClick={() => setTab('negotiation')}>
                      Negotiate Terms
                    </Button>
                  ) : dealStage === 6 ? (
                    <Button size="sm" onClick={() => setTab('agreement')}>
                      {isAgreementFinalized ? 'Activate Milestones' : 'Sign Agreement'}
                    </Button>
                  ) : dealStage === 7 ? (
                    isDealCompletionEligible && isFounder ? (
                      <Button
                        size="sm"
                        disabled={isCompletingDeal}
                        onClick={() => {
                          setDealCompletionError(null);
                          setShowCompleteModal(true);
                        }}
                      >
                        Complete Deal
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setTab('milestones')}>
                        View Milestones
                      </Button>
                    )
                  ) : null}
                </div>
              </div>

              {/* Grid of Deal Summary Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Participants Card */}
                <div className="p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-4">
                  <h3 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                    Deal Participants
                  </h3>

                  {/* Founder */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1c2a3e]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center text-xs font-bold text-[color:var(--vv-text)] shrink-0">
                        {(business?.name || 'F')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[color:var(--vv-text)] truncate">{founderName}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Founder / Business Owner</p>
                      </div>
                    </div>
                    <VerificationBadge tier={1} />
                  </div>

                  {/* Counterparty */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center text-xs font-bold text-[#C67A4E] shrink-0">
                        {counterpartyRoleLabel[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[color:var(--vv-text)] truncate">{counterpartyName}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{counterpartyRoleLabel}</p>
                      </div>
                    </div>
                    <VerificationBadge tier={1} />
                  </div>
                </div>

                {/* Deal Status & Terms Snapshot Card */}
                <div className="p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3 text-xs">
                  <h3 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider mb-2">
                    Deal Status & Key Figures
                  </h3>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
                    <span className="text-[color:var(--vv-text-tertiary)]">Current Stage</span>
                    <Badge variant={dealStage >= 8 ? 'success' : dealStage >= 6 ? 'accent' : 'warning'} dot>
                      {deal?.stage_label || STAGES[dealStage - 1]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
                    <span className="text-[color:var(--vv-text-tertiary)]">NDA Status</span>
                    <span className="font-medium text-[color:var(--vv-text-secondary)]">
                      {ndaStatus?.status === 'active' || dealStage >= 4
                        ? 'Signed & Active'
                        : ndaStatus?.status === 'pending'
                        ? 'Pending Acceptance'
                        : 'Required'}
                    </span>
                  </div>

                  {business?.funding_amount ? (
                    <div className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e]">
                      <span className="text-[color:var(--vv-text-tertiary)]">Target Ask Amount</span>
                      <span className="font-mono font-semibold text-[#C67A4E]">
                        ৳{business.funding_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : null}

                  {fundingSummary && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[color:var(--vv-text-tertiary)]">Milestone Progress</span>
                      <span className="font-mono font-semibold text-[#22C55E]">
                        {fundingSummary.funding_progress_percentage}% (৳{fundingSummary.total_released_bdt.toLocaleString('en-IN')} released)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Snapshot */}
              <div className="p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                    Recent Deal Activity
                  </h3>
                  <button
                    onClick={() => setTab('communication')}
                    className="text-xs text-[#C67A4E] hover:underline font-medium"
                  >
                    View Full Activity History →
                  </button>
                </div>

                {histories.length === 0 ? (
                  <p className="text-xs text-[color:var(--vv-text-tertiary)] italic py-2">
                    No stage transitions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {histories.slice(0, 3).map((item) => {
                      const timeStr = item.changed_at
                        ? new Date(item.changed_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently';
                      const label = item.previous_state_label
                        ? `Transitioned: ${item.previous_state_label} → ${item.new_state_label}`
                        : `Deal initialized in ${item.new_state_label}`;

                      return (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] shrink-0" />
                            <span className="text-[color:var(--vv-text-secondary)] truncate">{label}</span>
                          </div>
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ==================================================================== */}
        {/* TAB 2: NEGOTIATION                                                   */}
        {/* ==================================================================== */}
        {tab === 'negotiation' && (
          <div className="max-w-4xl space-y-6">
            {/* Negotiation Header Banner */}
            <div className="p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">
                  Commercial Terms Negotiation
                </h3>
                <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Propose, counter, and finalize investment amounts, equity stakes, and deliverables.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
              >
                Open Full Negotiation Panel →
              </Button>
            </div>

            {/* Active Proposal Card */}
            {negotiation?.active_proposal ? (
              <div className="rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-[color:var(--vv-text)] capitalize">
                      {negotiation.active_proposal.investment_type.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5 capitalize">
                      Proposal v{negotiation.active_proposal.version} • Submitted by {negotiation.active_proposal.proposed_by_role}
                      {negotiation.active_proposal.created_at &&
                        ` • ${new Date(negotiation.active_proposal.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`}
                    </p>
                  </div>
                  <Badge variant={negotiation.active_proposal.status === 'accepted' ? 'success' : 'warning'} dot>
                    {negotiation.active_proposal.status}
                  </Badge>
                </div>

                <div className="divide-y divide-[#1c2a3e] text-xs">
                  {negotiation.active_proposal.amount !== null && negotiation.active_proposal.amount !== undefined && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-[color:var(--vv-text-tertiary)]">Financial Amount</span>
                      <span className="font-mono text-sm font-semibold text-[color:var(--vv-text)]">
                        BDT {Number(negotiation.active_proposal.amount).toLocaleString('en-IN')} (Simulated)
                      </span>
                    </div>
                  )}

                  {negotiation.active_proposal.equity_percentage !== null &&
                    negotiation.active_proposal.equity_percentage !== undefined && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">Equity Stake</span>
                        <span className="font-mono text-sm font-semibold text-[#22C55E]">
                          {negotiation.active_proposal.equity_percentage}%
                        </span>
                      </div>
                    )}

                  {negotiation.active_proposal.profit_sharing_percentage !== null &&
                    negotiation.active_proposal.profit_sharing_percentage !== undefined && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">Profit Sharing</span>
                        <span className="font-mono text-sm font-semibold text-[#C9A24B]">
                          {negotiation.active_proposal.profit_sharing_percentage}%
                        </span>
                      </div>
                    )}

                  {negotiation.active_proposal.loss_sharing_terms && (
                    <div className="flex items-start justify-between px-5 py-3">
                      <span className="text-[color:var(--vv-text-tertiary)]">Loss Sharing Terms</span>
                      <span className="text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                        {negotiation.active_proposal.loss_sharing_terms}
                      </span>
                    </div>
                  )}

                  {negotiation.active_proposal.proposed_terms && (
                    <div className="flex items-start justify-between px-5 py-3">
                      <span className="text-[color:var(--vv-text-tertiary)]">Deliverables & Milestone Terms</span>
                      <span className="text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                        {negotiation.active_proposal.proposed_terms}
                      </span>
                    </div>
                  )}

                  {negotiation.active_proposal.note && (
                    <div className="flex items-start justify-between px-5 py-3">
                      <span className="text-[color:var(--vv-text-tertiary)]">Proposal Note</span>
                      <span className="text-[color:var(--vv-text-tertiary)] italic text-right max-w-[60%]">
                        "{negotiation.active_proposal.note}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-[#1c2a3e] bg-[#121A2B] text-center space-y-3">
                <p className="text-sm font-semibold text-[color:var(--vv-text)]">No Active Proposal Yet</p>
                <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mx-auto">
                  Submit or review proposals in the dedicated Negotiation Panel to establish formal terms.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
                >
                  Open Negotiation Panel
                </Button>
              </div>
            )}

            {/* Negotiation Action Error Banner */}
            {negotiationActionError && (
              <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                <IconAlertTriangle s={15} className="shrink-0" />
                <span>{negotiationActionError}</span>
              </div>
            )}

            {/* Action Buttons */}
            {canParticipantAct ? (
              negotiation?.active_proposal?.status === 'accepted' ? (
                <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#22C55E] font-medium">
                    <IconCheck s={16} />
                    <span>Negotiation Terms Accepted — Both parties approved proposal v{negotiation.active_proposal.version}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
                  >
                    View Negotiation History
                  </Button>
                </div>
              ) : negotiation?.active_proposal?.status === 'proposed' ? (
                user?.id === negotiation.active_proposal.proposed_by_user_id ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#C67A4E]/5 border border-[#C67A4E]/20 text-xs">
                    <p className="text-[color:var(--vv-text-tertiary)]">
                      Your proposal v{negotiation.active_proposal.version} has been submitted. Awaiting counterparty response.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
                    >
                      Open Full Negotiation Panel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
                    >
                      Review / Counter Proposal
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={isAcceptingTerms}
                      onClick={handleAcceptProposalInDealRoom}
                    >
                      {isAcceptingTerms ? 'Accepting Terms...' : 'Accept Terms'}
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex justify-center">
                  <Button
                    onClick={() => navigate(`/app/negotiation/${deal?.id || ''}?return=/app/deals/${deal?.id || ''}`)}
                  >
                    Propose Initial Terms
                  </Button>
                </div>
              )
            ) : (
              <div className="p-3.5 rounded-lg border border-[#1c2a3e] text-xs text-[color:var(--vv-text-tertiary)] text-center">
                {isAdmin
                  ? 'Admin oversight: participant negotiation actions are disabled.'
                  : 'Negotiation actions are unavailable in this workspace.'}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: AGREEMENT & DOCUMENTS (No fake static docs)                   */}
        {/* ==================================================================== */}
        {tab === 'agreement' && (
          <div className="max-w-4xl space-y-6">
            {/* Agreement Error Banner */}
            {agreementError && (
              <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                <IconAlertTriangle s={15} className="shrink-0" />
                <span>{agreementError}</span>
              </div>
            )}

            {/* Bilateral NDA Status Section */}
            <div className="p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
                    <IconLock s={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                      Mutual Non-Disclosure Agreement (NDA)
                    </h3>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                      Bilateral confidentiality protection governing data room access
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    ndaStatus?.status === 'active' || dealStage >= 4
                      ? 'success'
                      : ndaStatus?.status === 'pending'
                      ? 'warning'
                      : 'neutral'
                  }
                  dot
                >
                  {ndaStatus?.status === 'active' || dealStage >= 4
                    ? 'Active / Signed'
                    : ndaStatus?.status === 'pending'
                    ? 'Pending Acceptance'
                    : 'Required'}
                </Badge>
              </div>

              <div className="pt-2 border-t border-[#1c2a3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <p className="text-[color:var(--vv-text-tertiary)]">
                  {ndaStatus?.status === 'active' || dealStage >= 4
                    ? 'Bilateral NDA is active and verified. Protected business disclosures are unlocked.'
                    : ndaStatus?.status === 'pending'
                    ? ndaStatus.current_user_accepted
                      ? 'You have accepted the NDA. Waiting for counterparty signature.'
                      : 'An NDA is pending your review and signature.'
                    : 'A signed mutual NDA is required before accessing protected data room materials.'}
                </p>

                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() =>
                    navigate(
                      deal?.business_id
                        ? `/app/nda/${deal.business_id}?deal_id=${deal.id}&return=/app/deals/${deal.id}${
                            Number(user?.id) === Number(deal.founder_user_id) && deal.counterparty_user_id
                              ? `&counterparty_user_id=${deal.counterparty_user_id}`
                              : ''
                          }${deal.counterparty_role ? `&role=${deal.counterparty_role}` : ''}`
                        : '/app/nda'
                    )
                  }
                >
                  {ndaStatus?.status === 'pending' && !ndaStatus?.current_user_accepted
                    ? 'Review & Sign NDA'
                    : 'Review NDA'}
                </Button>
              </div>
            </div>

            {/* Agreement Execution Section */}
            {agreement ? (
              <div className="space-y-6">
                {/* Agreement Title & Status */}
                <div className="rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1c2a3e] flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">
                        {agreement.title || 'Deal Agreement'}
                      </h3>
                      {agreement.finalized_at && (
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                          Executed on{' '}
                          {new Date(agreement.finalized_at).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={isAgreementFinalized ? 'success' : agreement.status === 'declined' ? 'danger' : 'warning'}
                      dot
                    >
                      {isAgreementFinalized
                        ? 'Finalized & Immutable'
                        : agreement.status === 'pending_signatures'
                        ? 'Pending Signatures'
                        : agreement.status}
                    </Badge>
                  </div>

                  {/* Agreed Terms Snapshot */}
                  <div className="px-5 py-3 border-b border-[#1c2a3e] bg-[#0E1524]">
                    <h4 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                      Agreed Terms Snapshot
                    </h4>
                  </div>
                  <div className="divide-y divide-[#1c2a3e] text-xs">
                    {agreement.terms_snapshot?.investment_type && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">
                          {agreement.terms_snapshot.investment_type === 'professional_collaboration' ? 'Engagement Model' : 'Investment Type'}
                        </span>
                        <span className="font-semibold text-[color:var(--vv-text)] capitalize">
                          {agreement.terms_snapshot.investment_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {agreement.terms_snapshot?.amount !== null && agreement.terms_snapshot?.amount !== undefined && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">
                          {agreement.terms_snapshot.investment_type === 'professional_collaboration' ? 'Agreed Compensation' : 'Investment Amount'}
                        </span>
                        <span className="font-mono font-semibold text-[color:var(--vv-text)]">
                          BDT {Number(agreement.terms_snapshot.amount).toLocaleString('en-IN')} (Simulated)
                        </span>
                      </div>
                    )}
                    {agreement.terms_snapshot?.equity_percentage !== null &&
                      agreement.terms_snapshot?.equity_percentage !== undefined && (
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="text-[color:var(--vv-text-tertiary)]">Equity Stake</span>
                          <span className="font-mono font-semibold text-[#22C55E]">
                            {agreement.terms_snapshot.equity_percentage}%
                          </span>
                        </div>
                      )}
                    {agreement.terms_snapshot?.profit_sharing_percentage !== null &&
                      agreement.terms_snapshot?.profit_sharing_percentage !== undefined && (
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="text-[color:var(--vv-text-tertiary)]">Profit Sharing</span>
                          <span className="font-mono font-semibold text-[#C9A24B]">
                            {agreement.terms_snapshot.profit_sharing_percentage}%
                          </span>
                        </div>
                      )}
                    {agreement.terms_snapshot?.loss_sharing_terms && (
                      <div className="flex items-start justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">Loss Sharing Terms</span>
                        <span className="text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                          {agreement.terms_snapshot.loss_sharing_terms}
                        </span>
                      </div>
                    )}
                    {agreement.terms_snapshot?.proposed_terms && (
                      <div className="flex items-start justify-between px-5 py-3">
                        <span className="text-[color:var(--vv-text-tertiary)]">Scope & Deliverables</span>
                        <span className="text-[color:var(--vv-text-secondary)] text-right max-w-[60%]">
                          {agreement.terms_snapshot.proposed_terms}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agreement Document Text Preview */}
                {agreement.agreement_text && (
                  <div className="rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#1c2a3e] flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                        Agreement Document Draft
                      </h4>
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Standard Platform Terms</span>
                    </div>
                    <div className="p-5 max-h-60 overflow-y-auto bg-[#0D1626] font-mono text-xs leading-relaxed text-[color:var(--vv-text-secondary)] whitespace-pre-line select-text border-t border-[#1c2a3e]">
                      {agreement.agreement_text}
                    </div>
                  </div>
                )}

                {/* Participant Signatures Box */}
                <div className="rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1c2a3e]">
                    <h4 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
                      Bilateral Signatures
                    </h4>
                  </div>
                  <div className="divide-y divide-[#1c2a3e] text-xs">
                    {/* Founder Signature */}
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center text-xs font-bold text-[color:var(--vv-text)]">
                          {(business?.name || 'F')[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[color:var(--vv-text)]">
                            {business?.name ? `${business.name} (Founder)` : 'Founder / Business Owner'}
                          </p>
                          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Founder Execution</p>
                        </div>
                      </div>
                      {agreement.founder_signed_at ? (
                        <Badge variant="success" dot>
                          Signed ({new Date(agreement.founder_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </Badge>
                      ) : (
                        <Badge variant="warning" dot>Awaiting signature</Badge>
                      )}
                    </div>

                    {/* Counterparty Signature */}
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center text-xs font-bold text-[#C67A4E]">
                          {deal?.counterparty_role === 'investor' ? 'I' : 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-[color:var(--vv-text)]">
                            {deal?.counterparty_role === 'investor' ? 'Investor' : 'Professional Partner'}
                          </p>
                          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Counterparty Execution</p>
                        </div>
                      </div>
                      {agreement.counterparty_signed_at ? (
                        <Badge variant="success" dot>
                          Signed ({new Date(agreement.counterparty_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </Badge>
                      ) : (
                        <Badge variant="warning" dot>Awaiting signature</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signing / Activation Actions */}
                {isAgreementFinalized ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 text-xs text-[#22C55E] text-center font-medium">
                      This agreement is fully signed and immutable. You can now activate and fund milestone tranches.
                    </div>

                    {/* Milestone Allocation Status Card */}
                    <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1c2a3e] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[color:var(--vv-text)]">Milestone Funding Schedule</span>
                        <Badge
                          variant={isAllocationComplete ? 'success' : milestones.length > 0 ? 'warning' : 'neutral'}
                          dot
                        >
                          {isAllocationComplete ? 'Fully Allocated' : milestones.length === 0 ? 'No Milestones Defined' : 'Allocation Required'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-[#0D1626] rounded-lg border border-[#1c2a3e]/60">
                        <div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Agreed Amount</p>
                          <p className="text-xs font-mono font-bold text-[color:var(--vv-text)] mt-0.5">
                            ৳{committedAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Allocated</p>
                          <p className={`text-xs font-mono font-bold mt-0.5 ${isAllocationComplete ? 'text-[#22C55E]' : 'text-[#C67A4E]'}`}>
                            ৳{totalAllocated.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Remaining</p>
                          <p className="text-xs font-mono font-bold text-[color:var(--vv-text-tertiary)] mt-0.5">
                            ৳{remainingToAllocate.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Defined milestones list */}
                      {milestones.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {milestones.map((m, idx) => (
                            <div key={m.id || idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1626] border border-[#1c2a3e]/50 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-[#1C283E] text-[10px] font-bold text-[color:var(--vv-text-secondary)] flex items-center justify-center shrink-0">
                                  {m.sequence_order || idx + 1}
                                </span>
                                <span className="text-[color:var(--vv-text)] font-medium truncate">{m.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-[#C67A4E] font-semibold">
                                  ৳{Number(m.target_amount).toLocaleString('en-IN')}
                                </span>
                                {deal?.stage === 'agreement' && isFounder && (
                                  <button
                                    type="button"
                                    disabled={deletingMilestoneId === m.id}
                                    onClick={() => handleDeleteMilestone(m.id)}
                                    className="text-red-400/70 hover:text-red-400 px-1 text-[11px] transition-colors"
                                    title="Delete milestone"
                                  >
                                    {deletingMilestoneId === m.id ? '...' : '✕'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Founder Milestone Creation Form */}
                      {deal?.stage === 'agreement' && isFounder && !isAllocationComplete && (
                        <div className="pt-2">
                          {!showAddMilestone ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setNewMilestoneAmount(remainingToAllocate > 0 ? remainingToAllocate : '');
                                setNewMilestoneTitle(`Milestone ${milestones.length + 1}`);
                                setShowAddMilestone(true);
                              }}
                            >
                              + Define Milestone {milestones.length === 0 ? '(Required for Activation)' : 'Tranche'}
                            </Button>
                          ) : (
                            <form onSubmit={handleCreateMilestone} className="space-y-3 p-3.5 rounded-xl bg-[#0D1626] border border-[#C67A4E]/30">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-[color:var(--vv-text)]">New Milestone Definition</p>
                                <button
                                  type="button"
                                  onClick={() => setShowAddMilestone(false)}
                                  className="text-xs text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"
                                >
                                  Cancel
                                </button>
                              </div>

                              {addMilestoneError && (
                                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-lg">
                                  <IconAlertTriangle s={13} />
                                  <span>{addMilestoneError}</span>
                                </div>
                              )}

                              <div>
                                <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">Milestone Title</label>
                                <input
                                  type="text"
                                  value={newMilestoneTitle}
                                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                  placeholder="e.g. Phase 1: Prototype Completion"
                                  className="w-full px-3 py-1.5 text-xs bg-[#121A2B] border border-[#1c2a3e] rounded-lg text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">Target Amount (BDT)</label>
                                  <input
                                    type="number"
                                    value={newMilestoneAmount}
                                    onChange={(e) => setNewMilestoneAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="any"
                                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#121A2B] border border-[#1c2a3e] rounded-lg text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">Target Date (Optional)</label>
                                  <input
                                    type="date"
                                    value={newMilestoneDate}
                                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-[#121A2B] border border-[#1c2a3e] rounded-lg text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] mb-1">Description (Optional)</label>
                                <textarea
                                  value={newMilestoneDesc}
                                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                                  placeholder="Key deliverables..."
                                  rows={2}
                                  className="w-full px-3 py-1.5 text-xs bg-[#121A2B] border border-[#1c2a3e] rounded-lg text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
                                />
                              </div>

                              <Button size="sm" className="w-full" disabled={isAddingMilestone} type="submit">
                                {isAddingMilestone ? 'Saving Milestone...' : 'Save Milestone'}
                              </Button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* Counterparty waiting notice */}
                      {deal?.stage === 'agreement' && !isFounder && !isAllocationComplete && (
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center italic">
                          Waiting for founder to define milestone schedule totaling BDT {committedAmount.toLocaleString('en-IN')}.
                        </p>
                      )}
                    </div>

                    {deal?.stage === 'agreement' && (
                      isAdmin ? (
                        <p className="text-xs text-[color:var(--vv-text-tertiary)] text-center italic">
                          Admin oversight: milestone activation is disabled.
                        </p>
                      ) : isParticipant ? (
                        <div className="space-y-2">
                          {milestoneActivationError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                              <IconAlertTriangle s={15} />
                              <span>{milestoneActivationError}</span>
                            </div>
                          )}
                          <Button
                            className="w-full"
                            disabled={isActivatingMilestones || !isAllocationComplete}
                            onClick={handleActivateMilestones}
                          >
                            {isActivatingMilestones
                              ? 'Activating Milestone Funding...'
                              : !isAllocationComplete
                              ? `Milestone Allocation Required (BDT ${remainingToAllocate.toLocaleString('en-IN')} remaining)`
                              : 'Activate Milestone Funding Stage'}
                          </Button>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : agreement.status === 'pending_signatures' ? (
                  isAdmin ? (
                    <div className="p-3.5 rounded-lg border border-[#1c2a3e] text-xs text-[color:var(--vv-text-tertiary)] text-center">
                      Admin oversight: participant signing actions are disabled.
                    </div>
                  ) : hasCurrentUserSignedAgreement ? (
                    <div className="p-4 rounded-xl bg-[#C67A4E]/5 border border-[#C67A4E]/20 flex items-center gap-3">
                      <IconCheck s={16} className="text-[#22C55E] shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[color:var(--vv-text)]">You have signed this agreement</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                          Waiting for the counterparty to complete their signature.
                        </p>
                      </div>
                    </div>
                  ) : isParticipant ? (
                    <Button className="w-full" disabled={isSigningAgreement} onClick={handleSignAgreement}>
                      {isSigningAgreement ? 'Signing Agreement...' : 'Sign Deal Agreement'}
                    </Button>
                  ) : null
                ) : null}
              </div>
            ) : (
              /* Null Agreement State */
              (() => {
                const hasAcceptedProposal =
                  negotiation?.active_proposal?.status === 'accepted' ||
                  negotiation?.proposals?.some((p) => p.status === 'accepted');

                if (hasAcceptedProposal) {
                  return (
                    <div className="p-8 rounded-xl border border-[#1c2a3e] bg-[#121A2B] text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] mx-auto">
                        <IconFileText s={22} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">
                          Negotiation Terms Accepted — Agreement Ready to Draft
                        </h3>
                        <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mt-1">
                          Commercial terms have been approved. Generate the formal bilateral agreement draft to proceed with execution.
                        </p>
                      </div>
                      {isAdmin ? (
                        <p className="text-xs text-[color:var(--vv-text-tertiary)] italic">
                          Admin oversight: agreement draft generation is disabled.
                        </p>
                      ) : isParticipant ? (
                        <Button disabled={isGeneratingAgreement} onClick={handleGenerateAgreement}>
                          {isGeneratingAgreement ? 'Generating Draft...' : 'Generate Agreement Draft'}
                        </Button>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div className="p-8 rounded-xl border border-[#1c2a3e] bg-[#121A2B] text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center text-[color:var(--vv-text-tertiary)] mx-auto">
                      <IconLock s={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">No Agreement Draft Available</h3>
                      <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mt-1">
                        An agreement draft is generated automatically once proposal terms are submitted and accepted by both parties.
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setTab('negotiation')}>
                      Go to Negotiation Terms
                    </Button>
                  </div>
                );
              })()
            )}

            {/* Staged Disclosures & Real Data Room Level */}
            <div className="pt-2">
              <StagedDisclosure currentStage={dealStage >= 4 ? 3 : 2} />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: MILESTONES                                                    */}
        {/* ==================================================================== */}
        {tab === 'milestones' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--vv-text)]">
                  Milestone Funding Schedule
                </h3>
                <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-0.5">
                  Track delivery tranches, funding commitments, and release approvals.
                </p>
              </div>
              <button
                onClick={() =>
                  navigate(
                    deal?.id
                      ? `/app/milestones?deal_id=${deal.id}&return=/app/deals/${deal.id}`
                      : '/app/milestones'
                  )
                }
                className="text-xs text-[#C67A4E] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Full Tracking View</span>
                <IconArrowRight s={12} />
              </button>
            </div>

            {/* Funding Summary Banner */}
            {fundingSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 rounded-xl bg-[#121A2B] border border-[#1c2a3e]">
                <div>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Total Committed</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-[color:var(--vv-text)] mt-1">
                    ৳{fundingSummary.total_committed_bdt.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Total Allocated</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-[#C67A4E] mt-1">
                    ৳{fundingSummary.total_allocated_bdt.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Total Released</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-[#22C55E] mt-1">
                    ৳{fundingSummary.total_released_bdt.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Progress</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-[#C9A24B] mt-1">
                    {fundingSummary.funding_progress_percentage}%
                  </p>
                </div>
              </div>
            )}

            {/* Ready to complete deal banner */}
            {isDealCompletionEligible && (
              <div className="p-5 rounded-xl bg-[#121A2B] border border-[#22C55E]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                      <IconCheck s={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[color:var(--vv-text)]">
                        All Milestones Funded — Ready to Complete Deal
                      </h4>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                        Agreement is finalized, all tranches are released, and the milestone schedule is 100% fulfilled.
                      </p>
                    </div>
                  </div>
                  {isAdmin ? (
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                      Admin oversight: completion action disabled
                    </span>
                  ) : isFounder ? (
                    <Button
                      disabled={isCompletingDeal}
                      onClick={() => {
                        setDealCompletionError(null);
                        setShowCompleteModal(true);
                      }}
                      className="shrink-0"
                    >
                      Complete Deal
                    </Button>
                  ) : null}
                </div>
                {dealCompletionError && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                    <IconAlertTriangle s={14} />
                    <span>{dealCompletionError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Milestones Schedule List */}
            {milestonesLoading ? (
              <div className="p-8 rounded-xl border border-[#1c2a3e] bg-[#121A2B] text-center text-xs text-[color:var(--vv-text-tertiary)]">
                <div className="w-6 h-6 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto mb-2" />
                Loading milestone schedule...
              </div>
            ) : milestonesError ? (
              <div className="p-6 rounded-xl border border-red-500/20 bg-[#121A2B] text-center space-y-3">
                <IconAlertTriangle s={20} className="text-red-400 mx-auto" />
                <p className="text-xs text-red-400">{milestonesError}</p>
                <Button size="sm" variant="secondary" onClick={() => fetchDealData()}>
                  Retry Loading
                </Button>
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-8 rounded-xl border border-[#1c2a3e] bg-[#121A2B] text-center space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--vv-text)]">No Milestones Defined Yet</p>
                  <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto mt-1">
                    {deal?.stage === 'agreement' && isFounder
                      ? `Milestone funding tranches totaling BDT ${committedAmount.toLocaleString('en-IN')} must be scheduled before activating milestone funding.`
                      : 'Milestone funding tranches will be established and scheduled during the agreement execution phase.'}
                  </p>
                </div>
                {deal?.stage === 'agreement' && isFounder && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTab('agreement');
                      setNewMilestoneAmount(remainingToAllocate > 0 ? remainingToAllocate : '');
                      setNewMilestoneTitle('Milestone 1');
                      setShowAddMilestone(true);
                    }}
                  >
                    + Define Milestone Schedule
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                {milestones.map((m, index) => {
                  const isCompleted = m.status === 'funded';
                  const isActive = m.status === 'active' || m.status === 'submitted';
                  const isPending = m.status === 'pending';
                  const formattedAmount =
                    m.target_amount !== undefined && m.target_amount !== null
                      ? `BDT ${Number(m.target_amount).toLocaleString('en-IN')}`
                      : '—';
                  const formattedDate = m.target_date
                    ? new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <div
                      key={m.id || index}
                      className={`flex items-center gap-4 px-5 py-4 border-b border-[#1c2a3e] last:border-0 ${
                        isActive ? 'bg-[#152035]' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCompleted
                            ? 'bg-[#22C55E] border-[#22C55E] text-white'
                            : isActive
                            ? 'bg-[#C67A4E] border-[#C67A4E] text-white'
                            : 'border-[#1c2a3e] bg-[#1C283E] text-[color:var(--vv-text-tertiary)]'
                        }`}
                      >
                        {isCompleted ? <IconCheck s={12} /> : m.sequence_order || index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isPending ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'
                          }`}
                        >
                          {m.title}
                        </p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                          {formattedDate} {m.description ? `• ${m.description}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`font-mono text-xs font-semibold tabular-nums ${
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
                          {m.status === 'funded'
                            ? 'Funded'
                            : m.status === 'submitted'
                            ? 'Submitted'
                            : m.status === 'active'
                            ? 'Active'
                            : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: COMMUNICATION & ACTIVITY                                      */}
        {/* ==================================================================== */}
        {tab === 'communication' && (
          <div className="max-w-5xl space-y-5">
            {/* Split layout: Messages & Activity Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Deal Messages */}
              <div className="lg:col-span-7 flex flex-col h-[460px] lg:h-[calc(100vh-230px)] min-h-[380px] max-h-[600px] rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1c2a3e] bg-[#0F1728] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconMessageSquare s={14} className="text-[#C67A4E]" />
                    <h3 className="text-xs font-semibold text-[color:var(--vv-text)]">
                      Deal Messages
                    </h3>
                  </div>
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                  {messagesLoading ? (
                    <div className="py-16 text-center text-xs text-[color:var(--vv-text-tertiary)]">
                      <div className="w-5 h-5 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto mb-2" />
                      Loading deal conversation...
                    </div>
                  ) : messagesError ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center space-y-2">
                      <p className="text-xs text-red-400">{messagesError}</p>
                      <button
                        onClick={() => fetchDealData()}
                        className="text-[11px] font-semibold text-[#C67A4E] hover:underline"
                      >
                        Retry Loading
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center space-y-1">
                      <p className="text-xs font-semibold text-[color:var(--vv-text)]">No messages yet</p>
                      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] max-w-xs mx-auto">
                        Send a message below to start communicating with authorized deal participants.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = user && msg.sender_user_id === user.id;
                      const senderName = isMe
                        ? `You (${user?.name || (canFounderAct ? 'Founder' : 'Counterparty')})`
                        : msg.sender?.name || (canFounderAct ? 'Counterparty' : business?.name || 'Founder');
                      const initial = (msg.sender?.name || (isMe ? user?.name : 'P') || 'P')[0].toUpperCase();
                      const timeStr = msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now';

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              isMe
                                ? 'bg-[#C67A4E]/20 border-[#C67A4E]/40 text-[#C67A4E]'
                                : 'bg-[#1C283E] border-[#1c2a3e] text-[color:var(--vv-text-secondary)]'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className={`min-w-0 max-w-[85%] ${isMe ? 'text-right' : ''}`}>
                            <div
                              className={`flex items-baseline gap-2 mb-1 ${
                                isMe ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span className="text-[11px] font-semibold text-[color:var(--vv-text)]">
                                {senderName}
                              </span>
                              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">
                                {timeStr}
                              </span>
                            </div>
                            <div
                              className={`p-2.5 rounded-lg text-xs leading-relaxed text-left break-words ${
                                isMe
                                  ? 'bg-[#182338] border border-[#C67A4E]/30 text-white'
                                  : 'bg-[#0D1626] border border-[#1c2a3e] text-[color:var(--vv-text-secondary)]'
                              }`}
                            >
                              {msg.body}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Error alert if send failed */}
                {sendMessageError && (
                  <div className="px-3 py-1.5 bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] flex items-center justify-between">
                    <span>{sendMessageError}</span>
                    <button
                      onClick={() => setSendMessageError(null)}
                      className="text-red-300 hover:underline font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-2.5 border-t border-[#1c2a3e] bg-[#0F1728] flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !sendingMessage) handleSendMessage();
                    }}
                    placeholder={
                      canParticipantAct
                        ? 'Type a message to deal participants...'
                        : 'Messaging disabled in view-only mode'
                    }
                    disabled={!canParticipantAct || sendingMessage}
                    className="flex-1 h-8 px-3 bg-[#0D1626] border border-[#1c2a3e] rounded-md text-xs text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors disabled:opacity-50"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!canParticipantAct || !chatMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>

              {/* Right Column: Full Authoritative Activity Log */}
              <div className="lg:col-span-5 flex flex-col h-[460px] lg:h-[calc(100vh-230px)] min-h-[380px] max-h-[600px] rounded-xl border border-[#1c2a3e] bg-[#121A2B] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1c2a3e] bg-[#0F1728] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconActivity s={14} className="text-[#C67A4E]" />
                    <h3 className="text-xs font-semibold text-[color:var(--vv-text)]">
                      Authoritative State Log
                    </h3>
                  </div>
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">
                    {histories.length} events
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {histories.length === 0 ? (
                    <p className="text-xs text-[color:var(--vv-text-tertiary)] italic text-center py-8">
                      No state transitions recorded.
                    </p>
                  ) : (
                    histories.map((e) => {
                      const timeStr = e.changed_at
                        ? new Date(e.changed_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently';
                      const label = e.previous_state_label
                        ? `Transition: ${e.previous_state_label} → ${e.new_state_label}`
                        : `Initialized: ${e.new_state_label}`;

                      return (
                        <div key={e.id} className="p-3 bg-[#0D1626] border border-[#1c2a3e] rounded-lg text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] shrink-0" />
                            <span className="font-medium text-[color:var(--vv-text)] truncate">{label}</span>
                          </div>
                          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono pl-3.5">
                            {timeStr}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Complete Deal Confirmation Modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-deal-modal-title"
          data-testid="complete-deal-modal"
        >
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
            onClick={() => !isCompletingDeal && setShowCompleteModal(false)}
            aria-hidden="true"
          />
          <div className="relative border border-[#1c2a3e] rounded-2xl w-full max-w-md bg-[#121A2B] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                <IconCheck s={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="complete-deal-modal-title"
                  className="text-base font-bold text-[color:var(--vv-text)] font-display"
                >
                  Complete Deal
                </h3>
                <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1.5 leading-relaxed">
                  All milestones have been confirmed and all simulated funding tranches have been released. Completing this deal will close the active deal lifecycle.
                </p>
              </div>
            </div>

            {dealCompletionError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                <IconAlertTriangle s={14} />
                <span>{dealCompletionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompletingDeal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCompleteDeal}
                disabled={isCompletingDeal}
                data-testid="confirm-complete-deal-btn"
              >
                {isCompletingDeal ? 'Completing Deal...' : 'Complete Deal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
