import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import ReadinessScore from '../pages/founder/ReadinessScore';
import ReadinessInputModal from '../components/business/ReadinessInputModal';

vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: 'founder', setRole: vi.fn() }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, name: 'Founder' }, session: { roles: ['founder'], activeRole: 'founder' } }) }));

function renderReadiness(businessId = 4) {
  return render(
    <MemoryRouter initialEntries={[`/app/founder/readiness?businessId=${businessId}`]}>
      <Routes>
        <Route path="/app/founder/readiness" element={<ReadinessScore />} />
      </Routes>
    </MemoryRouter>
  );
}

const mockBusiness = { id: 4, name: 'Shaymoli Paribahan', status: 'published', description: 'Transport service' };

const completedAssessment = {
  id: 10,
  business_id: 4,
  version: 1,
  overall_score: 85.0,
  is_incomplete: false,
  evaluated_at: '2026-09-24T00:00:00Z',
  factor_results: {
    market_potential: { name: 'Market Potential', score: 85, weight: 15, is_weak: false, is_incomplete: false, suggestions: [] },
    business_model_clarity: { name: 'Business Model Clarity', score: 85, weight: 15, is_weak: false, is_incomplete: false, suggestions: [] },
  },
  suggestions: [],
  basis: 'Automated evaluation',
};

const incompleteAssessment = {
  ...completedAssessment,
  is_incomplete: true,
  overall_score: 45,
};

const mockInputs = {
  id: 1,
  business_id: 4,
  version: 1,
  schema_version: '1',
  answers: {
    market_customer_segment_identified: true,
    market_demand_evidence_sources: ['founder_observation'],
    business_model_revenue_methods: ['product_sales'],
    business_model_cost_categories_identified: true,
    competition_review_status: 'reviewed_alternatives_found',
    competition_differentiation_status: 'founder_defined',
    scalability_delivery_process_status: 'defined_not_tried',
    scalability_capacity_review_status: 'constraints_identified',
    founder_relevant_execution_experience: true,
    founder_capability_gap_status: 'reviewed_no_gaps_identified',
    funding_estimate_basis: 'itemized_cost_estimate',
    funding_use_plan_status: 'uses_identified',
    risk_review_status: 'reviewed_risks_identified',
    risk_response_status: 'responses_planned',
    customer_validation_methods: ['concept_feedback'],
    customer_validation_findings: 'mainly_supportive',
  },
  created_at: '2026-09-24T00:00:00Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.businesses, 'get').mockResolvedValue(mockBusiness);
  vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
  vi.spyOn(api.readiness, 'listAssessments').mockResolvedValue([]);
  vi.spyOn(api.readiness, 'getLatestInputs').mockResolvedValue(null);
  vi.spyOn(api.readiness, 'saveInputs').mockResolvedValue(mockInputs);
  vi.spyOn(api.readiness, 'createAssessment').mockResolvedValue(completedAssessment as any);
  vi.spyOn(api.readinessInsights, 'latest').mockResolvedValue({
    data: null,
    meta: {
      generation_enabled: true,
      provider_status: 'configured',
      remote_health: 'not_checked',
      eligible: false,
      eligibility_reasons: ['ASSESSMENT_MISSING'],
      current_version: null,
    },
  });
});

describe('Readiness Input Workflow and Status', () => {
  it('1. Displays "Not Assessed" and no fake 0/100 score when no assessment exists', async () => {
    renderReadiness();
    expect(await screen.findByText('No Readiness Assessment Evaluated Yet')).toBeTruthy();
    expect(screen.getByText('Not Assessed', { selector: 'span' })).toBeTruthy();
    expect(screen.queryByText('/ 100')).toBeNull();
    expect(screen.getByText('Complete Readiness Questionnaire')).toBeTruthy();
  });

  it('2. Opens questionnaire modal with all 16 canonical question groups when clicking Complete Questionnaire', async () => {
    renderReadiness();
    const btn = await screen.findByRole('button', { name: 'Complete Readiness Questionnaire' });
    fireEvent.click(btn);

    expect(await screen.findByText('Readiness Assessment Questionnaire')).toBeTruthy();
    expect(screen.getByText('1. Market Potential')).toBeTruthy();
    expect(screen.getByText('2. Business Model Clarity')).toBeTruthy();
    expect(screen.getByText('3. Competition')).toBeTruthy();
    expect(screen.getByText('4. Scalability')).toBeTruthy();
    expect(screen.getByText('5. Founder Capability')).toBeTruthy();
    expect(screen.getByText('6. Funding Requirement Realism')).toBeTruthy();
    expect(screen.getByText('7. Risk Management')).toBeTruthy();
    expect(screen.getByText('8. Customer Validation')).toBeTruthy();
  });

  it('3. Successfully submits questionnaire answers via api.readiness.saveInputs', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(
      <ReadinessInputModal
        businessId={4}
        initialAnswers={null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    // Answer Yes to customer segment
    const radioYes = screen.getAllByLabelText('Yes')[0];
    fireEvent.click(radioYes);

    // Toggle a revenue method
    const revenueCheck = screen.getByLabelText('Direct product sales');
    fireEvent.click(revenueCheck);

    const submitBtn = screen.getByRole('button', { name: 'Save & Evaluate Assessment' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.readiness.saveInputs).toHaveBeenCalledWith(4, expect.objectContaining({
        market_customer_segment_identified: true,
        business_model_revenue_methods: ['product_sales'],
      }));
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('4. Prepopulates existing inputs when available (revision flow)', async () => {
    vi.mocked(api.readiness.getLatestInputs).mockResolvedValue(mockInputs);
    vi.mocked(api.readiness.getLatestAssessment).mockResolvedValue(completedAssessment as any);

    renderReadiness();
    const editBtn = await screen.findByRole('button', { name: 'Edit Questionnaire' });
    fireEvent.click(editBtn);

    expect(await screen.findByText('Readiness Assessment Questionnaire')).toBeTruthy();
    // Verify prefilled value: Direct product sales checkbox is checked
    const revenueCheck = screen.getByLabelText('Direct product sales') as HTMLInputElement;
    expect(revenueCheck.checked).toBe(true);
  });

  it('5. Displays "Incomplete Inputs" status when assessment is marked is_incomplete', async () => {
    vi.mocked(api.readiness.getLatestAssessment).mockResolvedValue(incompleteAssessment as any);
    renderReadiness();

    expect(await screen.findByText('Incomplete Inputs', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText('Some readiness inputs are incomplete')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('6. Displays "Complete" status and calculated score when completed assessment exists', async () => {
    vi.mocked(api.readiness.getLatestAssessment).mockResolvedValue(completedAssessment as any);
    renderReadiness();

    expect(await screen.findByText('Complete', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText('85')).toBeTruthy();
    expect(screen.getByText('Investor-Ready')).toBeTruthy();
  });

  it('7. Recalculate Assessment button invokes createAssessment', async () => {
    vi.mocked(api.readiness.getLatestAssessment).mockResolvedValue(completedAssessment as any);
    renderReadiness();

    const recalcBtn = await screen.findByRole('button', { name: 'Recalculate Assessment' });
    fireEvent.click(recalcBtn);

    await waitFor(() => {
      expect(api.readiness.createAssessment).toHaveBeenCalledWith(4);
    });
  });
});
