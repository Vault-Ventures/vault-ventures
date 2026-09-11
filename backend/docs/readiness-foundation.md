# Phase 3 — Part 1 — Readiness Input & Assessment Foundation

Historical Part 1 scope is recorded below. Phase 3 Part 2 now extends it with the approved deterministic assessment implementation; see [readiness-scoring.md](readiness-scoring.md). Statements below that Part 2 has not started describe the earlier Part 1 stopping point.

## Scope and financial convention

Completed 2026-09-10. Implements input persistence only. No scoring, weights, formulas, thresholds, AI logic, assessment records, or Phase 3 Part 2 implementation.

Master Specification §§8, 10, 23, 24, 25.1 and 33 support the eight factors, structured founder inputs, and future versioned assessments. The exact questionnaire, input versioning/API, validation and incomplete-save rules are owner-approved implementation decisions, not questions defined by the specification.

> All monetary values used anywhere in Vault Ventures, including funding amounts, investment amounts, proposed terms, financial reports, milestone funding, and any readiness-related financial inputs, must use Bangladeshi Taka (BDT/৳). USD or any other currency must not be used.

Readiness creates no new amount or currency field. BusinessRequirement.funding_amount is the existing BDT (৳) DECIMAL(15,2) value, read as an exact decimal string for validation. No conversion or classification occurs. Proposed-term text elsewhere remains subject to the same BDT convention; this Part does not implement text parsing.

## Approved input contract — schema version 1

Every answer is founder-provided and self-reported, not verified. All questions describe the eventual complete input set, but incomplete saves are allowed and do not gate business submission. Missing means omitted or explicit null. False and explicit negative/not-started answers remain answers. There are no numeric questionnaire fields: numeric 0/1 must not masquerade as JSON booleans.

| Factor (specification-supported) | Field (approved implementation decision) | Exact question | Type/options |
| --- | --- | --- | --- |
| Market Potential | `market_customer_segment_identified` | Have you identified a specific customer segment for this business? | Strict JSON boolean |
| Market Potential | `market_demand_evidence_sources` | Which sources have you used to investigate demand? | Unique nonempty list: `not_investigated`, `founder_observation`, `published_research`, `customer_conversations`, `survey_results`, `observed_customer_behavior` |
| Business Model Clarity | `business_model_revenue_methods` | How does the business intend to earn revenue? | Unique nonempty list: `not_defined`, `product_sales`, `service_fees`, `subscriptions`, `transaction_commissions`, `licensing`, `advertising`, `other` |
| Business Model Clarity | `business_model_cost_categories_identified` | Have you identified the main categories of costs needed to operate this business? | Strict JSON boolean |
| Competition | `competition_review_status` | Have you investigated competing products, services, or alternative ways customers solve this problem? | Enum: `not_reviewed`, `reviewed_alternatives_found`, `reviewed_none_identified` |
| Competition | `competition_differentiation_status` | What is the current status of your explanation of why customers would choose this business? | Enum: `not_defined`, `founder_defined`, `discussed_with_target_customers` |
| Scalability | `scalability_delivery_process_status` | How developed is the process for repeatedly delivering the product or service? | Enum: `not_defined`, `defined_not_tried`, `tried_in_practice` |
| Scalability | `scalability_capacity_review_status` | Have you reviewed what would constrain delivery if customer demand increased? | Enum: `not_reviewed`, `constraints_identified`, `constraints_and_response_plan_identified` |
| Founder Capability | `founder_relevant_execution_experience` | Have you previously carried out work relevant to delivering this business’s product or service? | Strict JSON boolean |
| Founder Capability | `founder_capability_gap_status` | Have you reviewed the capabilities needed to execute this business and how any gaps will be addressed? | Enum: `not_reviewed`, `reviewed_no_gaps_identified`, `gaps_identified_without_plan`, `gaps_identified_with_plan` |
| Funding Requirement Realism | `funding_estimate_basis` | What supports the funding amount currently recorded for this business? | Enum: `not_prepared`, `founder_estimate`, `itemized_cost_estimate`, `supplier_quotes_or_prior_actual_costs`, `no_external_funding_planned` |
| Funding Requirement Realism | `funding_use_plan_status` | Have you identified how the requested funding would be used? | Enum: `not_defined`, `uses_identified`, `uses_and_timing_identified`, `no_external_funding_planned` |
| Risk | `risk_review_status` | Have you reviewed the main risks that could prevent this business from operating or meeting its objectives? | Enum: `not_reviewed`, `reviewed_risks_identified`, `reviewed_no_material_risks_identified` |
| Risk | `risk_response_status` | What is the status of your response plans for the risks identified? | Enum: `not_prepared`, `responses_planned`, `responses_tried`, `no_risks_identified` |
| Customer Validation | `customer_validation_methods` | How have target customers interacted with or evaluated the proposed solution? | Unique nonempty list: `not_started`, `concept_feedback`, `prototype_testing`, `pilot_usage`, `paid_usage` |
| Customer Validation | `customer_validation_findings` | What do the customer-validation findings currently indicate? | Enum: `not_collected`, `insufficient_to_conclude`, `mainly_supportive`, `mixed`, `mainly_unsupportive` |

Validation:
- Only these 16 answer keys; no nested questionnaire objects or unknown keys.
- Enums match the allowed options exactly; no free-text alternatives.
- Boolean answers must be actual true/false, not strings or 0/1.
- Arrays must be nonempty lists with unique permitted values; explicit null remains missing. not_investigated, not_defined and not_started are exclusive selections within their respective lists.
- JSON answers preserve their original values before validation; blank strings are rejected rather than silently becoming null.
- Null is permitted for every answer. No default answers, factor completeness calculation, percentages, or fallback scores.

