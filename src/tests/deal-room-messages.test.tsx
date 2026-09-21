import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealRoom from '../pages/shared/DealRoom';
import { api, type DealMessageItem } from '../services/api';

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

describe('Phase 5: Real Database-Persisted Deal Room Chat', () => {
  const sampleMessages: DealMessageItem[] = [
    {
      id: 1,
      deal_id: 42,
      sender_user_id: 2,
      sender: {
        id: 2,
        name: 'Jane Investor',
        email: 'jane@investor.com',
        avatar_url: null,
      },
      body: 'Hello Founder, excited to review the terms!',
      created_at: '2026-09-18T10:00:00Z',
    },
    {
      id: 2,
      deal_id: 42,
      sender_user_id: 1,
      sender: {
        id: 1,
        name: 'Founder User',
        email: 'founder@example.com',
        avatar_url: null,
      },
      body: 'Welcome Jane! Let us align on milestone tranches.',
      created_at: '2026-09-18T10:05:00Z',
    },
  ];

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

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 42,
      connection_id: 10,
      business_id: 5,
      founder_user_id: 1,
      counterparty_user_id: 2,
      counterparty_role: 'investor',
      stage: 'deal_room_opened',
      stage_label: 'Deal Room',
      stage_order: 3,
      created_at: '2026-09-18T00:00:00Z',
      updated_at: '2026-09-18T00:00:00Z',
    });

    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: sampleMessages });
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/nda')) return null as any;
      if (url.includes('/businesses/')) return { id: 5, name: 'Apex AI Systems', funding_amount: 500000 } as any;
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  function renderDealRoom(dealId = '42') {
    return render(
      <MemoryRouter initialEntries={[`/app/deals/${dealId}`]}>
        <Routes>
          <Route path="/app/deals/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads and renders persisted messages in the Communication tab', async () => {
    renderDealRoom();

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(screen.getByText('Hello Founder, excited to review the terms!')).toBeTruthy();
      expect(screen.getByText('Welcome Jane! Let us align on milestone tranches.')).toBeTruthy();
      expect(screen.getByText('Jane Investor')).toBeTruthy();
    });

    // Verify session-only warning is gone and professional header exists
    expect(screen.queryByText(/local session thread/i)).toBeNull();
    expect(screen.getByText('Deal Messages')).toBeTruthy();
  });

  it('renders empty state when no messages exist in the conversation', async () => {
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });

    renderDealRoom();

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeTruthy();
      expect(screen.getByText(/0 messages/i)).toBeTruthy();
    });
  });

  it('sends a new message using exact deal ID and appends it to the conversation', async () => {
    const newMsg: DealMessageItem = {
      id: 3,
      deal_id: 42,
      sender_user_id: 1,
      sender: {
        id: 1,
        name: 'Founder User',
        email: 'founder@example.com',
        avatar_url: null,
      },
      body: 'Attaching updated milestone breakdown.',
      created_at: new Date().toISOString(),
    };

    const sendSpy = vi.spyOn(api.deals.messages, 'send').mockResolvedValue(newMsg);

    renderDealRoom();

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message to deal participants/i)).toBeTruthy();
    });

    const input = screen.getByPlaceholderText(/type a message to deal participants/i);
    fireEvent.change(input, { target: { value: 'Attaching updated milestone breakdown.' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith(42, 'Attaching updated milestone breakdown.', undefined);
      expect(screen.getByText('Attaching updated milestone breakdown.')).toBeTruthy();
    });

    // Input is cleared on success
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('handles send failure gracefully with truthful error message', async () => {
    vi.spyOn(api.deals.messages, 'send').mockRejectedValue(new Error('Network disconnected. Message failed to send.'));

    renderDealRoom();

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message to deal participants/i)).toBeTruthy();
    });

    const input = screen.getByPlaceholderText(/type a message to deal participants/i);
    fireEvent.change(input, { target: { value: 'This message will fail.' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Network disconnected. Message failed to send.')).toBeTruthy();
    });

    // Failed message is NOT appended as a sent message
    expect(screen.queryByText('This message will fail.')).toBeNull();
  });

  it('fetches deal-isolated messages when navigating to a different deal ID', async () => {
    const deal99Messages: DealMessageItem[] = [
      {
        id: 991,
        deal_id: 99,
        sender_user_id: 1,
        sender: { id: 1, name: 'Founder User', email: 'founder@example.com', avatar_url: null },
        body: 'Deal 99 Private Discussion',
        created_at: '2026-09-18T12:00:00Z',
      },
    ];

    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 99,
      connection_id: 20,
      business_id: 5,
      founder_user_id: 1,
      counterparty_user_id: 3,
      counterparty_role: 'professional',
      stage: 'negotiation',
      stage_label: 'Negotiation',
      stage_order: 5,
      created_at: '2026-09-18T00:00:00Z',
      updated_at: '2026-09-18T00:00:00Z',
    });

    const listSpy = vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: deal99Messages });

    renderDealRoom('99');

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(99, undefined);
      expect(screen.getByText('Deal 99 Private Discussion')).toBeTruthy();
      expect(screen.queryByText('Hello Founder, excited to review the terms!')).toBeNull();
    });
  });

  it('keeps Authoritative State Log separate from user deal chat messages', async () => {
    renderDealRoom();

    await waitFor(() => {
      expect(screen.getByText('Apex AI Systems')).toBeTruthy();
    });

    const commTab = screen.getByRole('button', { name: /communication/i });
    fireEvent.click(commTab);

    await waitFor(() => {
      expect(screen.getByText('Authoritative State Log')).toBeTruthy();
      expect(screen.getByText('Deal Messages')).toBeTruthy();
    });
  });
});
