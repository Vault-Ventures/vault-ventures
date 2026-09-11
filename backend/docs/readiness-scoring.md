# Phase 3 — Part 2 — Readiness Scoring Engine

Implements the owner-approved Readiness Scoring Contract Version 1 and assessment integration decisions. Master Specification v1.1 §§8, 10, 23, 24 and 25.1 support deterministic explainable readiness; exact weights, mappings, fallback values, thresholds and templates below are approved implementation decisions, not specification-defined values.

## Financial convention

All monetary values throughout Vault Ventures use Bangladeshi Taka (BDT/৳) exclusively. Scoring reads the existing BusinessRequirement.funding_amount DECIMAL(15,2) as an exact decimal string or null. It stores that exact value in the immutable source snapshot with currency BDT. No amount magnitude, conversion, thresholds or new monetary questionnaire fields are introduced.

## Rubric 1 / input schema 1

All eight factors have weight **12.5%**, totaling exactly 100%. Each complete factor averages its two answer contributions. Lists use the maximum selected contribution, never a sum. The approved sixteen questions and validation remain in [readiness-foundation.md](readiness-foundation.md).

| Factor | Input | Answer contribution (0–100) |
| --- | --- | --- |
| Market Potential | `market_customer_segment_identified` | `false`: 0; `true`: 100 |
| Market Potential | `market_demand_evidence_sources` | `not_investigated`: 0; `founder_observation`: 25; `published_research`: 50; `customer_conversations`: 75; `survey_results`: 75; `observed_customer_behavior`: 100 |
| Business Model Clarity | `business_model_revenue_methods` | `not_defined`: 0; `product_sales`: 100; `service_fees`: 100; `subscriptions`: 100; `transaction_commissions`: 100; `licensing`: 100; `advertising`: 100; `other`: 100 |
| Business Model Clarity | `business_model_cost_categories_identified` | `false`: 0; `true`: 100 |
| Competition | `competition_review_status` | `not_reviewed`: 0; `reviewed_alternatives_found`: 100; `reviewed_none_identified`: 100 |
| Competition | `competition_differentiation_status` | `not_defined`: 0; `founder_defined`: 50; `discussed_with_target_customers`: 100 |
| Scalability | `scalability_delivery_process_status` | `not_defined`: 0; `defined_not_tried`: 50; `tried_in_practice`: 100 |
| Scalability | `scalability_capacity_review_status` | `not_reviewed`: 0; `constraints_identified`: 50; `constraints_and_response_plan_identified`: 100 |
| Founder Capability | `founder_relevant_execution_experience` | `false`: 0; `true`: 100 |
| Founder Capability | `founder_capability_gap_status` | `not_reviewed`: 0; `reviewed_no_gaps_identified`: 50; `gaps_identified_without_plan`: 25; `gaps_identified_with_plan`: 100 |
| Funding Requirement Realism | `funding_estimate_basis` | `not_prepared`: 0; `founder_estimate`: 25; `itemized_cost_estimate`: 75; `supplier_quotes_or_prior_actual_costs`: 100; `no_external_funding_planned`: 50 |
| Funding Requirement Realism | `funding_use_plan_status` | `not_defined`: 0; `uses_identified`: 50; `uses_and_timing_identified`: 100; `no_external_funding_planned`: 50 |
| Risk | `risk_review_status` | `not_reviewed`: 0; `reviewed_risks_identified`: 100; `reviewed_no_material_risks_identified`: 50 |
| Risk | `risk_response_status` | `not_prepared`: 0; `responses_planned`: 75; `responses_tried`: 100; `no_risks_identified`: 50 |
| Customer Validation | `customer_validation_methods` | `not_started`: 0; `concept_feedback`: 25; `prototype_testing`: 50; `pilot_usage`: 75; `paid_usage`: 100 |
| Customer Validation | `customer_validation_findings` | `not_collected`: 0; `insufficient_to_conclude`: 25; `mainly_supportive`: 100; `mixed`: 50; `mainly_unsupportive`: 25 |

The two no_external_funding_planned entries are a paired special case, not independent ordinary contributions.

## Missing answers and funding overrides

Missing means omitted or null; false and negative options are valid answers. If either required answer is missing, the entire factor is 0 and incomplete. Preserve the available answer contribution for explanation, record missing keys, and do not average it alone or redistribute weights.

Funding rules:
- Ordinary answers with funding_amount null: factor 0, incomplete, missing key business_requirement.funding_amount and reason MISSING_FUNDING_AMOUNT.
- Ordinary answers with zero or positive BDT amount: ordinary scoring, independent of magnitude.
- Both answers no_external_funding_planned with null or zero funding: factor 50, complete, reason NO_EXTERNAL_FUNDING_PLANNED.
- That saved pair with later positive funding: factor 0, incomplete, reason FUNDING_DEPENDENCY_CONFLICT. Historical input answers are not rewritten.
- Missing questionnaire answers record MISSING_REQUIRED_INPUT. Existing input consistency checks remain unchanged.