Cross-field rules:
- If either funding answer is no_external_funding_planned, both must be supplied with that value, and the existing BDT funding amount must be null or zero. A missing counterpart is rejected for this pair. Other funding answers do not require an amount.
- When both risk answers are supplied, reviewed_no_material_risks_identified and no_risks_identified must correspond. Missing counterparts remain allowed.
- When customer-validation methods contain not_started and findings are supplied, findings must be not_collected. Missing findings remain allowed.
- Validation uses only the new answer set and current locked requirements, never inherits a prior revision.

These inputs describe research, preparation, and reported findings; they do not establish positive demand, absence of competition/risk, verified capability, guaranteed returns, or readiness quality. Any later deterministic interpretation needs a separately approved rubric.

## Storage and append-only semantics

One table readiness_input_versions: id, business_id FK, unsigned version, schema_version, answers JSON, created_at UTC. Unique (business_id, version); foreign key restricts parent deletion. No owner duplication, updated_at, score, assessment, or completion fields. Empty answers serialize as {} in Resources.

Business has many input versions. Each successful POST appends a full replacement set, starting at version 1 per business. Omitted answers do not carry forward. Identical repeated POSTs also create distinct versions; no idempotency key is introduced. No input records are fabricated for existing businesses.

The business and requirements rows are locked. The latest version uses a locking read before assigning the next number; the unique constraint is a second line of protection. SQL transactions roll back failed saves.

No update/delete routes exist. Policy rejects historical mutation; model update/delete events also reject it. This is application-level append-only history, not a claim of tamper-proof storage against privileged direct SQL or query-builder bypasses.

## API, authorization and responses

| Method | Route | Behavior |
| --- | --- | --- |
| GET | /api/me/businesses/{business}/readiness-inputs | Latest revision, or data:null if absent |
| POST | /api/me/businesses/{business}/readiness-inputs | Body contains answers; creates full replacement revision, 201 |
| GET | /api/me/businesses/{business}/readiness-inputs/versions/{version} | Owned historical business-local revision, 200 |

Successful data fields: id, version, schema_version, answers, created_at. Schema version is server-selected string "1". No owner, source amounts, or computed assessment data is exposed in this Resource.

Use JSON requests, including {"answers":{}} for an unanswered set. Nonempty lists are invalid as the answers object. The empty PHP/Laravel array representation is also accepted as an empty set; responses consistently expose an object.

Ownership derives through Business → FounderProfile → User. Founder membership/profile required, with no admin bypass. Inputs may be saved on draft or submitted businesses. Existing BusinessPolicy is reused through explicit ReadinessInputPolicy binding. Sanctum protects reads/writes; RequireSpaSession and CSRF protect writes. Unknown top-level fields, ownership, versions, schema_version, weights and scoring fields are rejected.

Existing API envelopes preserved: invalid input 422, unauthorized 401 (CSRF may reject earlier on an unsafe request), no Founder role 403, cross-owner/missing records 404, CSRF 419. Historical mutation routes return 405.

## Existing data and future assessment boundary

Business descriptions/context, BDT funding, investor preferences, professional requirements and documents remain authoritative in their existing entities. They are not copied into editable answers. PDFs are not inspected or treated as a substitute for inputs.

Funding consistency is checked when saving. Later business/requirement edits do not rewrite input history. Before future scoring, revalidate current consistency and snapshot the exact source data and input revision evaluated. Schema revisions and eventual scoring-rubric/assessment versions are separate concepts.

No factor scores, weights, thresholds, weak areas, improvement suggestions, assessment records, automatic recalculation, matching, publication/discovery, NDA/Deal Rooms, or financial workflows were implemented.

## Verification and commands

- Focused: **35 tests, 294 assertions passed**.
- Full regression: **237 tests, 1,603 assertions passed**, PHP 8.3.33.
- Tests cover all options, exact types/missing semantics, rejected keys, funding/risk/customer consistency, history isolation, SQL uniqueness, lock ordering, rollback, model/policy immutability, ownership/admin isolation, real Sanctum sessions, CSRF, and unchanged draft/submitted behavior.
- Guarded vault_ventures_test only. Tests verify lock ordering and uniqueness, not a production load benchmark.
- Migration 2026_09_10_000011_create_readiness_input_versions_table applied in batch 6. New table empty on main database.
- Existing main table counts/hashes unchanged except expected migration ledger entry (13 → 14).
- 258 existing source/configuration files compared; only Business.php and routes/api.php changed. Authentication, frontend, environment, requirements, documents, submission logic, and safety guard remain unchanged.

Commands from backend:
```powershell
& C:/Tools/php83/php.exe vendor/bin/phpunit --filter 'ReadinessInputTest|ReadinessInputAuthorizationTest'
& C:/Tools/php83/php.exe vendor/bin/phpunit
& C:/Tools/php83/php.exe artisan route:list --path=readiness-inputs -vv
& C:/Tools/php83/php.exe artisan migrate --no-interaction --path=database/migrations/2026_09_10_000011_create_readiness_input_versions_table.php
& C:/Tools/php83/php.exe artisan migrate:status --no-interaction
```
Existing Pint formatted/tested only scoped PHP files. No packages, seeders, or destructive main-database operations.

## Stopping point

Phase 3 Part 1 input storage and authorization are complete. No assessment records exist. Phase 3 Part 2 has not started and requires a separate instruction.
