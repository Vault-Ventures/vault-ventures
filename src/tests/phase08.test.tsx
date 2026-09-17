import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Reputation from '../pages/shared/Reputation';
import { api, ReputationSummaryData } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'founder',
  user: { id: 1, name: 'Alice Founder', roles: ['founder'] },
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
  context.user = { id: 1, name: 'Alice Founder', roles: ['founder'] };
});

function mountReputation(role = 'founder') {
  return render(
    <MemoryRouter initialEntries={[`/app/${role}/reputation`]}>
      <Routes>
        <Route path="/app/:role/reputation" element={<Reputation profileRole={role} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Phase 08: Reputation and Trust System', () => {
  it('displays deterministic reputation standing and separates verification tier from reputation', async () => {
    const mockReputation: ReputationSummaryData = {
      user_id: 1,
      role: 'founder',
      verification: {
        tier: 1,
        is_identity_verified: true,
        is_track_record_verified: false,
      },
      track_record: {
        completed_deals_count: 2,
        completed_milestones_count: 4,
        total_simulated_bdt: '350000.00',
      },
      feedback: {
        reviews_count: 2,
        average_rating: 4.8,
        reviews: [
          {
            id: 1,
            deal_id: 81,
            reviewer_name: 'Meridian Capital',
            reviewer_role: 'investor',
            business_name: 'NovaTech AI Ltd',
            rating: 5,
            comment: 'Outstanding milestone execution and transparency.',
            submitted_at: '2026-09-15T10:00:00Z',
          },
        ],
      },
      profile_evidence: {
        businesses_count: 1,
        businesses: [
          {
            id: 42,
            name: 'NovaTech AI Ltd',
            industry: 'technology',
            stage: 'early_traction',
            location: 'Dhaka, Bangladesh',
            status: 'submitted',
          },
        ],
      },
    };

    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);

    mountReputation('founder');

    expect(await screen.findByText('Alice Founder')).toBeTruthy();
    // Reputation standing
    expect(screen.getByText('Reputation Standing')).toBeTruthy();
    expect((await screen.findAllByText('Trusted')).length).toBeGreaterThan(0);
    // Verification panel
    expect(screen.getByText('Verification Status')).toBeTruthy();
    expect((await screen.findAllByText('Tier 1 - Identity Verified')).length).toBeGreaterThan(0);
    // Notice clarifying separation
    expect(screen.getByText(/Reputation on Vault Ventures is based entirely on verified platform activity/i)).toBeTruthy();
  });

  it('renders track record breakdown and profile evidence for investor and professional roles', async () => {
    context.role = 'investor';
    context.user = { id: 2, name: 'Bob Investor', roles: ['investor'] };

    const mockReputation: ReputationSummaryData = {
      user_id: 2,
      role: 'investor',
      verification: {
        tier: 2,
        is_identity_verified: true,
        is_track_record_verified: true,
      },
      track_record: {
        completed_deals_count: 3,
        completed_milestones_count: 6,
        total_simulated_bdt: '750000.00',
      },
      feedback: {
        reviews_count: 3,
        average_rating: 4.9,
        reviews: [],
      },
      profile_evidence: {
        industry: 'technology',
        investment_types: ['micro_profit_sharing', 'standard_equity'],
        minimum_investment_bdt: 50000,
        maximum_investment_bdt: 500000,
        location: 'Dhaka',
      },
    };

    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);

    mountReputation('investor');

    expect(await screen.findByText('Bob Investor')).toBeTruthy();
    expect((await screen.findAllByText('Proven')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Completed Deals')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('3')).length).toBeGreaterThan(0);
    expect(screen.getByText('Milestones Funded & Released')).toBeTruthy();
    expect((await screen.findAllByText('6')).length).toBeGreaterThan(0);
  });

  it('handles empty reputation state without inventing arbitrary scores or using AI terminology', async () => {
    const mockEmptyReputation: ReputationSummaryData = {
      user_id: 1,
      role: 'founder',
      verification: {
        tier: 0,
        is_identity_verified: false,
        is_track_record_verified: false,
      },
      track_record: {
        completed_deals_count: 0,
        completed_milestones_count: 0,
        total_simulated_bdt: '0.00',
      },
      feedback: {
        reviews_count: 0,
        average_rating: null,
        reviews: [],
      },
      profile_evidence: {
        businesses_count: 0,
        businesses: [],
      },
    };

    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockEmptyReputation);

    mountReputation('founder');

    expect((await screen.findAllByText('Emerging')).length).toBeGreaterThan(0);
    expect(screen.getByText(/No feedback received yet/i)).toBeTruthy();
    // Ensure no AI score terminology is rendered on reputation screen
    expect(screen.queryByText(/AI Match Score/i)).toBeNull();
    expect(screen.queryByText(/AI Ranking/i)).toBeNull();
  });
});

