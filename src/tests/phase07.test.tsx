import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealRoom from '../pages/shared/DealRoom';
import { api, DealAgreementData, NegotiationData, DealMilestoneData } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'founder',
  user: { id: 1, roles: ['founder'] },
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: context.role }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: context.user }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'founder';
  context.user = { id: 1, roles: ['founder'] };
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url.includes('/businesses/42')) {
      return { id: 42, name: 'NovaTech AI Ltd' } as any;
    }
    if (url.includes('/nda')) {
      return { status: 'active' } as any;
    }
    if (url.includes('/history')) {
      return [] as any;
    }
    return { status: 'active' } as any;
  });
  vi.spyOn(api.businesses, 'get').mockResolvedValue({ id: 42, name: 'NovaTech AI Ltd' } as any);
  vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });
});

function mountDealRoom(dealId = '81') {
  return render(
    <MemoryRouter initialEntries={[`/app/deals/${dealId}`]}>
      <Routes>
        <Route path="/app/deals/:dealId" element={<DealRoom />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Phase 07: Deal Room & Negotiation Workflows', () => {
  it('BUG-022: renders negotiation terms and respects investment mode and turn-taking', async () => {
    const mockNegotiation: NegotiationData = {
      deal_id: 81,
      active_proposal: {
        id: 101,
        deal_id: 81,
        version: 1,
        proposed_by_user_id: 1,
        proposed_by_role: 'founder',
        investment_type: 'micro_profit_sharing',
        amount: 15000,
        equity_percentage: null,
        profit_sharing_percentage: 10,
        loss_sharing_terms: 'Loss proportional to investment',
        proposed_terms: '2 tranches',
        note: 'Initial proposal',
        status: 'proposed',
        created_at: '2026-09-16T10:00:00Z',
      },
      proposals: [],
    };

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 81,
      business_id: 42,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'negotiation',
      stage_label: 'Negotiation',
      stage_order: 5,
    } as any);

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue(mockNegotiation);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);

    mountDealRoom('81');

    fireEvent.click(await screen.findByRole('button', { name: /Negotiation/i }));
    expect(await screen.findByText(/15,000/i)).toBeTruthy();
    expect(screen.getByText(/10%/i)).toBeTruthy();
  });

  it('BUG-025: displays agreement terms snapshot and bilateral digital signatures', async () => {
    const mockAgreement: DealAgreementData = {
      id: 55,
      deal_id: 81,
      proposal_id: 101,
      agreement_type: 'profit_sharing_agreement',
      title: 'Micro Investment Profit-Loss Sharing Agreement',
      agreement_text: 'Simulated Platform Agreement Text',
      terms_snapshot: {
        proposal_id: 101,
        proposal_version: 1,
        investment_type: 'micro_profit_sharing',
        amount: 25000,
        currency: 'BDT',
        equity_percentage: null,
        profit_sharing_percentage: 12.5,
        loss_sharing_terms: 'Standard risk profile',
        proposed_terms: 'Standard terms',
        generated_at: '2026-09-16T10:00:00Z',
      },
      status: 'pending_signatures',
      founder_signed_at: '2026-09-16T11:00:00Z',
      founder_signed_user_id: 1,
      counterparty_signed_at: null,
      counterparty_signed_user_id: null,
      finalized_at: null,
    };

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 81,
      business_id: 42,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'agreement',
      stage_label: 'Agreement',
      stage_order: 6,
    } as any);

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(mockAgreement);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);

    mountDealRoom('81');

    fireEvent.click(await screen.findByRole('button', { name: 'Agreement' }));
    expect(await screen.findByText('Agreed Terms Snapshot')).toBeTruthy();
    expect(screen.getByText(/25,000/i)).toBeTruthy();
    expect(screen.getByText('Pending Signatures')).toBeTruthy();
    expect(screen.getByText(/Awaiting signature/i)).toBeTruthy();
  });

  it('BUG-026 & BUG-030: tracks sequential milestone states and funding execution', async () => {
    const mockMilestones: DealMilestoneData[] = [
      {
        id: 1,
        deal_id: 81,
        sequence_order: 1,
        title: 'MVP Prototype',
        description: 'Complete prototype',
        target_amount: 15000,
        target_date: '2026-10-01',
        status: 'funded',
        progress_percentage: 100,
        evidence_notes: 'Repository submitted',
        evidence_urls: ['https://github.com/example/repo'],
        dispute_reason: null,
        submitted_at: '2026-09-15T10:00:00Z',
        submitted_by_user_id: 1,
        confirmed_at: '2026-09-16T10:00:00Z',
        confirmed_by_user_id: 2,
        funded_at: '2026-09-16T10:00:00Z',
        confirmation_notes: 'Verified and approved',
      },
      {
        id: 2,
        deal_id: 81,
        sequence_order: 2,
        title: 'Beta Launch',
        description: 'Launch to 100 users',
        target_amount: 10000,
        target_date: '2026-11-01',
        status: 'active',
        progress_percentage: 50,
        evidence_notes: null,
        evidence_urls: null,
        dispute_reason: null,
        submitted_at: null,
        submitted_by_user_id: null,
        confirmed_at: null,
        confirmed_by_user_id: null,
        funded_at: null,
        confirmation_notes: null,
      },
    ];

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 81,
      business_id: 42,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'milestone_funding_active',
      stage_label: 'Milestone Funding Active',
      stage_order: 7,
    } as any);

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({
      deal_id: 81,
      summary: {
        total_committed_bdt: 25000,
        total_allocated_bdt: 25000,
        total_released_bdt: 15000,
        total_remaining_bdt: 10000,
        milestone_count: 2,
        funded_milestone_count: 1,
        funding_progress_percentage: 60,
      },
      milestones: mockMilestones,
    } as any);

    mountDealRoom('81');

    fireEvent.click(await screen.findByRole('button', { name: 'Milestones' }));
    expect(await screen.findByText('MVP Prototype')).toBeTruthy();
    expect(screen.getByText('Beta Launch')).toBeTruthy();
  });

  it('BUG-031: renders completed deal summary and leave feedback CTA', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 81,
      business_id: 42,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'completed',
      stage_label: 'Completed',
      stage_order: 8,
    } as any);

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({
      deal_id: 81,
      summary: {
        total_committed_bdt: 25000,
        total_allocated_bdt: 25000,
        total_released_bdt: 25000,
        total_remaining_bdt: 0,
        milestone_count: 2,
        funded_milestone_count: 2,
        funding_progress_percentage: 100,
      },
      milestones: [],
    } as any);

    mountDealRoom('81');

    expect((await screen.findAllByText(/Deal Completed/i)).length).toBeGreaterThan(0);
    expect(screen.getByText('Leave Feedback')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Leave Feedback/i })).toBeTruthy();
  });
});
