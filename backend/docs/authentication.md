# Phase 1 Part 2: Authentication

The backend uses Laravel Sanctum SPA cookie authentication. Browser origin: `http://localhost:8443`. Backend: `http://localhost:8000`. MySQL remains `127.0.0.1:3307`; application/database timezone is UTC and locale is English. Only the exact frontend origin receives credentialed CORS access.

## Browser protocol

1. Request `GET /sanctum/csrf-cookie` with credentials included. It returns 204 and establishes the session and readable `XSRF-TOKEN` cookie.
2. Send credentialed requests to `/api/auth/*`, with `Accept: application/json` and the URL-decoded XSRF cookie value in `X-XSRF-TOKEN`. The browser supplies Origin/Referer. A raw session CSRF token can alternatively use `X-CSRF-TOKEN`.
3. The session cookie is HttpOnly, host-only, and SameSite=Lax. Local HTTP uses `SESSION_SECURE_COOKIE=false`; HTTPS deployments must enable secure cookies. Browser sessionStorage/localStorage is never trusted for identity or authorization.
4. Registration and login rotate session IDs. Logout invalidates the session and rotates CSRF state. Obtain CSRF cookies again as needed after logout/reset or a 419 response.

Bearer-token authentication is explicitly disabled. No personal-access-token table or token issuance endpoint is installed. CSRF cookies and emailed reset/verification links are protocol secrets; none are returned in API JSON.

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | CSRF bootstrap, 204 |
| POST | `/api/auth/register` | name, email, password, password_confirmation; creates an unverified user and session, sends verification notification; 201 |
| POST | `/api/auth/login` | email, password; session login, 200; incorrect credentials return generic 422 |
| POST | `/api/auth/logout` | authenticated session required; 200 |
| GET | `/api/auth/user` | authenticated user, 200; anonymous requests return 401 |
| POST | `/api/auth/forgot-password` | email; generic 200 regardless of account existence or broker cooldown |
| POST | `/api/auth/reset-password` | email, token, password, password_confirmation; 200 or generic invalid/expired-link 422 |
| POST | `/api/auth/email/verification-notification` | authenticated, throttled resend; 200 |
| GET | `/api/auth/email/verify/{id}/{hash}` | authenticated browser session plus valid signed link for that user; 200 or 403 |

API envelopes remain as specified in `api-foundation.md`. User data is restricted to id, name, email, and email_verified_at. Passwords, hashes, remember tokens, reset tokens and admin/role input are excluded. Normal web routes retain their original behavior.

Passwords require at least 12 characters, mixed case and a number. Inputs exceeding bcrypt's 72-byte limit or containing null characters are rejected. Passwords are hashed by the existing User cast. Email is normalized to lowercase; the database unique index protects duplicate registrations.

## Authorization and limits

Protected endpoints use `auth:sanctum`. Verification links additionally enforce the authenticated user's ID and email hash plus signature expiry. The User implements MustVerifyEmail; Laravel's `verified` middleware is available and tested for future protected features. Unverified users can inspect their own account, log out and request verification. No business permissions or roles are implemented.

Login allows five requests per minute per normalized email/IP pair and 30 per IP. Registration and recovery each allow five requests per minute per IP; verification allows six per minute per authenticated user. Limits use the configured cache and return structured 429 errors with Retry-After. Password broker reset links expire after 60 minutes and have a 60-second resend cooldown.

Password reset tokens are hashed in the existing password_reset_tokens table and consumed on successful reset. Reset changes the password, rotates the remember token, revokes that user's database sessions, and invalidates the requesting session. Verification links expire after 60 minutes and require login as the matching user.

## Local notifications and limitations

MAIL_MAILER remains log. Notifications can be inspected locally, but no external email is delivered. Password reset mail points to `http://localhost:8443/reset-password` with the token and email; connecting that route to a reset form is a future frontend task. Verification links point to the backend and return JSON; opening a link without an authenticated matching session returns 401. These are backend foundations, not completed frontend flows.

No new migrations or fields were required. Existing users/default migrations were preserved; no seeders or main-database reset commands ran. Main-database migration checks are read-only. Default factory accounts are used only inside guarded test transactions.

## Verification

Use PHP 8.3.33 explicitly from the backend directory:

```powershell
& 'C:\Tools\php83\php.exe' vendor/bin/phpunit --filter 'AuthenticationTest|TestDatabaseGuardTest|TestDatabaseSafetyTest'
& 'C:\Tools\php83\php.exe' vendor/bin/phpunit
```

Tests use the existing guarded factory before Laravel's RefreshDatabase lifecycle; only vault_ventures_test is allowed. The test schema is refreshed from the three existing migrations, with no seeders, and test records are rolled back. CSRF tests explicitly re-enable validation normally bypassed by Laravel's test environment. Session tests replay the old session after logout to verify rejection.

No frontend, business-domain, investment, deal, NDA, milestone or financial implementation is included. Future monetary values must use BDT/৳.
