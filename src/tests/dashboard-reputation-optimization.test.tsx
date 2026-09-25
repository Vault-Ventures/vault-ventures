import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FounderDashboard from '../pages/founder/Dashboard';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    reputation: {
      get: vi.fn(),
    },
    recommendations: {
      investors: vi.fn(),
    },
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Founder John', verification_tier: 1 },
    session: { activeRole: 'founder', roles: ['founder'], isAdmin: false, onboardingComplete: true },
    hasRole: () => true,
  }),
}));

describe('Dashboard Reputation Performance Optimization Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renders business list immediately while reputation loads asynchronously', async () => {
    // Fast response for businesses
    vi.mocked(api.get).mockResolvedValueOnce({
      items: [
        {
          id: 1,
          name: 'Apex Robotics',
          industry: 'Robotics',
          business_stage: 'early_traction',
          status: 'published',
        },
      ],
    });

    // Slow or deferred response for reputation
    let resolveReputation: (val: any) => void = () => {};
    const repPromise = new Promise((resolve) => {
      resolveReputation = resolve;
    });
    vi.mocked(api.reputation.get).mockReturnValueOnce(repPromise as any);
    vi.mocked(api.recommendations.investors).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <FounderDashboard />
      </MemoryRouter>
    );

    // Verify businesses render immediately WITHOUT waiting for reputation to finish
    await waitFor(() => {
      expect(screen.getAllByText('Apex Robotics').length).toBeGreaterThan(0);
    });

    // Now resolve reputation
    resolveReputation({
      user_id: 1,
      role: 'founder',
      verification: { tier: 1, is_identity_verified: true, is_track_record_verified: false },
      track_record: { completed_deals_count: 5, completed_milestones_count: 12, total_simulated_bdt: '450000.00' },
      feedback: { reviews_count: 4, average_rating: 4.8, reviews: [] },
      profile_evidence: { businesses_count: 1, businesses: [] },
      financial_transparency: { submitted_reports_count: 3, verified_reports_count: 2, evidence_backed_reports_count: 2, active_discrepancies_count: 0 },
    });

    // Verify metrics updated
    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy(); // completed deals
      expect(screen.getByText('12')).toBeTruthy(); // funded milestones
    });
  });

  it('2. Dashboard remains completely functional even if reputation request fails', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      items: [
        {
          id: 2,
          name: 'GreenAgro BD',
          industry: 'Agriculture',
          business_stage: 'idea',
          status: 'draft',
        },
      ],
    });

    vi.mocked(api.reputation.get).mockRejectedValueOnce(new Error('Network error on reputation'));
    vi.mocked(api.recommendations.investors).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <FounderDashboard />
      </MemoryRouter>
    );

    // Businesses still render cleanly
    await waitFor(() => {
      expect(screen.getAllByText('GreenAgro BD').length).toBeGreaterThan(0);
    });

    // Default fallback '0' is shown for deal metrics instead of crashing
    expect(screen.getByText('0 published, 1 draft')).toBeTruthy();
  });
});

