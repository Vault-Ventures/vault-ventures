import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminInsightsSection, ADMIN_INSIGHTS_DISCLOSURE } from '../components/admin/AdminInsightsSection';
import AdminDashboard from '../pages/admin/Dashboard';
import { api, ApiError, type AdminInsightRecord } from '../services/api';

const authState = {
  isAuthenticated: true,
  isAdmin: true,
  status: 'authenticated',
  session: {
    activeRole: 'admin',
    roles: ['admin'],
  },
  user: {
    id: 1,
    name: 'Alvi Admin',
    email: 'admin@vaultventures.com',
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

function createMockAdminInsight(overrides: Partial<AdminInsightRecord> = {}): AdminInsightRecord {
  return {
    id: 1,
    version: 1,
    source_schema_version: 'admin-intelligence-source-v1',
    output_contract_version: 'admin-intelligence-output-v1',
    summary: 'The platform shows steady transaction governance with all audit pipelines operational.',
    governance_observations: [
      'Tier 1 verification queue is processing within acceptable turnaround thresholds.',
      'Financial reports are verified against platform banking simulated tender.',
    ],
    operational_highlights: [
      'Zero unresolved high-severity platform discrepancies.',
      'Cross-deal milestone progression remains active across 12 live rooms.',
    ],
    attention_areas: [
      'Monitor verification queue backlog during end-of-quarter volume surges.',
    ],
    suggested_review_points: [
      'Audit unverified self-reported financial statements pending evidence.',
    ],
    generated_at: '2026-09-22T10:00:00Z',
    created_at: '2026-09-22T10:00:00Z',
    is_current: true,
    ...overrides,
  };
}

describe('AI Phase 5 Part 4 — Admin Intelligence Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(api.admin.insights, 'current').mockResolvedValue(null);
    vi.spyOn(api.admin.insights, 'history').mockResolvedValue([]);
    vi.spyOn(api.admin.insights, 'generate').mockResolvedValue(createMockAdminInsight());
    vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue({
      overview: {
        total_financial_reports_count: 14,
        total_deals_with_reporting: 6,
        total_discrepancies_count: 2,
      },
      verification_pipeline: {
        self_reported_count: 4,
        evidence_submitted_count: 3,
        under_review_count: 2,
        verified_count: 5,
      },
      discrepancy_queue: {
        pending_under_review_count: 2,
        resolved_count: 8,
        disputed_count: 1,
      },
      financial_totals_bdt: {
        currency: 'BDT',
        total_reported_revenue: 15000000,
        total_reported_expenses: 8500000,
        total_calculated_profit_loss: 6500000,
      },
      disclaimer: 'All figures are simulated.',
    });
    vi.spyOn(api.admin.verificationRequests, 'list').mockResolvedValue([]);
    vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({ reports: [], total: 0 } as any);
  });

  it('renders no-insight empty state and never auto-generates on initial mount', async () => {
    const currentSpy = vi.spyOn(api.admin.insights, 'current');
    const generateSpy = vi.spyOn(api.admin.insights, 'generate');

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    expect(screen.getByText('No AI Platform Insight Generated')).toBeTruthy();
    expect(screen.getByTestId('generate-insight-btn')).toBeTruthy();
    expect(screen.getByTestId('advisory-badge')).toBeTruthy();

    expect(currentSpy).toHaveBeenCalledTimes(1);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it('triggers generation on explicit click and disables repeated clicks while busy', async () => {
    let resolveGen: (value: any) => void;
    const genPromise = new Promise((resolve) => {
      resolveGen = resolve;
    });

    const generateSpy = vi.spyOn(api.admin.insights, 'generate').mockImplementation(() => genPromise as any);

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    const generateBtn = screen.getByTestId('generate-insight-btn');
    fireEvent.click(generateBtn);

    // Should immediately show generating state
    expect(await screen.findByTestId('insights-generating')).toBeTruthy();
    expect(screen.getByText('Generating platform governance summary…')).toBeTruthy();
    expect(generateBtn.hasAttribute('disabled')).toBe(true);

    // Rapid double-click should be ignored
    fireEvent.click(generateBtn);
    expect(generateSpy).toHaveBeenCalledTimes(1);

    // Resolve generation
    resolveGen!(createMockAdminInsight());

    expect(await screen.findByTestId('insights-content')).toBeTruthy();
    expect(screen.getByTestId('insight-summary').textContent).toContain(
      'The platform shows steady transaction governance with all audit pipelines operational.'
    );
  });

  it('renders full structured factor sections, disclaimers, and no scores', async () => {
    vi.spyOn(api.admin.insights, 'current').mockResolvedValue(createMockAdminInsight());

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-content')).toBeTruthy();
    expect(screen.getByText('Executive Governance Summary')).toBeTruthy();
    expect(screen.getByTestId('insight-summary').textContent).toContain(
      'The platform shows steady transaction governance with all audit pipelines operational.'
    );

    // Governance observations
    const govList = screen.getByTestId('governance-observations-list');
    expect(govList.textContent).toContain('Tier 1 verification queue is processing within acceptable turnaround thresholds.');

    // Operational highlights
    const opList = screen.getByTestId('operational-highlights-list');
    expect(opList.textContent).toContain('Zero unresolved high-severity platform discrepancies.');

    // Attention areas
    const attnList = screen.getByTestId('attention-areas-list');
    expect(attnList.textContent).toContain('Monitor verification queue backlog during end-of-quarter volume surges.');

    // Suggested review points
    const revList = screen.getByTestId('suggested-review-points-list');
    expect(revList.textContent).toContain('Audit unverified self-reported financial statements pending evidence.');

    // Advisory disclosure
    expect(screen.getByTestId('admin-insights-disclosure').textContent).toContain(ADMIN_INSIGHTS_DISCLOSURE);

    // Verify absence of artificial scores or decisions
    expect(screen.queryByText(/AI Admin Score/i)).toBeNull();
    expect(screen.queryByText(/Confidence Score/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Approve Verification/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reject Verification/i })).toBeNull();
  });

  it('displays stale state indicator and offers regenerate action when platform metrics change', async () => {
    const staleInsight = createMockAdminInsight({ is_current: false, version: 1 });
    vi.spyOn(api.admin.insights, 'current').mockResolvedValue(null);
    vi.spyOn(api.admin.insights, 'history').mockResolvedValue([staleInsight]);

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('stale-insight-banner')).toBeTruthy();
    expect(screen.getByText(/Deterministic platform metrics have changed since this insight was generated/i)).toBeTruthy();

    const regenBtn = screen.getByTestId('generate-insight-btn');
    expect(regenBtn.textContent).toContain('Regenerate Platform Insight');
  });

  it('allows opening and inspecting past versions in history drawer', async () => {
    const v1 = createMockAdminInsight({ version: 1, is_current: false, summary: 'Summary for Version 1.' });
    const v2 = createMockAdminInsight({ id: 2, version: 2, is_current: true, summary: 'Summary for Version 2.' });

    vi.spyOn(api.admin.insights, 'current').mockResolvedValue(v2);
    vi.spyOn(api.admin.insights, 'history').mockResolvedValue([v2, v1]);

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('toggle-history-btn')).toBeTruthy();
    expect(screen.getByTestId('insight-summary').textContent).toContain('Summary for Version 2.');

    // Toggle history drawer
    fireEvent.click(screen.getByTestId('toggle-history-btn'));
    expect(await screen.findByTestId('history-drawer')).toBeTruthy();

    // Select Version 1
    fireEvent.click(screen.getByTestId('history-version-item-1'));
    await waitFor(() => {
      expect(screen.getByTestId('insight-summary').textContent).toContain('Summary for Version 1.');
    });
  });

  it('handles PROVIDER_UNAVAILABLE error gracefully', async () => {
    vi.spyOn(api.admin.insights, 'generate').mockRejectedValue(
      new ApiError(503, 'Analysis disabled', 'PROVIDER_UNAVAILABLE')
    );

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    const btn = screen.getByTestId('generate-insight-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('insights-error-banner')).toBeTruthy();
    expect(screen.getByText('AI insights are temporarily unavailable. Platform operations remain fully usable.')).toBeTruthy();
  });

  it('handles SOURCE_CHANGED 409 error gracefully', async () => {
    vi.spyOn(api.admin.insights, 'generate').mockRejectedValue(
      new ApiError(409, 'Source changed during execution', 'SOURCE_CHANGED')
    );

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    const btn = screen.getByTestId('generate-insight-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('insights-error-banner')).toBeTruthy();
    expect(screen.getByText('Platform metrics changed while the insight was being generated. Please try again.')).toBeTruthy();
  });

  it('handles GENERATION_IN_PROGRESS 409 error gracefully', async () => {
    vi.spyOn(api.admin.insights, 'generate').mockRejectedValue(
      new ApiError(409, 'Lock busy', 'GENERATION_IN_PROGRESS')
    );

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    const btn = screen.getByTestId('generate-insight-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('insights-error-banner')).toBeTruthy();
    expect(screen.getByText('An AI insight is already being generated for the platform.')).toBeTruthy();
  });

  it('handles 502 INVALID_ANALYSIS_OUTPUT gracefully', async () => {
    vi.spyOn(api.admin.insights, 'generate').mockRejectedValue(
      new ApiError(502, 'Malformed JSON payload', 'INVALID_ANALYSIS_OUTPUT')
    );

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insights-empty-state')).toBeTruthy();
    const btn = screen.getByTestId('generate-insight-btn');
    fireEvent.click(btn);

    expect(await screen.findByTestId('insights-error-banner')).toBeTruthy();
    expect(screen.getByText('AI analysis output could not be validated. Platform operations remain fully usable.')).toBeTruthy();
  });

  it('renders potentially malicious script tags safely as plain text', async () => {
    const xssInsight = createMockAdminInsight({
      summary: '<script>alert("xss-summary")</script>',
      governance_observations: ['<img src="x" onerror="alert(\'xss-obs\')" />'],
    });

    vi.spyOn(api.admin.insights, 'current').mockResolvedValue(xssInsight);

    render(<AdminInsightsSection />);

    expect(await screen.findByTestId('insight-summary')).toBeTruthy();
    expect(screen.getByTestId('insight-summary').textContent).toContain('<script>alert("xss-summary")</script>');
    expect(document.querySelector('script[src*="xss"]')).toBeNull();
  });

  it('integrates cleanly into AdminDashboard while preserving deterministic metric cards and verification queue', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Top metrics remain visible
    expect(await screen.findByText('Pending Verifications')).toBeTruthy();
    expect(screen.getAllByText('Financial Reports').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flagged Discrepancies')).toBeTruthy();
    expect(screen.getByText('Platform Currency')).toBeTruthy();

    // AI Section is present as an additive component
    expect(await screen.findByTestId('admin-insights-section')).toBeTruthy();
    expect(screen.getByText('AI-Assisted Platform Insights')).toBeTruthy();

    // Verification Queue section is intact
    expect(screen.getByText('Active Verification Requests')).toBeTruthy();
    expect(screen.getByText('Recent Financial Submissions')).toBeTruthy();
  });
});