## Exact arithmetic and weak areas

Let H for each factor be the sum of its two integer contributions (twice its factor score), or the approved override (0 for incomplete/conflict; 100 for no external funding).

Factor score = H / 2. Weighted contribution = H / 16.
Overall = sum(H) / 16, rounded half-up to two decimal places only at the final step.
Implementation computes overall cents as intdiv(sum(H) * 100 + 8, 16).
No binary floating-point calculation is used. Score strings have two decimal places; weighted contribution strings have four.

Weak means unrounded factor score <60 or incomplete. is_weak and is_incomplete remain separate; a complete no-external-funding factor is weak at 50. No readiness bands or investment classifications.

Worked examples (factor order as above):
- [75, 100, 75, 50, 100, 37.5, 87.5, 50] → 71.88.
- Same, with scalability incomplete/0 → 65.63.
- First example with no-external-funding factor 50 → 73.44.
- All answers missing → 0.00, all eight factors incomplete/weak.
- All ordinary contributions 100 and a supplied BDT amount → 100.00.

## Fixed suggestions

Emit suggestions only for weak factors. Within factor/input order, emit missing-answer guidance, any funding special guidance, then guidance for supplied contributions below 60. Deduplicate by stable ID, preserving first insertion order. Missing templates are: "Provide an answer for: {approved question without question mark}."

The following mapping is the frozen rubric-1 template inventory. A wildcard means the field's applicable low answer; high contributions never trigger it.

| Input | Low answer condition | Stable ID | Exact text |
| --- | --- | --- | --- |
| `market_customer_segment_identified` | `false` | `market.segment` | Identify a specific customer segment for this business. |
| `market_demand_evidence_sources` | `*` | `market.demand` | Investigate demand directly with target customers and record the method used. |
| `business_model_revenue_methods` | `*` | `model.revenue` | Identify how the business intends to earn revenue. |
| `business_model_cost_categories_identified` | `false` | `model.costs` | Identify the main categories of operating costs. |
| `competition_review_status` | `not_reviewed` | `competition.review` | Investigate competing solutions and alternative ways customers address the problem. |
| `competition_differentiation_status` | `not_defined` | `competition.define` | Define why target customers would choose this business. |
| `competition_differentiation_status` | `founder_defined` | `competition.test` | Discuss the proposed differentiation with target customers. |
| `scalability_delivery_process_status` | `not_defined` | `scalability.define` | Define a repeatable process for delivering the product or service. |
| `scalability_delivery_process_status` | `defined_not_tried` | `scalability.try` | Try the defined delivery process in practice and review the result. |
| `scalability_capacity_review_status` | `not_reviewed` | `scalability.review` | Review what could constrain delivery as demand increases. |
| `scalability_capacity_review_status` | `constraints_identified` | `scalability.respond` | Identify how the business would respond to the capacity constraints found. |
| `founder_relevant_execution_experience` | `false` | `founder.experience` | Identify practical ways to gain relevant execution experience for this business. |
| `founder_capability_gap_status` | `not_reviewed` | `founder.review` | Review the capabilities needed to execute the business. |
| `founder_capability_gap_status` | `gaps_identified_without_plan` | `founder.plan` | Define how the identified capability gaps will be addressed. |
| `founder_capability_gap_status` | `reviewed_no_gaps_identified` | `founder.recheck` | Recheck the capability requirements against the planned delivery work. |
| `funding_estimate_basis` | `not_prepared` | `funding.estimate` | Support the BDT funding estimate with itemized costs, supplier quotes, or prior actual costs. |
| `funding_estimate_basis` | `founder_estimate` | `funding.estimate` | Support the BDT funding estimate with itemized costs, supplier quotes, or prior actual costs. |
| `funding_use_plan_status` | `not_defined` | `funding.uses` | Identify how the requested BDT funding would be used. |
| `funding_use_plan_status` | `uses_identified` | `funding.timing` | Identify the timing of the proposed funding uses. |
| `risk_review_status` | `not_reviewed` | `risk.review` | Review the main risks that could prevent the business from meeting its objectives. |
| `risk_review_status` | `reviewed_no_material_risks_identified` | `risk.revisit` | Revisit the risk review and test the assumptions behind identifying no material risks. |
| `risk_response_status` | `not_prepared` | `risk.prepare` | Prepare responses for the risks identified. |
| `risk_response_status` | `no_risks_identified` | `risk.revisit` | Revisit the risk review and test the assumptions behind identifying no material risks. |
| `customer_validation_methods` | `not_started` | `customer.begin` | Begin evaluating the proposed solution with target customers. |
| `customer_validation_methods` | `*` | `customer.next` | Use what you learned to plan the next practical customer-validation activity. |
| `customer_validation_findings` | `not_collected` | `customer.record` | Record the findings from the customer-validation activity. |
| `customer_validation_findings` | `insufficient_to_conclude` | `customer.gather` | Gather enough additional customer feedback to clarify the findings. |
| `customer_validation_findings` | `mixed` | `customer.mixed` | Investigate the reasons for mixed customer feedback and test the revised assumptions. |
| `customer_validation_findings` | `mainly_unsupportive` | `customer.revise` | Review the concerns raised by customers and test a revised solution or assumption. |

