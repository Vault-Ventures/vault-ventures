import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Connections from '../pages/shared/Connections';
import Profile from '../pages/shared/Profile';
import { ToastProvider } from '../components/ui/Feedback';
import { api, type ConnectionListResponse, type UserProfileResponseData } from '../services/api';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 10,
    name: 'Farhan Founder',
    email: 'farhan@founder.com',
    avatar_url: null as string | null,
    cover_photo_url: null as string | null,
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

describe('Founder Investor Profile Access & Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockInvestorProfileResponse: UserProfileResponseData = {
    user: {
      id: 99,
      name: 'Rahim Chowdhury',
      email: null, // Sanitized
      headline: 'Angel Investor & Strategic Advisor',
      bio: 'Investing in high-growth Bangladeshi technology ventures and pre-seed founders.',
      location: 'Dhaka, Bangladesh',
      avatar_url: null,
      cover_photo_url: null,
      experience: [
        { role: 'Managing Partner', org: 'Bengal Angels', duration: '2020 - Present', desc: 'Leading early stage investments.' },
      ],
      portfolio: [
        { title: 'FinTech Seed Fund', role: 'Lead Investor', year: '2023', desc: 'Pre-seed round' },
      ],
      preferences: {},
      verification_tier: 2,
    },
    roles: ['investor'],
    profiles: {
      founder: null,
      investor: {
        id: 42,
        user_id: 99,
        preferences: {
          thesis: 'High-conviction investments in FinTech and Logistics.',
          industry: 'FinTech',
          minimum_investment: 500000,
          maximum_investment: 2500000,
          business_stage: 'Seed',
          involvement: 'Active',
          location: 'Dhaka',
        },
      },
      professional: null,
    },
  };

  const mockConnectionsResponse: ConnectionListResponse = {
    items: [
      {
        connection_id: null,
        business: { id: 1, name: 'PayFast Solutions' },
        founder: { id: 10, name: 'Farhan Founder' },
        counterparty: { id: 99, name: 'Rahim Chowdhury' },
        counterparty_role: 'investor',
        has_founder_interest: false,
        has_counterparty_interest: true,
        is_mutual: false,
        is_connected: false,
        connected_at: null,
        deal: null,
      },
    ],
    pagination: {
      current_page: 1,
      last_page: 1,
      total: 1,
      per_page: 25,
    },
  };

  it('renders View Profile button on connection card with correct investor ID and name', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue(mockConnectionsResponse);

    render(
      <MemoryRouter initialEntries={['/app/founder/connections']}>
        <ToastProvider>
          <Connections />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Rahim Chowdhury')).toBeDefined();
    expect(screen.getByText('PayFast Solutions')).toBeDefined();

    const viewProfileBtn = screen.getByRole('button', { name: /View profile for Rahim Chowdhury/i });
    expect(viewProfileBtn).toBeDefined();

    const avatarBtn = screen.getByRole('button', { name: /View Rahim Chowdhury's profile/i });
    expect(avatarBtn).toBeDefined();
  });

  it('loads real persisted investor profile data when opening /app/profile/:userId', async () => {
    const getUserSpy = vi.spyOn(api.profile, 'getUser').mockResolvedValue(mockInvestorProfileResponse);

    render(
      <MemoryRouter initialEntries={['/app/profile/99']}>
        <ToastProvider>
          <Routes>
            <Route path="/app/profile/:userId" element={<Profile />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getUserSpy).toHaveBeenCalledWith('99');
    });

    // Check investor name, headline, bio, location
    expect(await screen.findByText('Rahim Chowdhury')).toBeDefined();
    expect(screen.getByText(/Angel Investor & Strategic Advisor/i)).toBeDefined();
    expect(screen.getByText(/Investing in high-growth Bangladeshi technology ventures/i)).toBeDefined();

    // Check investor preferences rendered
    expect(screen.getByText('High-conviction investments in FinTech and Logistics.')).toBeDefined();
    expect(screen.getByText('৳500,000 - ৳2,500,000')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('FinTech')).toBeDefined();
    expect(screen.getByText('Seed')).toBeDefined();

    // Check experience rendered
    expect(screen.getByText('Managing Partner')).toBeDefined();
    expect(screen.getByText('Bengal Angels')).toBeDefined();

    // Check read-only mode: no "Manage Roles", "Edit cover", or "Edit profile photo" buttons
    expect(screen.queryByText('Manage Roles')).toBeNull();
    expect(screen.queryByTitle('Edit profile photo')).toBeNull();
    expect(screen.queryByTitle('Edit cover photo')).toBeNull();
  });

  it('displays access restriction when backend returns 403 Forbidden for unauthorized viewer', async () => {
    vi.spyOn(api.profile, 'getUser').mockRejectedValue(new Error('You are not authorized to view this user profile.'));

    render(
      <MemoryRouter initialEntries={['/app/profile/777']}>
        <ToastProvider>
          <Routes>
            <Route path="/app/profile/:userId" element={<Profile />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Access Restricted')).toBeDefined();
    expect(screen.getByText('You are not authorized to view this user profile.')).toBeDefined();
  });
});
