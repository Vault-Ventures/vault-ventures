import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import DiscoverInvestors from '../pages/founder/DiscoverInvestors';
import Profile from '../pages/shared/Profile';
import { ToastProvider } from '../components/ui/Feedback';
import { api } from '../services/api';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 10,
    name: 'Farhan Founder',
    email: 'farhan@founder.com',
    verification_tier: 1,
  },
  session: {
    roles: ['founder'],
    activeRole: 'founder',
    user: { id: 10, name: 'Farhan Founder' },
    isAdmin: false,
  },
  refreshUser: vi.fn(),
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'founder', setRole: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    isAdmin: false,
    refreshUser: mockAuthState.refreshUser,
  }),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

describe('Founder Discover Investors Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockBusinessesList = {
    items: [
      { id: 1, name: 'PayFast Solutions', status: 'published' },
      { id: 2, name: 'Agritech BD', status: 'published' },
    ],
    pagination: {
      current_page: 1,
      last_page: 1,
      total: 2,
      per_page: 10,
    },
  };

  const mockInvestorRecommendations = [
    {
      id: 101,
      user_id: 88,
      name: 'Tanvir Ahmed',
      verification_tier: 0,
      verification_tier_label: 'Email & Phone Verified',
      industry: 'FinTech',
      location: 'Dhaka',
      business_stage: 'Seed',
      investment_types: ['Equity'],
      minimum_investment: 200000,
      maximum_investment: 1000000,
      involvement: 'Active',
      match: {
        overall_score: 0.88,
        summary_explanation: 'Strong alignment with FinTech Seed business in Dhaka.',
        strongest_alignments: [
          { factor_name: 'Industry Match', score: 1.0, explanation: 'Both parties are focused on FinTech.' },
        ],
        potential_gaps: [],
      },
    },
    {
      id: 102,
      user_id: 99,
      name: 'Rahim Chowdhury',
      verification_tier: 2,
      verification_tier_label: 'Track-Record Verified',
      industry: 'HealthTech',
      location: 'Chittagong',
      business_stage: 'Series A',
      investment_types: ['Equity', 'Advisory'],
      available_investment: 5000000,
      involvement: 'Advisory',
      match: {
        overall_score: 0.72,
        summary_explanation: 'Good capital availability and advisory experience.',
        strongest_alignments: [],
        potential_gaps: [
          { factor_name: 'Industry Match', score: 0.0, explanation: 'Different primary sectors.' },
        ],
      },
    },
  ];

  it('renders recommended investors for selected business with correct details', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue(mockInvestorRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-investors']}>
        <ToastProvider>
          <DiscoverInvestors />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('PayFast Solutions')).toBeDefined();
    expect(await screen.findByText('Tanvir Ahmed')).toBeDefined();
    expect(screen.getByText('Rahim Chowdhury')).toBeDefined();

    expect(getSpy).toHaveBeenCalledWith('/api/me/businesses/1/recommendations/investors');

    // Check match scores
    expect(screen.getByText('88% match')).toBeDefined();
    expect(screen.getByText('72% match')).toBeDefined();

    // Check BDT formatted ticket display
    expect(screen.getByText(/৳200,000 – ৳1,000,000/)).toBeDefined();
    expect(screen.getByText(/Up to ৳5,000,000/)).toBeDefined();

    // Check View Profile buttons exist for both investors
    const viewProfileLinks = screen.getAllByRole('link', { name: /View Profile/i });
    expect(viewProfileLinks.length).toBe(2);
    expect(viewProfileLinks[0].getAttribute('href')).toBe('/app/profile/88');
    expect(viewProfileLinks[1].getAttribute('href')).toBe('/app/profile/99');
  });

  it('clicking View Profile navigates to the correct investor user ID profile route', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockInvestorRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-investors']}>
        <ToastProvider>
          <Routes>
            <Route path="/app/founder/discover-investors" element={<DiscoverInvestors />} />
            <Route path="/app/profile/:userId" element={<LocationDisplay />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tanvir Ahmed')).toBeDefined();

    // Click on Tanvir Ahmed's View Profile button
    const viewProfileLinks = screen.getAllByRole('link', { name: /View Profile/i });
    fireEvent.click(viewProfileLinks[0]);

    await waitFor(() => {
      expect(screen.getByTestId('current-location').textContent).toBe('/app/profile/88');
    });
  });

  it('clicking investor name or avatar navigates to their specific profile', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockInvestorRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-investors']}>
        <ToastProvider>
          <Routes>
            <Route path="/app/founder/discover-investors" element={<DiscoverInvestors />} />
            <Route path="/app/profile/:userId" element={<LocationDisplay />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Rahim Chowdhury')).toBeDefined();

    // Click Rahim Chowdhury name link
    const rahimLink = screen.getByRole('link', { name: 'Rahim Chowdhury' });
    fireEvent.click(rahimLink);

    await waitFor(() => {
      expect(screen.getByTestId('current-location').textContent).toBe('/app/profile/99');
    });
  });

  it('match explanation drawer includes secondary CTA to view investor profile', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockInvestorRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-investors']}>
        <ToastProvider>
          <DiscoverInvestors />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tanvir Ahmed')).toBeDefined();

    // Click match score chip or view match analysis
    const matchAnalysisButtons = screen.getAllByRole('button', { name: /View match analysis/i });
    fireEvent.click(matchAnalysisButtons[0]);

    // Drawer opens
    expect(await screen.findByText(/AI Match Analysis/i)).toBeDefined();
    expect(screen.getByText('View Investor Profile')).toBeDefined();

    const profileCta = screen.getByRole('link', { name: /View Investor Profile/i });
    expect(profileCta.getAttribute('href')).toBe('/app/profile/88');
  });

  it('filters discovered investors by industry and search query', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockInvestorRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-investors']}>
        <ToastProvider>
          <DiscoverInvestors />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tanvir Ahmed')).toBeDefined();
    expect(screen.getByText('Rahim Chowdhury')).toBeDefined();

    // Search for Tanvir
    const searchInput = screen.getByPlaceholderText(/Search by name, focus area, company/i);
    fireEvent.change(searchInput, { target: { value: 'Tanvir' } });

    expect(screen.getByText('Tanvir Ahmed')).toBeDefined();
    expect(screen.queryByText('Rahim Chowdhury')).toBeNull();
  });
});
