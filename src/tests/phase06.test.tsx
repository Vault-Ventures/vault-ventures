import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import Readiness from '../pages/founder/ReadinessScore';
import BusinessProfile from '../pages/founder/BusinessProfile';
import DiscoverInvestors from '../pages/founder/DiscoverInvestors';
import DiscoverProfessionals from '../pages/founder/DiscoverProfessionals';
import Connections from '../pages/shared/Connections';
import Reputation from '../pages/shared/Reputation';
import Dashboard from '../pages/founder/Dashboard';

const context = vi.hoisted(() => ({ role: 'founder' }));
vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: context.role, setRole: vi.fn() }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, name: 'Founder' }, session: { roles: ['founder', 'investor'], activeRole: context.role } }) }));

function Location() { const location = useLocation(); return <span data-testid="location">{location.pathname}{location.search}</span>; }
function mount(element: React.ReactNode, url: string, path = '*') {
  return render(<MemoryRouter initialEntries={[url]}><Location /><Routes><Route path={path} element={element} /><Route path="*" element={<p>Destination</p>} /></Routes></MemoryRouter>);
}
const page = (items: any[], current = 1, last = 1) => ({ items, pagination: { current_page: current, last_page: last, per_page: 15, total: items.length } });
const assessment = { overall_score: 60, suggestions: ['Update description'], factor_results: {}, version: 1 } as any;

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'founder';
  vi.spyOn(api, 'get').mockResolvedValue([]);
  vi.spyOn(api.businesses, 'listPage').mockResolvedValue(page([]));
  vi.spyOn(api.businesses, 'get').mockImplementation(async id => ({ id: Number(id), name: `Business ${id}`, status: 'draft', description: 'Original' }));
  vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);
  vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(assessment);
  vi.spyOn(api.readiness, 'listAssessments').mockResolvedValue([]);
  vi.spyOn(api.readiness, 'createAssessment').mockResolvedValue(assessment);
  vi.spyOn(api.reputation, 'get').mockResolvedValue(null as any);
});

