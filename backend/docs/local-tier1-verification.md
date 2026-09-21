# Local Tier 1 verification — Part 2B

This adds local delivery and private admin review to the existing verification workflow.
It does not verify any existing participant or change NDA eligibility. Do not run the
manual journey until the implementation has been reviewed.

## Operator setup after review

The implementation deliberately does not migrate the development database or enable
delivery in its `.env`. Tests use only `vault_ventures_test` on `127.0.0.1:3307`, enforced
by `Tests\Support\SafeConnectionFactory`, including the concurrency workers.

1. Apply only the new migration from `backend` (existing foundation migrations must
   already be present):

   ```text
   php artisan migrate --path=database/migrations/2026_09_21_000001_complete_local_verification_infrastructure.php
   ```

   It adds delivery confirmation, participant feedback and evidence access auditing.
   It changes OTP expiry to DATETIME to prevent legacy MySQL/MariaDB implicit
   `ON UPDATE CURRENT_TIMESTAMP` from changing expiry on delivery/attempt updates.
   Existing verification tiers/timestamps and historical review messages are not backfilled.
   Outstanding challenges without delivery confirmation are intentionally unusable; request
   a fresh code through the normal endpoint.

2. On a **local-only** instance, explicitly configure:

   ```dotenv
   APP_ENV=local
   VERIFICATION_PHONE_DELIVERY=local_capture
   MAIL_MAILER=log
   FRONTEND_ORIGIN=http://localhost:8443
   ```

   Use the actual approved SPA origin, consistent with the app's session/CORS settings.
   Reload the backend; if configuration was cached, clear/rebuild that cache deliberately.
   Do not change the `APP_KEY`, since it protects existing encrypted evidence.

3. Confirm the operator/service account has private filesystem permissions on
   `storage/app/development-phone-verification`. On Windows, enforce appropriate NTFS
   permissions; Unix mode bits alone do not establish Windows access control.

## Manual journey (not performed by this implementation)

### Email

- Sign in as the intended participant and open `/app/profile?tab=verification`.
- Click **Send Verification Email**.
- The operator privately reads the full signed URL from the local mail log. Do not
  paste it into public issues, analytics or shared screenshots.
- Open that URL unchanged in the browser authenticated as the same participant.
- Laravel validates signature, expiry, user ID and email hash. Browser success redirects
  to the configured `FRONTEND_ORIGIN` plus `/app/profile?tab=verification`; API clients
  explicitly accepting JSON continue to receive JSON.
- The participant tab reloads account status. Request parameters cannot choose the return URL.

The log mailer is sufficient locally. A loopback mail catcher can be configured separately
if desired; no provider, credentials or external delivery has been added here.

### Phone

- Enter an international number including country calling code. The canonical form is
  `+` followed by 8–15 digits, with a nonzero first digit. Input may omit `+` and contain
  spaces, parentheses, periods or hyphens. Letters, extensions and `00` prefixes are
  rejected; no country is inferred. Formatting variants are checked against existing
  phone records without rewriting those records.
- Click **Send Code**. On successful local delivery, the operator reads:

  ```text
  backend/storage/app/development-phone-verification/latest.json
  ```

- This dedicated private disk is outside both the public disk and the served default
  `storage/app/private` root. `serve=false`; the directory is ignored by Git.
- The file contains only masked destination, code, challenge ID, creation and expiry.
  Exactly one capture is overwritten on every delivery, so historical captures do not
  accumulate. With several developers/users, coordinate access: `latest.json` is global,
  not an inbox per participant. An expired last capture may remain until overwritten;
  delete the capture after manual testing and do not back it up or share it.
- Enter the captured code in **Verify Phone**. The normal endpoint validates it. No
  automatic verification or production UI secret retrieval exists.
- The challenge expires in ten minutes, allows five wrong attempts, and has a 60-second
  resend cooldown. Both phone routes retain the existing shared six/minute user throttle.
- Resend expires older challenges. Verification locks user then latest challenge and
  validates delivery, unused state, expiry, attempt count, hash and destination uniqueness.
  Failure increments commit; double consumption and stale/superseded challenge use fail.
- Delivery happens outside database locks. Until delivery confirmation persists, the
  challenge cannot verify. Transport failure expires it and returns a safe 503, with no
  code or provider exception in the response. A failed send still consumes its cooldown.
  A crash before confirmation leaves an unusable challenge, never a verification bypass.

`disabled` is the default delivery configuration. There is no production SMS adapter.
Unknown drivers and `local_capture` outside `APP_ENV=local` fail startup; the adapter also
checks configuration at delivery time. Tests explicitly inject their own recording
transport; production never binds test fixtures.

### Request, documents and decisions

- After both contacts are verified, create a Tier 1 request and upload evidence through
  the participant UI. Current PDF/JPEG/PNG, five-file and 5 MiB/file limits remain.
