import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Connections from '../pages/shared/Connections';
import { api, type ConnectionItem } from '../services/api';

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'investor', activeRole: 'investor' }),
}));

function page(items: ConnectionItem[]) {
  return {
    items,
    pagination: { current_page: 1, last_page: 1, total: items.length, per_page: 25 },
  };
}

describe('Investor Cancel/Withdraw Interest UI Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Withdraw Interest button for pending investor interest', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue(
      page([
        {
          connection_id: null,
          business: { id: 42, name: 'CloudScale AI' },
          founder: { id: 1, name: 'Jane Founder' },
          counterparty: { id: 10, name: 'Angel Investor' },
          counterparty_role: 'investor',
          has_founder_interest: false,
          has_counterparty_interest: true,
          is_mutual: false,
          is_connected: false,
          connected_at: null,
          deal: null,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/app/investor/connections']}>
        <Connections />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CloudScale AI')).toBeTruthy();
    });

    const withdrawBtn = screen.getByRole('button', { name: /withdraw interest/i });
    expect(withdrawBtn).toBeTruthy();
  });

  it('does not render Withdraw Interest when mutual interest is confirmed', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue(
      page([
        {
          connection_id: 101,
          business: { id: 42, name: 'CloudScale AI' },
          founder: { id: 1, name: 'Jane Founder' },
          counterparty: { id: 10, name: 'Angel Investor' },
          counterparty_role: 'investor',
          has_founder_interest: true,
          has_counterparty_interest: true,
          is_mutual: true,
          is_connected: true,
          connected_at: '2026-09-18T10:00:00.000Z',
          deal: null,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/app/investor/connections']}>
        <Connections />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CloudScale AI')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: /withdraw interest/i })).toBeNull();
    expect(screen.getByRole('button', { name: /open deal room/i })).toBeTruthy();
  });

  it('opens confirmation modal and cancels withdrawal on Keep Interest', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue(
      page([
        {
          connection_id: null,
          business: { id: 42, name: 'CloudScale AI' },
          founder: { id: 1, name: 'Jane Founder' },
          counterparty: { id: 10, name: 'Angel Investor' },
          counterparty_role: 'investor',
          has_founder_interest: false,
          has_counterparty_interest: true,
          is_mutual: false,
          is_connected: false,
          connected_at: null,
          deal: null,
        },
      ])
    );

    const withdrawSpy = vi.spyOn(api.connections, 'withdrawInterest').mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/app/investor/connections']}>
        <Connections />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CloudScale AI')).toBeTruthy();
    });

    // Click Withdraw Interest to open confirmation modal
    fireEvent.click(screen.getByRole('button', { name: /withdraw interest/i }));

    // Confirmation modal should be visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/are you sure you want to withdraw your interest in/i)).toBeTruthy();
    });

    // Click Keep Interest
    fireEvent.click(screen.getByRole('button', { name: /keep interest/i }));

    // Modal closes without API call
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(withdrawSpy).not.toHaveBeenCalled();
  });

  it('confirms withdrawal, calls API, and refreshes the connection list', async () => {
    const listSpy = vi.spyOn(api.connections, 'list')
      .mockResolvedValueOnce(
        page([
          {
            connection_id: null,
            business: { id: 42, name: 'CloudScale AI' },
            founder: { id: 1, name: 'Jane Founder' },
            counterparty: { id: 10, name: 'Angel Investor' },
            counterparty_role: 'investor',
            has_founder_interest: false,
            has_counterparty_interest: true,
            is_mutual: false,
            is_connected: false,
            connected_at: null,
            deal: null,
          },
        ])
      )
      .mockResolvedValueOnce(page([])); // After withdrawal, list is empty

    const withdrawSpy = vi.spyOn(api.connections, 'withdrawInterest').mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/app/investor/connections']}>
        <Connections />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CloudScale AI')).toBeTruthy();
    });

    // Open confirmation modal
    fireEvent.click(screen.getByRole('button', { name: /withdraw interest/i }));

    // Modal dialog is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    // Click confirm Withdraw Interest button inside modal
    const confirmButtons = screen.getAllByRole('button', { name: /withdraw interest/i });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(withdrawSpy).toHaveBeenCalledWith(42, 'investor');
    });

    // Connection list refreshed and empty state shown
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('No connections yet')).toBeTruthy();
    });
  });
});