Funding special templates:
- funding.missing: "Record the funding requirement in BDT (৳), or explicitly state that no external funding is planned."
- funding.none: "No external funding is currently planned. If that changes, update the BDT funding amount and its estimate and use plans."
- funding.conflict: "Reconcile the positive BDT funding amount with the answers stating that no external funding is planned."

No AI-generated text, ML, NLP, datasets or probabilistic scoring.

## API and authorization

Base: /api/me/businesses/{business}/readiness-assessments

| Method / suffix | Result |
| --- | --- |
| GET base | All historical assessments, descending version, each with freshness |
| GET /latest | Highest historical version and freshness; data:null if none |
| GET /{version} | Owned business-local version, 404 if absent |
| POST base | No client payload. 201 for a new assessment, 200 for a reused matching snapshot |

POST returns structured 422 when not submitted, no input revision exists, an input schema is unsupported, or any client field is supplied. Existing API success/error envelopes, Founder ownership, Sanctum, SPA-session and CSRF apply. No Founder role: 403; cross-owner: 404; unauthenticated: 401; missing/invalid CSRF: 419. No admin bypass or new admin API. No update/delete endpoints.

Response exposes version, input revision/schema, rubric version, source snapshot/fingerprint, per-answer contributions, factor scores/weights/reasons/missing keys, overall score, weak areas, fixed suggestions, incomplete flag, arithmetic explanation, UTC timestamps and freshness. The basis statement identifies founder-reported rule-based assessment, not independent verification or a prediction of returns.

## Versioning and freshness

The additive readiness_assessments table records all results immutably. Business owns many assessments; each references the exact input revision. Unique business/version and business/source_fingerprint constraints prevent duplicate versions/results. The approved supporting unique (business_id,id) index on readiness_input_versions enables the composite foreign key enforcing same-business input ownership. No existing input/business rows are changed.

The server assigns the next business-local version under a Business row lock, followed by locked requirements/input/fingerprint reads. Identical current dependency fingerprints reuse an existing record. Fingerprint is SHA-256 of the ordered server-created snapshot:
business ID, submitted status, input row ID/revision/schema, rubric version, exact funding string/null, currency BDT.

Freshness reasons include BUSINESS_NOT_SUBMITTED, INPUT_REVISION_CHANGED, INPUT_SCHEMA_CHANGED, FUNDING_AMOUNT_CHANGED and RUBRIC_CHANGED. No fresh flag is persisted or trusted from a client. Schema compatibility is checked before scoring; a future rubric requires an explicit version change. No client-selected rubric or automatic schema conversion.

**Latest versus current:** /latest always means highest historical version. If funding changes A → B → A without a new input revision, POST reuses the earlier A assessment with is_current:true; /latest may still show B with is_current:false. History also exposes the current A record. Clients must use freshness.is_current, never infer freshness from maximum version. No new endpoint, history rewrite or GET calculation is needed.

## Automatic recalculation and failures

Readiness-input revisions, actual BDT funding changes (including null ↔ zero), and first eligible submission schedule synchronous recalculation after the source transaction commits. Unchanged funding, repeated submission and unrelated business/requirements/profile/document changes do not trigger scoring.

Failure preserves the committed source and its normal success response, logs business ID and exception class without questionnaire contents, leaves old results stale, and permits retry via POST. No queue. Rolled-back source transactions discard callbacks. Assessment inserts run in a separate transaction; failure does not consume a version or overwrite prior results.

## Known limitations and scope boundary

- Assessments use self-reported structured answers, not document analysis or independent verification.
- Application/model guards protect history; privileged direct SQL can bypass model immutability.
- Freshness represents the dependencies read for that response; another committed edit can immediately supersede a response.
- History is unpaginated at this foundation stage.
- Two-worker contention, lock ordering and SQL constraints are tested; this is not a production load benchmark.
- Rubric/schema deployment changes invalidate through version comparison; no deployment-wide backfill or background job.
- No frontend, authentication, questionnaire changes, scoring redesign, publication, matching, transactions or Phase 3 Part 3.

## Verification

Focused tests: 20 passed / 421 assertions. Full regression: 257 passed / 2,024 assertions, PHP 8.3.33. Assessment migration applied to both databases (main batch 7; test batch 1). Existing main records and prior migration entries unchanged. See the [Phase 3 Part 2 completion entry](../../IMPLEMENTATION_LOG.md) for commands and exact changed-file inventory.
