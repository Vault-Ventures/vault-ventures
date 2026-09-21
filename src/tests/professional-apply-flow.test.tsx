import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BusinessProfile from '../pages/founder/BusinessProfile';
import ProfessionalApplications from '../pages/professional/Applications';
import { api, ConnectionItem } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'professional',
  user: { id: 8, name: 'rafiul', roles: ['professional'] },
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: context.role }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: context.user }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'professional';
  context.user = { id: 8, name: 'rafiul', roles: ['professional'] };
});

function mountBusinessProfile(url = '/app/businesses/3') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/app/businesses/:id" element={<BusinessProfile />} />
      </Routes>
    </MemoryRouter>
  );
}

function mountApplications() {
  return render(
    <MemoryRouter initialEntries={['/app/professional/applications']}>
      <Routes>
        <Route path="/app/professional/applications" element={<ProfessionalApplications />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Professional Apply / Connect — BusinessProfile Flow', () => {
  const mockBusiness = {
    id: 3,
    name: 'naim health care',
    description: 'Healthcare innovation provider',
    industry: 'Healthcare',
    business_stage: 'Growth',
    risk_level: 'Medium',
    status: 'published',
    requirements: { funding_amount: 500000 },
    disclosure: { stage: 1, has_expressed_interest: false },
  };

  it('1. Professional with no existing interest sees "Apply / Connect"', async () => {
    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockBusiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: false, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply \/ Connect/i });
    expect(applyBtn).toBeTruthy();
  });

  it('2. Clicking "Apply / Connect" calls expressInterest with role: professional and shows "Applied"', async () => {
    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockBusiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: false, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    const expressInterestSpy = vi.spyOn(api.businesses, 'expressInterest').mockResolvedValue({ success: true });

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply \/ Connect/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(expressInterestSpy).toHaveBeenCalledWith(3, { role: 'professional' });
      expect(screen.getByRole('button', { name: /Applied/i })).toBeTruthy();
    });
  });

  it('3. Failed request does NOT show "Applied" and displays error feedback', async () => {
    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockBusiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: false, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    vi.spyOn(api.businesses, 'expressInterest').mockRejectedValue(new Error('Network error expressing interest'));

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply \/ Connect/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText('Network error expressing interest')).toBeTruthy();
      // Button still available, not Applied
      expect(screen.getByRole('button', { name: /Apply \/ Connect/i })).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Applied/i })).toBeNull();
    });
  });

  it('4. Request pending: repeated clicks cannot send duplicate requests', async () => {
    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockBusiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: false, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    const expressSpy = vi.spyOn(api.businesses, 'expressInterest').mockImplementation(() => pendingPromise);

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply \/ Connect/i });
    fireEvent.click(applyBtn);

    // Rapid second click
    fireEvent.click(applyBtn);

    expect(expressSpy).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!({ success: true });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Applied/i })).toBeTruthy();
    });
  });

  it('5. Existing backend Professional interest on initial load / refresh hydration shows "Applied"', async () => {
    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue({
      ...mockBusiness,
      disclosure: { stage: 2, has_expressed_interest: true },
    });
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 2, has_expressed_interest: true });
    vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: true, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    // Should immediately show Applied
    expect(screen.getByRole('button', { name: /Applied/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Apply \/ Connect/i })).toBeNull();
  });

  it('6. Multi-role account: in professional workspace, sends professional role payload', async () => {
    context.role = 'professional';
    context.user = { id: 8, name: 'rafiul', roles: ['founder', 'investor', 'professional'] };

    vi.spyOn(api.businesses, 'getDisclosure').mockResolvedValue(mockBusiness);
    vi.spyOn(api.businesses, 'getDisclosureStatus').mockResolvedValue({ current_stage: 1, has_expressed_interest: false });
    const connStatusSpy = vi.spyOn(api.businesses, 'getConnectionStatus').mockResolvedValue({ has_counterparty_interest: false, is_connected: false, is_mutual: false });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    const expressInterestSpy = vi.spyOn(api.businesses, 'expressInterest').mockResolvedValue({ success: true });

    mountBusinessProfile('/app/businesses/3');

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply \/ Connect/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(expressInterestSpy).toHaveBeenCalledWith(3, { role: 'professional' });
    });
  });
});

