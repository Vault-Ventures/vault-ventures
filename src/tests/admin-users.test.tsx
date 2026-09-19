import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminUsers from '../pages/admin/Users';
import { api, ApiError, AdminUserListItem, AdminUserDetail } from '../services/api';

const mockUsers: AdminUserListItem[] = [
  {
    id: 1,
    name: 'Rahim Chowdhury',
    email: 'rahim@vaultventures.test',
    phone: '+8801711111111',
    phone_verified_at: '2026-09-10T12:00:00Z',
    email_verified_at: '2026-09-10T12:00:00Z',
    verification_tier: 2,
    is_suspended: false,
    roles: ['founder'],
    is_admin: false,
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 2,
    name: 'Amina Investor',
    email: 'amina@angelinvestors.test',
    phone: '+8801822222222',
    phone_verified_at: '2026-09-11T12:00:00Z',
    email_verified_at: '2026-09-11T12:00:00Z',
    verification_tier: 3,
    is_suspended: true,
    suspended_at: '2026-09-15T14:30:00Z',
    suspension_reason: 'Compliance audit pending',
    roles: ['investor'],
    is_admin: false,
    created_at: '2026-09-11T09:00:00Z',
  },
];

const mockUserDetail: AdminUserDetail = {
  ...mockUsers[0],
  headline: 'Founder & CEO at EcoTrack',
  bio: 'Passionate about building green-tech startups in Bangladesh.',
  location: 'Dhaka, Bangladesh',
  experience: [{ role: 'Founder', org: 'EcoTrack', duration: '2 yrs' }],
  portfolio: [{ title: 'EcoTrack V1', year: '2025' }],
  verification_requests: [
    {
      id: 101,
      requested_tier: 2,
      status: 'approved',
      submitted_at: '2026-09-12T10:00:00Z',
      reviewed_at: '2026-09-13T10:00:00Z',
    },
  ],
};

describe('Admin User Management (Phase 9)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders user directory with real user data, roles, verification tier, and account status', async () => {
    vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: mockUsers,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 2,
      },
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for directory rows to load
    expect(await screen.findByText('Rahim Chowdhury')).toBeDefined();
    expect(screen.getByText(/2 Total Users/)).toBeDefined();
    expect(screen.getByText('rahim@vaultventures.test')).toBeDefined();
    expect(screen.getAllByText('Founder').length).toBeGreaterThan(0);
    expect(screen.getByText('Tier 2 • Track Record')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();

    expect(screen.getByText('Amina Investor')).toBeDefined();
    expect(screen.getByText('amina@angelinvestors.test')).toBeDefined();
    expect(screen.getAllByText('Investor').length).toBeGreaterThan(0);
    expect(screen.getByText('Tier 3 • Track Record')).toBeDefined();
    expect(screen.getByText('Suspended')).toBeDefined();
    expect(screen.getByText('Compliance audit pending')).toBeDefined();
  });

  it('filters users by search query, role, and account status', async () => {
    const listSpy = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [mockUsers[0]],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Rahim Chowdhury');

    // Search input
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...');
    fireEvent.change(searchInput, { target: { value: 'Rahim' } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Rahim',
        })
      );
    });

    // Role filter
    const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
    fireEvent.change(roleSelect, { target: { value: 'founder' } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'founder',
        })
      );
    });

    // Status filter
    const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  it('opens user details drawer upon clicking View', async () => {
    vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: mockUsers,
      pagination: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
    });

    const getSpy = vi.spyOn(api.admin.users, 'get').mockResolvedValue(mockUserDetail);

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Rahim Chowdhury');

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(1);
    });

    // Drawer elements
    expect(await screen.findByText('Founder & CEO at EcoTrack')).toBeDefined();
    expect(screen.getByText('Passionate about building green-tech startups in Bangladesh.')).toBeDefined();
    expect(screen.getByText('Verification History (1)')).toBeDefined();
  });

  it('handles suspend action with confirmation modal', async () => {
    vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [mockUsers[0]],
      pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    });

    const suspendSpy = vi.spyOn(api.admin.users, 'suspend').mockResolvedValue({
      ...mockUsers[0],
      is_suspended: true,
      suspension_reason: 'Terms violation',
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Rahim Chowdhury');

    const suspendBtn = screen.getByRole('button', { name: /^suspend$/i });
    fireEvent.click(suspendBtn);

    // Modal open
    expect(await screen.findByText('Suspend User Account')).toBeDefined();
    expect(screen.getByText(/Target: Rahim Chowdhury/)).toBeDefined();

    const reasonInput = screen.getByPlaceholderText('Specify the policy violation or rationale...');
    fireEvent.change(reasonInput, { target: { value: 'Terms violation' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm suspension/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(suspendSpy).toHaveBeenCalledWith(1, 'Terms violation');
    });

    expect(await screen.findByText(/User "Rahim Chowdhury" has been suspended/)).toBeDefined();
  });

  it('handles restore action with confirmation modal', async () => {
    vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [mockUsers[1]],
      pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    });

    const restoreSpy = vi.spyOn(api.admin.users, 'restore').mockResolvedValue({
      ...mockUsers[1],
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Amina Investor');

    const restoreBtn = screen.getByRole('button', { name: /^restore$/i });
    fireEvent.click(restoreBtn);

    // Modal open
    expect(await screen.findByText('Restore User Account')).toBeDefined();
    expect(screen.getByText(/Target: Amina Investor/)).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /confirm restore/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(restoreSpy).toHaveBeenCalledWith(2);
    });

    expect(await screen.findByText(/User "Amina Investor" account has been restored/)).toBeDefined();
  });

  it('renders error state and allows retry', async () => {
    const listSpy = vi.spyOn(api.admin.users, 'list')
      .mockRejectedValueOnce(new ApiError(500, 'Network disconnected', 'NETWORK_ERROR'))
      .mockResolvedValueOnce({
        users: mockUsers,
        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      });

    render(
      <MemoryRouter initialEntries={['/app/admin/users']}>
        <Routes>
          <Route path="/app/admin/users" element={<AdminUsers />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Unable to Load User Directory')).toBeDefined();
    expect(await screen.findByText('Network disconnected')).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Rahim Chowdhury')).toBeDefined();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
