# AI Phase 1 foundation

## Audit and reuse

The pre-edit audit found a complete disabled, reference-only analysis pipeline:

- `app/Services/BusinessAnalysis/AnalysisProvider.php`: canonical provider interface (`identifier`, `modelIdentifier`, `enabled`, `generate`).
- `AnalysisContract.php`: versioned structured snapshot/output definitions and fingerprints; no analysis DTO or analysis-specific enum existed.
- `AnalysisInputBuilder.php`, `AnalysisOutputValidator.php`, `AnalysisRenderer.php`, `BusinessAnalysisService.php`: private snapshots, strict reference validation, deterministic rendering, eligibility, source freshness, owner authorization, locks, quotas and immutable persistence.
- `DisabledAnalysisProvider.php`; `tests/Fixtures/FakeAnalysisProvider.php`: no real provider. The fake is explicitly injected and restricted to PHPUnit.
- `app/Models/BusinessAnalysis.php`, `database/migrations/2026_09_10_000013_create_business_analyses_table.php`: existing versioned history, reused without schema changes or local data writes.
- `app/Policies/BusinessAnalysisPolicy.php`, `app/Http/Controllers/BusinessAnalysisController.php`, `app/Http/Requests/BusinessAnalysis/CreateBusinessAnalysisRequest.php`, `app/Http/Resources/BusinessAnalysisResource.php`.
- `routes/api.php`: owner-only GET history/latest/version and POST generation at `/api/me/businesses/{business}/business-analyses`; existing Sanctum, SPA session, CSRF and policy boundaries remain.
- `tests/Feature/BusinessAnalysisTest.php`: 41 existing cases, including 22 invalid-output datasets, ownership/admin/anonymous/CSRF, source mutation, history, leases and quotas.
- `config/business_analysis.php`: existing generation quota only. No Gemini/OpenAI/Anthropic implementation, credentials, completion client or provider configuration existed.
- Frontend `BusinessProfile.tsx` consumes the existing API with an empty-analysis state. `AIInsights.tsx` contains shared presentation helpers; no frontend provider or secret is introduced.

## Decision and scope

Reuse the canonical interface, service, input capture, validator, renderer, policies and table. Laravel's container selects Gemini from `config/ai.php`; disabled/unknown provider values resolve to the deterministic disabled provider, never a fake. A missing key is not success and never causes fabricated analysis.

`generate(array $snapshot): string` remains the compatibility path for the v1 endpoints. Gemini output is validated in the provider and again at the service persistence boundary. `analyze(AnalysisInput $input): AnalysisResult` prepares the typed six-field advisory contract for later phases. It has no route, persistence or UI integration in Phase 1. Future callers must authorize the business before constructing the input. Future rendering must treat narrative strings as untrusted text, not HTML or platform instructions.

The existing input builder rejected every new submission because it required legacy `submitted`, while the current Readiness service accepts `pending_approval`, `approved` and `published` as well. Only the analysis eligibility check now recognizes those four states. Draft and rejected businesses remain ineligible. No Admin workflow, status transition or Readiness calculation changes. Regression tests exercise all six states.

## Official integration and configuration

Documentation verified on 2026-09-21:

