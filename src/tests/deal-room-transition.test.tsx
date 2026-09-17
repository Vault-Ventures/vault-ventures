import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealRoom, { submitDealTransition } from '../pages/shared/DealRoom';
import { api } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'investor',
  user: { id: 2, roles: ['investor', 'professional'] },
}));
vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: context.role }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: context.user }) }));

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'investor';
  context.user = { id: 2, roles: ['investor', 'professional'] };
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(api, 'get').mockResolvedValue([]);
  vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({ active_proposal: null, proposals: [] } as any);
  vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
  vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
});

function mountDeal() {
  render(<MemoryRouter initialEntries={['/app/deals/81']}><Routes>
    <Route path="/app/deals/:dealId" element={<DealRoom />} />
  </Routes></MemoryRouter>);
}

it.each([
  ['multi-role Investor', ['investor', 'professional']],
  ['single-role Investor', ['investor']],
])('%s sends the selected role on Accept Terms and refreshes the transitioned Deal', async (_, roles) => {
  context.user.roles = roles;
  let stage = 'negotiation';
  const get = vi.spyOn(api.deals, 'get').mockImplementation(async () => ({
    id: 81, founder_user_id: 1, counterparty_user_id: 2, counterparty_role: 'investor',
    stage, stage_label: stage === 'agreement' ? 'Agreement' : 'Negotiation', stage_order: stage === 'agreement' ? 6 : 5,
  } as any));
  const post = vi.spyOn(api, 'post').mockImplementation(async (url, payload) => {
    expect(url).toBe('/api/me/deals/81/transition');
    expect(payload).toEqual({ target_state: 'agreement', role: 'investor' });
    stage = 'agreement';
    return { id: 81, stage } as any;
  });
  mountDeal();
  fireEvent.click(await screen.findByRole('button', { name: 'Negotiation Terms' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Accept Terms' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/me/deals/81/transition', { target_state: 'agreement', role: 'investor' }));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(get).toHaveBeenLastCalledWith('81', 'investor');
  expect(stage).toBe('agreement');
});

it('sends professional when Professional is selected, without inferring Investor from account roles', async () => {
  context.role = 'professional';
  const post = vi.spyOn(api, 'post').mockResolvedValue({ stage: 'agreement' });
  await submitDealTransition(81, 'agreement', context.role);
  expect(post).toHaveBeenCalledWith('/api/me/deals/81/transition', { target_state: 'agreement', role: 'professional' });
});

it('preserves the Founder transition payload', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ stage: 'agreement' });
  await submitDealTransition(81, 'agreement', 'founder');
  expect(post).toHaveBeenCalledWith('/api/me/deals/81/transition', { target_state: 'agreement' });
});

it.each(['admin', 'professional'])('preserves existing %s workspace action restrictions', async role => {
  context.role = role;
  vi.spyOn(api.deals, 'get').mockResolvedValue({ id: 81, stage: 'negotiation', stage_order: 5, stage_label: 'Negotiation' } as any);
  const post = vi.spyOn(api, 'post').mockResolvedValue({});
  mountDeal();
  fireEvent.click(await screen.findByRole('button', { name: 'Negotiation Terms' }));
  expect(screen.queryByRole('button', { name: 'Accept Terms' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Approve Terms' })).toBeNull();
  expect(post).not.toHaveBeenCalled();
});
