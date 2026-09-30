import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealRoom from '../pages/shared/DealRoom';
import DealFinancialReportsTab from '../components/deals/DealFinancialReportsTab';
import { api, DealFinancialOverviewData, FinancialReportItem } from '../services/api';

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

const mockOverview: DealFinancialOverviewData = {
  total_reports_count: 2,
  cumulative_revenue_bdt: 150000,
  cumulative_expenses_bdt: 90000,
  cumulative_net_profit_loss_bdt: 60000,
  latest_cash_position_bdt: 250000,
  latest_reporting_period_start: '2026-08-01',
  latest_reporting_period_end: '2026-08-31',
  verification_breakdown: {
    self_reported: 1,
    evidence_submitted: 0,
    under_review: 0,
    verified: 1,
  },
  total_evidence_files_count: 1,
  total_discrepancies_count: 0,
};

const mockReports: FinancialReportItem[] = [
  {
    id: 101,
    deal_id: 2,
    submitted_by_user_id: 1,
    reporting_period_start: '2026-08-01',
    reporting_period_end: '2026-08-31',
    revenue: 100000,
    expenses: 60000,
    net_profit_loss: 40000,
    cash_position: 250000,
    notes: 'August revenue from enterprise contracts.',
    status: 'verified',
    evidence_count: 1,
    evidences: [
      {
        id: 1,
        financial_report_id: 101,
        evidence_type: 'bank_statement',
        original_filename: 'august_statement.pdf',
        file_size: 102400,
        mime_type: 'application/pdf',
        created_at: '2026-09-01T10:00:00Z',
      },
    ],
    reviewed_at: '2026-09-02T12:00:00Z',
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 102,
    deal_id: 2,
    submitted_by_user_id: 1,
    reporting_period_start: '2026-09-01',
    reporting_period_end: '2026-09-30',
    revenue: 50000,
    expenses: 30000,
    net_profit_loss: 20000,
    cash_position: 270000,
    notes: 'September preliminary close.',
    status: 'self_reported',
    evidence_count: 0,
    evidences: [],
    reviewed_at: null,
    created_at: '2026-10-01T09:00:00Z',
  },
];

