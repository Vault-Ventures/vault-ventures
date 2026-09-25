import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DealInsightsSection, {
  DEAL_INSIGHTS_DISCLOSURE,
  DEAL_INSIGHTS_LEGAL_DISCLAIMER,
} from '../components/deals/DealInsightsSection';
import DealRoom from '../pages/shared/DealRoom';
import { api, ApiError, type DealInsightRecord } from '../services/api';

const authState = {
  isAuthenticated: true,
  isAdmin: false,
  status: 'authenticated',
  session: {
    activeRole: 'investor',
    roles: ['investor'],
  },
  user: {
    id: 2,
    name: 'Jane Investor',
    email: 'jane@investor.com',
  },
};

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    status: authState.status,
    session: authState.session,
    user: authState.user,
  }),
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({
    role: authState.session.activeRole,
    setRole: vi.fn(),
  }),
}));

function createMockDealInsight(overrides: Partial<DealInsightRecord> = {}): DealInsightRecord {
  return {
    id: 10,
    deal_id: 1,
    version: 1,
    source_schema_version: 'deal-insight-source-v1',
    output_contract_version: 'deal-insight-output-v1',
    summary: 'The deal is actively progressing through commercial term alignment and bilateral governance.',
    current_stage_summary: 'Negotiation phase is active with consensus on equity allocation and first tranche milestones.',
    key_points: ['Equity valuation aligned at 10%', 'Target tranche schedules defined'],
    open_items: ['Finalize governance committee structure', 'Confirm IP assignment schedule'],
    discussion_points: ['Review quarterly dividend timeline', 'Establish board reporting cadence'],
    cautions: ['Simulated fund disbursement is non-custodial and milestone-contingent'],
    generated_at: '2026-09-22T10:00:00Z',
    created_at: '2026-09-22T10:00:00Z',
    freshness: {
      is_current: true,
    },
    ...overrides,
  };
}

const mockDealData = {
  id: 1,
  connection_id: 10,
  business_id: 100,
  founder_user_id: 1,
  counterparty_user_id: 2,
  counterparty_role: 'investor' as const,
  stage: 'negotiation',
  stage_label: 'Negotiation',
  stage_order: 5,
  created_at: '2026-09-22T08:00:00Z',
  updated_at: '2026-09-22T08:00:00Z',
};

