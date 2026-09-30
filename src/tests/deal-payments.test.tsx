import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealRoom from '../pages/shared/DealRoom';
import DealPaymentsTab from '../components/deals/DealPaymentsTab';
import {
  api,
  type DealPaymentsResponse,
} from '../services/api';

const context = vi.hoisted(() => ({
  role: 'founder',
  user: { id: 1, roles: ['founder'], name: 'Founder User' },
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: context.role }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: context.user }),
}));

const mockPaymentResponse: DealPaymentsResponse = {
  summary: {
    agreed_amount_bdt: 500000,
    total_completed_bdt: 200000,
    total_pending_bdt: 100000,
    remaining_bdt: 200000,
    platform_commission_rate: 5,
    total_commission_bdt: 10000,
    net_to_founder_bdt: 190000,
  },
  payments: [
    {
      id: 1,
      deal_id: 2,
      payer_user_id: 2,
      payer_name: 'Investor User',
      receiver_user_id: 1,
      receiver_name: 'Founder User',
      amount_bdt: 200000,
      payment_method: 'bank_transfer',
      payment_method_label: 'Bank Transfer',
      transaction_reference: 'TRX-12345',
      payment_date: '2026-09-25',
      note: 'First tranche for equipment purchase',
      status: 'completed',
      commission_rate: 5,
      commission_amount_bdt: 10000,
      net_to_founder_bdt: 190000,
      confirmed_at: '2026-09-26T10:00:00Z',
      created_at: '2026-09-25T12:00:00Z',
    },
    {
      id: 2,
      deal_id: 2,
      payer_user_id: 2,
      payer_name: 'Investor User',
      receiver_user_id: 1,
      receiver_name: 'Founder User',
      amount_bdt: 100000,
      payment_method: 'bkash',
      payment_method_label: 'bKash',
      transaction_reference: 'BK-998877',
      payment_date: '2026-09-28',
      note: 'Second tranche pending confirmation',
      status: 'pending',
      commission_rate: null,
      commission_amount_bdt: null,
      net_to_founder_bdt: null,
      confirmed_at: null,
      created_at: '2026-09-28T08:00:00Z',
    },
  ],
  eligibility: {
    can_create: false,
    can_confirm: true,
    reason: null,
  },
};

const mockDealInvestorAgreement = {
  id: 2,
  connection_id: 1,
  business_id: 42,
  founder_user_id: 1,
  counterparty_user_id: 2,
  counterparty_role: 'investor' as const,
  stage: 'milestone_funding_active',
  stage_label: 'Milestone Funding Active',
  stage_order: 7,
  created_at: '2026-09-18T00:00:00Z',
  updated_at: '2026-09-19T00:00:00Z',
};

const mockDealEarlyStage = {
  id: 3,
  connection_id: 2,
  business_id: 42,
  founder_user_id: 1,
  counterparty_user_id: 2,
  counterparty_role: 'investor' as const,
  stage: 'negotiation',
  stage_label: 'Negotiation',
  stage_order: 5,
  created_at: '2026-09-18T00:00:00Z',
  updated_at: '2026-09-19T00:00:00Z',
};

const mockDealProfessional = {
  id: 4,
  connection_id: 3,
  business_id: 42,
  founder_user_id: 1,
  counterparty_user_id: 3,
  counterparty_role: 'professional' as const,
  stage: 'milestone_funding_active',
  stage_label: 'Milestone Funding Active',
  stage_order: 7,
  created_at: '2026-09-18T00:00:00Z',
  updated_at: '2026-09-19T00:00:00Z',
};

