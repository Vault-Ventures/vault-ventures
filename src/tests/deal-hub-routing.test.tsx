import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { api } from '../services/api';

const auth = vi.hoisted(() => ({
  user: { id: 1, name: 'Shayan Founder', email: 'shayan@example.com' },
  activeRole: 'founder',
  roles: ['founder'],
  isAdmin: false,
  isAuthenticated: true,
}));

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    status: 'authenticated',
    session: {
      onboardingComplete: true,
      activeRole: auth.activeRole,
      roles: auth.roles,
    },
  }),
}));

describe('Deal Rooms Hub & Routing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { id: 1, name: 'Shayan Founder', email: 'shayan@example.com' };
    auth.activeRole = 'founder';
    auth.roles = ['founder'];
    auth.isAdmin = false;
    auth.isAuthenticated = true;

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue({
      deal_id: 2,
      deal_stage: 'completed',
      can_submit_feedback: true,
      has_submitted_feedback: false,
      founder_feedback_submitted: false,
      counterparty_feedback_submitted: false,
      reviews: [],
    });

    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/businesses/2') {
        return { id: 2, name: 'naim health care', industry: 'Healthcare', funding_amount: 5000000 };
      }
      if (url === '/api/businesses/14') {
        return { id: 14, name: 'CyberSec Shield', industry: 'Security', funding_amount: 3000000 };
      }
      if (url === '/api/me/deals/2/history') {
        return [];
      }
      return {};
    });
  });

  it('navigates to Deal Rooms hub from Founder sidebar / route /app/deal-room without requiring a Deal ID', async () => {
    const listSpy = vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 2,
          connection_id: 10,
          business_id: 2,
          business: { id: 2, name: 'naim health care', industry: 'Healthcare', business_stage: 'Growth' },
          founder_user_id: 1,
          founder: { id: 1, name: 'Shayan Founder', email: 'shayan@example.com' },
          counterparty_user_id: 2,
          counterparty: { id: 2, name: 'Siza Investor', email: 'siza@example.com' },
          counterparty_role: 'investor',
          stage: 'completed',
          stage_label: 'Completed',
          stage_order: 8,
          agreement_status: 'accepted',
          milestones_count: 3,
          funded_milestones_count: 3,
          created_at: '2026-03-10T10:00:00Z',
          updated_at: '2026-03-20T10:00:00Z',
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 1, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' }, { timeout: 8000 })).toBeTruthy();
    expect(await screen.findByText('1 deal', {}, { timeout: 8000 })).toBeTruthy();

    // Verify Deal #2 card details rendered accurately from API data
    expect((await screen.findAllByText('naim health care')).length).toBeGreaterThan(0);
    expect(screen.getByText('Deal #2')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText(/Siza Investor/i)).toBeTruthy();

    expect(listSpy).toHaveBeenCalledWith({
      role: undefined,
      page: 1,
      per_page: 30,
    });
  });

  it('navigates to Deal Rooms hub for Investor role and lists accessible deal cards', async () => {
    auth.user = { id: 2, name: 'Siza Investor', email: 'siza@example.com' };
    auth.activeRole = 'investor';
    auth.roles = ['investor'];

    const listSpy = vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 2,
          connection_id: 10,
          business_id: 2,
          business: { id: 2, name: 'naim health care', industry: 'Healthcare' },
          founder_user_id: 1,
          founder: { id: 1, name: 'Shayan Founder', email: 'shayan@example.com' },
          counterparty_user_id: 2,
          counterparty: { id: 2, name: 'Siza Investor', email: 'siza@example.com' },
          counterparty_role: 'investor',
          stage: 'completed',
          stage_label: 'Completed',
          stage_order: 8,
          created_at: '2026-03-10T10:00:00Z',
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 1, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' }, { timeout: 8000 })).toBeTruthy();
    expect((await screen.findAllByText('naim health care', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(screen.getByText('Deal #2')).toBeTruthy();
    expect(screen.getByText(/Shayan Founder/i)).toBeTruthy();

    expect(listSpy).toHaveBeenCalledWith({
      role: 'investor',
      page: 1,
      per_page: 30,
    });
  });

  it('navigates to specific /app/deals/:id when clicking Open Room on a deal card', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 2,
          connection_id: 10,
          business_id: 2,
          business: { id: 2, name: 'naim health care', industry: 'Healthcare' },
          founder_user_id: 1,
          counterparty_user_id: 2,
          counterparty_role: 'investor',
          stage: 'completed',
          stage_label: 'Completed',
          stage_order: 8,
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 1, per_page: 30 },
    });

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 2,
      connection_id: 10,
      business_id: 2,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'completed',
      stage_label: 'Completed',
      stage_order: 8,
      created_at: '2026-03-10T10:00:00Z',
      updated_at: '2026-03-20T10:00:00Z',
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    const openRoomBtn = await screen.findByRole('button', { name: /Open Room/i });
    fireEvent.click(openRoomBtn);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app/deals/2');
    });
  });

  it('loads specific deal route /app/deals/2 directly with authoritative lifecycle state', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 2,
      connection_id: 10,
      business_id: 2,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'completed',
      stage_label: 'Completed',
      stage_order: 8,
      created_at: '2026-03-10T10:00:00Z',
      updated_at: '2026-03-20T10:00:00Z',
    });

    window.history.replaceState({}, '', '/app/deals/2');
    render(<App />);

    expect((await screen.findAllByText('naim health care', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(await screen.findByText('Deal Completed', {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText('All milestones verified, agreement executed, and deal lifecycle completed.')).toBeTruthy();
  });

  it('toggles between Grid view and Pipeline Kanban view in DealHub', async () => {
    vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 101,
          connection_id: 1,
          business_id: 5,
          business: { id: 5, name: 'Apex AI Systems', industry: 'Artificial Intelligence' },
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
          business: { id: 6, name: 'BioHealth Corp', industry: 'Biotech' },
          founder_user_id: 1,
          counterparty_user_id: 3,
          counterparty: { id: 3, name: 'Tariq Rahman' },
          counterparty_role: 'investor',
          stage: 'completed',
          stage_label: 'Completed',
          stage_order: 8,
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 2, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    const apexItems = await screen.findAllByText('Apex AI Systems', {}, { timeout: 8000 });
    expect(apexItems.length).toBeGreaterThan(0);

    const pipelineBtn = screen.getByRole('button', { name: /Pipeline/i });
    fireEvent.click(pipelineBtn);

    // Pipeline Stage Columns should be present
    expect(await screen.findByText('Matched')).toBeTruthy();
    expect(screen.getByText('Negotiation')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect((await screen.findAllByText('BioHealth Corp')).length).toBeGreaterThan(0);
  });

  it('filters deals by text search', async () => {
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

    expect((await screen.findAllByText('Apex AI Systems', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('GreenEnergy Ltd', {}, { timeout: 8000 })).length).toBeGreaterThan(0);

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

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' }, { timeout: 8000 })).toBeTruthy();
    expect(await screen.findByText('No Active Deal Rooms', {}, { timeout: 8000 })).toBeTruthy();
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
          },
        ],
        pagination: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
      });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByText('Unable to Load Deals', {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText('Network error loading deals')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('EcoGreen Energy', {}, { timeout: 8000 })).toBeTruthy();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('handles invalid deal ID gracefully in DealRoom and offers CTA to Deal Hub and Connections', async () => {
    vi.spyOn(api.deals, 'get').mockRejectedValue(new Error('Deal not found or unauthorized.'));

    window.history.replaceState({}, '', '/app/deals/99999');
    render(<App />);

    expect(await screen.findByText('Unable to Load Deal Room', {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText('Deal not found or unauthorized.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deal Hub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connections' })).toBeTruthy();
  });

  it('supports professional role accessing /app/deal-room', async () => {
    auth.user = { id: 3, name: 'Prof User', email: 'prof@example.com' };
    auth.activeRole = 'professional';
    auth.roles = ['professional'];

    const listSpy = vi.spyOn(api.deals, 'list').mockResolvedValue({
      items: [
        {
          id: 303,
          connection_id: 15,
          business_id: 2,
          business: { id: 2, name: 'naim health care' },
          founder_user_id: 1,
          founder: { id: 1, name: 'Shayan Founder' },
          counterparty_user_id: 3,
          counterparty: { id: 3, name: 'Prof User' },
          counterparty_role: 'professional',
          stage: 'negotiation',
          stage_label: 'Negotiation',
          stage_order: 5,
        },
      ],
      pagination: { current_page: 1, last_page: 1, total: 1, per_page: 30 },
    });

    window.history.replaceState({}, '', '/app/deal-room');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Deal Rooms' }, { timeout: 8000 })).toBeTruthy();
    expect((await screen.findAllByText('naim health care', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(listSpy).toHaveBeenCalledWith({
      role: 'professional',
      page: 1,
      per_page: 30,
    });
  });
});