describe('AI Phase 5 Part 3 — Deal Intelligence Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authState.isAdmin = false;
    authState.session.activeRole = 'investor';
    authState.user = { id: 2, name: 'Jane Investor', email: 'jane@investor.com' };

    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(null);
    vi.spyOn(api.dealInsights, 'history').mockResolvedValue([]);
    vi.spyOn(api.dealInsights, 'generate').mockResolvedValue(createMockDealInsight());
  });

  // 1 & 2. No insight state renders with Generate button for authorized participant
  it('renders no-insight empty state and shows Generate button for authorized participant', async () => {
    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-empty')).toBeTruthy();
    expect(screen.getByText('No AI Insight Generated Yet')).toBeTruthy();
    expect(screen.getByTestId('deal-insights-generate-btn')).toBeTruthy();
    expect(screen.getByText('Advisory')).toBeTruthy();
  });

  // 3. Opening page does NOT call POST generate
  it('does NOT automatically trigger POST generation on mount', async () => {
    const generateSpy = vi.spyOn(api.dealInsights, 'generate');
    const currentSpy = vi.spyOn(api.dealInsights, 'current');

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    await waitFor(() => {
      expect(currentSpy).toHaveBeenCalledWith(1, 'investor');
    });

    expect(generateSpy).not.toHaveBeenCalled();
  });

  // 4 & 5. Explicit click triggers generation and prevents duplicate clicks while generating
  it('triggers generation on click and prevents duplicate requests while busy', async () => {
    let resolveGen: (val: DealInsightRecord) => void = () => {};
    const pendingPromise = new Promise<DealInsightRecord>((res) => {
      resolveGen = res;
    });
    const generateSpy = vi.spyOn(api.dealInsights, 'generate').mockReturnValue(pendingPromise);

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    // Should show generating state
    expect(await screen.findByTestId('deal-insights-generating')).toBeTruthy();
    expect(generateSpy).toHaveBeenCalledTimes(1);

    // Duplicate clicks during generating should do nothing
    fireEvent.click(btn);
    expect(generateSpy).toHaveBeenCalledTimes(1);

    // Resolve promise
    resolveGen(createMockDealInsight());

    expect(await screen.findByTestId('deal-insights-content')).toBeTruthy();
  });

  // 6, 7, 8, 9, 10, 11. Structured fields render accurately
  it('renders summary, current_stage_summary, key_points, open_items, discussion_points, and cautions', async () => {
    const mockInsight = createMockDealInsight();
    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(mockInsight);
    vi.spyOn(api.dealInsights, 'history').mockResolvedValue([mockInsight]);

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-content')).toBeTruthy();

    // Summary
    expect(screen.getByText(mockInsight.summary)).toBeTruthy();

    // Current stage summary (rendered as explanation, not authoritative stage)
    expect(screen.getByText('Current Stage Explanation')).toBeTruthy();
    expect(screen.getByText(mockInsight.current_stage_summary)).toBeTruthy();

    // Key points
    expect(screen.getByText('Equity valuation aligned at 10%')).toBeTruthy();

    // Open items
    expect(screen.getByText('Finalize governance committee structure')).toBeTruthy();

    // Discussion points
    expect(screen.getByText('Review quarterly dividend timeline')).toBeTruthy();

    // Cautions
    expect(screen.getByText('Simulated fund disbursement is non-custodial and milestone-contingent')).toBeTruthy();

    // Version and status
    expect(screen.getByText(/Version 1/)).toBeTruthy();
    expect(screen.getByText('Current')).toBeTruthy();
  });

  // 12 & 13. Disclosures are visible
  it('displays advisory disclosure and legal disclaimer', async () => {
    const mockInsight = createMockDealInsight();
    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(mockInsight);

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-content')).toBeTruthy();

    expect(screen.getByText(DEAL_INSIGHTS_DISCLOSURE)).toBeTruthy();
    expect(screen.getByText(DEAL_INSIGHTS_LEGAL_DISCLAIMER)).toBeTruthy();
  });

  // 14, 15, 16. Stale state is visible, shows Regenerate button, and does not auto-regenerate
  it('displays stale state indicator and regenerate button without auto-regenerating', async () => {
    const staleInsight = createMockDealInsight({
      freshness: { is_current: false },
    });
    const generateSpy = vi.spyOn(api.dealInsights, 'generate');
    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(staleInsight);
    vi.spyOn(api.dealInsights, 'history').mockResolvedValue([staleInsight]);

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-stale-banner')).toBeTruthy();

    expect(screen.getByText('Outdated / Deal changed')).toBeTruthy();
    expect(screen.getByText('The Deal Room has changed since this insight was generated.')).toBeTruthy();
    expect(generateSpy).not.toHaveBeenCalled();

    // Explicit click on regenerate
    const regenBtn = screen.getByTestId('deal-insights-regenerate-btn');
    fireEvent.click(regenBtn);

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledTimes(1);
    });
  });

  // 17, 18, 19, 20, 21. History opens, shows versions, freshness, and never exposes source_snapshot or fingerprint
  it('toggles history drawer, shows versions/freshness, and excludes sensitive internal fields', async () => {
    const v1 = createMockDealInsight({ id: 10, version: 1, freshness: { is_current: false } });
    const v2 = createMockDealInsight({ id: 11, version: 2, summary: 'Updated v2 summary', freshness: { is_current: true } });

    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(v2);
    vi.spyOn(api.dealInsights, 'history').mockResolvedValue([v2, v1]);

    const { container } = render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-history-toggle')).toBeTruthy();
    expect(screen.getByText('History (2)')).toBeTruthy();

    // Toggle history open
    fireEvent.click(screen.getByTestId('deal-insights-history-toggle'));

    expect(await screen.findByTestId('deal-insights-history-drawer')).toBeTruthy();
    expect(screen.getByText('v1')).toBeTruthy();
    expect(screen.getByText('v2')).toBeTruthy();

    // Click on v1 to view historical
    fireEvent.click(screen.getByText('v1'));
    expect(await screen.findByText('Viewing v1 (Historical)')).toBeTruthy();
    expect(screen.getByText('← Return to latest insight')).toBeTruthy();

    // Internal fields check: neither source_snapshot nor source_fingerprint are in DOM
    expect(container.innerHTML).not.toContain('source_snapshot');
    expect(container.innerHTML).not.toContain('source_fingerprint');
    expect(container.innerHTML).not.toContain('deal-insight-source-v1');
  });

  // 22. Provider unavailable handled (503)
  it('handles PROVIDER_UNAVAILABLE 503 error safely', async () => {
    vi.spyOn(api.dealInsights, 'generate').mockRejectedValue(
      new ApiError(503, 'AI provider is disabled.', 'PROVIDER_UNAVAILABLE')
    );

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('deal-insights-error')).toBeTruthy();
    expect(screen.getByText('AI insights are temporarily unavailable. The Deal Room remains fully usable.')).toBeTruthy();
  });

  // 23. SOURCE_CHANGED handled (409)
  it('handles SOURCE_CHANGED 409 error safely', async () => {
    vi.spyOn(api.dealInsights, 'generate').mockRejectedValue(
      new ApiError(409, 'Deal state changed during generation.', 'SOURCE_CHANGED')
    );

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('deal-insights-error')).toBeTruthy();
    expect(screen.getByText('The Deal changed while the insight was being generated. Please try again.')).toBeTruthy();
  });

  // 24. GENERATION_IN_PROGRESS handled (409)
  it('handles GENERATION_IN_PROGRESS 409 error safely', async () => {
    vi.spyOn(api.dealInsights, 'generate').mockRejectedValue(
      new ApiError(409, 'Generation lock occupied.', 'GENERATION_IN_PROGRESS')
    );

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('deal-insights-error')).toBeTruthy();
    expect(screen.getByText('An AI insight is already being generated for this Deal.')).toBeTruthy();
  });

  // 25. 403 Forbidden handled
  it('handles 403 Forbidden error safely', async () => {
    vi.spyOn(api.dealInsights, 'generate').mockRejectedValue(
      new ApiError(403, 'Admin accounts cannot perform participant actions.', 'FORBIDDEN')
    );

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('deal-insights-error')).toBeTruthy();
    expect(screen.getByText('You do not have permission to generate AI insights for this Deal.')).toBeTruthy();
  });

  // 26. 502 / INVALID_ANALYSIS_OUTPUT handled
  it('handles 502 INVALID_ANALYSIS_OUTPUT safely', async () => {
    vi.spyOn(api.dealInsights, 'generate').mockRejectedValue(
      new ApiError(502, 'Malformed provider response.', 'INVALID_ANALYSIS_OUTPUT')
    );

    render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('deal-insights-error')).toBeTruthy();
    expect(screen.getByText('Unable to process AI insight output. Please try again later.')).toBeTruthy();
  });

  // 27. Script-like AI output rendered safely without HTML injection
  it('renders potentially malicious script tags safely as plain text', async () => {
    const xssInsight = createMockDealInsight({
      summary: '<script>alert("xss")</script> Deal summary with script.',
      key_points: ['<img src="x" onerror="alert(1)" /> Clean bullet.'],
    });
    vi.spyOn(api.dealInsights, 'current').mockResolvedValue(xssInsight);

    const { container } = render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    expect(await screen.findByTestId('deal-insights-content')).toBeTruthy();

    // Content is rendered as literal text
    expect(screen.getByText(/<script>alert\("xss"\)<\/script>/)).toBeTruthy();
    expect(container.querySelector('script')).toBeNull();
  });

  // 28. Admin read-only view hides generation action
  it('hides Generate/Regenerate button in read-only admin view', async () => {
    render(<DealInsightsSection dealId={1} role="admin" canGenerate={false} />);

    expect(await screen.findByTestId('deal-insights-empty')).toBeTruthy();
    expect(screen.queryByTestId('deal-insights-generate-btn')).toBeNull();
    expect(screen.getByText(/Admin oversight is read-only/)).toBeTruthy();
  });

  // 29 & 30. Investor and Professional role param is passed to API
  it('passes active role parameter to backend endpoints', async () => {
    const currentSpy = vi.spyOn(api.dealInsights, 'current');
    const generateSpy = vi.spyOn(api.dealInsights, 'generate');

    // Investor role
    const { unmount } = render(<DealInsightsSection dealId={1} role="investor" canGenerate={true} />);

    await waitFor(() => {
      expect(currentSpy).toHaveBeenCalledWith(1, 'investor');
    });

    unmount();

    // Professional role
    render(<DealInsightsSection dealId={1} role="professional" canGenerate={true} />);

    await waitFor(() => {
      expect(currentSpy).toHaveBeenCalledWith(1, 'professional');
    });

    const btn = await screen.findByTestId('deal-insights-generate-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith(1, 'professional');
    });
  });

  // 31, 32, 33. Integration inside DealRoom: Overview tab renders AI section alongside deterministic UI without messages in AI call
  it('integrates into DealRoom Overview tab while preserving stage tracker and deterministic UI', async () => {
    vi.spyOn(api.deals, 'get').mockResolvedValue(mockDealData as any);
    vi.spyOn(api, 'get').mockResolvedValue([]);
    vi.spyOn(api.deals, 'getNegotiation').mockResolvedValue(null as any);
    vi.spyOn(api.deals, 'getAgreement').mockResolvedValue(null as any);
    vi.spyOn(api.deals.milestones, 'list').mockResolvedValue({ milestones: [], summary: null } as any);
    vi.spyOn(api.deals.messages, 'list').mockResolvedValue({ messages: [] } as any);

    const dealCurrentSpy = vi.spyOn(api.dealInsights, 'current');

    render(
      <MemoryRouter initialEntries={['/app/deals/1']}>
        <Routes>
          <Route path="/app/deals/:dealId" element={<DealRoom />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify Deal Room header and stage tracker
    expect(await screen.findByText('Deal #1')).toBeTruthy();
    expect(screen.getAllByText('Negotiation').length).toBeGreaterThan(0);
    expect(screen.getByText('Overview')).toBeTruthy();

    // Verify DealInsightsSection is rendered inside Overview
    expect(await screen.findByTestId('deal-insights-section')).toBeTruthy();
    expect(screen.getByText('AI-Assisted Deal Insights')).toBeTruthy();
    expect(dealCurrentSpy).toHaveBeenCalledWith(1, expect.anything());
  });
});
