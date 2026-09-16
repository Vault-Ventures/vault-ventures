import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

const auth = vi.hoisted(() => ({ isAdmin: false }));
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isAuthenticated: true, isAdmin: auth.isAdmin, status: 'authenticated', session: { onboardingComplete: true, activeRole: 'founder', roles: ['founder'] } }),
}));
vi.mock('../components/layout/AppShell', async () => {
  const { Outlet } = await import('react-router-dom');
  return { AppShell: () => <Outlet /> };
});
vi.mock('../pages/shared/DealRoom', async () => {
  const { useParams } = await import('react-router-dom');
  return { default: () => <p>Deal room {useParams().dealId}</p> };
});
vi.mock('../pages/founder/CreateBusiness', () => ({ default: () => <p>Create business form</p> }));
vi.mock('../pages/shared/Reputation', () => ({ default: ({ profileRole }: any) => <p>Reputation {profileRole}</p> }));

beforeEach(() => { auth.isAdmin = false; });

it('routes Admin directly to a Deal ID without the normal-user redirect', async () => {
  auth.isAdmin = true;
  window.history.replaceState({}, '', '/app/admin/deal-room/81');
  render(<App />);
  expect(await screen.findByText('Deal room 81')).toBeTruthy();
  expect(window.location.pathname).toBe('/app/admin/deal-room/81');
});

it('routes the canonical creation URL to the form instead of a business ID', async () => {
  window.history.replaceState({}, '', '/app/founder/businesses/new');
  render(<App />);
  expect(await screen.findByText('Create business form')).toBeTruthy();
});

it('passes explicit Founder context to the registered reputation page', async () => {
  window.history.replaceState({}, '', '/app/founder/reputation');
  render(<App />);
  expect(await screen.findByText('Reputation founder')).toBeTruthy();
});
