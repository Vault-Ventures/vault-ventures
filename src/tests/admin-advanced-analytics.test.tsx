import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdvancedAnalyticsCharts from '../pages/admin/AdvancedAnalyticsCharts';
import AdvancedAnalytics from '../pages/admin/AdvancedAnalytics';
import { api, AdminFinancialGovernanceOverviewData } from '../services/api';

const data: AdminFinancialGovernanceOverviewData = {
  reporting_periods: [{ start: '2026-09-27', end: '2026-09-30', reports_count: 1, revenue: 5000, expenses: 200, net_profit_loss: 4800 }],
  overview: { total_financial_reports_count: 1, total_deals_with_reporting: 1, total_discrepancies_count: 0 },
  verification_pipeline: { self_reported_count: 0, evidence_submitted_count: 0, under_review_count: 0, verified_count: 1 },
  discrepancy_queue: { pending_under_review_count: 0, resolved_count: 0, disputed_count: 0 },
  financial_totals_bdt: { currency: 'BDT', total_reported_revenue: 5000, total_reported_expenses: 200, total_calculated_profit_loss: 4800 },
  disclaimer: '',
};
beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue(data); });
async function open() { render(<AdvancedAnalytics />); await screen.findByRole('heading', { level: 1 }); }
async function click(name: string) { await act(async () => { fireEvent.click(screen.getByRole('button', { name })); }); }
const card = (name: string) => screen.getByText(name).parentElement!;

it('announces loading and never substitutes zero for unavailable metrics', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockImplementation(() => new Promise(() => {}));
  await open();
  expect(screen.getByRole('status').textContent).toContain('Refreshing');
  expect(card('Governance Reports').textContent).toContain('... verified');
  expect(card('Reported Revenue').textContent).not.toContain('৳0');
  expect(card('Verified Audit').textContent).toContain('...');
});

it('shows initial failure with an alert and retries using the existing API', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockRejectedValueOnce(new Error('Offline'));
  await open();
  expect((await screen.findByRole('alert')).textContent).toContain('Metrics unavailable');
  expect(card('Reported Revenue').textContent).toContain('—');
  expect(card('Governance Reports').textContent).not.toContain('0 verified');
  await click('Retry');
  await screen.findAllByText('৳5,000');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('retains successful data during refresh, marks failures stale, and clears stale status after retry', async () => {
  await open(); await screen.findAllByText('৳5,000');
  let reject: (reason: Error) => void = () => {};
  vi.mocked(api.admin.financialReports.getGovernance).mockImplementationOnce(() => new Promise((_, r) => { reject = r; }));
  await click('Refresh Telemetry');
  expect(screen.getAllByText('৳5,000')).toBeTruthy();
  await act(async () => reject(new Error('Offline')));
  expect((await screen.findByRole('alert')).textContent).toContain('Stale data');
  expect(screen.getAllByText('৳5,000')).toBeTruthy();
  await click('Retry');
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(api.admin.financialReports.getGovernance).toHaveBeenCalledTimes(3);
});

it('preserves legitimate backend zero values', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockResolvedValue({ ...data,
    overview: { ...data.overview, total_financial_reports_count: 0 },
    verification_pipeline: { ...data.verification_pipeline, verified_count: 0 },
    financial_totals_bdt: { currency: 'BDT', total_reported_revenue: 0, total_reported_expenses: 0, total_calculated_profit_loss: 0 },
  });
  await open(); await screen.findByText('0 verified');
  expect(screen.getAllByText('৳0')).toHaveLength(6);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('uses accurate wording and semantic headings while keeping navy cards', async () => {
  await open(); await screen.findAllByText('৳5,000');
  for (const name of ['Capital & Governance Summary', 'Financial Verification Pipeline', 'Predictive & Historical Analytics']) {
    expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
  }
  expect(screen.getByText('Cumulative reported net')).toBeTruthy();
  expect(screen.getByText(/Predictive analytics are not implemented/)).toBeTruthy();
  expect(screen.queryByText(/Live platform|Real-time|asynchronous|commission prediction|Cumulative audited net/)).toBeNull();
  expect(card('Reported Revenue').style.background).toBe('rgb(18, 26, 43)');
  expect(api.admin.financialReports.getGovernance).toHaveBeenCalledTimes(1);
});

it('uses persisted financial/status values and shows the genuine single-period empty state', async () => {
  await open();
  const financial = within(await screen.findByRole('region', { name: 'Financial comparison' }));
  expect(financial.getByText('৳5,000')).toBeTruthy();
  expect(financial.getByText('৳200')).toBeTruthy();
  expect(financial.getByText('৳4,800')).toBeTruthy();
  const statuses = within(screen.getByRole('region', { name: 'Verification distribution' }));
  expect(statuses.getAllByText('0')).toHaveLength(3);
  expect(statuses.getByText('1')).toBeTruthy();
  expect(screen.getByText('More reporting periods required')).toBeTruthy();
  expect(screen.getByText(/27 Sept 2026/)).toBeTruthy();
  expect(screen.queryByLabelText('Historical period comparisons')).toBeNull();
});

it('compares real supplied periods on a shared scale, retaining negative values and gaps', async () => {
  const periods = [...data.reporting_periods!, { start: '2026-11-01', end: '2026-11-30', reports_count: 1, revenue: 100, expenses: 200, net_profit_loss: -100 }];
  render(<AdvancedAnalyticsCharts data={{ ...data, reporting_periods: periods }} />);
  const history = within(await screen.findByLabelText('Historical period comparisons'));
  expect(history.getByText('৳-100')).toBeTruthy();
  expect(history.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  expect(history.queryByText(/Oct 2026/)).toBeNull();
  expect(history.getAllByText(/Zero is at the center/)).toHaveLength(2);
  expect(screen.queryByText('More reporting periods required')).toBeNull();
});

it('distinguishes absent historical data from zero periods', async () => {
  vi.mocked(api.admin.financialReports.getGovernance).mockResolvedValue({ ...data, reporting_periods: undefined });
  await open();
  expect(await screen.findByText(/Historical period data is unavailable/)).toBeTruthy();
  expect(screen.queryByText('More reporting periods required')).toBeNull();
});
