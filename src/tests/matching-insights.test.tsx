import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MatchingInsightsSection, {
  MATCHING_INSIGHTS_DISCLOSURE,
  formatFactorLabel,
} from '../components/matching/MatchingInsightsSection';
import { MatchExplanationDrawer, type MatchDetail } from '../components/ui/AIInsights';
import { MatchExplainDrawer, type MatchExplainData } from '../components/ui/MatchExplainDrawer';
import DiscoverBusinesses from '../pages/shared/DiscoverBusinesses';
import { api, ApiError, type MatchingInsightRecord, type UserProfileResponseData } from '../services/api';

const mockProfile: UserProfileResponseData = {
  user: {
    id: 10,
    name: 'Sarah Rahman',
    email: 'sarah@example.com',
  },
  roles: ['investor', 'professional'],
  profiles: {
    founder: null,
    investor: { id: 25, user_id: 10 },
    professional: { id: 35, user_id: 10, skills: ['Finance', 'Strategy'] },
  },
};

function createMockInsight(overrides: Partial<MatchingInsightRecord> = {}): MatchingInsightRecord {
  return {
    id: 101,
    business_id: 1,
    candidate_id: 25,
    counterparty_role: 'investor',
    version: 1,
    formula_version: 'matching-v1',
    output_contract_version: 'matching-insight-v1',
    summary: 'Strong strategic alignment between investor thesis and the business development roadmap.',
    match_strengths: ['Compatible check size', 'Sector experience in FinTech'],
    potential_gaps: ['Timeline differences on follow-on tranches'],
    discussion_points: ['Discuss board representation expectations', 'Review international expansion milestones'],
    cautions: ['Regulatory approval in secondary markets pending'],
    factor_explanations: [
      {
        factor: 'investment_range',
        observation: 'Ask is well within the standard ticket range.',
        evidence: 'Stated investment preference covers ৳25L to ৳1Cr.',
        confidence: 0.95,
      },
      {
        factor: 'business_stage',
        observation: 'Growth metrics match Seed criteria.',
        evidence: 'Business is at active Seed stage with initial traction.',
        confidence: 0.9,
      },
      {
        factor: 'risk_level',
        observation: 'Risk appetite matches moderate market category.',
        evidence: 'Both profiles indicate moderate risk tolerance.',
        confidence: 0.85,
      },
    ],
    confidence: 0.92,
    recommendations: ['Schedule initial discussion call to clarify expectations.'],
    generated_at: '2026-09-22T10:00:00Z',
    created_at: '2026-09-22T10:00:00Z',
    freshness: {
      is_current: true,
    },
    ...overrides,
  };
}

const mockMatchDetail: MatchDetail = {
  score: 84,
  entityName: 'Apex HealthTech',
  summary: 'High thematic alignment in HealthTech sector.',
  alignments: [
    { factor: 'Industry Alignment', score: 90, description: 'Direct match in health analytics.' },
    { factor: 'Stage Fit', score: 85, description: 'Seed stage aligns with thesis.' },
  ],
  gaps: [
    { factor: 'Location Fit', description: 'Counterparty operates in different district.', severity: 'moderate' },
  ],
  whyThisMatch: ['Strong sector synergy in HealthTech.', 'Funding amount matches target ticket size.'],
  contextLabel: 'Investor Match',
  businessId: 1,
  role: 'investor',
  candidateId: 25,
};

