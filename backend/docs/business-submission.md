# Phase 2 — Part 1 — Business Submission Foundation

## Source and approved decisions

Implements the owner's approved plan derived from Master Specification sections 5.1, 7, 9.1–9.2, 12.1, 13, 23–25, 29, and 33. The specification requires submission, management, funding/skill requirements, and controlled access; the owner approved the exact schema, field limits, multiple businesses, five-field submission minimum, draft/submitted lifecycle, and editable/idempotent submission behavior.

## Storage

Three additive migrations applied in batch 3 on 2026-09-10:

- `2026_09_10_000005_create_businesses_table.php`
- `2026_09_10_000006_create_business_requirements_table.php`
- `2026_09_10_000007_create_business_requirement_skill_table.php`

`businesses`: id, founder_profile_id, name, description, industry, business_stage, risk_level, expected_involvement, location, status, submitted_at, created_at, updated_at.
`business_requirements`: id, unique business_id, nullable funding_amount DECIMAL(15,2), created_at, updated_at.
`business_requirement_skill`: business_requirement_id and skill_id, composite primary key.

FounderProfile has many businesses. Business belongs to FounderProfile and has one BusinessRequirement. Requirements belong to Business and have many shared Skills through the pivot. Foreign keys restrict parent deletion; there is no deletion endpoint. Existing Founder profiles remain identity-only.

All timestamps use existing UTC conventions. Funding is BDT only and returned as an exact two-place decimal string; no financial calculation occurs.

## API

All paths start with `/api/me/businesses`.

| Method | Suffix | Behavior |
| --- | --- | --- |
| GET | (none) | Own businesses, newest ID first; data.items and data.pagination |
| POST | (none) | Create private draft and empty requirements atomically; 201 |
| GET | /{business} | Read owned business with requirements |
| PATCH | /{business} | Update approved business fields |
| PATCH | /{business}/requirements | Update funding and skill requirements atomically |
| POST | /{business}/submit | Submit stored record; repeat submission is idempotent |

Read/update/submit successes use 200 and the existing success/message/data envelope. List pagination accepts page >= 1 and per_page 1–100 (default 15); no search or filter parameters. Response pagination contains current_page, per_page, total, last_page.

Create requires a nonblank name up to 255 characters. Other business fields are nullable:

- description: string, maximum 10,000 characters.
- industry, business_stage, risk_level, expected_involvement: strings, maximum 100.
- location: string, maximum 255.

PATCH retains omitted fields. Explicit null clears nullable values; name cannot be cleared. Unknown input fields are rejected, including ownership, status, timestamps, verification, and scoring fields. Submission accepts no payload fields; it validates the stored record under a row lock.

Funding amount is optional, nonnegative, at most 13 integer digits and two decimal places. Prefer decimal-string inputs. Negative values, exponent strings, booleans, excessive precision, and overflow are rejected. Null clears funding; zero is valid.

Skills accepts up to 50 nonblank names, maximum 100 characters each. Whitespace is collapsed and lowercase normalized keys share the Phase 1 catalog. Duplicate normalized names collapse; the first display name is retained. Empty [] removes only the business associations. Professional skill associations and shared catalog names remain unchanged.

## Lifecycle and confidentiality

Create sets draft. First submission requires name, description, industry, business_stage, and location, then sets submitted and submitted_at atomically. Funding and skills are optional. Submitted records remain editable, including clearing nullable fields. Repeat submission is a no-op even after edits and preserves the first submitted_at; this is not revalidation or a new revision. There is no reset-to-draft endpoint.

Both states remain private. Submitted does not mean published, verified, assessed, approved, or available to investors/professionals.

Every endpoint requires auth:sanctum and Founder role/profile authorization. Writes retain RequireSpaSession and CSRF. Owner-scoped queries and BusinessPolicy enforce record ownership. Owner IDs are derived from the session, never client input. Missing roles/profile return 403; another owner's or nonexistent record returns 404. Anonymous requests return 401, invalid payloads 422, CSRF failures 419, using existing error conventions. Admin access is not an ownership bypass. Unverified founders may use this foundation; no new verification gate.

Resources explicitly expose business fields, UTC timestamps, and requirements only; no owner identity, authentication secrets, admin state, or speculative business fields.

## Verification

PHP 8.3.33, separate guarded vault_ventures_test database:

- Focused business tests: **46 tests, 329 assertions passed**.
- Full regression: **152 tests, 887 assertions passed**.
- Six routes verified with Sanctum middleware; writes include RequireSpaSession.
- Main database: original table data counts/hashes unchanged; migration ledger advanced by three entries; all three new tables empty.
- 223 existing source/configuration files compared; only approved FounderProfile.php and routes/api.php changed.

Commands from backend:

```powershell
& C:/Tools/php83/php.exe vendor/bin/phpunit --filter 'BusinessSubmissionTest|BusinessRequirementsTest|BusinessAuthorizationTest'
& C:/Tools/php83/php.exe vendor/bin/phpunit
& C:/Tools/php83/php.exe artisan route:list --path=api/me/businesses -vv
& C:/Tools/php83/php.exe artisan migrate --no-interaction --path=database/migrations/2026_09_10_000005_create_businesses_table.php --path=database/migrations/2026_09_10_000006_create_business_requirements_table.php --path=database/migrations/2026_09_10_000007_create_business_requirement_skill_table.php
& C:/Tools/php83/php.exe artisan migrate:status --no-interaction
```

