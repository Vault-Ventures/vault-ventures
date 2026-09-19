import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import DiscoverProfessionals from '../pages/founder/DiscoverProfessionals';
import Profile from '../pages/shared/Profile';
import { ToastProvider } from '../components/ui/Feedback';
import { api, resolveMediaUrl, API_BASE_URL } from '../services/api';

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

describe('Founder Discover Professionals Flow & Profile Access', () => {
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

  const mockProfessionalRecommendations = [
    {
      id: 201,
      user_id: 88,
      name: 'Nadia Rahman',
      avatar_url: '/storage/avatars/nadia-photo.jpg',
      verification_tier: 2,
      verification_tier_label: 'Track-Record Verified',
      experience_level: 'Senior Executive',
      location: 'Dhaka',
      industry_experience: ['FinTech', 'SaaS'],
      compensation_preferences: ['Equity', 'Retainer'],
      skills: ['Product Management', 'Growth Strategy'],
      match: {
        overall_score: 0.92,
        summary_explanation: 'Strong alignment with FinTech Product & Growth needs.',
        strongest_alignments: [
          { factor_name: 'Skill Match', score: 0.95, explanation: 'Matches required Product Management skill.' },
          { factor_name: 'Industry Experience', score: 0.9, explanation: 'Has 8+ years in FinTech.' },
        ],
        potential_gaps: [],
      },
    },
    {
      id: 202,
      user_id: 99,
      name: 'Kamal Hossain',
      avatar_url: null, // No photo -> should show fallback initials
      verification_tier: 1,
      verification_tier_label: 'Identity Verified',
      experience_level: 'Lead Engineer',
      location: 'Chittagong',
      industry_experience: ['Logistics', 'CleanTech'],
      compensation_preferences: ['Hourly'],
      skills: ['Engineering', 'Machine Learning'],
      match: {
        overall_score: 0.78,
        summary_explanation: 'Experienced technical architect with ML focus.',
        strongest_alignments: [
          { factor_name: 'Technical Depth', score: 0.85, explanation: 'Deep engineering background.' },
        ],
        potential_gaps: [
          { factor_name: 'Location', score: 0.4, explanation: 'Based in Chittagong, business in Dhaka.' },
        ],
      },
    },
  ];

  const mockNadiaProfileResponse = {
    user: {
      id: 88,
      name: 'Nadia Rahman',
      email: null, // Masked for privacy
      headline: 'Senior Growth & Product Lead',
      bio: 'Scaling high-growth FinTech and SaaS startups with data-driven product strategies.',
      location: 'Dhaka, Bangladesh',
      avatar_url: '/storage/avatars/nadia-photo.jpg',
      cover_photo_url: '/storage/covers/nadia-cover.jpg',
      experience: [
        { role: 'VP of Product', org: 'FastPay Technologies', duration: '2021 - Present', desc: 'Leading cross-functional product squads.' },
      ],
      portfolio: [
        { title: 'Payment Gateway Revamp', role: 'Product Lead', year: '2023', desc: 'Increased conversion by 34%.' },
      ],
      preferences: {},
      verification_tier: 2,
    },
    roles: ['professional'],
    profiles: {
      founder: null,
      investor: null,
      professional: {
        id: 55,
        user_id: 88,
        experience_level: 'Senior Executive',
        availability: 'Full-time / Fractional',
        location: 'Dhaka, Bangladesh',
        industry_experience: ['FinTech', 'SaaS'],
        compensation_preferences: ['Equity', 'Retainer'],
        skills: ['Product Management', 'Growth Strategy'],
      },
    },
  };

  it('renders professional recommendations with saved avatar and fallback initials', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockProfessionalRecommendations as any);

    render(
      <MemoryRouter>
        <DiscoverProfessionals />
      </MemoryRouter>
    );

    // Wait for professionals to load
    await waitFor(() => {
      expect(screen.getByText('Nadia Rahman')).toBeTruthy();
      expect(screen.getByText('Kamal Hossain')).toBeTruthy();
    });

    // Nadia has an avatar URL
    const nadiaImg = screen.getByAltText('Nadia Rahman') as HTMLImageElement;
    expect(nadiaImg).toBeTruthy();
    expect(nadiaImg.src).toContain('storage/avatars/nadia-photo.jpg');

    // Kamal has no avatar -> initials fallback
    expect(screen.getByText('KH')).toBeTruthy();
  });

  it('displays View Profile action and clickable avatar/name links pointing to /app/profile/:userId', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockProfessionalRecommendations as any);

    render(
      <MemoryRouter>
        <DiscoverProfessionals />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nadia Rahman')).toBeTruthy();
    });

    // Check View Profile buttons
    const viewProfileButtons = screen.getAllByRole('link', { name: 'View Profile' });
    expect(viewProfileButtons.length).toBe(2);
    expect(viewProfileButtons[0].getAttribute('href')).toBe('/app/profile/88');
    expect(viewProfileButtons[1].getAttribute('href')).toBe('/app/profile/99');

    // Check Name link
    const nadiaLink = screen.getByRole('link', { name: 'Nadia Rahman' });
    expect(nadiaLink.getAttribute('href')).toBe('/app/profile/88');
  });

  it('navigates to /app/profile/:userId when clicking View Profile', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockProfessionalRecommendations as any);

    render(
      <MemoryRouter initialEntries={['/app/founder/discover-professionals']}>
        <LocationDisplay />
        <Routes>
          <Route path="/app/founder/discover-professionals" element={<DiscoverProfessionals />} />
          <Route path="/app/profile/:userId" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nadia Rahman')).toBeTruthy();
    });

    const viewProfileButtons = screen.getAllByRole('link', { name: 'View Profile' });
    fireEvent.click(viewProfileButtons[0]);

    await waitFor(() => {
      const locations = screen.getAllByTestId('current-location');
      expect(locations.some((l) => l.textContent === '/app/profile/88')).toBe(true);
    });
  });

  it('loads real persisted professional profile data when opening /app/profile/:userId', async () => {
    vi.spyOn(api.profile, 'getUser').mockResolvedValue(mockNadiaProfileResponse as any);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/app/profile/88']}>
          <Routes>
            <Route path="/app/profile/:userId" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(api.profile.getUser).toHaveBeenCalledWith('88');
      expect(screen.getByRole('heading', { level: 1, name: 'Nadia Rahman' })).toBeTruthy();
    });

    expect(screen.getByText(/Senior Growth & Product Lead/i)).toBeTruthy();
    expect(screen.getByText(/Scaling high-growth FinTech and SaaS startups/i)).toBeTruthy();
    expect(screen.getByText(/Senior Executive/i)).toBeTruthy();
    expect(screen.getByText('Product Management')).toBeTruthy();
    expect(screen.getByText('Growth Strategy')).toBeTruthy();
  });

  it('displays drawer with secondary CTA to view professional profile', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockProfessionalRecommendations as any);

    render(
      <MemoryRouter>
        <DiscoverProfessionals />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nadia Rahman')).toBeTruthy();
    });

    // Click "View match analysis" for Nadia
    const matchAnalysisBtns = screen.getAllByText('View match analysis');
    fireEvent.click(matchAnalysisBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Why This Match/i)).toBeTruthy();
    });

    const secondaryCta = screen.getByRole('link', { name: 'View Professional Profile' });
    expect(secondaryCta).toBeTruthy();
    expect(secondaryCta.getAttribute('href')).toBe('/app/profile/88');
  });

  it('handles image loading error by falling back to initials', async () => {
    vi.spyOn(api.businesses, 'listPage').mockResolvedValue(mockBusinessesList as any);
    vi.spyOn(api, 'get').mockResolvedValue(mockProfessionalRecommendations as any);

    render(
      <MemoryRouter>
        <DiscoverProfessionals />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nadia Rahman')).toBeTruthy();
    });

    const nadiaImg = screen.getByAltText('Nadia Rahman');
    // Trigger image error
    fireEvent.error(nadiaImg);

    await waitFor(() => {
      expect(screen.getByText('NR')).toBeTruthy();
    });
  });
});
