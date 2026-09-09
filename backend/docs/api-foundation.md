# API foundation

Backend URL: `http://localhost:8000`. The confirmed browser-facing frontend origin is `http://localhost:8443`, set in the local `FRONTEND_ORIGIN` environment variable and documented in `.env.example`. Only this exact origin is allowed; `http://127.0.0.1:8443` is a different origin. Empty configuration allows no cross-origin access. Phase 1 Part 2 enables credentials and CSRF headers for Sanctum cookie authentication; see [authentication.md](authentication.md).

`GET /api/health` is a liveness endpoint, not a database readiness check. It returns:

```json
{"success":true,"message":"Success.","data":{"status":"ok"}}
```

Return successful JSON through `App\Http\Responses\ApiResponse::success()`. Use 200 for reads/updates, 201 for resource creation, and an empty 204 response where no content is appropriate. Do not wrap 204 responses in JSON.

For API exceptions, HTTP status codes are preserved. General error messages are safe HTTP descriptions, even in debug mode:

```json
{"success":false,"message":"Not Found","error":{"code":"HTTP_404","details":{}}}
```

Validation errors return HTTP 422:

```json
{"success":false,"message":"The given data was invalid.","error":{"code":"VALIDATION_ERROR","details":{"label":["The label field is required."]}}}
```

For endpoints with input, create a dedicated Laravel Form Request. Define explicit `rules()` and `authorize()` behavior, and use only `validated()` or `safe()` data. Keep authorization separate from client-supplied roles. Do not override validation failure handling just to format JSON; the API exception handler handles it centrally. Authentication requests follow this convention; the foundation example request remains a test-only fixture.

API path matching covers `/api` and `/api/*`, including unmatched routes. Web exception behavior is unchanged. HTTP headers such as `Allow` and `Retry-After` are retained. Use the shared error helper for intentional non-exception errors; avoid ad hoc response envelopes.

## Tests

From the backend directory:

```powershell
& 'C:\Tools\php83\php.exe' vendor/bin/phpunit
```

Every application/database test must extend `Tests\TestCase`. It installs a guarded connection factory before provider boot and before Laravel database-reset traits execute. It only permits the exact MySQL test database `vault_ventures_test` at `127.0.0.1:3307`, rejects URL/socket/read/write overrides, and checks each newly constructed connection. It also requires the testing environment. Configuration changes and alternate connection names cannot silently switch to the main database.

Foundation tests do not reset, migrate, seed, or write either database. Authentication tests use RefreshDatabase only against the guarded test database and roll back test records. The guard applies to Laravel connections in this test harness, not manually created PDO connections, shell commands, or deliberate bypasses. Do not bypass the test harness. A separately restricted test database account would add database-level isolation later. Parallel test database suffixes are intentionally not allowed.

No authentication package, auth endpoints, domain migrations, financial logic, or frontend changes are part of this foundation. Product text remains English. Storage remains UTC; future display dates use Bangladesh time and future monetary values use BDT/৳.
