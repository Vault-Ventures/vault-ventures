import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

function TestConsumer() {
  const { session, login, logout, refreshUser, hasRole } = useAuth();

  return (
    <div>
      <div data-testid="status">{session.status}</div>
      <div data-testid="is-admin">{session.isAdmin ? 'yes' : 'no'}</div>
      <div data-testid="roles">{session.roles.join(',')}</div>
      <div data-testid="active-role">{session.activeRole}</div>
      <div data-testid="has-founder">{hasRole('founder') ? 'yes' : 'no'}</div>
      <div data-testid="has-investor">{hasRole('investor') ? 'yes' : 'no'}</div>
      <div data-testid="has-professional">{hasRole('professional') ? 'yes' : 'no'}</div>
      <button
        onClick={() => login({ email: 'user@test.com', password: 'password' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={() => refreshUser()} data-testid="refresh-btn">
        Refresh
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe('AuthContext Performance Optimization & Role Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Session refresh retrieves roles and admin status in a single request without waterfall', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/api/auth/user') {
        return {
          id: 1,
          name: 'Founder User',
          email: 'founder@test.com',
          email_verified_at: '2026-01-01T00:00:00Z',
          phone: '+1234567890',
          phone_verified_at: '2026-01-01T00:00:00Z',
          verification_tier: 1,
          verification_tier_label: 'Tier 1',
          roles: ['founder'],
          is_admin: false,
        };
      }
      throw new Error(`Unexpected GET to ${path}`);
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-admin').textContent).toBe('no');
    expect(screen.getByTestId('roles').textContent).toBe('founder');
    expect(screen.getByTestId('active-role').textContent).toBe('founder');
    expect(screen.getByTestId('has-founder').textContent).toBe('yes');

    // VERIFY: api.get was called ONLY once for /api/auth/user
    // NO call to /api/me/profile and NO call to /api/admin/verification-requests
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/api/auth/user');
  });

  it('2. Login retrieves roles and admin status directly from login response with zero waterfall', async () => {
    // Initial mount unauthenticated
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthenticated'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });

    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/api/auth/login') {
        return {
          id: 42,
          name: 'Multi Role User',
          email: 'multi@test.com',
          email_verified_at: '2026-01-01T00:00:00Z',
          phone: null,
          phone_verified_at: null,
          verification_tier: 2,
          verification_tier_label: 'Tier 2',
          roles: ['founder', 'investor', 'professional'],
          is_admin: false,
        };
      }
      throw new Error(`Unexpected POST to ${path}`);
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-admin').textContent).toBe('no');
    expect(screen.getByTestId('roles').textContent).toBe('founder,investor,professional');
    expect(screen.getByTestId('has-founder').textContent).toBe('yes');
    expect(screen.getByTestId('has-investor').textContent).toBe('yes');
    expect(screen.getByTestId('has-professional').textContent).toBe('yes');

    // VERIFY: api.post called for login, but NO secondary GETs were triggered
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@test.com',
      password: 'password',
    });
    // Total GET calls is 1 (the initial mount probe)
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('3. Admin login sets isAdmin to true without 403 probe', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 99,
      name: 'System Admin',
      email: 'admin@vaultventures.local',
      email_verified_at: '2026-01-01T00:00:00Z',
      phone: null,
      phone_verified_at: null,
      verification_tier: 0,
      verification_tier_label: 'Tier 0',
      roles: [],
      is_admin: true,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-admin').textContent).toBe('yes');
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/api/auth/user');
  });

  it('4. Normal non-admin user is NOT admin', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 10,
      name: 'Regular Investor',
      email: 'investor@test.com',
      email_verified_at: '2026-01-01T00:00:00Z',
      phone: null,
      phone_verified_at: null,
      verification_tier: 1,
      verification_tier_label: 'Tier 1',
      roles: ['investor'],
      is_admin: false,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-admin').textContent).toBe('no');
    expect(screen.getByTestId('has-investor').textContent).toBe('yes');
    expect(screen.getByTestId('has-founder').textContent).toBe('no');
  });

  it('5. Unauthenticated user sets unauthenticated session', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthenticated'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });

    expect(screen.getByTestId('is-admin').textContent).toBe('no');
    expect(screen.getByTestId('roles').textContent).toBe('');
  });

  it('6. User with 0 roles has onboardingComplete: false', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 15,
      name: 'New Registered User',
      email: 'newbie@test.com',
      email_verified_at: null,
      phone: null,
      phone_verified_at: null,
      verification_tier: 0,
      verification_tier_label: 'Tier 0',
      roles: [],
      is_admin: false,
    });

    function OnboardingCheckConsumer() {
      const { session } = useAuth();
      return (
        <div>
          <div data-testid="onboarding-complete">{session.onboardingComplete ? 'yes' : 'no'}</div>
        </div>
      );
    }

    render(
      <AuthProvider>
        <OnboardingCheckConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-complete').textContent).toBe('no');
    });
  });
});
