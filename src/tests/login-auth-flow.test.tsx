import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from '../pages/auth/Login';
import { AuthProvider } from '../context/AuthContext';
import { api, ApiError } from '../services/api';

vi.mock('../services/api', () => {
  class ApiError extends Error {
    status: number;
    code?: string;
    details?: Record<string, string[]>;
    constructor(status: number, message: string, code?: string, details?: Record<string, string[]>) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    ApiError,
  };
});

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

function renderLoginApp(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <LocationDisplay />
        <Routes>
          <Route path="/" element={<div data-testid="landing-page">Landing Page</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/app/founder/dashboard" element={<div data-testid="founder-dashboard">Founder Dashboard</div>} />
          <Route path="/app/admin/dashboard" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login flow and invalid login error isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthenticated'));
  });

  it('stays on /login and renders error message on 401 invalid credentials without navigating away', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(401, 'Invalid email or password.'));

    renderLoginApp();

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy();
    expect(screen.getByTestId('location-display').textContent).toBe('/login');

    // Fill form with invalid credentials
    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-pw'), {
      target: { value: 'wrong-password-123' },
    });

    const submitBtn = screen.getByTestId('login-submit');
    expect(submitBtn.getAttribute('type')).toBe('submit');

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify error message is visible
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeTruthy();
    });
    expect(screen.getByText('Invalid email or password.')).toBeTruthy();

    // Verify user remained on /login and was NOT redirected to / or any dashboard
    expect(screen.getByTestId('location-display').textContent).toBe('/login');
    expect(screen.queryByTestId('landing-page')).toBeNull();
    expect(screen.queryByTestId('founder-dashboard')).toBeNull();
  });

  it('renders field validation errors on 422 response and stays on /login', async () => {
    vi.mocked(api.post).mockRejectedValue(
      new ApiError(422, 'The given data was invalid.', 'VALIDATION_ERROR', {
        email: ['The provided credentials do not match our records.'],
      })
    );

    renderLoginApp();

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy();

    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'invalid@vault.com' },
    });
    fireEvent.change(screen.getByTestId('login-pw'), {
      target: { value: 'wrongpass' },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-submit'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeTruthy();
    });
    expect(screen.getByText('The provided credentials do not match our records.')).toBeTruthy();
    expect(screen.getByTestId('location-display').textContent).toBe('/login');
  });

  it('redirects to user dashboard upon valid login', async () => {
    vi.mocked(api.post).mockResolvedValue({
      id: 1,
      name: 'Valid Founder',
      email: 'founder@vault.io',
      email_verified_at: '2026-01-01T00:00:00Z',
      roles: ['founder'],
      is_admin: false,
      verification_tier: 1,
    });

    renderLoginApp();

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy();

    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'founder@vault.io' },
    });
    fireEvent.change(screen.getByTestId('login-pw'), {
      target: { value: 'valid-password-123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-submit'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/app/founder/dashboard');
    });
    expect(screen.getByTestId('founder-dashboard')).toBeTruthy();
  });

  it('ensures Back navigation is a Link and not a button that could intercept generic button clicks', async () => {
    renderLoginApp();

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy();

    const backLink = screen.getByTestId('login-back-btn');
    expect(backLink.tagName).toBe('A');
    expect(backLink.getAttribute('href')).toBe('/');

    // The form submit button is the button with type submit
    const submitBtn = screen.getByTestId('login-submit');
    expect(submitBtn.tagName).toBe('BUTTON');
    expect(submitBtn.getAttribute('type')).toBe('submit');
  });
});