describe('AI Phase 4 Part 3 — Matching Insights Frontend UI Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.profile, 'get').mockResolvedValue(mockProfile);
    vi.spyOn(api.matchingInsights, 'current').mockResolvedValue(null);
    vi.spyOn(api.matchingInsights, 'generate').mockResolvedValue(createMockInsight());
    vi.spyOn(api.matchingInsights, 'history').mockResolvedValue([createMockInsight()]);
  });

  // 1 & 2. Deterministic match score & "Why this match?" still render
  it('1 & 2: renders deterministic match score and "Why this match?" without replacing them', async () => {
    render(
      <MatchExplanationDrawer
        data={mockMatchDetail}
        businessId={1}
        role="investor"
        candidateId={25}
        onClose={vi.fn()}
      />
    );

    // Canonical deterministic score
    expect(await screen.findByText('84%')).toBeTruthy();
    expect(screen.getByText('Strong Match')).toBeTruthy();

    // Deterministic factor breakdown & Why this match
    expect(screen.getByText('Industry Alignment')).toBeTruthy();
    expect(screen.getByText('Why This Match?')).toBeTruthy();
    expect(screen.getByText('Strong sector synergy in HealthTech.')).toBeTruthy();
  });

  // 3. AI section is visually separate
  it('3: renders AI-Assisted Match Insights in a visually separate section with advisory disclosure', async () => {
    render(
      <MatchExplanationDrawer
        data={mockMatchDetail}
        businessId={1}
        role="investor"
        candidateId={25}
        onClose={vi.fn()}
      />
    );

    const heading = await screen.findByRole('heading', { name: 'AI-Assisted Match Insights' });
    expect(heading).toBeTruthy();
    expect(screen.getByText(MATCHING_INSIGHTS_DISCLOSURE)).toBeTruthy();
  });

  // 4 & 5. No current insight state renders and Generate button calls API
  it('4 & 5: renders no-current-insight state and triggers generate on user action', async () => {
    vi.mocked(api.matchingInsights.current).mockResolvedValue(null);

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    expect(await screen.findByText(/No AI-assisted insight has been generated for this match yet/i)).toBeTruthy();

    const generateBtn = screen.getByRole('button', { name: 'Generate AI Insight' });
    expect(generateBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(api.matchingInsights.generate).toHaveBeenCalledWith(1, 'investor', 25);
  });

  // 6. Generating state disables duplicate click
  it('6: disables repeated generation clicks and displays in-progress status while request is active', async () => {
    let resolveGen!: (val: MatchingInsightRecord) => void;
    vi.mocked(api.matchingInsights.generate).mockReturnValue(
      new Promise(done => {
        resolveGen = done;
      })
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    const generateBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });

    await act(async () => {
      fireEvent.click(generateBtn);
      fireEvent.click(generateBtn); // Spam second click
    });

    expect(await screen.findByText('Generating match insight...')).toBeTruthy();
    expect(api.matchingInsights.generate).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveGen(createMockInsight());
    });

    expect(await screen.findByText(/Strong strategic alignment/)).toBeTruthy();
  });

  // 7, 9-14. Successful Investor insight renders all subsections
  it('7, 9-14: renders successful insight with summary, strengths, gaps, discussion points, cautions, and factor explanations', async () => {
    const mockInsight = createMockInsight();
    vi.mocked(api.matchingInsights.current).mockResolvedValue(mockInsight);

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    expect(await screen.findByText(mockInsight.summary)).toBeTruthy();
    expect(screen.getByText('• Compatible check size')).toBeTruthy();
    expect(screen.getByText('• Timeline differences on follow-on tranches')).toBeTruthy();
    expect(screen.getByText('• Discuss board representation expectations')).toBeTruthy();
    expect(screen.getByText('• Regulatory approval in secondary markets pending')).toBeTruthy();

    // Factor explanations
    expect(screen.getByText('Investment Range')).toBeTruthy();
    expect(screen.getByText('Ask is well within the standard ticket range.')).toBeTruthy();
    expect(screen.getByText('Business Stage')).toBeTruthy();
    expect(screen.getByText('Risk Compatibility')).toBeTruthy();
  });

  // 8. Successful Professional insight renders
  it('8 & 15: renders Professional match insight and maps technical factors to readable labels', async () => {
    const profInsight = createMockInsight({
      counterparty_role: 'professional',
      factor_explanations: [
        {
          factor: 'skills',
          observation: 'Full stack TypeScript capability.',
          evidence: 'Verified project portfolio.',
          confidence: 0.95,
        },
        {
          factor: 'industry_experience',
          observation: '5+ years in fintech domain.',
          evidence: 'Previous senior role in banking app.',
          confidence: 0.88,
        },
        {
          factor: 'experience_level',
          observation: 'Lead developer seniority.',
          evidence: 'Managed team of 6 engineers.',
          confidence: 0.9,
        },
        {
          factor: 'availability',
          observation: '20 hours per week available.',
          evidence: 'Part-time schedule stated.',
          confidence: 1.0,
        },
        {
          factor: 'compensation_preferences',
          observation: 'Equity plus stipend preference matches business offer.',
          evidence: 'Requested rate within budget.',
          confidence: 0.9,
        },
      ],
    });

    vi.mocked(api.matchingInsights.current).mockResolvedValue(profInsight);

    render(
      <MatchingInsightsSection
        businessId={1}
        role="professional"
        candidateId={35}
      />
    );

    expect(await screen.findByText('Skills Alignment')).toBeTruthy();
    expect(screen.getByText('Industry Experience')).toBeTruthy();
    expect(screen.getByText('Experience Level')).toBeTruthy();
    expect(screen.getByText('Availability')).toBeTruthy();
    expect(screen.getByText('Compensation Preferences')).toBeTruthy();
  });

  // 15. Helper formatFactorLabel test
  it('15: correctly converts factor keys into English title labels', () => {
    expect(formatFactorLabel('investment_range')).toBe('Investment Range');
    expect(formatFactorLabel('business_stage')).toBe('Business Stage');
    expect(formatFactorLabel('risk_level')).toBe('Risk Compatibility');
    expect(formatFactorLabel('industry_experience')).toBe('Industry Experience');
    expect(formatFactorLabel('skills')).toBe('Skills Alignment');
    expect(formatFactorLabel('expected_involvement')).toBe('Expected Involvement');
    expect(formatFactorLabel('custom_unknown_factor')).toBe('Custom Unknown Factor');
  });

  // 16 & 17. No AI score or AI rank rendered
  it('16 & 17: does not render AI Score, Predicted Score, or AI Rank in AI section', async () => {
    vi.mocked(api.matchingInsights.current).mockResolvedValue(createMockInsight());

    const { container } = render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    await screen.findByText(/Strong strategic alignment/);

    expect(screen.queryByText(/AI Match Score/i)).toBeNull();
    expect(screen.queryByText(/Predicted Score/i)).toBeNull();
    expect(screen.queryByText(/Recommended Score/i)).toBeNull();
    expect(screen.queryByText(/Adjusted Score/i)).toBeNull();
    expect(screen.queryByText(/AI Rank/i)).toBeNull();
    expect(screen.queryByText(/probability of/i)).toBeNull();
  });

  // 18 & 19. Stale insight clearly labeled and offers regeneration
  it('18 & 19: clearly labels stale insight and provides regeneration action', async () => {
    const staleInsight = createMockInsight({
      freshness: { is_current: false },
    });
    vi.mocked(api.matchingInsights.current).mockResolvedValue(staleInsight);

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    expect(await screen.findByText('Stale')).toBeTruthy();
    expect(
      screen.getByText(/This insight was generated from an earlier version of the match data/i)
    ).toBeTruthy();

    const regenBtn = screen.getByRole('button', { name: 'Regenerate Insight' });
    expect(regenBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(regenBtn);
    });

    expect(api.matchingInsights.generate).toHaveBeenCalledWith(1, 'investor', 25);
  });

  // 20 & 21. History view can be opened and does not appear current
  it('20 & 21: allows opening previous insight history without treating historical records as current', async () => {
    const currentInsight = createMockInsight({ version: 2 });
    const historicalInsight = createMockInsight({
      id: 99,
      version: 1,
      summary: 'Archived legacy summary for version 1',
      freshness: { is_current: false },
    });

    vi.mocked(api.matchingInsights.current).mockResolvedValue(currentInsight);
    vi.mocked(api.matchingInsights.history).mockResolvedValue([currentInsight, historicalInsight]);

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    await screen.findByText('v2');
    const historyBtn = screen.getByRole('button', { name: /View previous insights/i });

    await act(async () => {
      fireEvent.click(historyBtn);
    });

    expect(await screen.findByText('Insight History')).toBeTruthy();
    expect(screen.getByText('Version 1')).toBeTruthy();

    // Click historical version
    await act(async () => {
      fireEvent.click(screen.getByText('Version 1'));
    });

    expect(await screen.findByText('Archived legacy summary for version 1')).toBeTruthy();
    expect(screen.getByText('Viewing historical version 1')).toBeTruthy();
    expect(screen.getByText('Archived')).toBeTruthy();

    // Return to current
    await act(async () => {
      fireEvent.click(screen.getByText('Back to current insight'));
    });

    expect(screen.getByText(currentInsight.summary)).toBeTruthy();
  });

  // 22. Provider unavailable state (503)
  it('22: displays safe controlled message when provider is unavailable (503)', async () => {
    vi.mocked(api.matchingInsights.current).mockRejectedValue(
      new ApiError(503, 'private-provider-secret-key-failed', 'PROVIDER_UNAVAILABLE')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    expect(
      await screen.findByText('AI-assisted match insights are currently unavailable.')
    ).toBeTruthy();
    expect(screen.queryByText(/private-provider-secret-key-failed/)).toBeNull();
  });

  // 23. Timeout / temporary failure is retryable
  it('23: displays retryable error state on temporary provider failure', async () => {
    vi.mocked(api.matchingInsights.generate).mockRejectedValue(
      new ApiError(504, 'Gateway Timeout', 'TIMEOUT')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    const genBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    expect(
      await screen.findByText('AI insight could not be generated right now. Please try again.')
    ).toBeTruthy();
  });

  // 24. Invalid provider response (502) is safe
  it('24: rejects invalid provider response safely without rendering corrupted content', async () => {
    vi.mocked(api.matchingInsights.generate).mockRejectedValue(
      new ApiError(502, 'Malformed JSON', 'INVALID_ANALYSIS_OUTPUT')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    const genBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    expect(
      await screen.findByText(/AI insight could not be generated due to invalid provider output/i)
    ).toBeTruthy();
  });

  // 25. SOURCE_CHANGED (409) handling
  it('25: handles SOURCE_CHANGED conflict error (409) with helpful user guidance', async () => {
    vi.mocked(api.matchingInsights.generate).mockRejectedValue(
      new ApiError(409, 'Source Changed', 'SOURCE_CHANGED')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    const genBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    expect(
      await screen.findByText(/The match data changed while the insight was being generated/i)
    ).toBeTruthy();
  });

  // 26. GENERATION_IN_PROGRESS (409) handling
  it('26: handles GENERATION_IN_PROGRESS conflict error (409) gracefully', async () => {
    vi.mocked(api.matchingInsights.generate).mockRejectedValue(
      new ApiError(409, 'In progress', 'GENERATION_IN_PROGRESS')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    const genBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    expect(
      await screen.findByText(/An insight is already being generated for this match/i)
    ).toBeTruthy();
  });

  // 27 & 28. Founder role-aware URL building
  it('27 & 28: Founder -> Investor and Founder -> Professional build correct role-aware requests', async () => {
    render(
      <MatchExplanationDrawer
        data={mockMatchDetail}
        businessId={1}
        role="investor"
        candidateId={25}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(api.matchingInsights.current).toHaveBeenCalledWith(1, 'investor', 25);
    });

    render(
      <MatchExplanationDrawer
        data={{ ...mockMatchDetail, role: 'professional', candidateId: 35 }}
        businessId={2}
        role="professional"
        candidateId={35}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(api.matchingInsights.current).toHaveBeenCalledWith(2, 'professional', 35);
    });
  });

  // 29 & 30 & 31. Investor & Professional own matches and multi-role context
  it('29, 30 & 31: Investor and Professional own matches resolve current candidate and active role', async () => {
    // Investor context
    render(
      <MatchingInsightsSection
        businessId={8}
        role="investor"
      />
    );

    await waitFor(() => {
      expect(api.matchingInsights.current).toHaveBeenCalledWith(8, 'investor', 25);
    });

    // Professional context
    render(
      <MatchingInsightsSection
        businessId={9}
        role="professional"
      />
    );

    await waitFor(() => {
      expect(api.matchingInsights.current).toHaveBeenCalledWith(9, 'professional', 35);
    });
  });

  // 32. Unauthorized / Forbidden data protection
  it('32: clears private AI data when backend returns 403 Forbidden', async () => {
    vi.mocked(api.matchingInsights.current).mockRejectedValue(
      new ApiError(403, 'Forbidden.', 'FORBIDDEN')
    );

    render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    expect(
      await screen.findByText('You do not have permission to view AI insights for this match.')
    ).toBeTruthy();
    expect(screen.queryByText(/Strong strategic alignment/)).toBeNull();
  });

  // 33 & 34. Safe rendering / no dangerouslySetInnerHTML / XSS attack protection
  it('33 & 34: renders AI output as plain React text without HTML injection or dangerouslySetInnerHTML', async () => {
    const xssAttack = '<script>alert("xss")</script><img src=x onerror=alert(1) />';
    const attackInsight = createMockInsight({
      summary: xssAttack,
      match_strengths: [xssAttack],
    });
    vi.mocked(api.matchingInsights.current).mockResolvedValue(attackInsight);

    const { container } = render(
      <MatchingInsightsSection
        businessId={1}
        role="investor"
        candidateId={25}
      />
    );

    // Text content matches the literal string safely
    expect(await screen.findByText(xssAttack)).toBeTruthy();
    // No injected script or img elements
    expect(container.querySelector('script,img[onerror]')).toBeNull();
  });

  // 35. Deterministic score/factor UI remains unchanged after AI generation
  it('35: preserves deterministic score and factor breakdown before and after AI generation in MatchExplainDrawer', async () => {
    const matchData: MatchExplainData = {
      score: 91,
      subjectName: 'NovaTech AI Ltd',
      subjectInitials: 'NT',
      subjectRole: 'Seed-stage Investor',
      summaryLine: 'Strong alignment across industry, stage, and thesis.',
      viewerRole: 'investor',
      ctaLabel: 'Express Interest',
      whyBullets: ['Both parties are focused on Technology / AI.'],
      businessId: 1,
      role: 'investor',
      candidateId: 25,
      factors: [
        { name: 'Industry Match', score: 95, weight: 5, explanation: 'Both parties are focused on Technology / AI.' },
        { name: 'Investment Range Compatibility', score: 90, weight: 5, explanation: 'Target funding is within range.' },
      ],
    };

    render(
      <MatchExplainDrawer
        data={matchData}
        state="ready"
        onClose={vi.fn()}
      />
    );

    // Deterministic score is intact
    expect(await screen.findByText('91')).toBeTruthy();
    expect(screen.getByText('NovaTech AI Ltd')).toBeTruthy();
    expect(screen.getAllByText('Industry Match').length).toBeGreaterThan(0);

    // Trigger AI generation
    const genBtn = await screen.findByRole('button', { name: 'Generate AI Insight' });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    // Verify AI output rendered
    expect(await screen.findByText(/Strong strategic alignment/)).toBeTruthy();

    // Verify deterministic score and factors are still completely intact
    expect(screen.getByText('91')).toBeTruthy();
    expect(screen.getByText('NovaTech AI Ltd')).toBeTruthy();
    expect(screen.getAllByText('Industry Match').length).toBeGreaterThan(0);
  });
});