describe.each([['investors', DiscoverInvestors], ['professionals', DiscoverProfessionals]] as const)('Discovery %s', (_, Component) => {
  it('shows a genuine empty state and the registered create route', async () => {
    mount(<Component />, '/discovery');
    const button = await screen.findByRole('button', { name: 'Create a Business' });
    expect(button.closest('a')?.getAttribute('href')).toBe('/app/founder/businesses/new');
  });
  it('reads items and loads subsequent business pages', async () => {
    vi.mocked(api.businesses.listPage).mockResolvedValueOnce(page([{ id: 1, name: 'First' }, { id: 2, name: 'Second' }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 42, name: 'Later' }, { id: 43, name: 'Latest' }], 2, 2));
    mount(<Component />, '/discovery');
    expect(await screen.findByRole('option', { name: 'Second' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next businesses' }));
    expect(await screen.findByRole('option', { name: 'Later' })).toBeTruthy();
    expect(api.businesses.listPage).toHaveBeenLastCalledWith(2);
    expect(screen.queryByText('No business profile found')).toBeNull();
  });
  it('shows loading then an API error without a false empty state', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(api.businesses.listPage).mockReturnValue(new Promise((_, fail) => { reject = fail; }));
    mount(<Component />, '/discovery');
    expect(screen.getByRole('status').textContent).toContain('Loading businesses');
    reject(new Error('Service unavailable'));
    expect((await screen.findByRole('alert')).textContent).toContain('Service unavailable');
    expect(screen.queryByText('No business profile found')).toBeNull();
  });
});

describe('Readiness identity', () => {
  it.each([1, 42])('uses business %i for reads, recalculation, and profile navigation', async id => {
    mount(<Readiness />, `/app/founder/readiness?businessId=${id}`, '/app/founder/readiness');
    const recalculate = await screen.findByRole('button', { name: 'Recalculate Assessment' });
    expect(api.businesses.get).toHaveBeenCalledWith(String(id));
    expect(api.businesses.listPage).not.toHaveBeenCalled();
    expect(api.readiness.getLatestAssessment).toHaveBeenCalledWith(id);
    expect(api.readiness.listAssessments).toHaveBeenCalledWith(id);
    fireEvent.click(recalculate);
    await waitFor(() => expect(api.readiness.createAssessment).toHaveBeenCalledWith(id));
    fireEvent.click(await screen.findByRole('button', { name: 'Update Profile' }));
    expect(screen.getByTestId('location').textContent).toBe(`/app/founder/businesses/${id}`);
  });
  it.each(['new', 'edit', '0', 'abc'])('rejects invalid ID %s without loading another business', async id => {
    mount(<Readiness />, `/app/founder/readiness?businessId=${id}`);
    expect((await screen.findByRole('alert')).textContent).toContain('Invalid business ID');
    expect(api.businesses.get).not.toHaveBeenCalled();
    expect(api.businesses.listPage).not.toHaveBeenCalled();
  });
  it.each([403, 404])('shows authorization/not-found error %i', async status => {
    vi.mocked(api.businesses.get).mockRejectedValue(new ApiError(status, 'Business unavailable'));
    mount(<Readiness />, '/app/founder/readiness?businessId=99');
    expect((await screen.findByRole('alert')).textContent).toContain('Business unavailable');
    expect(api.readiness.getLatestAssessment).not.toHaveBeenCalled();
  });
  it('lets users select a business beyond the first page', async () => {
    vi.mocked(api.businesses.listPage).mockResolvedValueOnce(page([{ id: 1, name: 'First' }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 42, name: 'Later' }], 2, 2));
    mount(<Readiness />, '/app/founder/readiness');
    fireEvent.click(await screen.findByRole('button', { name: 'Next businesses' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Later' }));
    await waitFor(() => expect(api.businesses.get).toHaveBeenCalledWith('42'));
    expect(screen.getByTestId('location').textContent).toContain('businessId=42');
  });
  it('uses the real creation route when there are no businesses', async () => {
    mount(<Readiness />, '/app/founder/readiness', '/app/founder/readiness');
    fireEvent.click(await screen.findByRole('button', { name: 'Register Business' }));
    expect(screen.getByTestId('location').textContent).toBe('/app/founder/businesses/new');
  });
});

describe('Business Profile', () => {
  it.each(['new', 'edit', 'xyz'])('does not fall back for %s', async id => {
    mount(<BusinessProfile />, `/app/businesses/${id}`, '/app/businesses/:id');
    expect((await screen.findByRole('alert')).textContent).toContain('Invalid business ID');
    expect(api.businesses.get).not.toHaveBeenCalled();
  });
  it('persists edited values for the exact business and updates the screen', async () => {
    vi.spyOn(api.businesses, 'updateRecord').mockImplementation(async (id, fields) => ({ id: Number(id), ...fields } as any));
    mount(<BusinessProfile />, '/app/founder/businesses/42', '/app/founder/businesses/:id');
    const edits = await screen.findAllByRole('button', { name: /Edit/ });
    fireEvent.click(edits[0]);
    fireEvent.change(screen.getByLabelText('Business Name'), { target: { value: 'Saved name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(api.businesses.updateRecord).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'Saved name' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByText('Saved name').length).toBeGreaterThan(0);
  });
  it('keeps failed edits open with an error', async () => {
    vi.spyOn(api.businesses, 'updateRecord').mockRejectedValue(new Error('Save rejected'));
    mount(<BusinessProfile />, '/app/founder/businesses/42', '/app/founder/businesses/:id');
    fireEvent.click((await screen.findAllByRole('button', { name: /Edit/ }))[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Save rejected');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

it('Founder Reputation requests founder data even in another active role', async () => {
  context.role = 'investor';
  mount(<Reputation profileRole="founder" />, '/app/founder/reputation');
  await waitFor(() => expect(api.reputation.get).toHaveBeenCalledWith('founder'));
});

it('Founder Dashboard reputation link points to the registered founder route', async () => {
  vi.mocked(api.get).mockResolvedValue({ items: [] });
  const { container } = mount(<Dashboard />, '/app/founder/dashboard');
  await waitFor(() => expect(container.querySelector('a[href="/app/founder/reputation"]')).not.toBeNull());
});

it('Connections displays server data and creates a deal using connection_id', async () => {
  vi.spyOn(api.connections, 'list').mockResolvedValue(page([{
    connection_id: 73, business: { id: 42, name: 'Live business' }, founder: { id: 1, name: 'Founder' },
    counterparty: { id: 5, name: 'Investor' }, counterparty_role: 'investor', is_mutual: true, is_connected: true, deal: null,
  }]));
  vi.spyOn(api, 'post').mockResolvedValue({ id: 81 });
  mount(<Connections />, '/app/founder/connections', '/app/founder/connections');
  fireEvent.click(await screen.findByRole('button', { name: /Open Deal Room/ }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/me/connections/73/deal', {}));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/app/deals/81'));
});


it('Business Profile opens the readiness report with its current ID', async () => {
  mount(<BusinessProfile />, '/app/founder/businesses/42', '/app/founder/businesses/:id');
  fireEvent.click(await screen.findByRole('tab', { name: 'Readiness' }));
  fireEvent.click(await screen.findByRole('button', { name: /Full Report/ }));
  expect(screen.getByTestId('location').textContent).toBe('/app/founder/readiness?businessId=42');
});

it('counterparty can reciprocate a pending interest using the business and role', async () => {
  context.role = 'professional';
  vi.spyOn(api.connections, 'list').mockResolvedValue(page([{
    connection_id: null, business: { id: 42, name: 'Pending business' }, founder: { id: 5, name: 'Founder' },
    counterparty: { id: 1, name: 'Professional' }, counterparty_role: 'professional',
    has_founder_interest: true, has_counterparty_interest: false, is_mutual: false, is_connected: false, deal: null,
  }]));
  vi.spyOn(api, 'post').mockResolvedValue({ connection_id: 73 });
  mount(<Connections />, '/app/professional/connections');
  fireEvent.click(await screen.findByRole('button', { name: 'Reciprocate interest' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/me/businesses/42/reciprocal-interest', { role: 'professional' }));
  await waitFor(() => expect(api.connections.list).toHaveBeenCalledTimes(2));
});