describe('Professional Applications & Engagements Suite', () => {
  const mockConnections: ConnectionItem[] = [
    {
      connection_id: 101,
      business: { id: 3, name: 'naim health care' },
      founder: { id: 1, name: 'shayan' },
      counterparty: { id: 8, name: 'rafiul' },
      counterparty_role: 'professional',
      has_founder_interest: false,
      has_counterparty_interest: true,
      is_mutual: false,
      is_connected: false,
      connected_at: '2026-09-20T12:00:00Z',
      deal: null,
    },
    {
      connection_id: 102,
      business: { id: 4, name: 'Apex Logistics' },
      founder: { id: 2, name: 'Founder Two' },
      counterparty: { id: 8, name: 'rafiul' },
      counterparty_role: 'professional',
      has_founder_interest: true,
      has_counterparty_interest: true,
      is_mutual: true,
      is_connected: true,
      connected_at: '2026-09-18T10:00:00Z',
      deal: { id: 5, stage: 'negotiation' },
    },
  ];

  it('1. Applications page calls api.connections.list("professional") and renders items', async () => {
    const listSpy = vi.spyOn(api.connections, 'list').mockResolvedValue({
      items: mockConnections,
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
    });

    mountApplications();

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith('professional');
      expect(screen.getByText('naim health care')).toBeTruthy();
      expect(screen.getByText('Apex Logistics')).toBeTruthy();
    });
  });

  it('2. Professional pending interest renders as "Applied" and mutual/connected renders as "Connected / Joined"', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue({
      items: mockConnections,
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
    });

    mountApplications();

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
      expect(screen.getByText('Apex Logistics')).toBeTruthy();
    });

    expect(screen.getAllByText('Applied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Connected / Joined')).toBeTruthy();
  });

  it('3. Investor-role connections are filtered out from Professional Applications', async () => {
    const mixedConnections: ConnectionItem[] = [
      {
        connection_id: 101,
        business: { id: 3, name: 'naim health care' },
        founder: { id: 1, name: 'shayan' },
        counterparty: { id: 8, name: 'rafiul' },
        counterparty_role: 'professional',
        has_founder_interest: false,
        has_counterparty_interest: true,
        is_mutual: false,
        is_connected: false,
        connected_at: '2026-09-20T12:00:00Z',
        deal: null,
      },
      {
        connection_id: 103,
        business: { id: 5, name: 'Investor Only Corp' },
        founder: { id: 3, name: 'Founder Three' },
        counterparty: { id: 8, name: 'rafiul' },
        counterparty_role: 'investor',
        has_founder_interest: false,
        has_counterparty_interest: true,
        is_mutual: false,
        is_connected: false,
        connected_at: '2026-09-19T10:00:00Z',
        deal: null,
      },
    ];

    vi.spyOn(api.connections, 'list').mockResolvedValue({
      items: mixedConnections,
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
    });

    mountApplications();

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
    });

    expect(screen.queryByText('Investor Only Corp')).toBeNull();
  });

  it('4. Empty connection list renders "No Active Applications"', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue({
      items: [],
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });

    mountApplications();

    await waitFor(() => {
      expect(screen.getByText('No Active Applications')).toBeTruthy();
    });
  });

  it('5. Filter tabs filter by status properly', async () => {
    vi.spyOn(api.connections, 'list').mockResolvedValue({
      items: mockConnections,
      pagination: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
    });

    mountApplications();

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
      expect(screen.getByText('Apex Logistics')).toBeTruthy();
    });

    // Click "Applied" tab (key: 'submitted')
    const appliedTab = screen.getByRole('button', { name: 'Applied' });
    fireEvent.click(appliedTab);

    await waitFor(() => {
      expect(screen.getByText('naim health care')).toBeTruthy();
      expect(screen.queryByText('Apex Logistics')).toBeNull();
    });

    // Click "Joined" tab (key: 'joined')
    const joinedTab = screen.getByRole('button', { name: 'Joined' });
    fireEvent.click(joinedTab);

    await waitFor(() => {
      expect(screen.queryByText('naim health care')).toBeNull();
      expect(screen.getByText('Apex Logistics')).toBeTruthy();
    });
  });
});
