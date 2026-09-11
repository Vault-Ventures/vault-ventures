# Phase 2 — Part 3 — Business Documents & Submission Workflow

## Scope and source

Implements optional owner-private business plans and pitch decks. Master Specification §§12.2, 13, 14, 23, 28–29 support business documents, private access and auditing; §33 distinguishes submission from later analysis/publication. The owner approved storing documents before the future sharing/disclosure workflow. Uploads are not required by the specification or by this implementation for business submission.

No submission code, five-field minimum, draft/submitted status, repeat-submission behavior, funding, or skills changed. No new business fields or statuses.

## Implementation limits

These are implementation decisions, not Master Specification requirements:
- Only PDF files, with both detected PDF MIME type and .pdf extension.
- Maximum 2 MiB (2,048 KiB) per file, matching current PHP upload_max_filesize=2M. PHP post_max_size is 8M. Neither PHP configuration nor environment files changed.
- Maximum 10 documents per business across both kinds. Multiple plans/decks may coexist; no special “current version” meaning.
- Original filenames at most 255 characters, stripped of path components and control characters.
- No delete, replacement, or versioning API. Count limits do not create an automatic eviction policy.

PDF validation is not malware scanning, semantic document validation, or proof that file content belongs to a permitted category. Financial/identity evidence categories are rejected; content is not parsed.

## API and authorization

| Method | Route | Response |
| --- | --- | --- |
| GET | /api/me/businesses/{business}/documents | Existing JSON envelope; ordered metadata list |
| POST | /api/me/businesses/{business}/documents | Multipart kind + file; existing JSON envelope, 201 |
| GET | /api/me/businesses/{business}/documents/{document}/download | Authorized PDF bytes with attachment headers |

Kinds: business_plan or pitch_deck. No client disk/path/owner/business ID/audit actor/disclosure fields are accepted in upload payloads. Listing accepts no extra query fields.

All routes use existing auth:sanctum; uploads also use RequireSpaSession and existing CSRF protection. Founder role/profile and ownership are checked through existing BusinessPolicy, with BusinessDocumentPolicy for document actions. Document IDs are resolved through the owned business. No investor/professional sharing or admin bypass.

Anonymous access returns 401, missing Founder membership 403, cross-owner/nested mismatches 404, invalid uploads/protected fields/count limits 422, and CSRF failures 419. Errors preserve existing envelopes. Resource fields are id, kind, original_name, mime_type, size_bytes, created_at; no filesystem paths, disk, owner ID, or shareable URL.

## Storage, encryption, and download audit

Dedicated local disk business_documents uses storage/app/business-documents, outside both app/private and app/public. Its visibility is private, serve=false, and storage exceptions are enabled. No public link, serving route, or temporary URL is created. Existing local/public disks remain unchanged. Git ignores uploaded files through the existing storage/app/.gitignore.

Paths are server-generated business ID/UUID.enc values. Contents are encrypted with Laravel Crypt using the existing APP_KEY; the key is neither changed nor exposed. Preserve that key securely with backups: loss of the key makes stored documents unreadable. Metadata filenames are not encrypted.

Downloads validate ownership every time, validate stored disk/path references, decrypt content, and persist a download_initiated record before returning bytes. Missing files return 404; corruption or audit persistence failure prevents file delivery. Attachments use application/pdf, nosniff, and private/no-store cache headers. The audit records access initiation, not completed client receipt; HEAD requests follow Laravel's GET route handling and also record initiation.

document_access_logs stores document ID, authenticated actor user ID, action, and UTC occurred_at. No client audit fields and no audit viewing/admin API. Sensitive document bytes are not included in logs. List metadata access is not treated as a document-byte download.

The existing approved localhost HTTP setup remains for local development. HTTPS is still required for deployment; this Part does not configure TLS.

## Persistence and failure handling

- business_documents: id, business_id FK, kind, original_name, disk, unique path, mime_type, size_bytes, timestamps.
- document_access_logs: id, business_document_id FK, actor_user_id FK, action, occurred_at.
- Business has many documents; each document has many access logs; logs reference the actor. No duplicate owner_id.
- Foreign keys restrict parent deletion. No new public provisioning or deletion workflow.

Uploads lock the business row for count enforcement. File write and metadata persistence are coordinated inside a database transaction with no automatic retry of filesystem side effects. On an exception, metadata rolls back and the generated path is deleted, including partial writes. Cleanup failures are reported server-side; persistent disk failure or process termination can still leave an orphaned encrypted file. There is no automatic reconciliation job in this scope.

## Verification — 2026-09-10

- Focused document suite: **22 tests, 235 assertions passed**.
- Full regression: **202 tests, 1,309 assertions passed**, PHP 8.3.33.
- Tests use the guarded vault_ventures_test database and isolated fake storage; no main-business records or uploads created.
- Covers both kinds, MIME/extension/size/count validation, response fields, encryption round-trip, ownership/admin/nested isolation, anonymous denial, CSRF, real Sanctum sessions, access audits, audit failure, partial writes, metadata failure cleanup, corrupt/missing files, unchanged submission rules.
- Direct public/local paths are denied, no storage.business_documents route exists, and even an internally signed local-disk URL cannot reach document storage.
- Two additive migrations applied in batch 5; both new tables empty. Existing main data counts/hashes unchanged except the two migration ledger entries.
- 246 existing source/configuration files compared; only Business.php, routes/api.php, config/filesystems.php changed. Authentication, frontend, environment, completed requirements/submission code and safety guard unchanged.

Migrations:
- 2026_09_10_000009_create_business_documents_table
- 2026_09_10_000010_create_document_access_logs_table

Commands from backend:
```powershell
& C:/Tools/php83/php.exe vendor/bin/phpunit --filter 'BusinessDocumentTest|BusinessDocumentAuthorizationTest'
& C:/Tools/php83/php.exe vendor/bin/phpunit
& C:/Tools/php83/php.exe artisan route:list --path=documents -vv
& C:/Tools/php83/php.exe artisan migrate --no-interaction --path=database/migrations/2026_09_10_000009_create_business_documents_table.php --path=database/migrations/2026_09_10_000010_create_document_access_logs_table.php
& C:/Tools/php83/php.exe artisan migrate:status --no-interaction
```
Existing Pint formatted only the 15 changed PHP files. No packages or seeders. No destructive main-database commands.

## Remaining limitations

No sharing, disclosure/NDA/Deal Room access, financial/identity evidence workflows, parsing/AI, review/approval/publication, financial features, delete/replacement/versioning, retention automation, antivirus scanning, admin workflows, or frontend changes. Files persist until a future approved retention workflow; cleanup only removes failed upload artifacts. Future document sharing must introduce explicit relationship permissions and must not reuse private downloads as public URLs.
