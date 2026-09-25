import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReadinessInsightsPanel, { READINESS_DISCLOSURE } from '../components/business/ReadinessInsightsPanel';
import ReadinessScore from '../pages/founder/ReadinessScore';
import { api, ApiError } from '../services/api';
import type { AnalysisMeta, ReadinessInsightRecord } from '../services/api';

const meta: AnalysisMeta = { generation_enabled: true, provider_status: 'configured', remote_health: 'not_checked', eligible: true, eligibility_reasons: [], current_version: null };
function record(id = 1, summary = 'Advisory summary'): ReadinessInsightRecord {
  return { id, business_id: id, readiness_assessment_id: id, version: 1, generated_at: '2026-09-22T10:00:00Z', freshness: { is_current: true }, summary, strengths: ['Clear concept'], weaknesses: ['Evidence missing'], opportunities: ['Explore demand'], risks: ['Unverified claims'], recommendations: ['Interview customers'] };
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.readinessInsights, 'latest').mockResolvedValue({ data: null, meta });
  vi.spyOn(api.readinessInsights, 'generate').mockResolvedValue({ data: record(), meta: { ...meta, current_version: 1 } });
  vi.spyOn(api.readinessInsights, 'history').mockResolvedValue({ data: [record()], meta });
});

it('handles no assessment and unavailable configuration honestly', async () => {
  vi.mocked(api.readinessInsights.latest).mockResolvedValue({ data: null, meta: { ...meta, generation_enabled: false, eligible: false, eligibility_reasons: ['ASSESSMENT_MISSING'] } });
  render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText(/Provider configuration is required/);
  expect(screen.getByText(/Create a readiness assessment/)).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Generate Insights' }) as HTMLButtonElement).disabled).toBe(true);
  expect(api.readinessInsights.generate).not.toHaveBeenCalled();
});

it('generates once, shows loading, safe structured output and disclosure without a second score', async () => {
  let resolve!: (value: any) => void;
  vi.mocked(api.readinessInsights.generate).mockReturnValue(new Promise(done => { resolve = done; }));
  const { container } = render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText(/Ready to generate/);
  const button = screen.getByRole('button', { name: 'Generate Insights' });
  await act(async () => { fireEvent.click(button); fireEvent.click(button); });
  expect(await screen.findByText('Generating readiness insights...')).toBeTruthy();
  expect(api.readinessInsights.generate).toHaveBeenCalledTimes(1);
  const attack = '<script>steal()</script><img src=x onerror=alert(1)>';
  await act(async () => resolve({ data: record(1, attack), meta: { ...meta, current_version: 1 } }));
  expect(screen.getByText(attack)).toBeTruthy();
  expect(container.querySelector('img,script')).toBeNull();
  for (const title of ['Summary', 'Strong Areas', 'Improvement Areas', 'Opportunities', 'Risk Notes', 'Priority Actions']) expect(screen.getByRole('heading', { name: title })).toBeTruthy();
  expect(screen.getByText(READINESS_DISCLOSURE)).toBeTruthy();
  expect(container.querySelector('svg')).toBeNull();
  expect((screen.getByRole('button', { name: 'Update Insights' }) as HTMLButtonElement).disabled).toBe(true);
});

it('keeps prior insight on failure and supports stale updates and history', async () => {
  vi.mocked(api.readinessInsights.latest).mockResolvedValue({ data: { ...record(), freshness: { is_current: false } }, meta });
  vi.mocked(api.readinessInsights.generate).mockRejectedValueOnce(new ApiError(503, 'private-provider-error', 'ANALYSIS_TIMEOUT'));
  render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText(/Stale insight:/);
  fireEvent.click(screen.getByRole('button', { name: 'Update Insights' }));
  await screen.findByRole('alert');
  expect(screen.getByText('Advisory summary')).toBeTruthy();
  expect(screen.queryByText('private-provider-error')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Update Insights' }));
  await waitFor(() => expect(screen.queryByText(/Stale insight:/)).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'View Insight History' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Version 1' }));
  expect(screen.getByText(/Assessment 1/)).toBeTruthy();
});

it('requires a fresh assessment before updating a stale insight', async () => {
  vi.mocked(api.readinessInsights.latest).mockResolvedValue({ data: { ...record(), freshness: { is_current: false } }, meta: { ...meta, eligible: false, eligibility_reasons: ['ASSESSMENT_STALE'] } });
  render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText(/Recalculate your readiness assessment/);
  expect((screen.getByRole('button', { name: 'Update Insights' }) as HTMLButtonElement).disabled).toBe(true);
});

it('discards late generation and history responses when switching businesses', async () => {
  let resolve!: (value: any) => void;
  vi.mocked(api.readinessInsights.generate).mockReturnValue(new Promise(done => { resolve = done; }));
  const view = render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText(/Ready to generate/);
  fireEvent.click(screen.getByRole('button', { name: 'Generate Insights' }));
  vi.mocked(api.readinessInsights.latest).mockResolvedValue({ data: record(2, 'Business B'), meta });
  view.rerender(<ReadinessInsightsPanel businessId={2} />);
  await screen.findByText('Business B');
  await act(async () => resolve({ data: record(1, 'Business A private'), meta }));
  expect(screen.queryByText('Business A private')).toBeNull();
});

it.each([401, 403, 404])('clears private content when access is lost (%s)', async status => {
  vi.mocked(api.readinessInsights.latest).mockResolvedValueOnce({ data: record(), meta }).mockRejectedValueOnce(new ApiError(status, 'private-error'));
  render(<ReadinessInsightsPanel businessId={1} />);
  await screen.findByText('Advisory summary');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh Insights' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Advisory summary')).toBeNull();
});

it('retains the canonical deterministic score on the Founder readiness page', async () => {
  vi.spyOn(api.businesses, 'get').mockResolvedValue({ id: 1, name: 'Example' } as any);
  vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue({ id: 1, version: 1, overall_score: '75.00', factor_results: {}, suggestions: [], basis: 'Deterministic assessment' } as any);
  vi.spyOn(api.readiness, 'listAssessments').mockResolvedValue([]);
  vi.spyOn(api.readiness, 'getLatestInputs').mockResolvedValue(null);
  render(<MemoryRouter initialEntries={['/app/founder/readiness?businessId=1']}><ReadinessScore /></MemoryRouter>);
  expect(await screen.findByText('Overall Readiness Score')).toBeTruthy();
  expect(screen.getByText('75')).toBeTruthy();
  expect(screen.getByText('Rule-based assessment')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'AI-Assisted Readiness Insights' })).toBeTruthy();
  await screen.findByText(/Ready to generate/);
  fireEvent.click(screen.getByRole('button', { name: 'Generate Insights' }));
  await screen.findByText('Advisory summary');
  expect(screen.getByText('75')).toBeTruthy();
  expect(api.readiness.getLatestAssessment).toHaveBeenCalledTimes(1);
});
