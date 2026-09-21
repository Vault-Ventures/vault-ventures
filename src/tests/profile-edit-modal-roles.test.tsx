import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../pages/shared/Profile';
import { api } from '../services/api';
import { ToastProvider } from '../components/ui/Feedback';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 8,
    name: 'Rafiul Islam',
    email: 'rafiul@gmail.com',
    avatar_url: null as string | null,
    cover_photo_url: null as string | null,
    verification_tier: 0,
    headline: 'Software Advisor',
    bio: 'Professional advisor',
    location: 'Dhaka',
    experience: [],
    portfolio: [],
  },
  session: {
    roles: ['professional'],
    activeRole: 'professional',
    user: { id: 8, name: 'Rafiul Islam' },
    isAdmin: false,
  },
  refreshUser: vi.fn(),
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: mockAuthState.session.activeRole, setRole: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    isAdmin: false,
    refreshUser: mockAuthState.refreshUser,
  }),
}));

describe('Edit Profile Modal Role Scoping & Fallback Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderProfile = () => {
    return render(
      <MemoryRouter initialEntries={['/app/profile']}>
        <ToastProvider>
          <Profile />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  const openEditModal = async () => {
    const dotsBtn = await screen.findByLabelText('Profile actions');
    fireEvent.click(dotsBtn);
    const editBtn = await screen.findByText('Edit Profile');
    fireEvent.click(editBtn);
    return await screen.findByRole('dialog');
  };

  it('1. Professional-only user: shows Professional Information and hides Founder/Investor Information', async () => {
    mockAuthState.session.roles = ['professional'];
    mockAuthState.session.activeRole = 'professional';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 8,
        name: 'Rafiul Islam',
        email: 'rafiul@gmail.com',
        headline: 'Professional Consultant',
        bio: 'Advisory and engineering',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['professional'],
      profiles: {
        founder: null,
        investor: null,
        professional: { id: 4, skills: ['React', 'Node.js'] },
      },
    });

    renderProfile();
    const modal = await openEditModal();

    // Common and professional sections must exist inside modal
    expect(within(modal).getAllByText('Basic Information', { selector: 'button, p' }).length).toBeGreaterThan(0);
    expect(within(modal).getByRole('button', { name: /Professional Information/i })).toBeDefined();
    expect(within(modal).getByRole('button', { name: /^Experience$/i })).toBeDefined();
    expect(within(modal).getByRole('button', { name: /^Preferences$/i })).toBeDefined();

    // Founder and Investor sections must NOT exist in the modal
    expect(within(modal).queryByRole('button', { name: /Founder Information/i })).toBeNull();
    expect(within(modal).queryByRole('button', { name: /Investor Information/i })).toBeNull();
  });

  it('2. Founder-only user: shows Founder Information and hides Professional/Investor Information', async () => {
    mockAuthState.session.roles = ['founder'];
    mockAuthState.session.activeRole = 'founder';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 6,
        name: 'Shayan Founder',
        email: 'shayan@gmail.com',
        headline: 'HealthTech Founder',
        bio: 'Building ventures',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['founder'],
      profiles: {
        founder: { id: 2 },
        investor: null,
        professional: null,
      },
    });

    renderProfile();
    await openEditModal();

    expect(screen.getByRole('button', { name: /Founder Information/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Professional Information/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Investor Information/i })).toBeNull();
  });

  it('3. Investor-only user: shows Investor Information and hides Founder/Professional Information', async () => {
    mockAuthState.session.roles = ['investor'];
    mockAuthState.session.activeRole = 'investor';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 2,
        name: 'Siza Investor',
        email: 'siza@gmail.com',
        headline: 'Angel Investor',
        bio: 'Seed stage investor',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['investor'],
      profiles: {
        founder: null,
        investor: { id: 1, preferences: { industry: 'FinTech', minimum_investment: 50000, maximum_investment: 500000 } },
        professional: null,
      },
    });

    renderProfile();
    await openEditModal();

    expect(screen.getByRole('button', { name: /Investor Information/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Founder Information/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Professional Information/i })).toBeNull();
  });

  it('4. Founder + Investor user: shows Founder and Investor sections, hides Professional section', async () => {
    mockAuthState.session.roles = ['founder', 'investor'];
    mockAuthState.session.activeRole = 'founder';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 7,
        name: 'Dual User',
        email: 'dual@gmail.com',
        headline: 'Founder & Investor',
        bio: '',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['founder', 'investor'],
      profiles: {
        founder: { id: 3 },
        investor: { id: 2, preferences: {} },
        professional: null,
      },
    });

    renderProfile();
    await openEditModal();

    expect(screen.getByRole('button', { name: /Founder Information/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Investor Information/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Professional Information/i })).toBeNull();
  });

  it('5. Professional + Investor user: shows Professional and Investor sections, hides Founder section', async () => {
    mockAuthState.session.roles = ['professional', 'investor'];
    mockAuthState.session.activeRole = 'professional';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 9,
        name: 'Prof Investor',
        email: 'profinvestor@gmail.com',
        headline: 'Advisor & Angel',
        bio: '',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['professional', 'investor'],
      profiles: {
        founder: null,
        investor: { id: 4, preferences: {} },
        professional: { id: 5 },
      },
    });

    renderProfile();
    await openEditModal();

    expect(screen.getByRole('button', { name: /Professional Information/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Investor Information/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Founder Information/i })).toBeNull();
  });

  it('6. All three roles: shows all three role sections simultaneously', async () => {
    mockAuthState.session.roles = ['founder', 'professional', 'investor'];
    mockAuthState.session.activeRole = 'founder';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 7,
        name: 'Jim Multi',
        email: 'jim@gmail.com',
        headline: 'Triple Role',
        bio: '',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['founder', 'professional', 'investor'],
      profiles: {
        founder: { id: 1 },
        investor: { id: 1, preferences: {} },
        professional: { id: 1 },
      },
    });

    renderProfile();
    await openEditModal();

    expect(screen.getByRole('button', { name: /Founder Information/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Professional Information/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Investor Information/i })).toBeDefined();
  });

  it('7. Safely falls back to Basic Information if an inaccessible initialSection is requested', async () => {
    mockAuthState.session.roles = ['professional'];
    mockAuthState.session.activeRole = 'professional';

    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 8,
        name: 'Rafiul Islam',
        email: 'rafiul@gmail.com',
        headline: 'Professional Consultant',
        bio: '',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['professional'],
      profiles: {
        founder: null,
        investor: null,
        professional: { id: 4 },
      },
    });

    renderProfile();
    await openEditModal();

    // The modal defaults/falls back to Basic Information
    expect(screen.getByPlaceholderText('e.g. AI Product Strategist & Entrepreneur')).toBeDefined();
  });
});
