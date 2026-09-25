# Current status: AI Phase 1

The historical disabled-only implementation below is superseded by [AI foundation](ai-foundation.md). The existing v1 persistence, validation and authorization contracts remain in place. Gemini is now configurable server-side; no key is configured locally and no live call has been tested. The analysis eligibility boundary also recognizes the current submitted lifecycle states. See the linked document for provider configuration, privacy boundaries and verification.

# Phase 3 — Part 3 — AI Business Analysis & Improvement Guidance

Completed 2026-09-10 under the final owner-approved constrained contract.

**REAL EXTERNAL AI IS NOT IMPLEMENTED OR ENABLED.**

This is a provider-disabled analysis foundation. It does not deliver live AI analysis. The deterministic Part 2 readiness engine remains the only scoring authority. Part 3 does not calculate, modify, override, reinterpret or replace scores, weights, thresholds, factor results or Part 2 suggestions.

Master Specification v1.1 §§8, 10, 24 and 25.1 support rule-based readiness/explanation; §§12 and 29 support privacy/authorization. Exact analysis architecture, output schema and operations below are owner-approved implementation decisions. External/NLP business or pitch-deck analysis remains outside this phase.

## Architecture and operating mode

AnalysisInputBuilder → AnalysisProvider → AnalysisOutputValidator → AnalysisRenderer → BusinessAnalysisService → immutable BusinessAnalysis.

- Application binding is always DisabledAnalysisProvider. No configuration switch, credentials, SDK, HTTP client, external endpoint, queue or automatic generation exists.
- The service enforces disabled mode outside a PHPUnit testing process.
- FakeAnalysisProvider exists only in tests/Fixtures, requires testing mode and the PHPUnit runtime marker, and must be explicitly injected. Fake results carry provider_identifier=test_fake, model_identifier=null, test_fixture=true and an explicit "No live AI analysis" label.
- Versioned server definitions: input contract 1, output contract 1, instruction 1 and renderer 1. Instructions are never transmitted.
- Production creates no successful analyses while disabled. There are no seeded analyses.

## Input allowlist

Dedicated snapshots include only:
- Business name, description, industry, business_stage, location and status.
- Existing funding_amount as its exact decimal string/null, currency BDT.
- Exact saved readiness answers, input ID/revision/schema.
- Current assessment ID/version/rubric/source fingerprint; factor identifiers, missing keys, incomplete/weak flags, reason codes; applicable suggestion IDs and exact wording.
- Server-owned analysis configuration identities/versions.

Excluded: numeric scores/weights/thresholds, account identity/email/phone/authentication, investor/professional records, proposals/compensation/skills, documents/pitch decks/paths/metadata, verification/reputation, reports/deals and unrelated requirements. No whole-model serialization and no data transmission.

Business and requirements are read under the existing Business row lock. The builder resolves the assessment matching the current Part 2 source fingerprint, not necessarily the highest historical assessment version. It calls no scoring or recalculation function.

## Adapter output contract

Exactly four properties; all required:
- business_summary: object containing only source_refs, a unique list of 1–5 supplied field identifiers from name, description, industry, business_stage, location.
- information_coverage: exactly eight objects containing only factor_key, one per existing factor.
- review_points: 0–8 unique factor_key/condition_code objects.
- recommended_actions: 0–8 unique suggestion_id objects.

Conditions:
- missing_input: assessment already has missing keys for that factor.
- weak_factor: assessment already marks that factor weak.
- funding_conflict: funding factor already contains FUNDING_DEPENDENCY_CONFLICT.

Strict UTF-8 JSON, raw response maximum 8 KiB, bounded identifiers (128 bytes; allowed identifiers are ASCII), exact object keys and list shapes. Unknown properties, arbitrary prose, HTML/URLs, amounts, scores, confidence, timestamps or provenance are rejected. Unknown/inapplicable references and duplicate selections are rejected. Invalid output returns 502 and is never repaired or persisted as successful analysis.

Source references and predefined selection IDs prevent the adapter from introducing factual claims. Founder source text remains self-reported, not independently verified.

## Server rendering

The rendered_output stores:
- business_summary: selected source values, each marked Founder-provided.
- information_coverage: each factor's two existing input keys, supplied/missing status and exact captured value. False and negative answers remain supplied. No percentages, questionnaire additions or gates.
- review_points: neutral labels Missing input / Weak factor / Funding dependency conflict, with the existing assessment basis, missing keys and reason codes. No new advice catalogue.
- recommended_actions: exact captured Part 2 suggestion objects/wording.
- funding: captured amount, BDT, presence and existing conflict flag, separate from answer coverage.
- Fixed basis statement identifying founder-provided information and existing deterministic findings.

Rendered source text is plain data; future consumers must display it as text, not executable HTML. Source HTML-like text is not converted into markup. The adapter itself cannot supply text.

All monetary values remain strictly BDT/৳. Null and zero remain distinct; no conversions, estimates or new amounts.

## Persistence

One table: business_analyses. Migration: 2026_09_10_000013_create_business_analyses_table.

Columns: id, business_id, readiness_assessment_id, version, input_contract_version, output_contract_version, instruction_version, renderer_version, provider_identifier, nullable model_identifier, source_snapshot, source_fingerprint, validated_output, rendered_output, generated_at, created_at.