Existing Pint was run only on the changed PHP files. No dependencies or seeders were installed/run. No destructive main-database command was used.

## Limitations

No publication, discovery, search/filtering, scoring, matching, recommendations, verification gates, investment terms, disclosure/NDA, documents, teams, admin workflows, frontend changes, deletion, ownership transfer, or revision history. Future assessment/publication needs explicit revision/invalidation rules and per-field disclosure design. Detailed staffing requirements and proposed investment terms remain deferred. No new official Part is assigned.

Next recommendation: review the remaining Phase 2 Business Requirements scope against the specification before choosing the next implementation. Any expansion requires owner approval.


## Phase 2 — Part 2 — Business Requirements & Funding Details

**Completed:** 2026-09-10. This section extends the historical Part 1 scope above. Founder proposals and business-wide professional criteria are now supported; finalized deal terms remain excluded.

Source: Master Specification §§5.1, 5.3, 9.2, 15, 15.6, 23, 24 and 30. Exact field names, limits, optionality, representation, and consistency rules were approved by the owner.

Six optional columns were added to business_requirements:
- accepted_investment_types: nullable JSON; API returns [] when unset; unique micro/large_standard selections, maximum two.
- micro_proposed_terms and large_standard_proposed_terms: nullable text, maximum 5,000 characters each.
- required_experience_level and required_availability: nullable trimmed strings, maximum 100 characters each.
- compensation_preferences: nullable JSON; API returns [] when unset; unique salary/equity selections, maximum two.

No fabricated preferences are backfilled. All new fields remain optional for drafts and submitted businesses. Existing funding_amount DECIMAL(15,2), decimal-string BDT responses, zero/null semantics, and normalized shared skills are unchanged. There are no investment thresholds or automatic mode classifications.

The existing PATCH /api/me/businesses/{business}/requirements accepts the new fields; existing business list/detail responses include them in the requirements Resource. No routes, policies, submission rules, authentication, or frontend behavior changed. This is an additive response extension.

PATCH retains omitted fields. Null clears scalar values; [] clears selections; array fields reject null. Proposed terms require the corresponding selected mode. Consistency is checked against the merged row under the existing transaction/row lock, before saving or changing skills. Removing a mode while its saved terms remain returns structured 422 errors. Clear those terms explicitly in the same request to remove the mode. No proposal is silently deleted.

Founder proposals are private, preliminary text, not finalized agreements or authoritative machine-readable investment terms. No financial calculations, publication/discovery, scoring/matching, verification, NDA/disclosure, team/admin workflow, or transactions were introduced.

### Verification and migration

- Focused business suite: **74 tests, 516 assertions passed**.
- Full suite including Phase 1 and Part 1 regressions: **180 tests, 1,074 assertions passed**.
- PHP 8.3.33; database-writing tests use guarded vault_ventures_test.
- Migration: 2026_09_10_000008_add_details_to_business_requirements_table, applied in batch 4.
- Main database: existing data row counts/checksums unchanged; migration ledger increased from 10 to 11 entries. business_requirements remains empty.
- 244 existing source/configuration files compared: only four requirements implementation files and two existing tests changed. Routes, policies, authentication, frontend, environment, and safety guard hashes remain unchanged.
- No packages, seeders, or destructive main-database commands.

Commands from backend:
```powershell
& C:/Tools/php83/php.exe vendor/bin/phpunit --filter 'BusinessRequirementDetailsTest|BusinessRequirementsTest|BusinessSubmissionTest|BusinessAuthorizationTest'
& C:/Tools/php83/php.exe vendor/bin/phpunit
& C:/Tools/php83/php.exe artisan migrate --no-interaction --path=database/migrations/2026_09_10_000008_add_details_to_business_requirements_table.php
& C:/Tools/php83/php.exe artisan migrate:status --no-interaction
```
Existing Pint was run only on the eight changed PHP files. Full file inventory is in the Part 2 implementation-log entry.

## Phase 2 — Part 3 extension

Optional owner-private business_plan and pitch_deck documents are now available through three nested document endpoints. Documents are not required for submission and do not change statuses, the five-field minimum, funding/skills, or idempotent repeat submission. Earlier document exclusions above describe historical Parts 1–2 scope.

Implementation limits: PDF only, 2 MiB/file, 10 documents/business. Files are encrypted on a dedicated non-served disk; downloads reauthorize ownership and record download initiation. No sharing, public URLs, financial/identity evidence workflows, review/publication, delete/replacement/versioning, or AI parsing.

See [business-documents.md](business-documents.md) for API, schema, security, limits, and commands. Part 3 verification: focused 22 tests / 235 assertions; full regression 202 tests / 1,309 assertions, all passed. Both migrations applied in batch 5; existing main data unchanged except migration ledger additions.
