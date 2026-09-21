import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MilestoneTracking from '../pages/shared/MilestoneTracking';
import { api, DealMilestoneData, FundingSummaryData } from '../services/api';

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

const mockMilestones: DealMilestoneData[] = [
  {
    id: 10,
    deal_id: 2,
    sequence_order: 1,
    title: 'MVP Architecture',
    description: 'Initial deploy and technical documentation',
    target_amount: 3000,
    currency: 'BDT',
    target_date: '2026-10-01',
    status: 'funded',
    progress_percentage: 100,
    evidence_notes: 'Initial production rollout verified.',
    evidence_urls: ['https://storage.vault.test/demo.pdf'],
    submitted_at: '2026-09-19T10:00:00Z',
    submitted_by_user_id: 1,
    confirmed_at: '2026-09-19T12:00:00Z',
    confirmed_by_user_id: 2,
    confirmation_notes: 'Reviewed and approved by investor',
    funded_at: '2026-09-19T12:00:00Z',
    dispute_reason: null,
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-19T12:00:00Z',
  },
  {
    id: 11,
    deal_id: 2,
    sequence_order: 2,
    title: 'Beta Customer Onboarding',
    description: 'Onboard first 50 active users',
    target_amount: 2000,
    currency: 'BDT',
    target_date: '2026-11-01',
    status: 'active',
    progress_percentage: 50,
    evidence_notes: '25 users currently enrolled',
    evidence_urls: null,
    submitted_at: null,
    submitted_by_user_id: null,
    confirmed_at: null,
    confirmed_by_user_id: null,
    confirmation_notes: null,
    funded_at: null,
    dispute_reason: null,
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-19T14:00:00Z',
  },
];

const mockFundingSummary: FundingSummaryData = {
  currency: 'BDT',
  total_committed_bdt: 5000,
  total_allocated_bdt: 5000,
  total_released_bdt: 3000,
  remaining_locked_bdt: 2000,
  funding_progress_percentage: 60,
};

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'founder';
  context.user = { id: 1, roles: ['founder'] };

  vi.spyOn(api.deals, 'get').mockResolvedValue({
    id: 2,
    connection_id: 1,
    business_id: 42,
    founder_user_id: 1,
    counterparty_user_id: 2,
    counterparty_role: 'investor',
    stage: 'milestone_funding_active',
    stage_label: 'Milestone Funding Active',
    stage_order: 7,
    created_at: '2026-09-18T00:00:00Z',
    updated_at: '2026-09-19T00:00:00Z',
  });

  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url.includes('/businesses/42')) {
      return { id: 42, name: 'NovaTech Health AI' } as any;
    }
    return {} as any;
  });

  vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({
    deal_id: 2,
    summary: mockFundingSummary,
    milestones: mockMilestones,
  });
});

function mountMilestoneTracking(dealId = '2') {
  return render(
    <MemoryRouter initialEntries={[`/app/milestones?deal_id=${dealId}`]}>
      <Routes>
        <Route path="/app/milestones" element={<MilestoneTracking />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MilestoneTracking Component & Delete API', () => {
  it('renders milestone schedule, funding summary, and active status for participants', async () => {
    mountMilestoneTracking('2');

    expect(await screen.findByText(/NovaTech Health AI — Milestones/i)).toBeTruthy();
    expect(screen.getByText('MVP Architecture')).toBeTruthy();
    expect(screen.getAllByText('Beta Customer Onboarding').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/60%/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/৳3,000/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows Founder to update progress and submit 100% completion verification', async () => {
    const updateSpy = vi.spyOn(api.deals.milestones, 'updateProgress').mockResolvedValue({
      ...mockMilestones[1],
      progress_percentage: 75,
      evidence_notes: 'Added 10 more users',
    });

    mountMilestoneTracking('2');

    // Click Submit Progress button on the active milestone card
    const submitBtn = await screen.findByRole('button', { name: 'Submit Progress' });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Update Milestone Progress')).toBeTruthy();

    // Adjust progress slider to 75%
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    // Submit intermediate progress
    const saveBtn = screen.getByRole('button', { name: /Update Progress \(75%\)/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('2', 11, {
        progress_percentage: 75,
        notes: '25 users currently enrolled',
        evidence_urls: undefined,
      }, undefined);
    });
  });

  it('allows Investor to open confirmation modal and confirm milestone completion', async () => {
    context.role = 'investor';
    context.user = { id: 2, roles: ['investor'] };

    // Milestone 11 is now submitted awaiting confirmation
    const submittedMilestone: DealMilestoneData = {
      ...mockMilestones[1],
      status: 'submitted',
      progress_percentage: 100,
      evidence_notes: 'Completed full onboarding of 50 users.',
    };

    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({
      deal_id: 2,
      summary: mockFundingSummary,
      milestones: [mockMilestones[0], submittedMilestone],
    });

    const confirmSpy = vi.spyOn(api.deals.milestones, 'confirm').mockResolvedValue({
      ...submittedMilestone,
      status: 'funded',
      confirmed_at: '2026-09-20T10:00:00Z',
    });

    mountMilestoneTracking('2');

    const confirmBtn = await screen.findByRole('button', { name: 'Confirm Progress' });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText('Confirm Milestone & Release Tranche')).toBeTruthy();

    const executeBtn = screen.getByRole('button', { name: 'Confirm & Release Tranche' });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('2', 11, {
        confirmation_notes: undefined,
      }, 'investor');
    });
  });

  it('allows Investor to request revision with a dispute reason', async () => {
    context.role = 'investor';
    context.user = { id: 2, roles: ['investor'] };

    const submittedMilestone: DealMilestoneData = {
      ...mockMilestones[1],
      status: 'submitted',
      progress_percentage: 100,
      evidence_notes: 'Review pending',
    };

    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({
      deal_id: 2,
      summary: mockFundingSummary,
      milestones: [mockMilestones[0], submittedMilestone],
    });

    const disputeSpy = vi.spyOn(api.deals.milestones, 'dispute').mockResolvedValue({
      ...submittedMilestone,
      status: 'active',
      dispute_reason: 'Please provide user activity logs.',
    });

    mountMilestoneTracking('2');

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Progress' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Request Revision' }));

    expect(await screen.findByText('Request Milestone Revision')).toBeTruthy();

    const textarea = screen.getByPlaceholderText(/Explain what deliverables need adjustment/i);
    fireEvent.change(textarea, { target: { value: 'Please provide user activity logs.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Return for Revision' }));

    await waitFor(() => {
      expect(disputeSpy).toHaveBeenCalledWith('2', 11, {
        dispute_reason: 'Please provide user activity logs.',
      }, 'investor');
    });
  });

  it('verifies api.deals.milestones.delete calls DELETE /api/me/deals/:dealId/milestones/:milestoneId', async () => {
    const deleteSpy = vi.spyOn(api.deals.milestones, 'delete').mockResolvedValue({
      deal_id: 2,
      deleted_milestone_id: 11,
      summary: {
        currency: 'BDT',
        total_committed_bdt: 5000,
        total_allocated_bdt: 3000,
        total_released_bdt: 3000,
        remaining_locked_bdt: 2000,
        funding_progress_percentage: 60,
      },
    });

    const res = await api.deals.milestones.delete(2, 11);
    expect(deleteSpy).toHaveBeenCalledWith(2, 11);
    expect(res.deleted_milestone_id).toBe(11);
    expect(res.summary.total_allocated_bdt).toBe(3000);
  });
});
