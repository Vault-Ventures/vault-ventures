import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import MatchingInsightsSection from '../components/matching/MatchingInsightsSection';
import DealInsightsSection from '../components/deals/DealInsightsSection';
import { api, type MatchingInsightRecord } from '../services/api';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('renders canonical backend matching factor identity, explanation and numeric confidence', async () => {
  const record = {
    id: 1, business_id: 1, candidate_id: 2, counterparty_role: 'professional', version: 1,
    formula_version: 'matching-v1', output_contract_version: 'matching-insight-v1',
    summary: 'Advisory only.', match_strengths: [], potential_gaps: [], discussion_points: [], cautions: [],
    factor_explanations: [{ factor_key: 'compensation', explanation: 'Equity preferences overlap.', confidence: 0.75 }],
    confidence: 0.75, recommendations: [], generated_at: '2026-09-22T00:00:00Z', freshness: { is_current: true },
  } as unknown as MatchingInsightRecord;
  vi.spyOn(api.matchingInsights, 'current').mockResolvedValue(record);
  render(<MatchingInsightsSection businessId={1} role="professional" candidateId={2} />);
  expect(await screen.findByText('Equity preferences overlap.')).toBeTruthy();
  expect(screen.getByText('Compensation Preferences')).toBeTruthy();
  expect(screen.getByText('Confidence: 75%')).toBeTruthy();
});

it('discards a late Deal A response after switching to Deal B', async () => {
  let resolveA: (value: any) => void = () => {};
  const promiseA = new Promise(resolve => { resolveA = resolve; });
  vi.spyOn(api.dealInsights, 'current').mockImplementation(id => Number(id) === 1
    ? promiseA
    : Promise.resolve(null));
  vi.spyOn(api.dealInsights, 'history').mockResolvedValue([]);
  const view = render(<DealInsightsSection dealId={1} role="investor" />);
  view.rerender(<DealInsightsSection dealId={2} role="investor" />);
  await screen.findByText('No AI Insight Generated Yet');
  await act(async () => resolveA({ id: 1, deal_id: 1, version: 1, summary: 'Private Deal A summary',
    current_stage_summary: 'Negotiation', key_points: [], open_items: [], discussion_points: [], cautions: [],
    freshness: { is_current: true } }));
  expect(screen.queryByText('Private Deal A summary')).toBeNull();
});
