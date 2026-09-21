# Phase 4 Part 1 — Phone Verification, Verification Schema & Evidence Storage

> Updated local delivery, admin document retrieval and participant feedback behavior is documented
> in [Local Tier 1 verification — Part 2B](local-tier1-verification.md). Historical phase notes below
> describe the original foundation; Part 2B supersedes the no-delivery and metadata-only limitations.

## Overview

Phase 4 Part 1 provides the foundation for user identity verification on Vault Ventures:
1. **Phone Verification**: Secure OTP issuance and verification foundation.
2. **Verification Schema**: Three-tier trust model (`Tier 0`, `Tier 1`, `Tier 2`) and verification request lifecycle schema.
3. **Encrypted Evidence Storage**: Isolated, encrypted file storage for user-submitted verification documents.

---

## 1. Phone Verification Behavior

- **Issuance**: Authenticated users can request a 6-digit numeric OTP sent to their phone number via `POST /api/me/phone/send-code`.
- **Formatting**: Phone numbers are validated and normalized to international standard format (`^\+?[1-9]\d{7,14}$`).
- **Resend Cooldown**: Enforces a strict 60-second cooldown per user between code issuance requests. OTP issuance requests serialize under pessimistic database locking to guarantee concurrency safety.
- **Expiration**: Verification codes expire 10 minutes after generation.
- **Attempt Limit**: Maximum 5 attempts allowed per verification code. Exceeding 5 attempts permanently invalidates the code.
- **Single-Use**: Once successfully verified via `POST /api/me/phone/verify-code`, the code is marked `verified_at = now()` and cannot be reused.
- **Code Hashing**: Plaintext OTP codes are hashed via bcrypt (`Hash::make`) and never stored in plaintext in the database.
- **Prototype-Safe OTP Limitation**: Real external SMS provider and carrier network integrations are **not implemented**. OTP codes are generated via `OtpGeneratorInterface` (defaulting to `RandomOtpGenerator` in production) and test retrieval is isolated strictly within test infrastructure (`TestingOtpGenerator`). Production code never exposes OTP codes through static properties, responses, logs, exceptions, or events.

---

## 2. Verification Tier Definitions

The platform defines three verification tiers represented by `App\Enums\VerificationTier`:

| Tier | Label | Contract & Meaning | Qualification Status |
|---|---|---|---|
| **Tier 0** | `Email & Phone Verified` | Email + Phone verification only. Default state for users who have completed basic contact verification. | Implemented (Basic contact verification). |
| **Tier 1** | `Identity Verified` | Identity verified via government ID document evidence reviewed by platform administrators. | Evidence schema & storage implemented in Part 1; submission & review deferred to Parts 2 & 3. |
| **Tier 2** | `Track-Record Verified` | Verified past track record and deal execution history. | **Deferred** to future on-platform verified activity, deal, and project modules. |

---

## 3. Verification Schema & Audit Logging

- **`verification_requests` Table**:
  - Links user, requested tier (`Tier1` / `Tier2`), current status (`pending`, `under_review`, `needs_information`, `approved`, `rejected`, `cancelled`), timestamps, reviewer notes, and assigned admin.
  - Foreign key constraints restrict accidental cascade deletion of users with active verification requests.
- **`verification_evidence` Table**:
  - Tracks individual uploaded evidence documents associated with a verification request.
  - Enforces metadata isolation: disk name, relative UUID-namespaced path (`{request_id}/{uuid}.enc`), original filename, MIME type, and size in bytes.
- **`verification_audit_logs` Table**:
  - Immutable audit trail recording state transitions, acting user/admin, transition reason, and timestamp.

---

## 4. Evidence Storage Constraints

