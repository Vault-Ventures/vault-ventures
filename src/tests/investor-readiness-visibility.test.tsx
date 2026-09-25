import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import BusinessProfile from '../pages/founder/BusinessProfile';

let currentRole = 'investor';
vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: currentRole, setRole: vi.fn() }),
}));

describe('Investor Readiness Visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentRole = 'investor';
  });

  it('renders readiness score from disclosure for an investor without calling founder-only endpoint', async () => {
    const mockDisclosure = {
      disclosure: {
        stage: 1,
        stage_label: 'Teaser',
        has_expressed_interest: false,
      },
      business: {
        id: 5,
        name: 'alvi health tech',
        description: 'Health tech company',
        industry: 'Healthcare',
        business_stage: 'Seed',
        location: 'Dhaka',
        status: 'published',
        founder_verification_tier: 1,
      },
      requirements: {
        funding_amount: 5000000,
        skills: ['HealthTech'],
        accepted_investment_types: ['equity'],
      },
      readiness: {
        overall_score: '62.50',
        factor_results: {
          market_potential: { name: 'Market Potential', score: '75.00', weight: '12.50' },
          business_model_clarity: { name: 'Business Model Clarity', score: '50.00', weight: '12.50' },
        },
        weak_areas: ['business_model_clarity'],
        suggestions: [{ id: 's1', text: 'Clarify unit economics' }],
        evaluated_at: '2026-09-24T17:48:11.000Z',
      },
      documents: [],
    };

    const getDisclosureSpy = vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockDisclosure);
    const getDisclosureStatusSpy = vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    const getLatestAssessmentSpy = vi.spyOn(api.readiness, 'getLatestAssessment');

    render(
      <MemoryRouter initialEntries={['/app/businesses/5']}>
        <Routes>
          <Route path="/app/businesses/:id" element={<BusinessProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('alvi health tech')).toBeTruthy();
    });

    // Check disclosure was called
    expect(getDisclosureSpy).toHaveBeenCalledWith('5');
    // Verify founder-only endpoint was NOT called
    expect(getLatestAssessmentSpy).not.toHaveBeenCalled();

    // Switch to Readiness tab
    const readinessTab = screen.getByRole('tab', { name: /Readiness/i });
    fireEvent.click(readinessTab);

    // Verify score is displayed
    await waitFor(() => {
      expect(screen.getByText('Developing')).toBeTruthy();
      expect(screen.getByText('63')).toBeTruthy();
      expect(screen.getByText(/2-factor business readiness analysis/)).toBeTruthy();
    });
  });

  it('renders correct empty state when business genuinely has no readiness assessment', async () => {
    const mockDisclosureNoReadiness = {
      disclosure: {
        stage: 1,
        stage_label: 'Teaser',
        has_expressed_interest: false,
      },
      business: {
        id: 3,
        name: 'naim health care',
        description: 'Healthcare company',
        industry: 'Healthcare',
        business_stage: 'Seed',
        location: 'Dhaka',
        status: 'published',
        founder_verification_tier: 0,
      },
      requirements: null,
      readiness: null,
      documents: [],
    };

    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockDisclosureNoReadiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    const getLatestAssessmentSpy = vi.spyOn(api.readiness, 'getLatestAssessment');

    render(
      <MemoryRouter initialEntries={['/app/businesses/3']}>
        <Routes>
          <Route path="/app/businesses/:id" element={<BusinessProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    expect(getLatestAssessmentSpy).not.toHaveBeenCalled();

    // Switch to Readiness tab
    const readinessTab = screen.getByRole('tab', { name: /Readiness/i });
    fireEvent.click(readinessTab);

    await waitFor(() => {
      expect(screen.getByText('No readiness assessment has been recorded for this business yet.')).toBeTruthy();
    });
  });

  it('calls founder readiness endpoint when owner views business', async () => {
    currentRole = 'founder';
    const mockOwnerBiz = {
      id: 5,
      name: 'alvi health tech',
      status: 'published',
      description: 'Health tech company',
      industry: 'Healthcare',
      business_stage: 'Seed',
      location: 'Dhaka',
    };

    const mockAssessment = {
      id: 2,
      version: 1,
      overall_score: '62.50',
      factor_results: {
        market_potential: { name: 'Market Potential', score: '75.00', weight: '12.50' },
      },
      weak_areas: [],
      suggestions: [],
      evaluated_at: '2026-09-24T17:48:11.000Z',
    };

    vi.spyOn(api.businesses, 'get').mockResolvedValue(mockOwnerBiz);
    const getLatestAssessmentSpy = vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(mockAssessment as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/businesses/5']}>
        <Routes>
          <Route path="/app/founder/businesses/:id" element={<BusinessProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('alvi health tech')).toBeTruthy();
    });

    expect(getLatestAssessmentSpy).toHaveBeenCalledWith('5');
  });
});
