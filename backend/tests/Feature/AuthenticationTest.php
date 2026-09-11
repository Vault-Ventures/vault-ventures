<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'ExampleStrong123!';

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function credentials(): array
    {
        return ['name' => 'Test Person', 'email' => 'person@example.test',
            'password' => self::PASSWORD, 'password_confirmation' => self::PASSWORD];
    }

    private function continueSession(): void
    {
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
    }

    public function test_registration_hashes_password_and_excludes_sensitive_fields(): void
    {
        $data = $this->credentials() + ['is_admin' => true, 'email_verified_at' => now()->toISOString()];
        $response = $this->postJson('/api/auth/register', $data)->assertCreated()
            ->assertJsonPath('success', true)->assertJsonPath('data.email_verified_at', null);
        $user = User::firstOrFail();
        $this->assertTrue(Hash::check(self::PASSWORD, $user->password));
        $this->assertNotSame(self::PASSWORD, $user->password);
        $this->assertSame(['id', 'name', 'email', 'email_verified_at'], array_keys($response->json('data')));
        $response->assertDontSee(self::PASSWORD)->assertDontSee($user->password)->assertJsonMissingPath('token');
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->continueSession();
        $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_duplicate_email_is_rejected_case_insensitively(): void
    {
        User::factory()->create(['email' => 'person@example.test']);
        $this->postJson('/api/auth/register', array_replace($this->credentials(), ['email' => 'PERSON@example.test']))
            ->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['details' => ['email']]]);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_invalid_registration_is_rejected(): void
    {
        $this->postJson('/api/auth/register', ['name' => '', 'email' => 'invalid', 'password' => 'short'])
            ->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['name', 'email', 'password']]]);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_login_rotates_session_and_logout_revokes_it(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->create(['email' => 'person@example.test', 'password' => self::PASSWORD]);
        $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $old = $this->app['session']->driver()->getId();
        $this->continueSession();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => self::PASSWORD])
            ->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonMissingPath('data.password');
        $authenticatedId = $this->app['session']->driver()->getId();
        $this->assertNotSame($old, $authenticatedId);
        $this->assertDatabaseMissing('sessions', ['id' => $old]);
        $this->continueSession();
        $this->getJson('/api/auth/user')->assertOk();
        $this->continueSession();
        $this->postJson('/api/auth/logout')->assertOk()->assertJsonPath('message', 'Logged out.');
        $this->assertDatabaseMissing('sessions', ['id' => $authenticatedId]);
        $this->withCookie(config('session.cookie'), $authenticatedId);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user')->assertUnauthorized()->assertJsonPath('error.code', 'HTTP_401');
    }

    public function test_invalid_credentials_and_login_validation(): void
    {
        User::factory()->create(['email' => 'person@example.test']);
        $this->postJson('/api/auth/login', ['email' => 'person@example.test', 'password' => 'incorrect'])
            ->assertUnprocessable()->assertJsonPath('error.details.email.0', 'The provided credentials are incorrect.');
        $this->postJson('/api/auth/login', [])->assertUnprocessable()
            ->assertJsonStructure(['error' => ['details' => ['email', 'password']]]);
        $this->assertGuest('web');
    }

    public function test_anonymous_and_bearer_only_requests_are_rejected(): void
    {
        $this->getJson('/api/auth/user')->assertUnauthorized()->assertJsonPath('error.code', 'HTTP_401');
        $this->withHeader('Authorization', 'Bearer 1|not-a-valid-token')->getJson('/api/auth/user')->assertUnauthorized();
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }

    public function test_login_is_throttled(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', ['email' => 'unknown@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/api/auth/login', ['email' => 'UNKNOWN@example.test', 'password' => 'incorrect'])
            ->assertStatus(429)->assertHeader('Retry-After')->assertJsonPath('error.code', 'HTTP_429');
    }

    public function test_signed_email_verification_and_verified_middleware(): void
    {
        $user = User::factory()->unverified()->create();
        Route::get('/api/_test/verified', fn () => response()->json(['ok' => true]))->middleware(['auth:sanctum', 'verified']);
        $this->actingAs($user, 'web');
        $this->getJson('/api/_test/verified')->assertForbidden();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->getJson($url)->assertOk()->assertJsonPath('message', 'Email verified.');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->getJson('/api/_test/verified')->assertOk();
        $this->getJson($url)->assertOk();
    }

    public function test_verification_rejects_tampered_expired_and_other_user_links(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $this->actingAs($user, 'web');
        $params = ['id' => $user->id, 'hash' => sha1($user->email)];
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), $params);
        $this->getJson($url.'&changed=1')->assertForbidden();
        $this->getJson(URL::temporarySignedRoute('verification.verify', now()->subMinute(), $params))->assertForbidden();
        $this->getJson(URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $other->id, 'hash' => sha1($other->email)]))->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertFalse($other->fresh()->hasVerifiedEmail());
    }

    public function test_verification_resend_is_authenticated_and_throttled(): void
    {
        $this->postJson('/api/auth/email/verification-notification')->assertUnauthorized();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user, 'web');
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/email/verification-notification')->assertOk()->assertJsonMissingPath('token');
        }
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->postJson('/api/auth/email/verification-notification')->assertStatus(429);
    }

    public function test_recovery_response_does_not_disclose_account_existence(): void
    {
        $user = User::factory()->create();
        $known = $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'unknown@example.test'])->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($known) {
            $known->assertDontSee($notification->token);

            return true;
        });
    }

    public function test_password_reset_is_single_use_and_revokes_database_sessions(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();
        $token = Notification::sent($user, ResetPassword::class)->first()->token;
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        $data = ['email' => $user->email, 'token' => $token, 'password' => self::PASSWORD, 'password_confirmation' => self::PASSWORD];
        $this->postJson('/api/auth/reset-password', $data)->assertOk()->assertDontSee($token);
        $this->assertTrue(Hash::check(self::PASSWORD, $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertGuest('web');
        $this->postJson('/api/auth/reset-password', $data)->assertUnprocessable();
    }

    public function test_invalid_and_expired_reset_tokens_do_not_change_password(): void
    {
        $user = User::factory()->create();
        $original = $user->password;
        $data = ['email' => $user->email, 'token' => 'invalid', 'password' => self::PASSWORD, 'password_confirmation' => self::PASSWORD];
        $this->postJson('/api/auth/reset-password', $data)->assertUnprocessable();
        $data['token'] = Password::createToken($user);
        DB::table('password_reset_tokens')->where('email', $user->email)->update(['created_at' => now()->subMinutes(61)]);
        $this->postJson('/api/auth/reset-password', $data)->assertUnprocessable();
        $this->assertSame($original, $user->fresh()->password);
    }

    public function test_csrf_cookie_and_enforced_csrf_protection(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $response = $this->get('/sanctum/csrf-cookie')->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:8443')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $cookies = collect($response->headers->getCookies())->keyBy(fn ($cookie) => $cookie->getName());
        $this->assertTrue($cookies[config('session.cookie')]->isHttpOnly());
        $this->assertFalse($cookies['XSRF-TOKEN']->isHttpOnly());
        $this->continueSession();
        $this->postJson('/api/auth/register', $this->credentials())->assertStatus(419)->assertJsonPath('error.code', 'HTTP_419');
        $this->continueSession();
        $token = $this->app['session']->driver()->token();
        $this->withHeader('X-CSRF-TOKEN', $token)->postJson('/api/auth/register', $this->credentials())->assertCreated();
    }

    public function test_untrusted_origin_cannot_start_authentication_session(): void
    {
        $this->withHeader('Origin', 'http://untrusted.example.test');
        $this->postJson('/api/auth/register', $this->credentials())->assertStatus(419);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_byte_limit_prevents_bcrypt_truncation(): void
    {
        foreach ([str_repeat('é', 35).'Abc123!', "ExampleStrong123!\0suffix"] as $password) {
            $this->postJson('/api/auth/register', array_replace($this->credentials(), [
                'password' => $password, 'password_confirmation' => $password,
            ]))->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['password']]]);
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_recovery_is_throttled_and_validates_input(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'invalid'])->assertUnprocessable();
        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/auth/forgot-password', ['email' => 'unknown@example.test'])->assertOk();
        }
        $this->postJson('/api/auth/forgot-password', ['email' => 'unknown@example.test'])->assertStatus(429);
    }

    public function test_verified_user_does_not_receive_another_verification_notification(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web')->postJson('/api/auth/email/verification-notification')->assertOk();
        Notification::assertNothingSent();
    }

    public function test_notification_links_use_the_approved_hosts(): void
    {
        $user = User::factory()->unverified()->create();
        $verification = (new VerifyEmail)->toMail($user)->actionUrl;
        $reset = (new ResetPassword('test-only-token'))->toMail($user)->actionUrl;
        $this->assertStringStartsWith('http://localhost:8000/api/auth/email/verify/', $verification);
        $this->assertStringStartsWith('http://localhost:8443/reset-password?', $reset);
    }

    public function test_email_link_navigation_uses_the_existing_browser_session(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->unverified()->create(['password' => self::PASSWORD]);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => self::PASSWORD])->assertOk();
        $this->continueSession();
        $this->withoutHeader('Origin');
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id, 'hash' => sha1($user->email),
        ]);
        $this->get($url)->assertOk()->assertJsonPath('message', 'Email verified.');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }
}
