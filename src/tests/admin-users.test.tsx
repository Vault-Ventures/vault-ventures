import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminUsers from '../pages/admin/Users';
import { api } from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/app/admin/users' }),
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'admin' }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 4, name: 'Admin Faiza', email: 'adminfaiza@gmail.com', isAdmin: true },
    isAdmin: true,
  }),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

describe('Admin User Directory (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory with users and multi-role badges', async () => {
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
          status: 'active',
          status_label: 'Active',
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
          email_verified: true,
          email_verified_at: '2026-09-16T08:30:06Z',
          phone_verified: true,
          phone_verified_at: '2026-09-16T08:30:06Z',
          created_at: '2026-09-16T08:30:06Z',
        },
        {
          id: 7,
          name: 'Jim Multi',
          email: 'jim@vault.test',
          phone: '+8801700000007',
          is_admin: false,
          roles: ['founder', 'investor', 'professional'],
          verification_tier: 1,
          verification_tier_label: 'Identity Verified',
          status: 'active',
          status_label: 'Active',
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
          email_verified: false,
          email_verified_at: null,
          phone_verified: false,
          phone_verified_at: null,
          created_at: '2026-09-18T06:48:48Z',
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 2,
      },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Shayan Founder')).toBeTruthy();
      expect(screen.getByText('shayan@vault.test')).toBeTruthy();
      expect(screen.getByText('Jim Multi')).toBeTruthy();
      expect(screen.getByText('jim@vault.test')).toBeTruthy();
    });

    // Multi-role verification: Jim must display founder, investor, and professional
    expect(screen.getByText('investor')).toBeTruthy();
    expect(screen.getByText('professional')).toBeTruthy();
    expect(screen.getAllByText('founder').length).toBeGreaterThanOrEqual(1);

    // View reputation buttons exist
    const repButtons = screen.getAllByRole('button', { name: /View Reputation/i });
    expect(repButtons.length).toBe(2);

    fireEvent.click(repButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/app/admin/reputation');
  });

  it('handles search input and applies search filter to API', async () => {
    const mockList = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'shayan' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ q: 'shayan' }));
    });
  });

  it('handles role filter and tier filter selection', async () => {
    const mockList = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const roleSelect = screen.getByLabelText(/Filter by participant role/i);
    fireEvent.change(roleSelect, { target: { value: 'investor' } });

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ role: 'investor' }));
    });

    const tierSelect = screen.getByLabelText(/Filter by verification tier/i);
    fireEvent.change(tierSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ verification_tier: '1' }));
    });
  });

  it('handles status filter selection', async () => {
    const mockList = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const statusSelect = screen.getByLabelText(/Filter by account status/i);
    fireEvent.change(statusSelect, { target: { value: 'suspended' } });

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ status: 'suspended' }));
    });
  });

  it('handles server-driven pagination controls', async () => {
    const mockList = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [
        {
          id: 1,
          name: 'User One',
          email: 'user1@vault.test',
          phone: null,
          is_admin: false,
          roles: ['founder'],
          verification_tier: 0,
          verification_tier_label: 'Unverified',
          status: 'active',
          status_label: 'Active',
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
          email_verified: false,
          email_verified_at: null,
          phone_verified: false,
          phone_verified_at: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 2,
        per_page: 25,
        total: 26,
      },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeTruthy();
      expect(screen.getByText(/Page 1 of 2/i)).toBeTruthy();
    });

    const nextBtn = screen.getByRole('button', { name: /Next/i }) as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('displays empty state when no users match and allows clearing filters', async () => {
    const mockList = vi.spyOn(api.admin.users, 'list').mockResolvedValue({
      users: [],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const roleSelect = screen.getByLabelText(/Filter by participant role/i);
    fireEvent.change(roleSelect, { target: { value: 'investor' } });

    await waitFor(() => {
      expect(screen.getByText('No matching accounts found')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Reset All Filters/i })).toBeTruthy();
    });

    const clearBtn = screen.getByRole('button', { name: /Reset All Filters/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith({ page: 1, per_page: 25 });
    });
  });
});

