# Phase 1 Part 4 — Role-Based Profiles & Authorization Foundation

## Scope and source

Implements the approved mapping of Master Specification v1.1 sections 5.2–5.3, 7, 9.2, 12.1, 19, 23 and 25.1. Multiple participant roles per account, field representations, validation limits, and separate admin access are explicit implementation decisions approved by the project owner.

Participant roles are `founder`, `investor`, and `professional`. Large/Micro are investment preferences, not additional account roles. Existing users receive no automatic memberships or profile records. Registration and all authentication controllers remain unchanged.

## Tables and migrations

Exactly eight tables are created by four additive migrations:

- `2026_09_10_000001_create_role_authorization_tables.php`: `user_roles`, `admin_access`.
- `2026_09_10_000002_create_founder_profiles_table.php`: `founder_profiles`.
- `2026_09_10_000003_create_investor_profile_tables.php`: `investor_profiles`, `investor_preferences`.
- `2026_09_10_000004_create_professional_profile_tables.php`: `professional_profiles`, `skills`, `professional_profile_skill`.

Entity tables have IDs and UTC timestamps. The skill pivot has only its two foreign keys, with a composite primary key. Ownership/profile foreign keys and unique keys prevent duplicate profiles and memberships. User role values are constrained to the three participant roles. Foreign keys cascade on parent deletion; this part exposes no deletion endpoint.

Founder and Investor profile rows contain only `id`, `user_id`, `created_at`, `updated_at`. Founder profile resources expose only `id` and `user_id`; investor resources also contain their separate preferences. No founder business information is introduced.

### Investor preferences

| Field | Representation |
| --- | --- |
| available_investment, minimum_investment, maximum_investment | Nullable DECIMAL(15,2), BDT; JSON responses use exact decimal strings |
| industry, risk_level, business_stage, involvement | Nullable trimmed strings, maximum 100 characters |
| location | Nullable trimmed string, maximum 255 characters |
| investment_types | Array of unique `micro` / `large_standard` values; defaults to [] |

Amounts are nonnegative, have at most 13 integer digits and two decimal places, and do not accept scientific-notation strings. Send decimal strings to preserve precision. Minimum must not exceed maximum when both exist. Range checks use the merged record under a transaction/row lock, so omitted PATCH fields still participate. Available investment is not used to invent an additional cap on the preference range. No investment or return calculations occur.

### Professional profiles

| Field | Representation |
| --- | --- |
| industry_experience | Nullable list of industry labels, each nonblank and at most 100 characters |
| experience_level, availability | Nullable trimmed strings, maximum 100 characters |
| location | Nullable trimmed string, maximum 255 characters |
| compensation_preferences | Array of unique `salary` / `equity` values; defaults to [] |
| skills (API field) | List of up to 50 nonblank names, each at most 100 characters; persisted through the skill pivot |

Skill names collapse whitespace and use lowercase normalized keys for identity. Duplicate normalized names collapse into a single association. The first saved display name is retained across users. Updating one user's skills never renames shared skills or alters another user's associations. Removed associations do not delete catalog entries. No skills seeder or catalog-editing endpoint is introduced.

Profiles support drafts. No biography, avatar, education, social links, profile-completion fields/gates, verification status, reputation, or extra product fields are accepted. Categorical fields remain free text except for the explicitly approved role, investment-type and compensation arrays.

## APIs

All responses retain the existing `ApiResponse` envelope.

| Method | Path | Result |
| --- | --- | --- |
| GET | /api/me/profile | Own identity, participant roles and role profiles; absent profiles are null |
| POST | /api/me/roles | Enroll one participant role; creates its draft profile atomically |
| PATCH | /api/me/profiles/professional | Partially update own professional profile and optional skill associations |
| GET | /api/me/investor-preferences | Read own investor preferences |
| PATCH | /api/me/investor-preferences | Partially update own investor preferences |

Enrollment body:

```json
{"role":"investor"}
```

New enrollment returns 201; repeated enrollment returns 200 with no duplicates. Investor enrollment also creates its empty preference record. Enrollment is serialized per user and transactional.

GET profile data has `user: {id, name, email}`, a sorted `roles` list, and `profiles: {founder, investor, professional}`. Admin state, password/hash/token fields and verification/completion scores are not exposed. The existing `/api/auth/user` response is unchanged.

PATCH retains omitted fields. Explicit null clears nullable fields; [] clears skill associations or preference lists. Unknown input fields are rejected with structured 422 errors, including protected ownership/admin fields. There are no Founder/Investor identity-only update routes.

