import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminInvestmentOversight from '../pages/admin/InvestmentOversight';
import AdminSettings from '../pages/admin/Settings';
import {
  api,
  type AdminPlatformRevenueData,
  type AdminPaymentsListResponse,
  type AdminFinancialGovernanceOverviewData,
} from '../services/api';

const mockRevenueData: AdminPlatformRevenueData = {
  commission_rate: 5,
  total_platform_commission_bdt: 25000,
  total_completed_volume_bdt: 500000,
  total_completed_payments_count: 5,
  total_pending_volume_bdt: 150000,
  total_pending_payments_count: 2,
  total_net_to_founders_bdt: 475000,
  currency: 'BDT',
  monthly: [
    {
      month: '2026-09',
      total_volume_bdt: 300000,
      total_commission_bdt: 15000,
      completed_payments_count: 3,
    },
    {
      month: '2026-08',
      total_volume_bdt: 200000,
      total_commission_bdt: 10000,
      completed_payments_count: 2,
    },
  ],
  simulation_disclaimer:
    'All figures are simulated in Bangladeshi Taka (BDT / ৳) for platform governance prototype purposes.',
};

const mockPaymentsResponse: AdminPaymentsListResponse = {
  payments: [
    {
      id: 101,
      deal_id: 12,
      business_name: 'Delta Agro Tech',
      payer: { id: 2, name: 'Rahim Investor', email: 'rahim@example.com' },
      receiver: { id: 1, name: 'Karim Founder', email: 'karim@example.com' },
      amount: 200000,
      currency: 'BDT',
      payment_method: 'bank_transfer',
      payment_method_label: 'Bank Transfer',
      transaction_reference: 'TRX-998877',
      note: 'Tranche 1 payment',
      status: 'completed',
      status_label: 'Completed',
      payment_date: '2026-09-15',
      completed_at: '2026-09-16T10:00:00Z',
      commission_rate: 5,
      commission_amount: 10000,
      net_amount: 190000,
      created_at: '2026-09-15T08:00:00Z',
    },
    {
      id: 102,
      deal_id: 14,
      business_name: 'Chittagong Solar Solutions',
      payer: { id: 4, name: 'Apex Capital', email: 'apex@example.com' },
      receiver: { id: 3, name: 'Solar Founder', email: 'solar@example.com' },
      amount: 150000,
      currency: 'BDT',
      payment_method: 'bkash',
      payment_method_label: 'bKash',
      transaction_reference: 'BKASH-334455',
      note: 'Pending approval',
      status: 'pending',
      status_label: 'Pending',
      payment_date: '2026-09-28',
      completed_at: null,
      commission_rate: null,
      commission_amount: null,
      net_amount: null,
      created_at: '2026-09-28T12:00:00Z',
    },
  ],
  pagination: {
    total: 2,
    per_page: 50,
    current_page: 1,
    last_page: 1,
  },
};

const mockGovernance: AdminFinancialGovernanceOverviewData = {
  overview: {
    total_financial_reports_count: 4,
    total_deals_with_reporting: 2,
    total_discrepancies_count: 0,
  },
  verification_pipeline: {
    self_reported_count: 1,
    evidence_submitted_count: 1,
    under_review_count: 1,
    verified_count: 1,
  },
  discrepancy_queue: {
    pending_under_review_count: 0,
    resolved_count: 0,
    disputed_count: 0,
  },
  financial_totals_bdt: {
    currency: 'BDT',
    total_reported_revenue: 600000,
    total_reported_expenses: 350000,
    total_calculated_profit_loss: 250000,
  },
  disclaimer: 'Simulated BDT financial overview disclaimer.',
};

describe('Admin Investment Oversight & Platform Revenue UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue(mockGovernance);
    vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({
      reports: [],
      pagination: { total: 0, current_page: 1, last_page: 1, per_page: 50 },
    });
    vi.spyOn(api.admin, 'platformRevenue').mockResolvedValue(mockRevenueData);
    vi.spyOn(api.admin.payments, 'list').mockResolvedValue(mockPaymentsResponse);
  });

  it('1. renders Platform Revenue section with Simulated badge and stat cards', async () => {
    render(
      <MemoryRouter>
        <AdminInvestmentOversight />
      </MemoryRouter>
    );

    // Section title and simulated badge
    expect(await screen.findByRole('heading', { name: 'Platform Revenue' })).toBeTruthy();
    expect(screen.getByText('Simulated')).toBeTruthy();

    // Commission total & volume figures
    expect(await screen.findByText('৳ 25,000.00')).toBeTruthy();
    expect(screen.getByText('৳ 5,00,000.00')).toBeTruthy();
    expect(screen.getAllByText('৳ 1,50,000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('৳ 4,75,000.00')).toBeTruthy();

    // 6-month breakdown
    expect(screen.getByText('2026-09')).toBeTruthy();
    expect(screen.getByText('2026-08')).toBeTruthy();
    expect(screen.getByText('৳ 15,000.00')).toBeTruthy();
  });

  it('2. renders Recent Payments ledger with filters and Deal Room navigation links', async () => {
    render(
      <MemoryRouter>
        <AdminInvestmentOversight />
      </MemoryRouter>
    );

    expect(await screen.findByText('Delta Agro Tech')).toBeTruthy();
    expect(screen.getByText('Chittagong Solar Solutions')).toBeTruthy();
    expect(screen.getByText('TRX-998877')).toBeTruthy();
    expect(screen.getByText('BKASH-334455')).toBeTruthy();

    // Check deal links
    const dealRoomLinks = screen.getAllByRole('link', { name: /Deal Room/i });
    expect(dealRoomLinks.length).toBeGreaterThanOrEqual(2);
    expect(dealRoomLinks[0].getAttribute('href')).toBe('/app/admin/deal-room/12');
  });

  it('3. gracefully renders when platformRevenue or payments API fails', async () => {
    vi.spyOn(api.admin, 'platformRevenue').mockRejectedValue(new Error('Revenue network timeout'));
    vi.spyOn(api.admin.payments, 'list').mockRejectedValue(new Error('Payments server error'));

    render(
      <MemoryRouter>
        <AdminInvestmentOversight />
      </MemoryRouter>
    );

    // Should still render page and other governance cards without crashing
    expect(await screen.findByText('Investment Oversight & Governance')).toBeTruthy();
    expect(await screen.findByText('No payment records found')).toBeTruthy();
  });

  it('4. Settings page displays 5% (Simulated) for Platform Commission row and not 0%', async () => {
    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    // Check description text
    expect(
      await screen.findByText(
        'Simulated platform commission is calculated on payments recorded as completed. The rate is set in server configuration.'
      )
    ).toBeTruthy();

    // Check badge text (5% (Simulated))
    expect(await screen.findByText('5% (Simulated)')).toBeTruthy();

    // Ensure legacy "Not Applied (0%)" is gone
    expect(screen.queryByText('Not Applied (0%)')).toBeNull();
  });

  it('5. Settings page displays fallback when platformRevenue API fails', async () => {
    vi.spyOn(api.admin, 'platformRevenue').mockRejectedValue(new Error('Config unreachable'));

    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        'Simulated platform commission is calculated on payments recorded as completed. The rate is set in server configuration.'
      )
    ).toBeTruthy();

    expect(await screen.findByText('Configured on server')).toBeTruthy();
    expect(screen.queryByText('Not Applied (0%)')).toBeNull();
  });
});