describe('Deal Room Payments UI & DealPaymentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    context.role = 'founder';
    context.user = { id: 1, roles: ['founder'], name: 'Founder User' };

    vi.spyOn(api.deals, 'get').mockResolvedValue(mockDealInvestorAgreement as any);
    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({} as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue({} as any);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue([] as any);
    vi.spyOn(api.deals.milestones, 'getFundingSummary').mockResolvedValue({} as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue([] as any);
    vi.spyOn(api.deals.payments, 'list').mockResolvedValue(mockPaymentResponse);
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/api/businesses/')) {
        return { id: 42, name: 'Acme Robotics', funding_amount: 500000 };
      }
      if (url.includes('/nda')) {
        return { status: 'active', signed: true };
      }
      if (url.includes('/history')) {
        return [];
      }
      return {};
    });
  });

  it('renders Payments tab in Deal Room for investor deals at stage_order >= 6', async () => {
    render(
      <MemoryRouter initialEntries={['/app/deal-room/2']}>
        <Routes>
          <Route path="/app/deal-room/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Payments' })).toBeTruthy();
  });

  it('hides Payments tab for early-stage investor deals (< 6)', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue(mockDealEarlyStage as any);

    render(
      <MemoryRouter initialEntries={['/app/deal-room/3']}>
        <Routes>
          <Route path="/app/deal-room/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Overview' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Payments' })).toBeNull();
  });

  it('hides Payments tab for professional deals even if stage_order >= 6', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue(mockDealProfessional as any);

    render(
      <MemoryRouter initialEntries={['/app/deal-room/4']}>
        <Routes>
          <Route path="/app/deal-room/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Overview' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Payments' })).toBeNull();
  });

  it('renders DealPaymentsTab with simulated banner, summary cards, and payments table', async () => {
    render(
      <DealPaymentsTab
        deal={mockDealInvestorAgreement as any}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={context.user}
        businessName="Acme Robotics"
      />
    );

    expect(
      await screen.findByText(/Prototype record only\. No real money is moved or held by Vault Ventures/i)
    ).toBeTruthy();

    // Summary values
    expect(await screen.findByText('Agreed Amount')).toBeTruthy();
    expect(screen.getByText('Platform Commission')).toBeTruthy();
    expect(screen.getByText('5% platform fee total')).toBeTruthy();

    // Table rows
    expect(screen.getByText('TRX-12345')).toBeTruthy();
    expect(screen.getByText('BK-998877')).toBeTruthy();

    // Pending payment shows "—" for commission and net
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows Founder action buttons (Confirm as Completed / Mark Failed) on pending payments', async () => {
    render(
      <DealPaymentsTab
        deal={mockDealInvestorAgreement as any}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={context.user}
        businessName="Acme Robotics"
      />
    );

    expect(await screen.findByText('BK-998877')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fail' })).toBeTruthy();
  });

  it('shows Investor "Record Payment" button when can_create is true', async () => {
    context.role = 'investor';
    context.user = { id: 2, roles: ['investor'], name: 'Investor User' };

    vi.spyOn(api.deals.payments, 'list').mockResolvedValue({
      ...mockPaymentResponse,
      eligibility: {
        can_create: true,
        can_confirm: false,
        reason: null,
      },
    });

    render(
      <DealPaymentsTab
        deal={mockDealInvestorAgreement as any}
        isFounder={false}
        isCounterparty={true}
        role="investor"
        user={context.user}
        businessName="Acme Robotics"
      />
    );

    const recordBtn = await screen.findByRole('button', { name: 'Record Payment' });
    expect(recordBtn).toBeTruthy();

    // Open record modal
    fireEvent.click(recordBtn);
    expect(
      await screen.findByText(/Enter a receipt or reference ID only\. Do not enter card numbers/i)
    ).toBeTruthy();
  });

  it('shows no action buttons for admin role (read-only)', async () => {
    context.role = 'admin';
    context.user = { id: 99, roles: ['admin'], name: 'Admin User' };

    render(
      <DealPaymentsTab
        deal={mockDealInvestorAgreement as any}
        isFounder={false}
        isCounterparty={false}
        role="admin"
        user={context.user}
        businessName="Acme Robotics"
      />
    );

    expect(await screen.findByText('TRX-12345')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Record Payment' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fail' })).toBeNull();
  });
});
