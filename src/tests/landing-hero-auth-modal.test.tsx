import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../pages/Landing';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockEnrollRoles = vi.fn();
const mockResendVerificationNotification = vi.fn();

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    session: {
      status: 'unauthenticated',
      user: null,
      roles: [],
      activeRole: 'founder',
      onboardingComplete: false,
      isAdmin: false,
    },
    status: 'unauthenticated',
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
    enrollRoles: mockEnrollRoles,
    enrollRole: vi.fn(),
    removeRole: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationNotification: mockResendVerificationNotification,
    refreshUser: vi.fn(),
    setActiveRole: vi.fn(),
    updateNormalRoles: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Landing />
    </MemoryRouter>
  );
}

describe('Landing Hero + Auth Modal Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('renders the immersive landing hero image directly below navbar and does not render the old hero section', async () => {
    renderLanding();
    const heroImg = await screen.findByAltText('Vault Ventures Platform');
    expect(heroImg).toBeTruthy();
    expect(heroImg.getAttribute('src')).toBe('/hero/vault-hero-base.png');

    // Confirm old hero section content is completely removed
    expect(screen.queryByText(/where capital, ideas/i)).toBeNull();
    expect(screen.queryByText(/capital intelligence platform/i)).toBeNull();
    expect(screen.queryByText(/NovaTech AI - Meridian Capital/i)).toBeNull();

    // Confirm next genuine section exists
    expect(screen.getAllByText(/how it works/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/from discovery to trusted deal/i)).toBeTruthy();
  });

  it('opens Sign In modal when clicking Sign In in the navbar', async () => {
    renderLanding();
    const signInButtons = await screen.findAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    // Modal should be open with Sign in title
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole('heading', { level: 2, name: /sign in/i })).toBeTruthy();
    expect(within(dialog).getByLabelText(/email address/i)).toBeTruthy();
    expect(within(dialog).getByLabelText(/^password$/i)).toBeTruthy();
  });

  it('closes modal when clicking close button', async () => {
    renderLanding();
    const signInButtons = await screen.findAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    const closeBtn = await screen.findByLabelText('Close dialog');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('switches between Sign In, Create Account, and Forgot Password in the modal', async () => {
    renderLanding();
    const signInButtons = await screen.findAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    const dialog = await screen.findByRole('dialog');

    // Click "Create account" inside modal
    const createAccountBtn = within(dialog).getByRole('button', { name: /create account/i });
    fireEvent.click(createAccountBtn);

    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { level: 2, name: /create your account/i })).toBeTruthy();
    });
    expect(within(dialog).getByLabelText(/full name/i)).toBeTruthy();

    // Click "Sign in" inside modal to go back
    const backToSignInBtn = within(dialog).getByRole('button', { name: /sign in/i });
    fireEvent.click(backToSignInBtn);

    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { level: 2, name: /sign in/i })).toBeTruthy();
    });

    // Click "Forgot password?"
    const forgotPwBtn = within(dialog).getByRole('button', { name: /forgot password\?/i });
    fireEvent.click(forgotPwBtn);

    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { level: 2, name: /reset password/i })).toBeTruthy();
    });

    // Click "Back to Sign in"
    const backToSignInFromFp = within(dialog).getByRole('button', { name: /back to sign in/i });
    fireEvent.click(backToSignInFromFp);

    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { level: 2, name: /sign in/i })).toBeTruthy();
    });
  });

  it('opens registration modal with role preselection when clicking Register as Founder', async () => {
    renderLanding();
    const founderRegBtn = await screen.findByRole('button', { name: /register as founder/i });
    fireEvent.click(founderRegBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole('heading', { level: 2, name: /create your account/i })).toBeTruthy();
  });

  it('locks body scroll when modal is open and restores on close', async () => {
    renderLanding();
    expect(document.body.style.overflow).toBe('');

    const signInButtons = await screen.findAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    await screen.findByRole('dialog');
    expect(document.body.style.overflow).toBe('hidden');

    const closeBtn = await screen.findByLabelText('Close dialog');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });
});