- An authorized admin opens `/app/admin/verification`, reviews the request and selects
  **Submitted Evidence → View Evidence → Download document**.
- Downloads use cookie-authenticated
  `GET /api/admin/verification-requests/{request}/evidence/{evidence}/download`.
  Request/evidence membership and admin access are checked server-side. Files are decrypted
  only through existing private storage; no storage path, public URL or public token is returned.
- Responses have safe attachment disposition, allowed MIME type, `private, no-store`
  cache policy and `nosniff`. Each authorized successful retrieval initiation records actor,
  request, evidence, timestamp and action in `verification_evidence_access_logs`. Audit
  failure blocks the response; failed/denied reads do not record success. This audit means
  retrieval was initiated, not proof the browser completed or opened the download.
- The UI creates a local object URL only after authenticated retrieval. It is revoked on
  unmount, replacement or after 60 seconds. Downloaded copies are then the admin's responsibility.
- **Internal Admin Notes** remain private. **Message to Participant** is a separate optional
  rejection field and the required UI instruction for an information request. API validation
  accepts up to 2,000 characters and preserves legacy clients which omit the field.
- Existing records are never backfilled from `admin_notes` or `rejection_reason`, since those
  may contain private review material. Participants only see the explicit public message.
- Approval promotes Tier 0 to Tier 1 and preserves higher tiers. Cancelled, rejected and
  approved requests remain final. Refresh/focus/re-entry reloads the participant's status.

## Deliberately unchanged limitations

- Zero-evidence admin approval remains permitted and covered by regression tests. A production
  document checklist/minimum evidence policy is an unresolved product decision.
- At five uploaded files, a needs-information request has no replacement/deletion mechanism.
  Do not exceed or bypass the cap; that workflow requires a separate decision.
- No external SMS or production email delivery is configured. Production still needs a real
  adapter, credentials, delivery monitoring and appropriate abuse controls before launch.
- Tier 0 remains blocked from protected NDA acceptance. Tier 1 does not auto-sign or activate
  an NDA: existing role, relationship and bilateral acceptance rules still apply.

## Validation

Focused backend tests cover local isolation/failure, hashing, expiry/attempts, real independent
process lock contention, email signing/return, evidence authorization/auditing and message privacy.
The Professional NDA regression follows founder acceptance, Tier 0 denial, normal admin approval,
then Professional acceptance in the guarded test database only.

Do not run these fixtures against development records. Never manually alter participant tiers
or contact verification timestamps to demonstrate this workflow.

## Final validation results (2026-09-21)

- Focused verification, authentication, role and NDA backend regression: 186 tests,
  1,180 assertions, all passed.
- Relevant frontend regression: 99 tests across 10 files, all passed.
- Full frontend: 214 tests across 24 files passed with `npm.cmd test -- --maxWorkers=2`.
  Initial default-worker run had one timeout in
  `founder-professional-interest.test.tsx > renders incoming Professional interest with an actionable Founder button`
  while its loading state was visible (213 passed). No code or expectation was changed for
  that failure; the complete lower-concurrency rerun passed.
- Production frontend build: `npm.cmd run build` passed.
- Full guarded backend: 822 tests, 5,319 assertions, 779 passed and 43 failed.
  Business submission now produces `pending_approval` in
  `BusinessSubmissionController.php:23`, while `AnalysisInputBuilder.php:21` requires
  legacy `submitted`. The analysis tests therefore fail before their intended analysis
  assertions; document and readiness tests also expect the old submission status.
  These unrelated implementation/test files were not changed for Part 2B.
- Read-only full-row fingerprints for rafiul, his request list, Deal #3 and NDA #3
  exactly matched the original before snapshot after all tests. Rafiul remains Tier 0,
  email/phone unverified, phone null, and zero requests. Deal #3 remains
  `deal_room_opened`; NDA #3 remains pending, founder acceptance
  `2026-09-21 02:17:20`, counterparty acceptance null and activation null.
- Development migration and local delivery configuration remain unapplied. No manual
  verification, delivery, evidence upload or NDA signing was performed.

### Exact unrelated backend failures