- **Disk Isolation**: Evidence files are stored on a dedicated private disk (`verification_evidence`) rooted at `storage/app/verification-evidence` with `serve => false`.
- **Payload Encryption**: All evidence files are encrypted at rest using AES-256-CBC via `Crypt::encryptString()` before writing to disk. Plaintext bytes are never stored on disk.
- **File Validation**:
  - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`.
  - **Maximum file size**: 5 MiB (5,242,880 bytes).
  - **Maximum files per request**: 5 files.
- **Path Tamper Prevention**: Read operations strictly validate disk identity and verify that file paths match the expected `{verification_request_id}/{uuid}.enc` pattern.

---

## 5. Tier 1 Verification Request Creation (Part 2A)

- **Endpoint**: `POST /api/me/verification-requests`
  - Requires active authenticated session (`auth:sanctum`), SPA cookie session, and CSRF protection (`RequireSpaSession`).
  - **Prerequisites (Tier 0)**: User must have verified both email (`hasVerifiedEmail()`) and phone (`hasVerifiedPhone()`). Unverified email or phone returns HTTP 422 with `VALIDATION_ERROR`.
  - **Single Active Request Rule**: Users with an active request in `pending`, `under_review`, or `needs_information` status cannot submit another request (returns HTTP 422).
  - **Already Verified Check**: Users already possessing Tier 1+ verification cannot submit a duplicate Tier 1 request (returns HTTP 422).
  - **Starting State**: Newly created requests always begin in `VerificationRequestStatus::Pending` (`pending`). No automatic approval is performed.
  - **Concurrency Safety**: Requests are serialized under pessimistic `lockForUpdate()` within `DB::transaction`.
  - **Supported Tier**: Accepts only Tier 1 (`requested_tier = 1`). Tier 2 requests are rejected (HTTP 422).
- **Retrieval Endpoints**:
  - `GET /api/me/verification-requests/latest`: Retrieves the user's latest verification request or `data: null`.
  - `GET /api/me/verification-requests/{verification_request}`: Retrieves a specific verification request owned by the user. Enforces strict ownership via `VerificationRequestPolicy` (returns HTTP 403 Forbidden for cross-user requests).
- **Safe Serialization**: `VerificationRequestResource` strictly returns request metadata (`id`, `user_id`, `requested_tier`, `requested_tier_label`, `status`, `submitted_at`, `reviewed_at`, `created_at`, `updated_at`) and never exposes internal admin notes or evidence payload contents.

---

## 6. Tier 1 Evidence Upload (Part 2B)

- **Upload Endpoint**: `POST /api/me/verification-requests/{verification_request}/evidence`
  - Requires active authenticated session (`auth:sanctum`), SPA cookie session, and CSRF protection (`RequireSpaSession`).
  - **Ownership Authorization**: Enforces strict user ownership via `VerificationRequestPolicy::uploadEvidence` (cross-user access returns HTTP 403 Forbidden).
  - **Tier 1 Only**: Evidence can only be uploaded to Tier 1 identity verification requests (`requested_tier === VerificationTier::Tier1`). Tier 2 requests return HTTP 422.
  - **Active Request Status Only**: Evidence can only be added while the request is in an active state (`pending`, `under_review`, `needs_information`). Closed or finalized requests (`approved`, `rejected`, `cancelled`) return HTTP 422.
  - **File Limit**: Maximum of 5 evidence files per verification request. Exceeding 5 files returns HTTP 422.
  - **File Validation**: Files must be PDF, JPEG, or PNG (`mimes:pdf,jpg,jpeg,png`) with a maximum size of 5 MiB (5,120 KiB / 5,242,880 bytes).
  - **Private / Encrypted Storage**: Handled via `VerificationEvidenceStorage` onto the private `verification_evidence` disk (`storage/app/verification-evidence` with `serve => false`). Stored files are AES-256 encrypted string bytes (`Crypt::encryptString`).
  - **Failure Cleanup**: In case of database transaction failure or exception after file write, uploaded encrypted artifacts are reliably cleaned up from disk.
  - **Safe Serialization**: `VerificationEvidenceResource` exposes only safe metadata (`id`, `verification_request_id`, `original_filename`, `mime_type`, `file_size_bytes`, `created_at`). Disk name, internal storage path, and file contents are never exposed.
- **Evidence Listing Endpoint**: `GET /api/me/verification-requests/{verification_request}/evidence`
  - Requires active authenticated session (`auth:sanctum`).
  - Enforces strict user ownership via `VerificationRequestPolicy::view` (cross-user access returns HTTP 403 Forbidden).
  - Returns a collection of safe metadata-only `VerificationEvidenceResource` objects.
  - **No download endpoints**: File download endpoints are strictly omitted.

---

## 7. Admin Verification Review Foundation (Part 3A)

- **Review Queue Endpoint**: `GET /api/admin/verification-requests`
  - Requires authenticated session (`auth:sanctum`) and verified admin access (`$user->hasAdminAccess()`). Non-admin users receive HTTP 403 Forbidden.
  - Returns a list of Tier 1 verification requests requiring review (`pending`, `under_review`, `needs_information`) ordered by submission timestamp.
  - Supports optional status filtering for Tier 1 requests (`?status=pending|under_review|needs_information|approved|rejected|cancelled`).
  - Tier 2 requests are strictly excluded.
  - Serialized via `AdminVerificationRequestResource` with user metadata (`id`, `name`, `email`, `phone`), request status, and evidence count.
- **Request Detail Endpoint**: `GET /api/admin/verification-requests/{verification_request}`
  - Requires authenticated session (`auth:sanctum`) and admin access. Non-admin users receive HTTP 403 Forbidden.
  - Returns detailed Tier 1 request metadata, user information, assigned admin details (if any), and safe evidence metadata collection via `VerificationEvidenceResource`.
  - Tier 2 requests return HTTP 404 Not Found.
  - Raw evidence payload bytes, storage disk, and filesystem paths are never exposed.
  - **No State-Changing Actions in Part 3A**: Approval, rejection, notes, tier elevation, and request-more-information decision workflows are **not implemented** in Part 3A.

---

## 8. Admin Verification Decision Actions (Part 3B)

- **Approve Endpoint**: `POST /api/admin/verification-requests/{verification_request}/approve`
  - Requires authenticated admin session (`auth:sanctum`), SPA cookie session, and CSRF protection (`RequireSpaSession`).
  - Allowed on active Tier 1 requests (`pending`, `under_review`, `needs_information`). Closed/finalized requests return HTTP 422.
  - Transitions request status to `approved`, records `reviewed_at = now()`, `assigned_admin_id = $admin->id`, and optional `admin_notes`.
  - Elevates user verification tier to **Tier 1** (`$user->verification_tier = VerificationTier::Tier1`).
  - Creates immutable audit log in `verification_audit_logs` (`action = 'approved'`, `previous_status`, `new_status = 'approved'`, `actor_user_id = $admin->id`, `notes`).
- **Reject Endpoint**: `POST /api/admin/verification-requests/{verification_request}/reject`
  - Requires authenticated admin session (`auth:sanctum`), SPA cookie session, and CSRF protection (`RequireSpaSession`).
  - Transitions request status to `rejected`, records `reviewed_at = now()`, `assigned_admin_id = $admin->id`, `rejection_reason`, and optional `admin_notes`.
  - User verification tier remains unchanged (**Tier 0**).
  - Creates immutable audit log in `verification_audit_logs` (`action = 'rejected'`, `previous_status`, `new_status = 'rejected'`, `actor_user_id = $admin->id`, `notes`).
- **Request More Information Endpoint**: `POST /api/admin/verification-requests/{verification_request}/request-information`
  - Requires authenticated admin session (`auth:sanctum`), SPA cookie session, and CSRF protection (`RequireSpaSession`).
  - Transitions request status to `needs_information`, records `reviewed_at = now()`, `assigned_admin_id = $admin->id`, and `admin_notes`.
  - User verification tier remains unchanged (**Tier 0**).
  - Creates immutable audit log in `verification_audit_logs` (`action = 'needs_information'`, `previous_status`, `new_status = 'needs_information'`, `actor_user_id = $admin->id`, `notes`).
- **Concurrency & Decision Safety**:
  - Review actions serialize under pessimistic `lockForUpdate()` within `DB::transaction`.
  - Repeated/invalid state transitions on finalized requests return HTTP 422 `VALIDATION_ERROR`.
  - Tier 2 requests cannot be reviewed (return HTTP 422).

---

## 9. Verification Gating Foundation (Part 4A)

- **Reusable Verification Gating Middleware**:
  - `App\Http\Middleware\EnsureVerificationTier` registered with alias `'verification.tier'`.
  - Supports parameterized tier enforcement: `verification.tier:1`, `verification.tier:2`, `verification.tier:identity`, `verification.tier:track_record`.
  - Unauthenticated requests return HTTP 401 `AUTHENTICATION_REQUIRED`.
  - Authenticated users whose verification tier is below the required tier receive HTTP 403 Forbidden with standard envelope:
    ```json
    {
      "error": {
        "code": "HTTP_403",
        "message": "Tier 1 (Identity Verified) verification is required to perform this action."
      }
    }
    ```
- **User Model Tier Helpers**:
  - `User::hasVerificationTier(VerificationTier|int $requiredTier): bool`: Compares user's current numeric tier against required tier.
  - `User::isIdentityVerified(): bool`: Returns true if verification tier is `Tier1` (1) or higher.
  - `User::isTrackRecordVerified(): bool`: Returns true if verification tier is `Tier2` (2) or higher.
- **Authorization Gates (`Gate` Facade)**:
  - `Gate::allows('tier-0', $user)`: Passes if user has at least Tier 0 (`verification_tier >= 0`).
  - `Gate::allows('identity-verified', $user)`: Passes if user has at least Tier 1 (`verification_tier >= 1`).
  - `Gate::allows('track-record-verified', $user)`: Passes if user has Tier 2 (`verification_tier >= 2`).
  - `Gate::allows('verification-tier', [$user, $requiredTier])`: Dynamic gate accepting either integer or `VerificationTier` enum.
- **Specification Compliance & Module Boundary**:
  - In accordance with the Master Project Specification (Sections 11 & 24), Tier 0 users can freely browse, search, create founder profiles, create businesses, and assess readiness. Higher-trust actions (e.g. Stage 3 NDA access, investor deal rooms) belong to future modules.
  - Therefore, the gating foundation is established without introducing breaking gates onto existing Phase 1–3 endpoints.

---

---

## 10. Verification Profile Integration (Part 4B)

- **Safe Account & Profile Verification Exposure**:
  - `UserResource` (used on `GET /api/auth/user`, `POST /api/auth/login`) exposes:
    - `phone`: sanitized/formatted phone string (e.g., `+15551234567`) or null.
    - `phone_verified_at`: ISO timestamp or null.
    - `verification_tier`: integer (0 for Tier 0, 1 for Tier 1, 2 for Tier 2).
    - `verification_tier_label`: human-readable label (`Email & Phone Verified`, `Identity Verified`, `Track-Record Verified`).
  - Sensitive data strictly excluded: No OTP codes, password hashes, remember tokens, evidence storage paths, admin notes, or internal filesystem disk references are ever exposed.
  - Registration response preserves standard clean initialization payload (`id`, `name`, `email`, `email_verified_at = null`).
  - `GET /api/me/profile` multi-role participant profile aggregation remains fully backwards-compatible and operational.

---

## 11. Explicit Limitations & Boundaries

1. **No Frontend Changes**: Frontend files remain completely untouched (0 frontend files modified).
2. **No Phase 1–3 Modifications**: Existing contracts and behaviors remain fully preserved.
3. **No New Verification Workflows**: No new verification request or review pathways were introduced.
4. **No Tier 2 Qualification**: Tier 2 remains strictly deferred and cannot be attained through any new logic.
5. **No External KYC / Network Provider**: No third-party KYC or external identity verification services are integrated.
6. **No Git Push**: Git branches/commits remain local.