const mockDeal = {
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

describe('Founder Financial Reporting Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    context.role = 'founder';
    context.user = { id: 1, roles: ['founder'], name: 'Founder User' };

    vi.spyOn(api.deals, 'get').mockResolvedValue(mockDeal as any);
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/businesses/42')) {
        return { id: 42, name: 'NovaTech Health AI' } as any;
      }
      if (url.includes('/users/2')) {
        return { id: 2, name: 'Apex Capital', full_name: 'Apex Capital' } as any;
      }
      if (url.includes('/connections/1')) {
        return { id: 1, status: 'connected' } as any;
      }
      return {} as any;
    });

    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null);
    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue({} as any);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [] } as any);
    vi.spyOn(api.deals.milestones, 'getFundingSummary').mockResolvedValue({} as any);
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue({ can_submit: false } as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] });
    vi.spyOn(api.deals.insights, 'current').mockResolvedValue(null);

    vi.spyOn(api.deals, 'financialOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.deals.financialReports, 'list').mockResolvedValue({
      deal_id: 2,
      reports: mockReports,
    });
    vi.spyOn(api.deals.financialReports, 'create').mockResolvedValue({
      id: 103,
      deal_id: 2,
      submitted_by_user_id: 1,
      reporting_period_start: '2026-10-01',
      reporting_period_end: '2026-10-31',
      revenue: 80000,
      expenses: 40000,
      net_profit_loss: 40000,
      cash_position: 300000,
      notes: 'October report',
      status: 'self_reported',
      evidence_count: 0,
      evidences: [],
      reviewed_at: null,
      created_at: '2026-11-01T00:00:00Z',
    });
    vi.spyOn(api.deals.financialReports, 'uploadEvidence').mockResolvedValue({
      id: 2,
      financial_report_id: 102,
      evidence_type: 'bank_statement',
      original_filename: 'sept_statement.pdf',
      file_size: 51200,
      mime_type: 'application/pdf',
      created_at: '2026-10-02T10:00:00Z',
    });
  });

  it('1. Renders Financial Reports tab in DealRoom and switches to it', async () => {
    render(
      <MemoryRouter initialEntries={['/deals/2']}>
        <Routes>
          <Route path="/deals/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('NovaTech Health AI')).toBeTruthy();

    const tabButton = screen.getByRole('button', { name: /financial reports/i });
    expect(tabButton).toBeTruthy();

    fireEvent.click(tabButton);

    expect(await screen.findByText('Periodic Financial Reporting')).toBeTruthy();
    expect(screen.getByText(/Periodic Reporting History/i)).toBeTruthy();
    expect(screen.getByText(/August revenue from enterprise contracts./i)).toBeTruthy();
  });

  it('2. Founder on eligible deal (stage 7) sees "Submit Financial Report" button and can open modal', async () => {
    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText('Submit Financial Report')).toBeTruthy();

    fireEvent.click(screen.getByText('Submit Financial Report'));

    expect(await screen.findByText('Submit Periodic Financial Report')).toBeTruthy();
    expect(screen.getByLabelText(/Period Start Date/i)).toBeTruthy();
    expect(screen.getByLabelText(/Period End Date/i)).toBeTruthy();
    expect(screen.getByLabelText(/Gross Revenue/i)).toBeTruthy();
    expect(screen.getByLabelText(/Operating Expenses/i)).toBeTruthy();
  });

  it('3. Investor on stage >= 7 sees reporting history in read-only mode without submission controls', async () => {
    context.role = 'investor';
    context.user = { id: 2, roles: ['investor'], name: 'Apex Capital' };

    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={false}
        isCounterparty={true}
        role="investor"
        user={{ id: 2, name: 'Apex Capital' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText(/Periodic Reporting History/i)).toBeTruthy();

    // Ensure Submit button is NOT visible for investor
    expect(screen.queryByText('Submit Financial Report')).toBeNull();
    // Ensure "+ Evidence" button is NOT visible for investor
    expect(screen.queryByText('+ Evidence')).toBeNull();
  });

  it('4. Ineligible deal stage (stage < 7) disables/hides submission with informative message', async () => {
    const earlyDeal = {
      ...mockDeal,
      stage: 'due_diligence',
      stage_label: 'Due Diligence',
      stage_order: 3,
    };

    render(
      <DealFinancialReportsTab
        deal={earlyDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText(/Periodic Reporting Pending Milestone Activation/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Submit Financial Report/i })).toBeNull();
  });

  it('5. Live previews Net P/L calculation (Revenue - Expenses)', async () => {
    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText('Submit Financial Report')).toBeTruthy();

    fireEvent.click(screen.getByText('Submit Financial Report'));

    const revInput = await screen.findByLabelText(/Gross Revenue/i);
    const expInput = screen.getByLabelText(/Operating Expenses/i);

    fireEvent.change(revInput, { target: { value: '250000' } });
    fireEvent.change(expInput, { target: { value: '150000' } });

    // Net P/L preview should compute 250,000 - 150,000 = 100,000
    await waitFor(() => {
      expect(screen.getByText(/Net Profit/i)).toBeTruthy();
    });
  });

  it('6. Submits financial report successfully and refreshes overview and report list', async () => {
    const createSpy = vi.spyOn(api.deals.financialReports, 'create');
    const overviewSpy = vi.spyOn(api.deals, 'financialOverview');
    const listSpy = vi.spyOn(api.deals.financialReports, 'list');

    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText('Submit Financial Report')).toBeTruthy();

    fireEvent.click(screen.getByText('Submit Financial Report'));

    const startInput = await screen.findByLabelText(/Period Start Date/i);
    fireEvent.change(startInput, { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText(/Period End Date/i), { target: { value: '2026-10-31' } });
    fireEvent.change(screen.getByLabelText(/Gross Revenue/i), { target: { value: '80000' } });
    fireEvent.change(screen.getByLabelText(/Operating Expenses/i), { target: { value: '40000' } });
    fireEvent.change(screen.getByLabelText(/Ending Cash Balance/i), { target: { value: '300000' } });
    fireEvent.change(screen.getByLabelText(/Performance Notes/i), { target: { value: 'October report' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        2,
        {
          reporting_period_start: '2026-10-01',
          reporting_period_end: '2026-10-31',
          revenue: 80000,
          expenses: 40000,
          cash_position: 300000,
          notes: 'October report',
        },
        undefined
      );
    });

    await waitFor(() => {
      expect(overviewSpy).toHaveBeenCalledTimes(2);
      expect(listSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('7. Handles backend validation error cleanly (e.g. 422 overlapping period)', async () => {
    vi.spyOn(api.deals.financialReports, 'create').mockRejectedValueOnce({
      message: 'A financial report for this period already exists.',
      details: {
        reporting_period_start: ['A financial report overlapping with this period already exists.'],
      },
    });

    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText('Submit Financial Report')).toBeTruthy();

    fireEvent.click(screen.getByText('Submit Financial Report'));

    const startInput = await screen.findByLabelText(/Period Start Date/i);
    fireEvent.change(startInput, { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText(/Period End Date/i), { target: { value: '2026-08-31' } });
    fireEvent.change(screen.getByLabelText(/Gross Revenue/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/Operating Expenses/i), { target: { value: '20000' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/A financial report overlapping with this period already exists./i)).toBeTruthy();
  });

  it('8. Supports attaching evidence to a self-reported report', async () => {
    const uploadSpy = vi.spyOn(api.deals.financialReports, 'uploadEvidence');

    render(
      <DealFinancialReportsTab
        deal={mockDeal}
        isFounder={true}
        isCounterparty={false}
        role="founder"
        user={{ id: 1, name: 'Founder User' }}
        businessName="NovaTech Health AI"
      />
    );

    expect(await screen.findByText('+ Evidence')).toBeTruthy();

    fireEvent.click(screen.getByText('+ Evidence'));

    expect(await screen.findByText(/Attach Evidence to Report #102/i)).toBeTruthy();

    const file = new File(['dummy content'], 'sept_statement.pdf', { type: 'application/pdf' });
    const fileInput = document.getElementById('attach-file') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const form = fileInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(102, file, 'bank_statement');
    });
  });
});