```text
1) Tests\Feature\BusinessAnalysisTest::test_disabled_and_eligibility_do_not_generate_lock_or_consume_allowance
2) Tests\Feature\BusinessAnalysisTest::test_valid_output_exact_rendering_and_allowlisted_private_snapshot
3) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #0 ('malformed')
4) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #1 ('oversize')
5) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #2 ('utf8')
6) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #3 ('unknown_top')
7) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #4 ('unknown_nested')
8) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #5 ('duplicate_refs')
9) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #6 ('unknown_ref')
10) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #7 ('empty_refs')
11) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #8 ('long_id')
12) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #9 ('duplicate_factor')
13) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #10 ('unknown_factor')
14) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #11 ('coverage_short')
15) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #12 ('unknown_condition')
16) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #13 ('ineligible_condition')
17) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #14 ('duplicate_review')
18) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #15 ('unknown_suggestion')
19) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #16 ('duplicate_action')
20) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #17 ('score')
21) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #18 ('amount')
22) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #19 ('prose')
23) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #20 ('invented')
24) Tests\Feature\BusinessAnalysisTest::test_invalid_output_rejected_atomically with data set #21 ('object_list')
25) Tests\Feature\BusinessAnalysisTest::test_payload_rejected_and_no_public_fake_selection
26) Tests\Feature\BusinessAnalysisTest::test_reuse_history_recurring_source_and_pagination
27) Tests\Feature\BusinessAnalysisTest::test_exact_bdt_null_zero_and_current_matching_assessment
28) Tests\Feature\BusinessAnalysisTest::test_source_change_during_generation_rejects_persistence
29) Tests\Feature\BusinessAnalysisTest::test_all_snapshot_dependencies_and_excluded_fields
30) Tests\Feature\BusinessAnalysisTest::test_failure_logs_only_safe_metadata_and_preserves_source
31) Tests\Feature\BusinessAnalysisTest::test_non_reused_attempt_limit_and_reuse_exemption
32) Tests\Feature\BusinessAnalysisTest::test_generation_lock_conflict_expiry_and_ownership
33) Tests\Feature\BusinessAnalysisTest::test_database_constraints_and_immutable_history
34) Tests\Feature\BusinessAnalysisTest::test_ownership_admin_csrf_and_anonymous_boundaries
35) Tests\Feature\BusinessAnalysisTest::test_real_sanctum_session_disabled_and_fake_environment_guard
36) Tests\Feature\BusinessAnalysisTest::test_stale_assessment_rejected_without_recalculating
37) Tests\Feature\BusinessAnalysisTest::test_funding_conflict_rendered_only_from_existing_assessment
38) Tests\Feature\BusinessAnalysisTest::test_existing_but_inapplicable_suggestion_and_complete_factor_condition_rejected
39) Tests\Feature\BusinessAnalysisTest::test_overlapping_request_cannot_generate_duplicate_analysis
40) Tests\Feature\BusinessAnalysisTest::test_cross_business_assessment_foreign_key
41) Tests\Feature\BusinessAnalysisTest::test_insert_failure_has_no_history_version_gap_or_source_mutation
42) Tests\Feature\BusinessDocumentTest::test_documents_do_not_change_submission_eligibility_or_status
43) Tests\Feature\ReadinessAssessmentTest::test_funding_and_submission_failures_preserve_source_success
```

### Part 2B file manifest

This lists files added or amended for Part 2B, including amendments to earlier participant
workflow files. Other pre-existing workspace changes were preserved and are excluded.

```text
backend/.env.example
backend/.gitignore
backend/config/verification.php
backend/config/filesystems.php
backend/app/Providers/AppServiceProvider.php
backend/app/Contracts/PhoneVerificationCodeDeliveryInterface.php
backend/app/Services/Verification/LocalPhoneCodeDelivery.php
backend/app/Services/Verification/UnavailablePhoneCodeDelivery.php
backend/app/Services/PhoneVerificationService.php
backend/app/Models/PhoneVerificationCode.php
backend/app/Http/Controllers/Auth/PhoneVerificationController.php
backend/app/Http/Controllers/Auth/VerificationController.php
backend/app/Http/Controllers/AdminVerificationRequestController.php
backend/app/Http/Requests/Verification/RejectVerificationRequestRequest.php
backend/app/Http/Requests/Verification/RequestInformationVerificationRequestRequest.php
backend/app/Http/Resources/VerificationRequestResource.php
backend/app/Http/Resources/AdminVerificationRequestResource.php
backend/app/Models/VerificationEvidenceAccessLog.php
backend/app/Services/VerificationRequestService.php
backend/routes/api.php
backend/database/migrations/2026_09_21_000001_complete_local_verification_infrastructure.php
backend/docs/verification-foundation.md
backend/docs/local-tier1-verification.md
backend/tests/Support/RecordingPhoneCodeDelivery.php
backend/tests/Fixtures/verify-phone-worker.php
backend/tests/Feature/PhoneDeliveryInfrastructureTest.php
backend/tests/Feature/PhoneVerificationConcurrencyTest.php
backend/tests/Feature/VerificationInfrastructureTest.php
backend/tests/Feature/PhoneVerificationTest.php
backend/tests/Feature/BusinessNdaApiTest.php
src/services/api.ts
src/context/AuthContext.tsx
src/pages/auth/VerifyEmail.tsx
src/pages/admin/VerificationQueue.tsx
src/components/verification/ParticipantVerification.tsx
src/tests/admin-verification-infrastructure.test.tsx
src/tests/email-verification-navigation.test.tsx
src/tests/participant-verification.test.tsx
src/tests/participant-verification-api.test.tsx
src/tests/phase10.test.tsx
```