- [Current model catalog](https://ai.google.dev/gemini-api/docs/models)
- [Interactions API reference](https://ai.google.dev/api/interactions-api-v1)
- [Structured JSON outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Stateless Interactions and retention](https://ai.google.dev/gemini-api/docs/interactions-overview)

`GeminiAnalysisProvider` uses Laravel's server-side HTTP client, POST to the fixed `https://generativelanguage.googleapis.com/v1beta/interactions` endpoint, and the `x-goog-api-key` header. Model default: `gemini-3.8-flash`. `response_format` requests `application/json` with JSON Schema. Only completed interactions with model text are accepted. No SDK dependency, tool declarations, background generation, conversation history, redirects or retries. `store=false` disables Interaction object storage; this does not override Google's separate service terms.

Backend-only variables: `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_TIMEOUT_SECONDS`. All additions to `.env.example` are empty. Defaults are Gemini, the model above, and 20 seconds; timeout is clamped to 1–45 seconds beneath the existing 60-second lease, with a 5-second connection timeout. Provider selection is never request-controlled. No key is persisted in analysis snapshots, models, logs or API resources. Local `.env` is not changed.

`enabled()` reports configuration readiness, not remote health. Existing owner-only metadata now includes `provider_status` (`configured`, `not_configured`, `disabled`) and `remote_health=not_checked`. GET never makes a health probe or paid call. Request failures report safe application categories. Local inspection found no Gemini key; no live Gemini call was made.

## Data and prompt boundary

`AnalysisInput` permits only name, description, industry, business_stage and location, with type/UTF-8/size checks. Extra fields are discarded. `AnalysisPromptBuilder` separates system instructions from JSON-encoded untrusted business data. The legacy prompt additionally receives factor identifiers, already-computed eligible conditions and applicable suggestion IDs. It excludes readiness answers, funding amounts, internal IDs, configuration, credentials, verification records/documents, evidence files and message history. Entire Eloquent models are never serialized to the provider.

Allowlisting cannot identify every sensitive fact a founder might manually put in a business description. No identity/evidence retrieval or automatic document parsing is performed. The prompt is a mitigation, not a guarantee against injection; reference validation and the absence of tools/domain mutations enforce the v1 authority boundary.

## Output and failure behavior

- V1 fields remain `business_summary`, `information_coverage`, `review_points`, `recommended_actions`; unknown keys, free prose, invented references, scores, duplicates and inapplicable conditions are rejected by the existing validator.
- Advisory DTO supports summary, strengths, weaknesses, opportunities, risks and recommendations. All fields are required; extra keys and wrong types fail. Summary: 1–2000 characters; lists: at most 8 nonblank strings of at most 1000 characters each. No score or decision field exists.
- Provider envelope is bounded to 128 KiB, reference output to 8 KiB, advisory JSON to 48 KiB, with bounded JSON depth. Empty, malformed, blocked, incomplete or structurally invalid output fails with `INVALID_ANALYSIS_OUTPUT` (502).
- Missing configuration fails before HTTP. Existing generation returns `ANALYSIS_DISABLED` (503); direct typed calls return `ANALYSIS_NOT_CONFIGURED` (503).
- HTTP, connection, timeout and 429 failures become `ANALYSIS_PROVIDER_HTTP_FAILURE`, `ANALYSIS_CONNECTION_FAILURE`, `ANALYSIS_TIMEOUT`, `ANALYSIS_PROVIDER_RATE_LIMIT` (503). Raw HTTP exception chains/body/header values are not retained in application failures.
- Existing safe logging records only business ID, failure code and elapsed milliseconds. Provider code adds no prompt/body/header logging.
- Failed requests preserve analysis history and deterministic business records. No fake fallback or automatic retries; core operations do not depend on AI availability.

## Protected domains

No writes or formula changes to verification, deterministic Readiness, investor/professional matching, reputation, Deal lifecycle, NDA, negotiations, agreements, milestones, funding, messages, feedback or Admin authorization. Read-only table hashes protect the local Deal fixtures separately from the guarded `vault_ventures_test` database.

Investor weights remain 25/25/15/15/10/10 percent; professional weights remain 35/20/15/15/10/5 percent. Local Deal #2 remains shayan/siza, completed, with funded simulated milestones 4600 + 400 BDT. Deal #3 remains shayan/rafiul, completed, with a funded simulated milestone of 50000 BDT.

## Verification

PHP runtime: `C:\Tools\php83\php.exe` (8.3.33). Test configuration forces the disabled provider and an empty key; Gemini tests override configuration with ephemeral random test values and mocked HTTP. No paid/external test calls. Test DB guard permits only `vault_ventures_test` on `127.0.0.1:3307`.

Focused command from `backend`: `& C:\Tools\php83\php.exe artisan test --compact --filter='AiFoundationTest|BusinessAnalysisTest'` — 67 passed, 0 failed, 0 skipped, 616 assertions (35.82s).

Build from repository root: `npm.cmd run build` — passed, 94 modules, 9.49s, non-fatal plugin timing warning. `npm run build` initially hit the Windows PowerShell script execution policy; the `.cmd` launcher ran the same npm script successfully. No frontend files changed; frontend tests not required.

Initial verification history: the first focused invocation stopped before tests due to a new test helper colliding with PHPUnit's final `output()` method; renamed. An overlapping regression invocation interfered with the shared test database and was interrupted (focused result 17 passed/43 failed, 93 assertions, invalidated). A subsequent sequential run exposed the pre-existing analysis lifecycle incompatibility (19 passed/42 failed, 342 assertions). The final focused result above follows the input-boundary correction and isolated HTTP fixtures.

Broader command from `backend`: `& C:\Tools\php83\php.exe artisan test --compact --filter='Matching|Readiness|Reputation|Deal|Settings'` — 242 passed, 1 failed, 0 skipped, 2066 assertions (66.71s). Only `ReadinessAssessmentTest::test_funding_and_submission_failures_preserve_source_success` failed: line 154 expects legacy `submitted`, but current submission returns `pending_approval`. This exact failure was already documented in `docs/local-tier1-verification.md:214`; its test and the Readiness/Submission implementations were not changed. Matching, Reputation, Deals and Settings tests in this run passed. The full backend suite was not run.

Final output is retained locally in ignored `storage/logs/ai-phase1-focused.txt` and `storage/logs/ai-phase1-regressions.txt`. All 15 created/modified PHP files passed syntax checks. Pint formatted only the six new PHP files. The existing modified `src/pages/admin/Settings.tsx` was preserved byte-for-byte (SHA-256 `20117dc6dead8d3e791bd228e6dccbbb120b1417ac79ad94e8a1f123c18e2ddf`). No frontend source, local `.env`, migrations, production database rows or Git branch/history changes were made.

Phase 2 remains unstarted: business-analysis experience, narrative persistence/versioning, readiness explanations, matching explanations and Deal/Admin intelligence require their own phases. Before a live provider smoke test, configure server-side credentials and use explicitly selected non-sensitive business data.
