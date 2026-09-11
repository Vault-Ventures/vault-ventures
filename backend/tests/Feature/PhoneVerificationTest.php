<?php

namespace Tests\Feature;

use App\Contracts\OtpGeneratorInterface;
use App\Models\PhoneVerificationCode;
use App\Models\User;
use App\Services\PhoneVerificationService;
use App\Services\RandomOtpGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use ReflectionClass;
use Tests\Support\TestingOtpGenerator;
use Tests\TestCase;

class PhoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = '+15551234567';

    private TestingOtpGenerator $otpGenerator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);

        $this->otpGenerator = new TestingOtpGenerator;
        $this->app->instance(OtpGeneratorInterface::class, $this->otpGenerator);
    }

    public function test_unauthenticated_user_cannot_request_or_verify_phone_code(): void
    {
        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertUnauthorized();

        $this->postJson('/api/me/phone/verify-code', ['code' => '123456'])
            ->assertUnauthorized();
    }

    public function test_user_can_request_phone_verification_code_and_response_does_not_leak_code(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE]);
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Verification code sent.')
            ->assertJsonMissingPath('data.code')
            ->assertJsonMissingPath('data.otp');

        $this->assertDatabaseCount('phone_verification_codes', 1);
        $record = PhoneVerificationCode::firstOrFail();
        $this->assertSame($user->id, $record->user_id);
        $this->assertSame(self::PHONE, $record->phone);
        $this->assertNotNull($record->code_hash);
        $this->assertFalse(Hash::check('000000', $record->code_hash));
        $this->assertFalse($record->expires_at->isPast());
        $this->assertNull($record->verified_at);
        $this->assertSame(0, $record->attempts);

        // Verify that the code is hashed in the database and retrieved only via test infrastructure
        $plainCode = $this->otpGenerator->getLastGeneratedCode();
        $this->assertNotNull($plainCode);
        $this->assertNotEquals($plainCode, $record->code_hash);
        $this->assertTrue(Hash::check($plainCode, $record->code_hash));
    }

    public function test_production_service_has_no_testing_hooks_or_exposed_otp_state(): void
    {
        $reflection = new ReflectionClass(PhoneVerificationService::class);

        $this->assertFalse(
            $reflection->hasProperty('lastGeneratedCodeForTesting'),
            'PhoneVerificationService must not contain lastGeneratedCodeForTesting property.'
        );

        $staticProps = $reflection->getProperties(\ReflectionProperty::IS_STATIC);
        $this->assertEmpty($staticProps, 'PhoneVerificationService must not have static state properties.');
    }

    public function test_random_otp_generator_produces_valid_six_digit_numeric_string(): void
    {
        $generator = new RandomOtpGenerator;
        for ($i = 0; $i < 20; $i++) {
            $code = $generator->generate();
            $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
            $this->assertGreaterThanOrEqual(100000, (int) $code);
            $this->assertLessThanOrEqual(999999, (int) $code);
        }
    }

    public function test_invalid_phone_format_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $this->postJson('/api/me/phone/send-code', ['phone' => '123'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_send_code_enforces_resend_cooldown(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        // Immediate second attempt hits cooldown
        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_already_verified_phone_on_another_account_cannot_be_requested(): void
    {
        $otherUser = User::factory()->create(['phone' => self::PHONE, 'phone_verified_at' => now()]);

        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_successful_phone_verification_updates_user_and_marks_code_verified(): void
    {
        $user = User::factory()->create();
        $this->assertFalse($user->hasVerifiedPhone());
        $this->assertNull($user->phone);
        $this->assertNull($user->phone_verified_at);

        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        $plainCode = $this->otpGenerator->getLastGeneratedCode();
        $this->assertNotNull($plainCode);

        $response = $this->postJson('/api/me/phone/verify-code', ['code' => $plainCode]);
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Phone verified.');

        $freshUser = $user->fresh();
        $this->assertSame(self::PHONE, $freshUser->phone);
        $this->assertNotNull($freshUser->phone_verified_at);
        $this->assertTrue($freshUser->hasVerifiedPhone());

        $record = PhoneVerificationCode::firstOrFail();
        $this->assertNotNull($record->verified_at);
    }

    public function test_invalid_otp_is_rejected_and_increments_attempts(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        $this->postJson('/api/me/phone/verify-code', ['code' => '999999'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $record = PhoneVerificationCode::firstOrFail();
        $this->assertSame(1, $record->attempts);
        $this->assertNull($record->verified_at);
        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_attempt_limit_locks_code_verification(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        $record = PhoneVerificationCode::firstOrFail();
        $record->update(['attempts' => 5]);

        $plainCode = $this->otpGenerator->getLastGeneratedCode();

        $this->postJson('/api/me/phone/verify-code', ['code' => $plainCode])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_expired_otp_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        $record = PhoneVerificationCode::firstOrFail();
        $record->update(['expires_at' => now()->subMinute()]);

        $plainCode = $this->otpGenerator->getLastGeneratedCode();

        $this->postJson('/api/me/phone/verify-code', ['code' => $plainCode])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_otp_reuse_is_prevented(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/me/phone/send-code', ['phone' => self::PHONE])
            ->assertOk();

        $plainCode = $this->otpGenerator->getLastGeneratedCode();

        $this->postJson('/api/me/phone/verify-code', ['code' => $plainCode])
            ->assertOk();

        // Second attempt to verify the same code is rejected
        $this->postJson('/api/me/phone/verify-code', ['code' => $plainCode])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }
}
