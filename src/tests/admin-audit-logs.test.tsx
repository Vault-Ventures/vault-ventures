import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AuditLogs from '../pages/admin/AuditLogs';
import { api, ApiError, FinancialReportItem, AdminVerificationRequestData } from '../services/api';

const report = { id: 3, deal_id: 4, business_name: 'Persisted business', reporting_period_start: '2026-01-01', reporting_period_end: '2026-01-31', status: 'verified', status_label: 'Verified' } as FinancialReportItem;
const request = { id: 7, user_id: 8, user: { id: 8, name: 'Applicant', email: 'applicant@example.test' }, requested_tier: 1, status: 'approved', assigned_admin: { id: 9, name: 'Reviewer', email: 'reviewer@example.test' } } as AdminVerificationRequestData;
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({ reports: [report], pagination: { current_page: 1, last_page: 1, per_page: 100, total: 1 } });
  vi.spyOn(api.admin.financialReports, 'get').mockResolvedValue(report);
  vi.spyOn(api.admin.financialReports, 'getAuditLogs').mockResolvedValue({ financial_report_id: 3, audit_logs: ['report_created', 'evidence_uploaded', 'report_reviewed', 'discrepancy_flagged', 'discrepancy_resolved'].map((action, id) => ({ id, action, actor: { id: 9, name: 'Reviewer' }, actor_role: 'admin', created_at: `2026-01-0${id + 1}T12:00:00Z`, old_state: { status: 'under_review' }, new_state: { status: 'verified' } })), evidence_access_logs: [{ id: 20, action: 'downloaded', financial_report_evidence_id: 21 }] });
  vi.spyOn(api.admin.verificationRequests, 'list').mockResolvedValue([request]);
  vi.spyOn(api.admin.verificationRequests, 'get').mockResolvedValue(request);
  vi.spyOn(api.admin.verificationRequests, 'getAuditLogs').mockResolvedValue({ verification_request_id: 7, audit_logs: [{ id: 1, verification_request_id: 7, action: 'approved', previous_status: 'under_review', new_status: 'approved', actor: { id: 9, name: 'Reviewer' }, notes: 'Checked evidence', occurred_at: '2026-01-01T12:00:00Z' }], evidence_access_logs: [{ id: 1, verification_request_id: 7, verification_evidence_id: 2, action: 'download_initiated', occurred_at: '2026-01-01T11:00:00Z' }] });
});
async function selectFinancial() {
  fireEvent.change(await screen.findByLabelText('Select a report'), { target: { value: '3' } });
}
async function selectVerification() {
  fireEvent.click(await screen.findByRole('tab', { name: 'Verification History' }));
  fireEvent.change(await screen.findByLabelText('Select a verification request'), { target: { value: '7' } });
}
it('loads Report #3 from the existing API and renders every persisted event and custody entry', async () => {
  render(<AuditLogs />);
  expect(await screen.findByRole('heading', { name: 'System Audit Logs' })).toBeTruthy();
  await selectFinancial();
  await screen.findByText('Report Created');
  expect(api.admin.financialReports.getAuditLogs).toHaveBeenCalledWith('3');
  for (const action of ['Evidence Uploaded', 'Report Verified', 'Discrepancy Flagged', 'Discrepancy Resolved']) expect(screen.getByText(action)).toBeTruthy();
  expect(screen.getAllByText(/Reviewer · Admin/)).toHaveLength(5);
  expect(screen.getByText(/Chain of custody · Evidence #21/)).toBeTruthy();
});
it('loads completed verification requests and renders status transitions, actor, notes and access history', async () => {
  render(<AuditLogs />); await selectVerification();
  await screen.findByText('Checked evidence');
  expect(api.admin.verificationRequests.list).toHaveBeenCalledWith({ status: 'all' });
  expect(api.admin.verificationRequests.getAuditLogs).toHaveBeenCalledWith('7');
  const timeline = within(screen.getByRole('region', { name: 'Audit timeline' }));
  expect(timeline.getByText('Under Review')).toBeTruthy();
  expect(timeline.getByLabelText('changed to').textContent).toBe('→');
  expect(timeline.getAllByText('Approved').length).toBeGreaterThan(0);
  expect(timeline.getByText(/Reviewer/)).toBeTruthy();
  expect(timeline.getByText(/Evidence #2/)).toBeTruthy();
});
it('handles empty histories without inventing events', async () => {
  vi.mocked(api.admin.financialReports.getAuditLogs).mockResolvedValue({ financial_report_id: 3, audit_logs: [] });
  render(<AuditLogs />); await selectFinancial();
  expect(await screen.findByText('No audit events recorded.')).toBeTruthy();
});
it.each([404, 500])('handles history error %s and retries', async status => {
  vi.mocked(api.admin.financialReports.getAuditLogs).mockRejectedValueOnce(new ApiError(status, 'Failure'));
  render(<AuditLogs />); await selectFinancial();
  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toContain(status === 404 ? 'unavailable or has been deleted' : 'Unable to load audit history');
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Report Created')).toBeTruthy();
});
it('handles list errors and empty lists in both tabs', async () => {
  vi.mocked(api.admin.financialReports.list).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue({ reports: [], pagination: { current_page: 1, last_page: 1, per_page: 100, total: 0 } });
  vi.mocked(api.admin.verificationRequests.list).mockResolvedValue([]);
  render(<AuditLogs />);
  fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('No reports available.')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Verification History' }));
  expect(await screen.findByText('No verification requests available.')).toBeTruthy();
});
it('loads later report pages and filters the selector', async () => {
  vi.mocked(api.admin.financialReports.list).mockResolvedValueOnce({ reports: [], pagination: { current_page: 1, last_page: 2, per_page: 100, total: 1 } }).mockResolvedValueOnce({ reports: [report], pagination: { current_page: 2, last_page: 2, per_page: 100, total: 1 } });
  render(<AuditLogs />);
  await screen.findByLabelText('Select a report');
  expect(api.admin.financialReports.list).toHaveBeenCalledWith({ page: 2, per_page: 100 });
  fireEvent.change(screen.getByLabelText('Search reports'), { target: { value: 'missing' } });
  expect(screen.getByText('No matching reports.')).toBeTruthy();
  expect(screen.queryByRole('option', { name: /Report #3/ })).toBeNull();
});
it('discards late responses after switching tabs', async () => {
  let resolve: (value: any) => void = () => {};
  vi.mocked(api.admin.financialReports.getAuditLogs).mockImplementation(() => new Promise(r => { resolve = r; }));
  render(<AuditLogs />); await selectFinancial();
  await selectVerification(); await screen.findByText('Checked evidence');
  await act(async () => resolve({ financial_report_id: 3, audit_logs: [{ id: 1, action: 'stale_event' }] }));
  await waitFor(() => expect(screen.queryByText('stale_event')).toBeNull());
});
it.each(['approved', 'rejected', 'needs_information'])('renders persisted verification decision %s', async action => {
  vi.mocked(api.admin.verificationRequests.getAuditLogs).mockResolvedValue({ verification_request_id: 7, audit_logs: [{ id: 1, verification_request_id: 7, action, previous_status: 'pending', new_status: action, occurred_at: null }], evidence_access_logs: [] });
  render(<AuditLogs />); await selectVerification();
  await screen.findByText('Pending');
  expect(within(screen.getByRole('region', { name: 'Audit timeline' })).getAllByText(action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).length).toBe(2);
  expect(screen.queryByText(/Actor not recorded/)).toBeNull();
});
it('shows verification loading, failure, retry and an empty history', async () => {
  let reject: (error: Error) => void = () => {};
  vi.mocked(api.admin.verificationRequests.getAuditLogs).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; })).mockResolvedValue({ verification_request_id: 7, audit_logs: [], evidence_access_logs: [] });
  render(<AuditLogs />); await selectVerification();
  expect(await screen.findByText('Loading audit history…')).toBeTruthy();
  await act(async () => reject(new Error('Offline')));
  const alert = await screen.findByRole('alert');
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('No audit events recorded.')).toBeTruthy();
});

it('presents Report #3 snapshots as readable cards in persisted chronological order', async () => {
  vi.mocked(api.admin.financialReports.getAuditLogs).mockResolvedValue({ financial_report_id: 3, audit_logs: [
    { id: 3, action: 'report_verified', created_at: '2026-01-03T12:00:00Z', actor: { id: 9, name: 'Reviewer' }, old_state: { status: 'evidence_submitted', reviewed_at: null }, new_state: { status: 'verified', reviewed_at: '2026-01-03T12:00:00Z', admin_review_notes: 'Checked bank_statement.pdf' } },
    { id: 2, action: 'evidence_uploaded', created_at: '2026-01-02T12:00:00Z', old_state: { status: 'self_reported' }, new_state: { status: 'evidence_submitted', filename: 'bank_statement.pdf', evidence_id: 21 } },
    { id: 1, action: 'report_created', created_at: '2026-01-01T12:00:00Z', new_state: { revenue: '5000.00', expenses: '200.00', net_profit_loss: '4800.00', cash_position: '0.00', reporting_period_start: '2026-01-01', reporting_period_end: '2026-01-31', status: 'self_reported' } },
  ] });
  render(<AuditLogs />); await selectFinancial();
  await screen.findByText('Report Created');
  const timeline = screen.getByRole('region', { name: 'Audit timeline' });
  expect(within(timeline).getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Report Created', 'Evidence Uploaded', 'Report Verified']);
  const [created, uploaded, verified] = within(timeline).getAllByRole('listitem').map(el => within(el));
  for (const amount of ['৳5,000.00', '৳200.00', '৳4,800.00', '৳0.00']) expect(created.getByText(amount)).toBeTruthy();
  expect(created.getByText('Net P/L')).toBeTruthy();
  expect(created.getByText('1 Jan 2026 – 31 Jan 2026')).toBeTruthy();
  expect(uploaded.getByText('bank_statement.pdf')).toBeTruthy();
  expect(uploaded.getByText('Evidence ID')).toBeTruthy();
  expect(uploaded.getByText('21')).toBeTruthy();
  expect(uploaded.getByText('Self Reported')).toBeTruthy();
  expect(uploaded.getByText('Evidence Submitted')).toBeTruthy();
  expect(verified.getByText('Reviewed By: Reviewer')).toBeTruthy();
  expect(verified.getByText('Review Notes')).toBeTruthy();
  expect(verified.getByText('Checked bank_statement.pdf')).toBeTruthy();
  expect(verified.getByText('Reviewed At')).toBeTruthy();
  expect(verified.getByText('Verified')).toBeTruthy();
  expect(timeline.querySelector('pre, code')).toBeNull();
  expect(timeline.textContent).not.toMatch(/[{}]|"status"|self_reported|evidence_submitted|report_created/);
});

it('omits missing fields and renders nested persisted values without raw JSON or invented verification', async () => {
  vi.mocked(api.admin.financialReports.getAuditLogs).mockResolvedValue({ financial_report_id: 3, audit_logs: [
    { id: 1, action: 'report_created', new_state: { revenue: 0, cash_position: null, extra: { evidence_type: 'bank_statement' } } },
    { id: 2, action: 'report_reviewed', new_state: { status: 'under_review' } },
  ] });
  render(<AuditLogs />); await selectFinancial(); await screen.findByText('Report Created');
  const timeline = screen.getByRole('region', { name: 'Audit timeline' });
  expect(within(timeline).getByText('৳0.00')).toBeTruthy();
  expect(within(timeline).getByText('Extra · Evidence Type')).toBeTruthy();
  expect(within(timeline).getByText('Bank Statement')).toBeTruthy();
  expect(within(timeline).queryByText('Cash Position')).toBeNull();
  expect(within(timeline).queryByText('Report Verified')).toBeNull();
  expect(within(timeline).getByText('Report Reviewed')).toBeTruthy();
  expect(timeline.textContent).not.toMatch(/[{}]|Not recorded|undefined|null/);
});
