import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { IconX, IconAlertTriangle } from '../layout/Icons';
import { api, ApiError, ReadinessInputData } from '../../services/api';

export interface ReadinessFormAnswers {
  market_customer_segment_identified?: boolean | null;
  market_demand_evidence_sources?: string[] | null;
  business_model_revenue_methods?: string[] | null;
  business_model_cost_categories_identified?: boolean | null;
  competition_review_status?: string | null;
  competition_differentiation_status?: string | null;
  scalability_delivery_process_status?: string | null;
  scalability_capacity_review_status?: string | null;
  founder_relevant_execution_experience?: boolean | null;
  founder_capability_gap_status?: string | null;
  funding_estimate_basis?: string | null;
  funding_use_plan_status?: string | null;
  risk_review_status?: string | null;
  risk_response_status?: string | null;
  customer_validation_methods?: string[] | null;
  customer_validation_findings?: string | null;
}

interface Props {
  businessId: number | string;
  initialAnswers?: ReadinessFormAnswers | null;
  onClose: () => void;
  onSaved: (input: ReadinessInputData) => void;
}

export default function ReadinessInputModal({ businessId, initialAnswers, onClose, onSaved }: Props) {
  const [answers, setAnswers] = useState<ReadinessFormAnswers>(() => ({
    market_customer_segment_identified: initialAnswers?.market_customer_segment_identified ?? null,
    market_demand_evidence_sources: initialAnswers?.market_demand_evidence_sources ?? [],
    business_model_revenue_methods: initialAnswers?.business_model_revenue_methods ?? [],
    business_model_cost_categories_identified: initialAnswers?.business_model_cost_categories_identified ?? null,
    competition_review_status: initialAnswers?.competition_review_status ?? null,
    competition_differentiation_status: initialAnswers?.competition_differentiation_status ?? null,
    scalability_delivery_process_status: initialAnswers?.scalability_delivery_process_status ?? null,
    scalability_capacity_review_status: initialAnswers?.scalability_capacity_review_status ?? null,
    founder_relevant_execution_experience: initialAnswers?.founder_relevant_execution_experience ?? null,
    founder_capability_gap_status: initialAnswers?.founder_capability_gap_status ?? null,
    funding_estimate_basis: initialAnswers?.funding_estimate_basis ?? null,
    funding_use_plan_status: initialAnswers?.funding_use_plan_status ?? null,
    risk_review_status: initialAnswers?.risk_review_status ?? null,
    risk_response_status: initialAnswers?.risk_response_status ?? null,
    customer_validation_methods: initialAnswers?.customer_validation_methods ?? [],
    customer_validation_findings: initialAnswers?.customer_validation_findings ?? null,
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBoolean(key: 'market_customer_segment_identified' | 'business_model_cost_categories_identified' | 'founder_relevant_execution_experience', value: boolean) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function handleListToggle(key: 'market_demand_evidence_sources' | 'business_model_revenue_methods' | 'customer_validation_methods', value: string, exclusiveVal: string) {
    setAnswers(prev => {
      const current = prev[key] ?? [];
      if (value === exclusiveVal) {
        return {
          ...prev,
          [key]: current.includes(exclusiveVal) ? [] : [exclusiveVal],
          ...(key === 'customer_validation_methods' && !current.includes(exclusiveVal) ? { customer_validation_findings: 'not_collected' } : {})
        };
      }
      const withoutExclusive = current.filter(item => item !== exclusiveVal);
      const next = withoutExclusive.includes(value)
        ? withoutExclusive.filter(item => item !== value)
        : [...withoutExclusive, value];
      return { ...prev, [key]: next };
    });
  }

  function handleEnum(key: keyof ReadinessFormAnswers, value: string) {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      // Cross-field logic
      if (key === 'funding_estimate_basis' && value === 'no_external_funding_planned') {
        next.funding_use_plan_status = 'no_external_funding_planned';
      } else if (key === 'funding_use_plan_status' && value === 'no_external_funding_planned') {
        next.funding_estimate_basis = 'no_external_funding_planned';
      } else if (key === 'risk_review_status' && value === 'reviewed_no_material_risks_identified') {
        next.risk_response_status = 'no_risks_identified';
      } else if (key === 'risk_response_status' && value === 'no_risks_identified') {
        next.risk_review_status = 'reviewed_no_material_risks_identified';
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Prepare payload preserving types and omitting empty arrays as null if preferred or formatted clean
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (Array.isArray(v)) {
        payload[k] = v.length > 0 ? v : null;
      } else {
        payload[k] = v;
      }
    }

    try {
      const res = await api.readiness.saveInputs(businessId, payload);
      onSaved(res);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        const first = Object.values(err.details).flat()[0];
        setError(first as string || err.message);
      } else {
        setError(err.message || 'Failed to save readiness inputs.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121A2B] border border-[color:var(--vv-border)] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[color:var(--vv-border)] bg-[#101726]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[color:var(--vv-text)]">
              Readiness Assessment Questionnaire
            </h2>
            <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-0.5">
              Self-reported inputs for automated, rule-based readiness evaluation.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] p-1 rounded-lg transition-colors"
          >
            <IconX s={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs">
              <IconAlertTriangle s={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Section 1: Market Potential */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              1. Market Potential
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you identified a specific customer segment for this business?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="market_customer_segment_identified"
                    checked={answers.market_customer_segment_identified === true}
                    onChange={() => handleBoolean('market_customer_segment_identified', true)}
                    className="accent-[#C67A4E]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="market_customer_segment_identified"
                    checked={answers.market_customer_segment_identified === false}
                    onChange={() => handleBoolean('market_customer_segment_identified', false)}
                    className="accent-[#C67A4E]"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Which sources have you used to investigate demand? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  ['not_investigated', 'Not investigated yet'],
                  ['founder_observation', 'Founder observation'],
                  ['published_research', 'Published industry research'],
                  ['customer_conversations', 'Customer conversations'],
                  ['survey_results', 'Survey results'],
                  ['observed_customer_behavior', 'Observed customer behavior'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.market_demand_evidence_sources?.includes(val) ?? false}
                      onChange={() => handleListToggle('market_demand_evidence_sources', val, 'not_investigated')}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Business Model Clarity */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              2. Business Model Clarity
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                How does the business intend to earn revenue? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  ['not_defined', 'Not defined yet'],
                  ['product_sales', 'Direct product sales'],
                  ['service_fees', 'Service fees'],
                  ['subscriptions', 'Subscription fees'],
                  ['transaction_commissions', 'Transaction commissions'],
                  ['licensing', 'Licensing'],
                  ['advertising', 'Advertising'],
                  ['other', 'Other revenue stream'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.business_model_revenue_methods?.includes(val) ?? false}
                      onChange={() => handleListToggle('business_model_revenue_methods', val, 'not_defined')}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you identified the main categories of costs needed to operate this business?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="business_model_cost_categories_identified"
                    checked={answers.business_model_cost_categories_identified === true}
                    onChange={() => handleBoolean('business_model_cost_categories_identified', true)}
                    className="accent-[#C67A4E]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="business_model_cost_categories_identified"
                    checked={answers.business_model_cost_categories_identified === false}
                    onChange={() => handleBoolean('business_model_cost_categories_identified', false)}
                    className="accent-[#C67A4E]"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Competition */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              3. Competition
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you investigated competing products, services, or alternative ways customers solve this problem?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_reviewed', 'Not reviewed yet'],
                  ['reviewed_alternatives_found', 'Reviewed and alternatives / competitors identified'],
                  ['reviewed_none_identified', 'Reviewed and no direct alternatives identified'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="competition_review_status"
                      checked={answers.competition_review_status === val}
                      onChange={() => handleEnum('competition_review_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                What is the status of your explanation of why customers would choose this business?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_defined', 'Not defined yet'],
                  ['founder_defined', 'Defined internally by founder'],
                  ['discussed_with_target_customers', 'Discussed and validated with target customers'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="competition_differentiation_status"
                      checked={answers.competition_differentiation_status === val}
                      onChange={() => handleEnum('competition_differentiation_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Scalability */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              4. Scalability
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                How developed is the process for repeatedly delivering the product or service?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_defined', 'Not defined yet'],
                  ['defined_not_tried', 'Process defined but not tested in practice'],
                  ['tried_in_practice', 'Process tested and proven in practice'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="scalability_delivery_process_status"
                      checked={answers.scalability_delivery_process_status === val}
                      onChange={() => handleEnum('scalability_delivery_process_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you reviewed what would constrain delivery if customer demand increased?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_reviewed', 'Not reviewed yet'],
                  ['constraints_identified', 'Delivery constraints identified'],
                  ['constraints_and_response_plan_identified', 'Delivery constraints and scaling response plan identified'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="scalability_capacity_review_status"
                      checked={answers.scalability_capacity_review_status === val}
                      onChange={() => handleEnum('scalability_capacity_review_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Founder Capability */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              5. Founder Capability
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you previously carried out work relevant to delivering this business’s product or service?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="founder_relevant_execution_experience"
                    checked={answers.founder_relevant_execution_experience === true}
                    onChange={() => handleBoolean('founder_relevant_execution_experience', true)}
                    className="accent-[#C67A4E]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-xs text-[color:var(--vv-text-secondary)] cursor-pointer">
                  <input
                    type="radio"
                    name="founder_relevant_execution_experience"
                    checked={answers.founder_relevant_execution_experience === false}
                    onChange={() => handleBoolean('founder_relevant_execution_experience', false)}
                    className="accent-[#C67A4E]"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you reviewed the capabilities needed to execute this business and how any gaps will be addressed?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_reviewed', 'Not reviewed yet'],
                  ['reviewed_no_gaps_identified', 'Reviewed and no material execution gaps identified'],
                  ['gaps_identified_without_plan', 'Execution gaps identified (no action plan yet)'],
                  ['gaps_identified_with_plan', 'Execution gaps identified with a concrete recruitment / training plan'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="founder_capability_gap_status"
                      checked={answers.founder_capability_gap_status === val}
                      onChange={() => handleEnum('founder_capability_gap_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Funding Requirement Realism */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              6. Funding Requirement Realism
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                What supports the funding amount currently recorded for this business?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_prepared', 'Not prepared / rough guess'],
                  ['founder_estimate', 'Founder estimate based on general experience'],
                  ['itemized_cost_estimate', 'Itemized cost estimate spreadsheet'],
                  ['supplier_quotes_or_prior_actual_costs', 'Formal supplier quotes or prior verified actual costs'],
                  ['no_external_funding_planned', 'No external funding planned (self-funded / bootstrapped)'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="funding_estimate_basis"
                      checked={answers.funding_estimate_basis === val}
                      onChange={() => handleEnum('funding_estimate_basis', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you identified how the requested funding would be used?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_defined', 'Not defined yet'],
                  ['uses_identified', 'Primary use categories identified'],
                  ['uses_and_timing_identified', 'Detailed use categories and milestone timing identified'],
                  ['no_external_funding_planned', 'No external funding planned'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="funding_use_plan_status"
                      checked={answers.funding_use_plan_status === val}
                      onChange={() => handleEnum('funding_use_plan_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 7: Risk Management */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              7. Risk Management
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                Have you reviewed the main risks that could prevent this business from operating or meeting its objectives?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_reviewed', 'Not reviewed yet'],
                  ['reviewed_risks_identified', 'Reviewed and operational/market risks identified'],
                  ['reviewed_no_material_risks_identified', 'Reviewed and no material risks identified'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="risk_review_status"
                      checked={answers.risk_review_status === val}
                      onChange={() => handleEnum('risk_review_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                What is the status of your response plans for the risks identified?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_prepared', 'Not prepared / no action planned'],
                  ['responses_planned', 'Mitigation responses planned'],
                  ['responses_tried', 'Mitigation responses tested and operational'],
                  ['no_risks_identified', 'No risks identified'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="risk_response_status"
                      checked={answers.risk_response_status === val}
                      onChange={() => handleEnum('risk_response_status', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 8: Customer Validation */}
          <div className="space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_60%,transparent)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C67A4E]">
              8. Customer Validation
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                How have target customers interacted with or evaluated the proposed solution? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  ['not_started', 'Not started yet'],
                  ['concept_feedback', 'Concept feedback discussions'],
                  ['prototype_testing', 'Prototype / demo testing'],
                  ['pilot_usage', 'Pilot / trial usage'],
                  ['paid_usage', 'Paid usage / pre-orders'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.customer_validation_methods?.includes(val) ?? false}
                      onChange={() => handleListToggle('customer_validation_methods', val, 'not_started')}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[color:var(--vv-border)]">
              <label className="text-xs font-medium text-[color:var(--vv-text)] block">
                What do the customer validation findings currently indicate?
              </label>
              <div className="space-y-1 text-xs">
                {[
                  ['not_collected', 'Not collected yet'],
                  ['insufficient_to_conclude', 'Data collected but insufficient to conclude'],
                  ['mainly_supportive', 'Mainly supportive feedback and interest'],
                  ['mixed', 'Mixed feedback with notable concerns'],
                  ['mainly_unsupportive', 'Mainly unsupportive feedback'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[color:var(--vv-text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="customer_validation_findings"
                      checked={answers.customer_validation_findings === val}
                      onChange={() => handleEnum('customer_validation_findings', val)}
                      className="accent-[#C67A4E]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[color:var(--vv-border)]">
            <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              {saving ? 'Saving Inputs...' : 'Save & Evaluate Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
