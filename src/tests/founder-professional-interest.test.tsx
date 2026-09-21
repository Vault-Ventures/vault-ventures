import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Connections from '../pages/shared/Connections';
import { api, type ConnectionItem } from '../services/api';

vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: 'founder' }) }));

const pending: ConnectionItem = {
  connection_id: null, business: { id: 42, name: 'Test Business' },
  founder: { id: 17, name: 'Test Founder' }, counterparty: { id: 91, name: 'Test Professional' },
  counterparty_role: 'professional', has_founder_interest: false, has_counterparty_interest: true,
  is_mutual: false, is_connected: false, connected_at: null, deal: null,
};
const page = (item: ConnectionItem) => ({ items: [item], pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1 } });
function mount(role = 'founder') {
  render(<MemoryRouter initialEntries={[`/app/${role}/connections`]}><Connections /></MemoryRouter>);
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.connections, 'list').mockResolvedValue(page(pending));
  vi.spyOn(api, 'post').mockResolvedValue({});
});

it('renders incoming Professional interest with an actionable Founder button', async () => {
  mount();
  expect(await screen.findByRole('button', { name: 'Express Interest' })).toBeTruthy();
  expect(screen.getByText('Test Professional')).toBeTruthy();
  expect(screen.getByText(/This professional has expressed interest/)).toBeTruthy();
  expect(screen.queryByText(/Awaiting response/)).toBeNull();
  expect(api.connections.list).toHaveBeenCalledWith('founder', 1);
});

it('uses the exact card business and user ID, disables submission, and prevents rapid duplicate POSTs', async () => {
  const request = deferred<unknown>();
  vi.mocked(api.post).mockReturnValue(request.promise);
  vi.mocked(api.connections.list).mockResolvedValue(page({ ...pending, business: { id: 57, name: 'Other Business' }, counterparty: { id: 203, name: 'Test Professional' } }));
  mount();
  const button = await screen.findByRole('button', { name: 'Express Interest' });
  await act(async () => {
    fireEvent.click(button);
    fireEvent.click(button);
  });
  await waitFor(() => {
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.textContent).toBe('Expressing Interest...');
  });
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/api/me/businesses/57/interests', { counterparty_user_id: 203, role: 'professional' });
  await act(async () => { request.resolve({}); });
});

it('waits for authoritative refetch before showing mutual state and never creates a Deal', async () => {
  const refresh = deferred<ReturnType<typeof page>>();
  vi.mocked(api.connections.list).mockResolvedValueOnce(page(pending)).mockReturnValueOnce(refresh.promise);
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Express Interest' }));
  await waitFor(() => expect(api.connections.list).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('button', { name: 'Open Deal Room' })).toBeNull();
  expect(screen.queryByText('Mutual Interest')).toBeNull();
  await act(async () => { refresh.resolve(page({ ...pending, has_founder_interest: true, is_mutual: true, is_connected: true, connection_id: 73 })); });
  expect(await screen.findByRole('button', { name: 'Open Deal Room' })).toBeTruthy();
  expect(screen.getByText('Mutual Interest')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Express Interest' })).toBeNull();
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/api/me/businesses/42/interests', { counterparty_user_id: 91, role: 'professional' });
});

it('does not manufacture mutual state when refetch still reports pending', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Express Interest' }));
  await waitFor(() => expect(api.connections.list).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole('button', { name: 'Express Interest' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open Deal Room' })).toBeNull();
});

it('keeps POST failures pending with useful feedback and permits retry', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Interest request failed'));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Express Interest' }));
  expect(await screen.findByText('Interest request failed')).toBeTruthy();
  const retry = screen.getByRole('button', { name: 'Express Interest' }) as HTMLButtonElement;
  expect(retry.disabled).toBe(false);
  expect(screen.getByText('Updated Pending mutual interest')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open Deal Room' })).toBeNull();
  // The pending tracker names a future Mutual Interest step; it is not a mutual badge.
  expect(screen.getAllByText('Interest Sent').length).toBeGreaterThan(0);
  expect(api.connections.list).toHaveBeenCalledTimes(1);
  fireEvent.click(retry);
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
});

it('reports successful submission followed by refresh failure without inventing connected state', async () => {
  vi.mocked(api.connections.list).mockResolvedValueOnce(page(pending)).mockRejectedValueOnce(new Error('Service unavailable'));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Express Interest' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Interest was submitted, but connections could not be refreshed');
  expect(screen.queryByRole('button', { name: 'Open Deal Room' })).toBeNull();
  expect(screen.queryByText('Mutual Interest')).toBeNull();
  expect(api.post).toHaveBeenCalledTimes(1);
});

it.each([
  ['Founder already interested', { has_founder_interest: true }],
  ['already mutual', { is_mutual: true }],
  ['already connected', { is_connected: true }],
  ['no counterparty interest', { has_counterparty_interest: false }],
  ['Investor record', { counterparty_role: 'investor' }],
  ['completed Deal', { deal: { id: 4, stage: 'completed' } }],
] as [string, Partial<ConnectionItem>][])('does not offer the new action for %s', async (_, changes) => {
  vi.mocked(api.connections.list).mockResolvedValue(page({ ...pending, ...changes }));
  mount();
  await screen.findByText('Test Professional');
  expect(screen.queryByRole('button', { name: 'Express Interest' })).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});

it.each(['professional', 'investor'])('does not expose the Founder action in the %s workspace', async role => {
  mount(role);
  await screen.findByText('Test Founder');
  expect(screen.queryByRole('button', { name: 'Express Interest' })).toBeNull();
});

it.each(['professional', 'investor'] as const)('preserves the existing %s counterparty reciprocal endpoint', async role => {
  vi.mocked(api.connections.list).mockResolvedValue(page({ ...pending, counterparty_role: role, has_founder_interest: true, has_counterparty_interest: false }));
  mount(role);
  fireEvent.click(await screen.findByRole('button', { name: 'Reciprocate interest' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledExactlyOnceWith('/api/me/businesses/42/reciprocal-interest', { role }));
  await waitFor(() => expect(api.connections.list).toHaveBeenCalledTimes(2));
});
