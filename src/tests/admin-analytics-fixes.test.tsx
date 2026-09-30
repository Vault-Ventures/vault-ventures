import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Analytics from '../pages/admin/Analytics';
import FinancialReports from '../pages/admin/FinancialReports';
import { api, AdminFinancialGovernanceOverviewData, FinancialReportItem } from '../services/api';

const governance: AdminFinancialGovernanceOverviewData = {
  overview: { total_financial_reports_count: 1, total_deals_with_reporting: 1, active_reporting_deals_count: 0, total_discrepancies_count: 0 },
  verification_pipeline: { self_reported_count: 0, evidence_submitted_count: 0, under_review_count: 0, verified_count: 1 },
  discrepancy_queue: { pending_under_review_count: 0, resolved_count: 0, disputed_count: 0 },
  financial_totals_bdt: { currency: 'BDT', total_reported_revenue: 0, total_reported_expenses: 0, total_calculated_profit_loss: 0 },
  disclaimer: '',
};
const report = { id: 3, deal_id: 4, business_name: 'Existing business', status: 'verified', status_label: 'Verified', revenue: 0, expenses: 0, net_profit_loss: 0 } as FinancialReportItem;
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue(governance);
  vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({ reports: [report], pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 } });
});
async function settled() {
  await waitFor(() => {
    expect(screen.queryByText('Loading financial reports from ledger...')).toBeNull();
    expect(screen.queryByText('Loading governance metrics...')).toBeNull();
    const refresh = screen.queryByRole('button', { name: 'Refresh' }) as HTMLButtonElement | null;
    if (refresh) expect(refresh.disabled).toBe(false);
  });
}
async function open(component: React.ReactNode, wait = true) {
  await act(async () => { render(<MemoryRouter>{component}</MemoryRouter>); });
  await screen.findByRole('heading', { level: 1 });
  if (wait) await settled();
}
async function click(name: string) {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name })); });
  await settled();
}

it('shows the active-only count, keeps real zeros, and refreshes explicitly', async () => {
  await open(<Analytics />);
  expect(screen.getByText('Active Reporting Deals').parentElement?.textContent).toContain('0');
  expect(screen.getByText('Total Submissions').parentElement?.textContent).toContain('1');
  expect(screen.queryByText(/Real-time/)).toBeNull();
  vi.mocked(api.admin.financialReports.getGovernance).mockResolvedValue({ ...governance, overview: { ...governance.overview, active_reporting_deals_count: 2 } });
  await click('Refresh');
  expect(api.admin.financialReports.getGovernance).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Active Reporting Deals').parentElement?.textContent).toContain('2');
});

it('shows an error instead of zero cards and retries successfully', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockRejectedValueOnce(new Error('Offline'));
  await open(<Analytics />);
  expect(screen.getByRole('alert').textContent).toContain('Unable to load analytics');
  expect(screen.queryByText('Total Submissions')).toBeNull();
  await click('Retry');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('Unresolved Flags').parentElement?.textContent).toContain('0');
});

it('keeps reports available during governance failure and retries only governance', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockRejectedValueOnce(new Error('Offline'));
  await open(<FinancialReports initialTab="governance" />);
  expect(screen.getByRole('alert').textContent).toContain('Unable to load governance metrics');
  await click('Operational Reports (1)');
  expect(screen.getByText('Existing business')).toBeTruthy();
  await click('Retry governance');
  expect(api.admin.financialReports.list).toHaveBeenCalledTimes(1);
  await click('Governance & Pipeline');
  expect(screen.getByText('Total Reports')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('paginates from backend metadata and resets server search/status filters to page one', async () => {
  vi.mocked(api.admin.financialReports.list).mockImplementation(async params => ({
    reports: [{ ...report, business_name: params?.q ? 'Search result' : params?.page === 2 ? 'Older report' : 'First page' }],
    pagination: { current_page: params?.page || 1, last_page: params?.q || params?.status ? 1 : 2, total: params?.q || params?.status ? 1 : 16, per_page: 15 },
  }));
  await open(<FinancialReports />);
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
  await click('Next');
  expect(screen.getByText('Older report')).toBeTruthy();
  expect(screen.getByText('Page 2 of 2 · 16 reports')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  await click('Previous'); await click('Next');
  await act(async () => { fireEvent.change(screen.getByPlaceholderText('Filter by business or Deal ID...'), { target: { value: 'Older' } }); });
  await screen.findByText('Search result');
  expect(api.admin.financialReports.list).toHaveBeenLastCalledWith({ page: 1, q: 'Older', status: undefined });
  expect(screen.getByText('Search result')).toBeTruthy();
  await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'verified' } }); });
  await waitFor(() => expect(api.admin.financialReports.list).toHaveBeenLastCalledWith({ page: 1, q: 'Older', status: 'verified' }));
  expect(api.admin.financialReports.list).toHaveBeenLastCalledWith({ page: 1, q: 'Older', status: 'verified' });
});

it('ignores stale report responses when search changes', async () => {
  let resolve: (value: any) => void = () => {};
  vi.mocked(api.admin.financialReports.list).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await open(<FinancialReports />, false);
  await act(async () => { fireEvent.change(screen.getByPlaceholderText('Filter by business or Deal ID...'), { target: { value: 'Existing' } }); });
  await screen.findByText('Existing business');
  await act(async () => { resolve({ reports: [{ ...report, business_name: 'Stale' }], pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }); });
  expect(screen.queryByText('Stale')).toBeNull();
});
