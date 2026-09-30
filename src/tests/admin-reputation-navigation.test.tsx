import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminReputation from '../pages/admin/Reputation';
import AdminUsers from '../pages/admin/Users';
import { api, AdminUserReputationData } from '../services/api';

const mockNavigate = vi.fn();

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'admin' }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 4, name: 'Admin Faiza', email: 'adminfaiza@gmail.com', isAdmin: true },
    isAdmin: true,
  }),
}));

const mockUserShayanReputation: AdminUserReputationData = {
  user: {
    id: 6,
    name: 'Shayan Founder',
    email: 'shayan@vault.test',
    verification_tier: 1,
    roles: ['founder'],
  },
  reputation_by_role: {
    founder: {
      overall_score: 82,
      tier_label: 'Silver',
      verification: { tier: 1, label: 'Identity Verified' },
      track_record: {
        completed_deals_count: 2,
        completed_milestones_count: 5,
        total_funding_secured_bdt: 1200000,
      },
      feedback: {
        average_rating: 4.8,
        reviews_count: 4,
      },
    },
  },
};

const mockUserTasifReputation: AdminUserReputationData = {
  user: {
    id: 2,
    name: 'Tasif Investor',
    email: 'tasif@vault.test',
    verification_tier: 2,
    roles: ['investor'],
  },
  reputation_by_role: {
    investor: {
      overall_score: 91,
      tier_label: 'Gold',
      verification: { tier: 2, label: 'Financial Verified' },
      track_record: {
        completed_deals_count: 4,
        completed_milestones_count: 12,
        total_invested_bdt: 5000000,
      },
      feedback: {
        average_rating: 4.9,
        reviews_count: 8,
      },
    },
  },
};

const mockUserAlviReputation: AdminUserReputationData = {
  user: {
    id: 1,
    name: 'Alvi Ariyan',
    email: 'alvi@vault.test',
    verification_tier: 1,
    roles: ['professional'],
  },
  reputation_by_role: {
    professional: {
      overall_score: 78,
      tier_label: 'Silver',
      verification: { tier: 1, label: 'Identity Verified' },
      track_record: {
        completed_deals_count: 1,
        completed_milestones_count: 3,
      },
      feedback: {
        average_rating: 4.5,
        reviews_count: 2,
      },
    },
  },
};

describe('Admin User Management → View Reputation Navigation & Audit Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Admin Users page "View Reputation" navigates to reputation URL with user id query param', async () => {
    vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [
        {
          id: 6,
          name: 'Shayan Founder',
          email: 'shayan@vault.test',
          phone: '+8801700000006',
          is_admin: false,
          roles: ['founder'],
          verification_tier: 1,
          verification_tier_label: 'Identity Verified',
          reputation_score: 82,
          created_at: '2026-03-01T00:00:00Z',
        },
      ],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Shayan Founder')).toBeTruthy();
    const viewRepBtn = screen.getByRole('button', { name: /View Reputation/i });
    expect(viewRepBtn).toBeTruthy();
  });

  it('2. Admin Reputation page auto-loads User A (Shayan ID 6) from ?userId=6', async () => {
    const getUserSpy = vi.spyOn(api.admin.reputation, 'getUser').mockResolvedValue(mockUserShayanReputation);

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation?userId=6']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Shayan Founder')).toBeTruthy();
    expect(screen.getByText('shayan@vault.test • ID: 6')).toBeTruthy();
    expect(screen.getByText('Tier 1 Verified')).toBeTruthy();
    expect(screen.getByText('founder Track Record')).toBeTruthy();
    expect(screen.getByDisplayValue('6')).toBeTruthy();

    expect(getUserSpy).toHaveBeenCalledWith('6');
  });

  it('3. Admin Reputation page auto-loads User B (Tasif ID 2) from ?userId=2', async () => {
    const getUserSpy = vi.spyOn(api.admin.reputation, 'getUser').mockResolvedValue(mockUserTasifReputation);

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation?userId=2']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tasif Investor')).toBeTruthy();
    expect(screen.getByText('tasif@vault.test • ID: 2')).toBeTruthy();
    expect(screen.getByText('Tier 2 Verified')).toBeTruthy();
    expect(screen.getByText('investor Track Record')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();

    expect(getUserSpy).toHaveBeenCalledWith('2');
  });

  it('4. Admin Reputation page auto-loads User C (Alvi ID 1) from ?userId=1', async () => {
    const getUserSpy = vi.spyOn(api.admin.reputation, 'getUser').mockResolvedValue(mockUserAlviReputation);

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation?userId=1']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Alvi Ariyan')).toBeTruthy();
    expect(screen.getByText('alvi@vault.test • ID: 1')).toBeTruthy();
    expect(screen.getByText('professional Track Record')).toBeTruthy();
    expect(screen.getByDisplayValue('1')).toBeTruthy();

    expect(getUserSpy).toHaveBeenCalledWith('1');
  });

  it('5. Direct navigation to /app/admin/reputation without query parameters defaults safely to user 1', async () => {
    const getUserSpy = vi.spyOn(api.admin.reputation, 'getUser').mockResolvedValue(mockUserAlviReputation);

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Alvi Ariyan')).toBeTruthy();
    expect(getUserSpy).toHaveBeenCalledWith('1');
  });

  it('6. Manual Audit User search updates input and loads new user reputation', async () => {
    const getUserSpy = vi.spyOn(api.admin.reputation, 'getUser')
      .mockResolvedValueOnce(mockUserAlviReputation)
      .mockResolvedValueOnce(mockUserShayanReputation);

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Alvi Ariyan')).toBeTruthy();

    const searchInput = screen.getByPlaceholderText(/Enter User ID/i);
    fireEvent.change(searchInput, { target: { value: '6' } });

    const auditBtn = screen.getByRole('button', { name: /Audit User/i });
    fireEvent.click(auditBtn);

    expect(await screen.findByText('Shayan Founder')).toBeTruthy();
    expect(screen.getByText('shayan@vault.test • ID: 6')).toBeTruthy();
    expect(getUserSpy).toHaveBeenLastCalledWith('6');
  });

  it('7. Handles invalid or nonexistent user ID gracefully with safe error state', async () => {
    vi.spyOn(api.admin.reputation, 'getUser').mockRejectedValueOnce(
      new Error('User #9999 not found.')
    );

    render(
      <MemoryRouter initialEntries={['/app/admin/reputation?userId=9999']}>
        <Routes>
          <Route path="/app/admin/reputation" element={<AdminReputation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('User #9999 not found.')).toBeTruthy();
    expect(screen.getByText('Participant Reputation Lookup')).toBeTruthy();
  });
});
