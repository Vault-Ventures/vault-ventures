import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NDAFlow from '../pages/shared/NDAFlow';
import DealRoom from '../pages/shared/DealRoom';
import { api } from '../services/api';

const context = vi.hoisted(() => ({ role: 'founder', user: { id: 17, name: 'Test Founder', roles: ['founder'] } }));
vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: context.role }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: context.user }) }));
const endpoint = '/api/me/businesses/42/nda';
const pending = { business_id: 42, status: 'pending', status_label: 'Pending Acceptance', counterparty_role: 'professional', current_user_accepted: true, founder_accepted: true, counterparty_accepted: false, requested_at: '2026-09-20T20:17:20Z' };
const fresh = { ...pending, status: null, current_user_accepted: false, founder_accepted: false, status_label: 'Not Requested' };
const active = { ...pending, status: 'active', status_label: 'Active', counterparty_accepted: true, stage_3_unlocked: true };
let statusRead: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'founder';
  context.user = { id: 17, name: 'Test Founder', roles: ['founder'] };
  statusRead = vi.fn().mockResolvedValue(pending);
  vi.spyOn(api, 'get').mockImplementation(async (url, params) => {
    if (url === endpoint) return statusRead(params);
    if (url.includes('businesses/42')) return { id: 42, name: 'Test Business' };
    return [];
  });
  vi.spyOn(api, 'post').mockResolvedValue(pending);
  Element.prototype.scrollIntoView = vi.fn();
});
function mountNda() {
  render(<MemoryRouter initialEntries={['/app/nda/42?counterparty_user_id=91']}><Routes>
    <Route path="/app/nda/:id" element={<NDAFlow />} />
  </Routes></MemoryRouter>);
}
async function sign(label = 'Request & Sign NDA') {
  const review = await screen.findByRole('button', { name: 'Review NDA' });
  await act(async () => { fireEvent.click(review); });
  const next = await screen.findByRole('button', { name: 'Continue to Sign' });
  await act(async () => { fireEvent.click(next); });
  const checkbox = await screen.findByRole('checkbox');
  await act(async () => { fireEvent.click(checkbox); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: label })); });
}

it('loads the exact Professional counterparty query and shows persisted Founder acceptance without mutation', async () => {
  mountNda();
  expect(await screen.findByText('Your acceptance has been recorded')).toBeTruthy();
  expect(screen.getByText('Waiting for the counterparty to complete their acceptance.')).toBeTruthy();
  expect(api.get).toHaveBeenCalledWith(endpoint, { counterparty_user_id: '91' });
  expect(statusRead).toHaveBeenCalledExactlyOnceWith({ counterparty_user_id: '91' });
  expect(screen.queryByRole('button', { name: 'Request & Sign NDA' })).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});

it.each(['investor', 'professional'])('preserves %s query context and pending acceptance flow', async role => {
  context.role = role;
  context.user = { id: 91, name: 'Test Counterparty', roles: [role] };
  statusRead.mockResolvedValue({ ...pending, counterparty_role: role, current_user_accepted: false });
  vi.mocked(api.post).mockResolvedValue(active);
  mountNda();
  await sign('Confirm & Sign');
  expect(await screen.findByText('NDA Complete')).toBeTruthy();
  expect(api.get).toHaveBeenCalledWith(endpoint, { counterparty_user_id: '91', role });
  expect(api.post).toHaveBeenCalledExactlyOnceWith(`${endpoint}/accept`, { counterparty_user_id: '91', role });
});

it('preserves a genuinely fresh NDA request', async () => {
  statusRead.mockResolvedValue(fresh);
  mountNda();
  await sign();
  expect(await screen.findByText('Your acceptance has been recorded')).toBeTruthy();
  expect(api.post).toHaveBeenCalledExactlyOnceWith(`${endpoint}/request`, { counterparty_user_id: '91' });
});

it('loads an active NDA as complete without any mutation', async () => {
  statusRead.mockResolvedValue(active);
  mountNda();
  expect(await screen.findByText('NDA Complete')).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
});

it.each(['request', 'accept'])('recovers a 409 from %s by reading persisted acceptance, without retrying POST', async action => {
  statusRead.mockResolvedValueOnce(action === 'request' ? fresh : { ...pending, current_user_accepted: false, founder_accepted: false }).mockResolvedValueOnce(pending);
  vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
  mountNda();
  await sign(action === 'request' ? 'Request & Sign NDA' : 'Confirm & Sign');
  expect(await screen.findByText('Your acceptance has been recorded')).toBeTruthy();
  expect(statusRead).toHaveBeenCalledTimes(2);
  expect(statusRead).toHaveBeenLastCalledWith({ counterparty_user_id: '91' });
  expect(api.post).toHaveBeenCalledExactlyOnceWith(`${endpoint}/${action}`, { counterparty_user_id: '91' });
  expect(screen.queryByText('Conflict')).toBeNull();
});

it.each(['read failure', 'not requested', 'declined'])('retains an error after 409 when recovery returns %s', async result => {
  statusRead.mockResolvedValueOnce(fresh);
  if (result === 'read failure') statusRead.mockRejectedValueOnce(new Error('Network unavailable'));
  else statusRead.mockResolvedValueOnce({ ...fresh, status: result === 'declined' ? 'declined' : null });
  vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
  mountNda();
  await sign();
  expect(await screen.findByText(/an existing pending or active NDA could not be confirmed/)).toBeTruthy();
  expect(screen.queryByText('Your acceptance has been recorded')).toBeNull();
  expect(screen.queryByText('NDA Complete')).toBeNull();
  expect(api.post).toHaveBeenCalledTimes(1);
});

it('renders recovered pending state without inventing current-user acceptance', async () => {
  statusRead.mockResolvedValueOnce(fresh).mockResolvedValueOnce({ ...pending, current_user_accepted: false, founder_accepted: false, counterparty_accepted: true });
  vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
  mountNda();
  await sign();
  expect(await screen.findByRole('button', { name: 'Review NDA' })).toBeTruthy();
  expect(screen.queryByText('Your acceptance has been recorded')).toBeNull();
  expect(api.post).toHaveBeenCalledTimes(1);
});

it('does not treat a non-conflict failure as success or retry it', async () => {
  statusRead.mockResolvedValue(fresh);
  vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
  mountNda();
  await sign();
  expect(await screen.findByText('Forbidden')).toBeTruthy();
  expect(statusRead).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledTimes(1);
});

it.each(['professional', 'investor'])('DealRoom loads the exact %s NDA context for the Founder', async role => {
  vi.spyOn(api.deals, 'get').mockResolvedValue({ id: 81, business_id: 42, founder_user_id: 17, counterparty_user_id: 91, counterparty_role: role, stage: 'deal_room_opened', stage_order: 3, stage_label: 'Deal Room' } as any);
  vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
  vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
  vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
  vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });
  render(<MemoryRouter initialEntries={['/app/deals/81']}><Routes><Route path="/app/deals/:dealId" element={<DealRoom />} /></Routes></MemoryRouter>);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith(endpoint, { deal_id: 81, counterparty_user_id: 91, role }));
  expect(statusRead).toHaveBeenCalledWith({ deal_id: 81, counterparty_user_id: 91, role });
  expect(api.post).not.toHaveBeenCalled();
});
