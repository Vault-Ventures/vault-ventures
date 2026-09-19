import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';
import DealHub from '../pages/shared/DealHub';
import DealRoom from '../pages/shared/DealRoom';
import { api } from '../services/api';

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  isAdmin: false,
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'initializing',
  session: {
    onboardingComplete: true,
    activeRole: 'founder',
    roles: ['founder'],
  },
  user: {
    id: 1,
    name: 'Founder User',
    email: 'founder@example.com',
  },
}));

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    status: authState.status,
    session: authState.session,
    user: authState.user,
  }),
}));

describe('Phase 4: Deal Room & Deal Hub UI/UX Redesign', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    authState.isAuthenticated = true;
    authState.isAdmin = false;
    authState.status = 'authenticated';
    authState.session = {
      onboardingComplete: true,
      activeRole: 'founder',
      roles: ['founder'],
    };
    authState.user = {
      id: 1,
      name: 'Founder User',
      email: 'founder@example.com',
    };
    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/nda')) return null as any;
      if (url.includes('/businesses/')) return { id: 12, name: 'CyberSec Shield', funding_amount: 500000 } as any;
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects unauthenticated users attempting to access /app/deal-room to /login', async () => {
    authState.isAuthenticated = false;
    authState.status = 'unauthenticated';
    window.history.replaceState({}, '', '/app/deal-room');

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('renders DealHub in Grid view by default when navigating to /app/deal-room', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 101,
          connection_id: 1,
          business_id: 5,
          business: {
            id: 5,
            name: 'Apex AI Systems',
            industry: 'Artificial Intelligence',
          },
          founder_user_id: 1,
          counterparty_user_id: 2,
          counterparty: {
            id: 2,
            name: 'Sarah Investor',
            email: 'sarah@investor.com',
          },
          counterparty_role: 'investor',
          stage: 'matched',
          stage_label: 'Matched',
          stage_order: 1,
          created_at: '2026-03-10T12:00:00Z',
          updated_at: '2026-03-10T12:00:00Z',
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 1,
        per_page: 15,
      },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' }, { timeout: 8000 })).toBeTruthy();
    expect((await screen.findAllByText('Apex AI Systems')).length).toBeGreaterThan(0);
    expect(screen.getByText('Matched')).toBeTruthy();
    expect(screen.getByText(/Sarah Investor/)).toBeTruthy();
    expect(screen.getByText('Open Room')).toBeTruthy();
    expect(screen.getByText('Grid')).toBeTruthy();
    expect(screen.getByText('Pipeline')).toBeTruthy();
  });

  it('toggles to Pipeline view in DealHub and groups deals by stage', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 101,
          connection_id: 1,
          business_id: 5,
          business: { id: 5, name: 'Apex AI Systems' },
          founder_user_id: 1,
          counterparty_user_id: 2,
          counterparty: { id: 2, name: 'Sarah Investor' },
          counterparty_role: 'investor',
          stage: 'matched',
          stage_label: 'Matched',
          stage_order: 1,
        },
        {
          id: 102,
          connection_id: 2,
          business_id: 6,
          business: { id: 6, name: 'BioHealth Corp' },
          founder_user_id: 1,
          counterparty_user_id: 3,
          counterparty: { id: 3, name: 'Dr. John Tech' },
          counterparty_role: 'professional',
          stage: 'negotiation',
          stage_label: 'Negotiation',
          stage_order: 5,
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 2, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    const apexItems = await screen.findAllByText('Apex AI Systems');
    expect(apexItems.length).toBeGreaterThan(0);

    const pipelineBtn = screen.getByRole('button', { name: /Pipeline/i });
    fireEvent.click(pipelineBtn);

    // Columns should be present
    expect(await screen.findByText('1. Matched')).toBeTruthy();
    expect(screen.getByText('5. Negotiation')).toBeTruthy();
    expect(screen.getByText('8. Completed')).toBeTruthy();
    expect((await screen.findAllByText('BioHealth Corp')).length).toBeGreaterThan(0);
  });

  it('filters deals in DealHub by search query', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 101,
          connection_id: 1,
          business_id: 5,
          business: { id: 5, name: 'Apex AI Systems' },
          founder_user_id: 1,
          counterparty_user_id: 2,
          counterparty: { id: 2, name: 'Sarah Investor' },
          counterparty_role: 'investor',
          stage: 'matched',
          stage_label: 'Matched',
          stage_order: 1,
        },
        {
          id: 102,
          connection_id: 2,
          business_id: 6,
          business: { id: 6, name: 'GreenEnergy Ltd' },
          founder_user_id: 1,
          counterparty_user_id: 3,
          counterparty: { id: 3, name: 'Tariq Rahman' },
          counterparty_role: 'investor',
          stage: 'nda_signed',
          stage_label: 'NDA Signed',
          stage_order: 4,
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 2, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect((await screen.findAllByText('Apex AI Systems')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('GreenEnergy Ltd')).length).toBeGreaterThan(0);

    const searchInput = screen.getByPlaceholderText(/Search deals/i);
    fireEvent.change(searchInput, { target: { value: 'GreenEnergy' } });

    expect(screen.queryByTestId('deal-item-101')).toBeNull();
    expect(screen.getByTestId('deal-item-102')).toBeTruthy();
  });

  it('renders DealHub empty state with Explore Connections button', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15,
      },
    });

    window.history.replaceState({}, '', '/app/deals');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' })).toBeTruthy();
    expect(await screen.findByText('No Active Deal Rooms')).toBeTruthy();
    expect(screen.getByText('Explore Connections')).toBeTruthy();
  });

  it('handles DealHub error state with Retry capability', async () => {
    const listSpy = vi.spyOn(api.deals, 'list')
      .mockRejectedValueOnce(new Error('Network error loading deals'))
      .mockResolvedValueOnce({
        items: [
          {
            id: 202,
            connection_id: 2,
            business_id: 8,
            business: { id: 8, name: 'EcoGreen Energy' },
            founder_user_id: 1,
            counterparty_user_id: 3,
            counterparty: { id: 3, name: 'Green Growth Fund' },
            counterparty_role: 'investor',
            stage: 'nda_signed',
            stage_label: 'NDA Signed',
            stage_order: 4,
            created_at: '2026-03-12T10:00:00Z',
            updated_at: '2026-03-12T10:00:00Z',
          },
        ],
        pagination: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
      });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByText('Unable to Load Deals')).toBeTruthy();
    expect(screen.getByText('Network error loading deals')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('EcoGreen Energy')).toBeTruthy();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('renders DealRoom Option A Tabbed Workspace and switches between tabs', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 55,
      connection_id: 10,
      business_id: 12,
      founder_user_id: 1,
      counterparty_user_id: 4,
      counterparty_role: 'investor',
      stage: 'negotiation',
      stage_label: 'Negotiation',
      stage_order: 5,
      created_at: '2026-03-14T08:00:00Z',
      updated_at: '2026-03-14T08:00:00Z',
    });

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({
      deal_id: 55,
      active_proposal: {
        id: 1,
        version: 1,
        investment_type: 'equity',
        amount: 2500000,
        equity_percentage: 10,
        profit_sharing_percentage: null,
        loss_sharing_terms: 'Standard liquidation preference',
        proposed_terms: 'Delivery within 6 months',
        note: 'First term sheet draft',
        status: 'pending',
        proposed_by_role: 'investor',
        created_at: '2026-03-14T10:00:00Z',
      },
      proposals: [],
    } as any);

    window.history.replaceState({}, '', '/app/deals/55');
    render(<App />);

    // Header & Tabs
    expect((await screen.findAllByText('CyberSec Shield', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^Negotiation Terms/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Agreement/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Milestones/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Communication & Activity/i })).toBeTruthy();

    // Default Overview Tab
    expect(await screen.findByText('Deal Participants')).toBeTruthy();
    expect(screen.getByText('Deal Status & Key Figures')).toBeTruthy();

    // Switch to Negotiation Tab
    const negTabBtn = screen.getByRole('button', { name: /^Negotiation Terms/i });
    fireEvent.click(negTabBtn);

    expect(await screen.findByText('Commercial Terms Negotiation')).toBeTruthy();
    expect(screen.getByText(/BDT (?:25,00,000|2,500,000)/)).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();

    // Switch to Agreement Tab
    const agrTabBtn = screen.getByRole('button', { name: /^Agreement/i });
    fireEvent.click(agrTabBtn);

    expect(await screen.findByText('Mutual Non-Disclosure Agreement (NDA)')).toBeTruthy();

    // Switch to Communication & Activity Tab
    const commTabBtn = screen.getByRole('button', { name: /^Communication & Activity/i });
    fireEvent.click(commTabBtn);

    expect(await screen.findByText('Deal Messages')).toBeTruthy();
    expect(screen.getByText('Authoritative State Log')).toBeTruthy();
  });

  it('preserves deal ID when navigating to alias route /app/deal-room/:dealId', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 77,
      connection_id: 11,
      business_id: 14,
      founder_user_id: 1,
      counterparty_user_id: 5,
      counterparty_role: 'professional',
      stage: 'deal_room',
      stage_label: 'Deal Room',
      stage_order: 3,
      created_at: '2026-03-15T08:00:00Z',
      updated_at: '2026-03-15T08:00:00Z',
    });

    window.history.replaceState({}, '', '/app/deal-room/77');
    render(<App />);

    expect((await screen.findAllByText('CyberSec Shield', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(window.location.pathname).toBe('/app/deal-room/77');
  });

  it('handles invalid or inaccessible deal IDs safely with Deal Hub CTA', async () => {
    vi.spyOn(api.deals, 'get').mockRejectedValue(new Error('Deal not found or unauthorized.'));

    window.history.replaceState({}, '', '/app/deals/99999');
    render(<App />);

    expect(await screen.findByText('Unable to Load Deal Room')).toBeTruthy();
    expect(screen.getByText('Deal not found or unauthorized.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deal Hub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connections' })).toBeTruthy();
  });
});