- Unique business/version.
- Unique business/source-and-configuration fingerprint.
- Composite business/assessment FK, with approved supporting unique (business_id,id) index on readiness_assessments.
- Restrictive foreign keys, no updated_at, no update/delete APIs, model and policy mutation guards.
- Versions allocated only on successful insert under a Business lock.
- No request-state table or operational workflow table.

Fingerprint uses canonical key-sorted JSON (list order preserved) and SHA-256, incorporating the complete approved snapshot and configuration. Snapshots are historical provenance, not editable duplicate sources.

Application-level append-only history is not tamper-proof against privileged direct SQL.

## API

Base: /api/me/businesses/{business}/business-analyses

| Method / suffix | Behavior |
| --- | --- |
| POST base | No payload; 200 reuse or 201 valid test-fake persistence |
| GET base | Descending successful history, default per_page=20, maximum 50; invalid pagination 422 |
| GET /latest | Highest successful historical version or data:null |
| GET /{version} | Owned historical version, 404 when absent |

Existing success/message/data envelope is retained. These endpoints add top-level meta only to their own responses:
generation_enabled, eligible, eligibility_reasons, current_version; history includes pagination metadata.
Returned records include freshness.is_current. No new /status route.

Disabled application mode always reports generation_enabled=false. Eligibility is a generation prerequisite, never an investment-readiness verdict.

Errors:
- 422: unsubmitted business, missing/stale assessment, or client payload.
- 503 ANALYSIS_DISABLED: eligible request with disabled adapter, before cache lock/rate allowance.
- 503 ANALYSIS_ADAPTER_FAILURE: adapter exception.
- 503 ANALYSIS_FAILURE: safe persistence/internal failure.
- 502 INVALID_ANALYSIS_OUTPUT: invalid output.
- 409 GENERATION_IN_PROGRESS: competing lock/allowance coordination.
- 409 GENERATION_LOCK_LOST: expired or changed lease ownership.
- 409 SOURCE_CHANGED: dependencies changed during generation.
- 429 ANALYSIS_RATE_LIMIT: Founder allowance exhausted.

No client provider/model/adapter/endpoint/credentials or scoring fields. Existing Sanctum, SPA-session and CSRF apply. Owner-only Founder policy, no admin bypass. Authorization occurs before exposing business state. GET never generates or recalculates.

## Freshness and reuse

Dependencies: included Business values/status, exact BDT funding, readiness input revision/schema, matching assessment identity/source fingerprint and server configuration versions/adapter identity. Unrelated timestamps, skills/profiles/documents and excluded requirement fields are not dependencies.

latest means highest historical analysis version. current_version may identify an older reusable version when dependencies recur. Every record's freshness is explicit. Part 3 preserves Part 2's current-matching assessment semantics.

A stale/missing assessment requires the existing Part 2 workflow; Part 3 returns 422 and never triggers scoring. Source changes during adapter execution return SOURCE_CHANGED without persisting the candidate output. Historical analyses are not rewritten.

## Coordination and rate limiting

Existing database-backed cache is used explicitly, independent of the default test array cache:
- Per-business generation lock, 60-second lease, no waiting.
- Recheck reuse after acquisition.
- Adapter call outside source/persistence transactions.
- Before insert, lock the cache lease row and verify owner token and unexpired lease.
- Unique constraints are final duplicate protection.
- Owner-safe release cannot release another worker's replacement lease.
- Brief per-Founder allowance lock makes quota check/increment atomic across businesses.

Limit: 3 non-reused generation requests per Founder per hour, configurable in config/business_analysis.php.
Disabled requests do not acquire generation locks or consume allowance. Reuse does not consume allowance. Failed actual test-adapter attempts do consume allowance. No retries, tokens, billing or queue.

## Privacy and failures

No outbound network code exists. Provider selection is not publicly configurable. No document access.
Failure logs contain only safe business ID, failure code and elapsed time, never source text, answers, funding, raw output, prompts or credentials.
Failures never mutate business/funding/input/assessment records. Output failure and insert failure preserve history; successful version numbering has no failure gaps.

## Verification

PHP 8.3.33:
- Focused: 41 tests / 462 assertions passed.
- Full regression: 298 tests / 2,486 assertions passed.
- Tests cover all output categories, 22 invalid-output cases, exact rendering, disabled/fake isolation, no HTTP calls, ownership/Sanctum/CSRF, reuse/history, current-assessment resolution, fingerprint dependencies, stale/source-change cases, BDT null/zero/maximum/conflict, allowance/reuse exemption, overlapping requests, lease expiry/ownership, uniqueness/composite FK and persistence failures.
- Lock tests exercise overlapping requests and database leases; they are not a production load benchmark.
- Main migration applied in batch 8; new table empty. Existing table hashes and all 15 pre-existing migration records unchanged.
- Existing Part 1/Part 2 source and test files remain unchanged; only the shared Business relation, provider binding and route registration are extended.

Commands and exact file inventory are recorded in ../../IMPLEMENTATION_LOG.md.

## Stopping point

Phase 3 Part 3 foundation complete. REAL EXTERNAL AI IS NOT IMPLEMENTED OR ENABLED.
No live analysis, frontend changes, document parsing or Phase 3 Part 4.
Any real provider, private-data transmission, consent/privacy arrangement, unrestricted narrative or extra inputs needs separate explicit approval. The next step is owner review of this disabled foundation; no future integration is authorized by its completion.
