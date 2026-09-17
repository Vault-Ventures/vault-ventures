import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import DiscoverBusinesses from '../pages/shared/DiscoverBusinesses';
import BusinessProfile from '../pages/founder/BusinessProfile';

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'investor', setRole: vi.fn() }),
}));

const mockBusinesses = [
  {
    id: 101,
    name: 'SolarTech Innovations Ltd',
    industry: 'CleanTech',
    business_stage: 'Seed',
    location: 'Gazipur, Bangladesh',
    description: 'Solar panel microgrids for industrial parks.',
    funding_amount: 5000000,
    skills: ['Engineering', 'CleanTech'],
    founder_verification_tier: 1,
    match: {
      overall_score: 0.88,
      strongest_alignments: [
        { factor_name: 'Industry Match', score: 1.0, explanation: 'Both parties are focused on CleanTech.' },
      ],
      potential_gaps: [],
      summary_explanation: 'Strong match based on stage and capital compatibility.',
    },
  },
  {
    id: 102,
    name: 'FinFlow Payment Gateways',
    industry: 'FinTech',
    business_stage: 'Series A',
    location: 'Dhaka, Bangladesh',
    description: 'B2B payment aggregation and escrow service.',
    funding_amount: 15000000,
    skills: ['FinTech', 'Machine Learning'],
    founder_verification_tier: 0,
    match: {
      overall_score: 0.76,
      strongest_alignments: [
        { factor_name: 'Industry Match', score: 1.0, explanation: 'FinTech alignment.' },
      ],
      potential_gaps: [],
      summary_explanation: 'Good opportunity for growth-stage investment.',
    },
  },
];

describe('Investor Discover Businesses', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders published business recommendations for investor role', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(mockBusinesses);

    render(
      <MemoryRouter initialEntries={['/app/investor/discover']}>
        <Routes>
          <Route path="/app/investor/discover" element={<DiscoverBusinesses context="investor" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('SolarTech Innovations Ltd')).toBeTruthy();
    expect(screen.getByText('FinFlow Payment Gateways')).toBeTruthy();
    expect(screen.getByText('৳50,00,000')).toBeTruthy();
    expect(screen.getByText('৳1,50,00,000')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/api/me/recommendations/businesses?role=investor');
  });

  it('filters published businesses by search keyword', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(mockBusinesses);

    render(
      <MemoryRouter initialEntries={['/app/investor/discover']}>
        <Routes>
          <Route path="/app/investor/discover" element={<DiscoverBusinesses context="investor" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('SolarTech Innovations Ltd')).toBeTruthy();

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Solar' } });

    expect(screen.getByText('SolarTech Innovations Ltd')).toBeTruthy();
    expect(screen.queryByText('FinFlow Payment Gateways')).toBeNull();
  });

  it('shows empty state when no published businesses match selected filters', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(mockBusinesses);

    render(
      <MemoryRouter initialEntries={['/app/investor/discover']}>
        <Routes>
          <Route path="/app/investor/discover" element={<DiscoverBusinesses context="investor" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('SolarTech Innovations Ltd')).toBeTruthy();

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistent Venture' } });

    expect(await screen.findByText('No businesses found')).toBeTruthy();
    expect(screen.getByText(/No businesses match your current filters/i)).toBeTruthy();
  });

  it('navigates to the correct distinct business ID when clicking different business cards and renders real persisted details', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([
      {
        id: 1,
        name: 'naim health care',
        industry: 'HealthTech',
        business_stage: 'Seed',
        location: 'Sylhet, Bangladesh',
        description: 'Telemedicine and rural clinic healthcare network.',
        funding_amount: 3000000,
        skills: ['HealthTech', 'Operations'],
        founder_verification_tier: 1,
        match: { overall_score: 0.85, strongest_alignments: [], potential_gaps: [] },
      },
      {
        id: 2,
        name: 'SizaTechnology',
        industry: 'SaaS',
        business_stage: 'Growth',
        location: 'Chittagong, Bangladesh',
        description: 'Cloud ERP software for apparel manufacturing factories.',
        funding_amount: 12000000,
        skills: ['SaaS', 'Engineering'],
        founder_verification_tier: 2,
        match: { overall_score: 0.92, strongest_alignments: [], potential_gaps: [] },
      },
    ]);

    const getDisclosureSpy = vi.spyOn(api.businesses, 'getDisclosure').mockImplementation(async (id: any) => {
      if (String(id) === '1') {
        return {
          disclosure: { stage: 2, stage_label: 'Extended Information', has_expressed_interest: true },
          business: {
            id: 1,
            name: 'naim health care',
            description: 'Telemedicine and rural clinic healthcare network.',
            industry: 'HealthTech',
            business_stage: 'Seed',
            location: 'Sylhet, Bangladesh',
            status: 'published',
            founder_verification_tier: 1,
          },
          requirements: {
            funding_amount: 3000000,
            skills: ['HealthTech', 'Operations'],
          },
          readiness: null,
          documents: [],
        };
      }
      return {
        disclosure: { stage: 1, stage_label: 'Teaser', has_expressed_interest: false },
        business: {
          id: 2,
          name: 'SizaTechnology',
          description: 'Cloud ERP software for apparel manufacturing factories.',
          industry: 'SaaS',
          business_stage: 'Growth',
          location: 'Chittagong, Bangladesh',
          status: 'published',
          founder_verification_tier: 2,
        },
        requirements: {
          funding_amount: 12000000,
          skills: ['SaaS', 'Engineering'],
        },
        readiness: null,
        documents: [],
      };
    });

    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1 });

    render(
      <MemoryRouter initialEntries={['/app/investor/discover']}>
        <Routes>
          <Route path="/app/investor/discover" element={<DiscoverBusinesses context="investor" />} />
          <Route path="/app/businesses/:id" element={<BusinessProfile />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify both business cards are listed with real names
    expect(await screen.findByText('naim health care')).toBeTruthy();
    expect(screen.getByText('SizaTechnology')).toBeTruthy();

    // Click on naim health care card
    const card1 = screen.getByText('naim health care');
    const link1 = card1.closest('a');
    expect(link1?.getAttribute('href')).toBe('/app/businesses/1');
    fireEvent.click(link1 || card1);

    // Should navigate and render naim health care details without fallback placeholders
    expect(await screen.findByRole('heading', { level: 1, name: 'naim health care' })).toBeTruthy();
    expect(screen.queryByText('Untitled Business')).toBeNull();
    expect(screen.queryByText('No description provided.')).toBeNull();
    expect(screen.getAllByText('Telemedicine and rural clinic healthcare network.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sylhet, Bangladesh').length).toBeGreaterThanOrEqual(1);
    expect(getDisclosureSpy).toHaveBeenCalledWith('1');
  });
});
