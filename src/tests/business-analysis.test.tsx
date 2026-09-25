import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BusinessAnalysisPanel, { ANALYSIS_DISCLOSURE } from '../components/business/BusinessAnalysisPanel';
import { api, ApiError } from '../services/api';
import type { AnalysisMeta, BusinessAnalysisRecord } from '../services/api';

const meta: AnalysisMeta = { generation_enabled: true, provider_status: 'configured', remote_health: 'not_checked', eligible: true, eligibility_reasons: [], current_version: null };
function record(businessId = 1, version = 1, summary = 'Business summary'): BusinessAnalysisRecord {
  return { id: businessId * 100 + version, business_id: businessId, version, output_contract_version: '2', status: 'completed', generated_at: '2026-09-21T10:00:00Z', provider_identifier: 'gemini', model_identifier: 'gemini-3.8-flash', test_fixture: false, basis: ANALYSIS_DISCLOSURE, freshness: { is_current: true },
    analysis: { summary, strengths: ['Clear offering'], weaknesses: ['Traction unknown'], opportunities: ['Validate demand'], risks: ['Unverified claims'], recommendations: ['Interview customers'] } };
}
function mount(businessId = 1) { return render(<MemoryRouter><BusinessAnalysisPanel businessId={businessId} /></MemoryRouter>); }

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.businessAnalysis, 'latest').mockResolvedValue({ data: null, meta });
  vi.spyOn(api.businessAnalysis, 'generate').mockResolvedValue({ data: record(), meta: { ...meta, current_version: 1 } });
  vi.spyOn(api.businessAnalysis, 'history').mockResolvedValue({ data: [record()], meta: { ...meta, pagination: { current_page: 1, last_page: 1, total: 1 } } });
});

it('shows honest unavailable state and disables generation', async () => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: null, meta: { ...meta, generation_enabled: false, provider_status: 'not_configured' } });
  mount();
  expect(await screen.findByText(/Provider configuration is required/)).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Generate AI Analysis' }) as HTMLButtonElement).disabled).toBe(true);
  expect(api.businessAnalysis.generate).not.toHaveBeenCalled();
});

it('generates once, shows processing and renders every structured section safely', async () => {
  let resolve!: (value: any) => void;
  vi.mocked(api.businessAnalysis.generate).mockReturnValue(new Promise(done => { resolve = done; }));
  const { container } = mount();
  await screen.findByText('No AI analysis generated yet.');
  const button = screen.getByRole('button', { name: 'Generate AI Analysis' });
  await act(async () => { fireEvent.click(button); fireEvent.click(button); });
  expect(await screen.findByText(/Processing AI analysis/)).toBeTruthy();
  expect(api.businessAnalysis.generate).toHaveBeenCalledTimes(1);
  expect(api.businessAnalysis.generate).toHaveBeenCalledWith(1);
  const attack = '<img src=x onerror=alert(1)><script>steal()</script>';
  await act(async () => resolve({ data: record(1, 1, attack), meta: { ...meta, current_version: 1 } }));
  expect(screen.getByText(attack)).toBeTruthy();
  expect(container.querySelector('img,script')).toBeNull();
  for (const title of ['Executive Summary', 'Strengths', 'Weaknesses', 'Opportunities', 'Risks', 'Recommendations']) expect(screen.getByRole('heading', { name: title })).toBeTruthy();
  expect(screen.getByText(ANALYSIS_DISCLOSURE)).toBeTruthy();
  expect(screen.getByText(/Completed · Version 1/)).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Generate New Analysis' }) as HTMLButtonElement).disabled).toBe(true);
});