Anonymous access returns 401; missing participant membership or denied ownership returns 403; missing records/routes return 404. Invalid input and invalid merged ranges return 422. SPA-session/CSRF requirements remain active on writes; rejected CSRF requests return the existing structured 419 response.

## Authorization

All routes require `auth:sanctum`. Writes additionally use the existing `RequireSpaSession`; the existing Sanctum stateful middleware handles CSRF. URLs never accept another user's profile identifier.

Founder, Investor, Professional and Investor Preference policies require both ownership and the corresponding participant membership. The aggregate profile endpoint checks its loaded profiles through these policies as well.

`admin_access` is separate from participant memberships. Its model is fully mass-assignment guarded. `User::hasAdminAccess()` and `AdminAccessPolicy` provide the authorization boundary. The policy permits checking admin access for trusted administrative use, but denies create/update/delete through policy authorization. There is no public admin endpoint, automatic assignment, seeder, provisioning command, or global Gate bypass. Admin status alone does not grant access to another participant's profile.

Unverified authenticated accounts may maintain their own draft profiles. This does not grant identity verification or permission for future higher-trust actions.

## Validation and testing

Tests extend the existing guarded `Tests\TestCase`. RefreshDatabase applies only to `vault_ventures_test`; test records roll back. No seeders run. Tests cover enrollment, idempotency, rollback on failure, role combinations, ownership, admin escalation, schema uniqueness/foreign keys, preference precision and merged range checks, draft handling, skills, unsupported fields, actual Sanctum session access, and explicitly enforced CSRF.

From the backend directory, using the existing PHP 8.3.33 executable:

```powershell
& 'C:\Tools\php83\php.exe' vendor/bin/phpunit --filter 'RoleProfileTest|ProfileDataTest|TestDatabaseGuardTest|TestDatabaseSafetyTest'
& 'C:\Tools\php83\php.exe' vendor/bin/phpunit
& 'C:\Tools\php83\php.exe' artisan migrate --no-interaction
& 'C:\Tools\php83\php.exe' artisan migrate:status
```

The main database migration command is additive only. Do not use migrate:fresh, rollback or seed against the main database. Auth/environment/frontend files are preserved; no dependency installation is required.

## Files introduced or extended

- `app/Enums/ParticipantRole.php`
- `database/migrations/2026_09_10_000001_create_role_authorization_tables.php`
- `database/migrations/2026_09_10_000002_create_founder_profiles_table.php`
- `database/migrations/2026_09_10_000003_create_investor_profile_tables.php`
- `database/migrations/2026_09_10_000004_create_professional_profile_tables.php`
- `app/Models/UserRole.php`
- `app/Models/AdminAccess.php`
- `app/Models/FounderProfile.php`
- `app/Models/InvestorProfile.php`
- `app/Models/InvestorPreference.php`
- `app/Models/ProfessionalProfile.php`
- `app/Models/Skill.php`
- `app/Http/Requests/Profiles/ProfileRequest.php`
- `app/Http/Requests/Profiles/EnrollParticipantRoleRequest.php`
- `app/Http/Requests/Profiles/UpdateProfessionalProfileRequest.php`
- `app/Http/Requests/Profiles/UpdateInvestorPreferenceRequest.php`
- `app/Policies/InvestorPreferencePolicy.php`
- `app/Policies/AdminAccessPolicy.php`
- `app/Http/Resources/FounderProfileResource.php`
- `app/Http/Resources/InvestorPreferenceResource.php`
- `app/Http/Resources/InvestorProfileResource.php`
- `app/Http/Resources/ProfessionalProfileResource.php`
- `app/Http/Resources/ProfileResource.php`
- `app/Http/Controllers/ProfileController.php`
- `app/Http/Controllers/ParticipantRoleController.php`
- `app/Http/Controllers/InvestorPreferenceController.php`
- `app/Http/Controllers/ProfessionalProfileController.php`
- `app/Policies/FounderProfilePolicy.php`
- `app/Policies/InvestorProfilePolicy.php`
- `app/Policies/ProfessionalProfilePolicy.php`
- `tests/Feature/RoleProfileTest.php`
- `tests/Feature/ProfileDataTest.php`
- `app/Models/User.php`
- `routes/api.php`
- `docs/profiles-authorization.md`

## Explicit exclusions

No frontend changes, business submission, discovery, matching, readiness scoring, verification workflows, reputation, deals, investment processing, financial reporting, profile-completion calculation, public profile browsing, role removal, or admin provisioning. Sanctum authentication, CSRF, existing API conventions, MySQL 127.0.0.1:3307, APP_KEY, UTC and English remain intact. Stored investment preferences use BDT/৳ only.
