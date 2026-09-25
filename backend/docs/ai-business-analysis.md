# AI Phase 2 — Founder Business Analysis

## Audit and architecture

Phase 1 supplied the canonical `AnalysisProvider` contract, `AnalysisInput`, `AnalysisResult`, `AnalysisPromptBuilder`, Gemini/disabled providers, the test-only fake, and server configuration. `BusinessAnalysisService` already enforced owner authorization, current submitted/readiness prerequisites, fingerprints, a 60-second database lease, a per-Founder quota, immutable successful history and transactional rechecks. `BusinessAnalysis` and its existing table have JSON output and explicit contract versions; no new table or migration is needed.

The existing `BusinessAnalysisController`, `CreateBusinessAnalysisRequest`, `BusinessAnalysisPolicy`, resources and `/api/me/businesses/{business}/business-analyses` routes are reused. Before Phase 2, the Founder page's AI tab read incorrect top-level fields, offered no generation action, discarded availability metadata and attempted private-analysis fetches from other role views.

## Generation and persistence

The server selects output version `2` in `config/business_analysis.php`. The same service now calls `AnalysisProvider::analyze(AnalysisInput)` and revalidates its typed result at the persistence boundary. It saves only the six canonical advisory fields in the existing JSON columns. Source fingerprints include contract/instruction/renderer versions, separating new content from legacy version `1`. Existing version-1 reference generation remains supported by a server-only compatibility setting; legacy regression tests explicitly select it. Clients cannot select providers, output versions, prompts or output content.

Historical rows are never rewritten. Only validated successes create records. Processing and failure are transient request/UI states; there is no new persisted pending/failed record lifecycle. The resource labels persisted successes `completed`. New content gets the next per-business version. Unchanged or recurring source fingerprints reuse a prior successful record without another provider call or quota consumption. A source change, revoked ownership, invalid output, provider error or lost lock prevents insertion.

Generation retains the existing prerequisite of a submitted business with a current readiness assessment. Supported business states are submitted, pending_approval, approved and published. Draft/rejected or missing/stale assessments remain ineligible. This phase does not recalculate or change Readiness.

## Frontend

`src/components/business/BusinessAnalysisPanel.tsx` is mounted in the existing Founder `BusinessProfile.tsx` AI tab. Investor and Professional views have neither the tab nor private-analysis requests. The page's business load and server policy enforce ownership.

The panel shows loading, configuration-required, eligibility, processing, completed, error and historical states. It renders Executive Summary, Strengths, Weaknesses, Opportunities, Risks and Recommendations as React text. Provider/model, generated time, version and freshness are visible. Empty lists display an explicit absence message. The history action pages through existing records and can display legacy reference summaries, review points and recommendations.

Generate AI Analysis / Generate New Analysis is disabled while processing, unavailable, ineligible or already current. The UI explains that changed business information is needed for a new version. Refresh Analysis retrieves the latest saved result; View History exposes retained versions. Client guards suppress duplicate clicks, while backend locks, unique constraints and fingerprints remain authoritative. Failed generation retains the previous successful view. Business-keyed state and late-response guards prevent one business's response from appearing in another business's panel. Lost-access responses clear private displayed data.

The API client has an opt-in `preserveEnvelope` option, used only by typed `api.businessAnalysis` methods. This preserves availability/history metadata even when `data` is null without changing existing callers' envelope behavior. Shared Sanctum cookies, CSRF and error parsing remain in use.

## Exact visible advisory wording

> AI-assisted analysis based on the business information provided. Use these insights as guidance, not as a platform decision or investment guarantee.

> This is not verification, a platform score, or investment advice. Funding on Vault Ventures is simulated and non-custodial.

Unavailable wording:

> AI analysis is currently unavailable. Provider configuration is required. Saved analyses remain available.

Test fixtures, if encountered in test history, are labeled `Automated test fixture. No live AI analysis.` No production fake fallback is configured.

## Privacy, validation and authority

Exactly five provider input fields: `name`, `description`, `industry`, `business_stage`, `location`. They are constructed through `AnalysisInput`; whole models are never serialized. Excluded: credentials, tokens, OTP, NID/passport, verification evidence, financial evidence, NDA documents, private messages, unrelated profile data, internal configuration, readiness answers and scores. Existing private source snapshots remain server-side.

The prompt separates trusted instructions from JSON-encoded untrusted business data. It explicitly prohibits invented revenue/customer counts, compliance/certifications, partnerships, funding, credentials or market statistics and asks for uncertainty when data is missing. It forbids scores, authoritative actions, investment guarantees and claims that Vault Ventures holds funds, provides escrow or executes transfers. Model text remains advisory; prompts cannot guarantee factual accuracy or identify every sensitive fact users might put in descriptions.

`AnalysisResult` requires exactly summary plus five string arrays. Summary is nonblank, at most 2000 characters; lists contain at most eight nonblank strings, each at most 1000 characters. Unknown fields, wrong types, invalid JSON/UTF-8 and excessive output are rejected. React never uses raw provider HTML or `dangerouslySetInnerHTML`. Narrative content cannot execute domain mutations or overwrite platform scores.

Owner-only reads/writes and existing Admin governance remain unchanged. Other Founders receive 404 for unowned businesses; Investor/Professional/Admin-only users receive 403; anonymous users receive 401. No disclosure or Admin AI feature is added. Matching weights, Readiness scoring, reputation, verification, Deals, NDA, negotiations, agreements, milestones, simulated funding, messages and feedback are unchanged.

## Failure behavior

Safe application errors cover configuration missing, timeout, connection/HTTP failure, provider and Founder rate limits, invalid output, concurrent generation and source changes. The UI maps codes to fixed English messages rather than displaying raw exception/provider text. No partial analysis is persisted; previous success and history survive failures. Requests are not automatically retried. Configuration/model/provider are backend-only, with no secret in responses or logs.

## Local configuration and protected records

Effective provider: Gemini. Default model: gemini-3.8-flash. No local API key is configured. No live call is made and no artificial success is reported. No local `.env` or schema changes are required.

Read-only hashes cover the local Deals, NDA, agreements, proposals, histories, milestones, messages, feedback and financial tables. Deal #2 remains Shayan/Siza, completed, BDT 5000 simulated (4600 + 400). Deal #3 remains Shayan/Rafiul, completed, BDT 50000 simulated. Tests use the guarded vault_ventures_test database. The unrelated Admin Settings file remains byte-identical to its initial SHA-256 `20117dc6dead8d3e791bd228e6dccbbb120b1417ac79ad94e8a1f123c18e2ddf`.

## Verification

Focused backend, regression, frontend and build results are recorded in the completion report and ignored local `storage/logs/ai-phase2-*.txt` files. Initial new test failures were corrected in test fixtures: required business submission fields, schema-scoped domain table comparisons and React async assertions. No unrelated production behavior or stale Readiness expectations were changed to make tests pass.

Phase 3 is not started. AI Readiness Insights remain future work; deterministic Readiness is still authoritative.