it.each([
  ['ANALYSIS_TIMEOUT', 503, 'Analysis timed out.'],
  ['ANALYSIS_PROVIDER_RATE_LIMIT', 503, 'request limit has been reached'],
  ['INVALID_ANALYSIS_OUTPUT', 502, 'Nothing was saved.'],
  ['GENERATION_IN_PROGRESS', 409, 'already processing'],
  ['ANALYSIS_PROVIDER_HTTP_FAILURE', 503, 'temporarily unavailable'],
  ['VALIDATION_ERROR', 422, 'not ready for analysis'],
  ['ANALYSIS_NOT_CONFIGURED', 503, 'Provider configuration is required'],
])('handles %s without exposing raw errors or removing prior success', async (code, status, expected) => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: record(), meta });
  vi.mocked(api.businessAnalysis.generate).mockRejectedValue(new ApiError(status, 'raw-provider-secret', code));
  mount();
  await screen.findByText('Business summary');
  fireEvent.click(screen.getByRole('button', { name: 'Generate New Analysis' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(expected));
  expect(screen.getByText('Business summary')).toBeTruthy();
  expect(screen.queryByText(/raw-provider-secret/)).toBeNull();
});

it.each([401, 403, 404])('hides private content when access is lost (%s)', async status => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValueOnce({ data: record(), meta }).mockRejectedValueOnce(new ApiError(status, 'raw-private-error'));
  mount(); await screen.findByText('Business summary');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh Analysis' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Business summary')).toBeNull();
});

it('loads paginated history and lets the Founder view previous versions', async () => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: record(1, 2, 'Latest summary'), meta: { ...meta, current_version: 2 } });
  vi.mocked(api.businessAnalysis.history).mockResolvedValueOnce({ data: [record(1, 2, 'Latest summary')], meta: { ...meta, pagination: { current_page: 1, last_page: 2, total: 2 } } })
    .mockResolvedValueOnce({ data: [{ ...record(1, 1, 'Old summary'), freshness: { is_current: false } }], meta: { ...meta, pagination: { current_page: 2, last_page: 2, total: 2 } } });
  mount(); await screen.findByText('Latest summary');
  fireEvent.click(screen.getByRole('button', { name: 'View History' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Load More History' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Version 1' }));
  expect(await screen.findByText('Old summary')).toBeTruthy();
  expect(screen.getByText(/Historical analysis/)).toBeTruthy();
  expect(api.businessAnalysis.history).toHaveBeenLastCalledWith(1, 2);
});

it('never displays a late generation response for a different business', async () => {
  let resolve!: (value: any) => void;
  vi.mocked(api.businessAnalysis.generate).mockReturnValue(new Promise(done => { resolve = done; }));
  const view = mount(); await screen.findByText('No AI analysis generated yet.');
  fireEvent.click(screen.getByRole('button', { name: 'Generate AI Analysis' }));
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: record(2, 1, 'Business two'), meta });
  view.rerender(<MemoryRouter><BusinessAnalysisPanel businessId={2} /></MemoryRouter>);
  await screen.findByText('Business two');
  await act(async () => resolve({ data: record(1, 1, 'Business one private'), meta }));
  expect(screen.queryByText('Business one private')).toBeNull();
  expect(screen.getByText('Business two')).toBeTruthy();
});

it('renders legacy history honestly and keeps it accessible when AI is disabled', async () => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: { ...record(), output_contract_version: '1', analysis: null, rendered_output: { business_summary: [{ source_ref: 'name', value: 'Legacy name' }] } }, meta: { ...meta, generation_enabled: false } });
  mount();
  expect(await screen.findByRole('heading', { name: 'Legacy Reference Analysis' })).toBeTruthy();
  expect(screen.getByText('name: Legacy name')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Executive Summary' })).toBeNull();
});

it('shows missing assessment guidance and prevents invalid generation', async () => {
  vi.mocked(api.businessAnalysis.latest).mockResolvedValue({ data: null, meta: { ...meta, eligible: false, eligibility_reasons: ['ASSESSMENT_STALE'] } });
  mount();
  expect(await screen.findByText(/ensure a current readiness assessment/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'View readiness assessment' }).getAttribute('href')).toBe('/app/founder/readiness?businessId=1');
  expect((screen.getByRole('button', { name: 'Generate AI Analysis' }) as HTMLButtonElement).disabled).toBe(true);
});
