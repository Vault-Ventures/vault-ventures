<?php

namespace Tests\Feature;

use App\Contracts\OtpGeneratorInterface;
use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use App\Models\PhoneVerificationCode;
use App\Models\User;
use App\Providers\AppServiceProvider;
use App\Services\PhoneVerificationService;
use App\Services\Verification\LocalPhoneCodeDelivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Tests\Support\RecordingPhoneCodeDelivery;
use Tests\Support\TestingOtpGenerator;
use Tests\TestCase;

class PhoneDeliveryInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    private TestingOtpGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = (new TestingOtpGenerator)->setNextCode('123456');
        $this->app->instance(OtpGeneratorInterface::class, $this->generator);
        $this->app->instance(PhoneVerificationCodeDeliveryInterface::class, new RecordingPhoneCodeDelivery);
        $this->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    public function test_local_capture_requires_explicit_local_configuration_and_is_bounded_private(): void
    {
        $disk = Storage::fake('development_phone_verification');
        $this->app['env'] = 'local';
        config(['verification.phone_delivery' => 'local_capture']);
        Log::spy();
        try {
            $adapter = new LocalPhoneCodeDelivery;
            $adapter->deliver('+15551234567', '123456', 1, now()->addMinutes(10));
            $adapter->deliver('+15551234567', '654321', 2, now()->addMinutes(10));
            $data = json_decode($disk->get('latest.json'), true);
            $this->assertSame('654321', $data['code']);
            $this->assertSame('***4567', $data['destination']);
            $this->assertSame(2, $data['challenge_id']);
            $this->assertCount(1, $disk->allFiles());
            $this->assertFalse(config('filesystems.disks.development_phone_verification.serve'));
            $this->assertStringNotContainsString('app/private/', str_replace('\\', '/', config('filesystems.disks.development_phone_verification.root')));
            Log::shouldNotHaveReceived('info');
            Log::shouldNotHaveReceived('debug');
        } finally {
            $this->app['env'] = 'testing';
            config(['verification.phone_delivery' => 'disabled']);
        }
    }

    public function test_unsafe_local_configuration_is_rejected_at_boot_and_adapter_call(): void
    {
        foreach (['production', 'testing', 'staging'] as $environment) {
            $this->app['env'] = $environment;
            config(['verification.phone_delivery' => 'local_capture']);
            try {
                try { (new AppServiceProvider($this->app))->boot(); $this->fail('Unsafe startup accepted'); }
                catch (\LogicException $e) { $this->assertStringContainsString('Unsafe', $e->getMessage()); }
                try { (new LocalPhoneCodeDelivery)->deliver('+15551234567', '123456', 1, now()); $this->fail('Unsafe adapter accepted'); }
                catch (\LogicException $e) { $this->assertStringContainsString('not enabled', $e->getMessage()); }
            } finally { $this->app['env'] = 'testing'; config(['verification.phone_delivery' => 'disabled']); }
        }
        $this->app['env'] = 'local';
        try {
            $this->expectException(\LogicException::class);
            (new LocalPhoneCodeDelivery)->deliver('+15551234567', '123456', 1, now());
        } finally { $this->app['env'] = 'testing'; }
    }

    public function test_success_contains_no_otp_and_database_only_stores_hash(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/me/phone/send-code', ['phone' => '1 (555) 123-4567'])->assertOk();
        $this->assertStringNotContainsString('123456', $response->getContent());
        $record = PhoneVerificationCode::firstOrFail();
        $this->assertSame('+15551234567', $record->phone);
        $this->assertTrue(Hash::check('123456', $record->code_hash));
        $this->assertNotNull($record->delivered_at);
        $this->assertArrayNotHasKey('code', $record->getAttributes());
        $this->assertSame(600, (int) $record->created_at->diffInSeconds($record->expires_at));
    }

    public function test_delivery_failure_expires_challenge_and_never_reports_success_or_secret(): void
    {
        $this->app->instance(PhoneVerificationCodeDeliveryInterface::class, new class implements PhoneVerificationCodeDeliveryInterface {
            public function deliver(string $phone, #[\SensitiveParameter] string $code, int $challengeId, \DateTimeInterface $expiresAt): void { throw new \RuntimeException('secret '.$code); }
        });
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/me/phone/send-code', ['phone' => '+15551234567'])->assertStatus(503);
        $this->assertStringNotContainsString('123456', $response->getContent());
        $record = PhoneVerificationCode::firstOrFail();
        $this->assertNull($record->delivered_at);
        $this->assertTrue($record->expires_at->lte(now()));
        $this->postJson('/api/me/phone/verify-code', ['code' => '123456'])->assertUnprocessable();
        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_disabled_production_transport_fails_explicitly(): void
    {
        $this->app->instance(PhoneVerificationCodeDeliveryInterface::class, new \App\Services\Verification\UnavailablePhoneCodeDelivery);
        $this->actingAs(User::factory()->create())->postJson('/api/me/phone/send-code', ['phone' => '+15551234567'])->assertStatus(503);
    }

    public function test_resend_supersedes_old_code_and_only_new_code_can_be_used_once(): void
    {
        $user = User::factory()->create(); $service = app(PhoneVerificationService::class);
        $old = $service->sendCode($user, '+15551234567');
        $this->travel(61)->seconds(); $this->generator->setNextCode('654321');
        $new = $service->sendCode($user, '15551234567');
        $this->assertTrue($old->fresh()->expires_at->lte(now()));
        try { $service->verifyCode($user, '123456'); $this->fail('Old code accepted'); } catch (ValidationException) {}
        $this->assertSame(1, $new->fresh()->attempts);
        $this->assertTrue($service->verifyCode($user, '654321'));
        $timestamp = $user->fresh()->phone_verified_at;
        try { $service->verifyCode($user, '654321'); $this->fail('Reused code'); } catch (ValidationException) {}
        $this->assertTrue($timestamp->equalTo($user->fresh()->phone_verified_at));
    }

    public function test_canonical_collision_is_checked_at_send_and_verify_including_legacy_format(): void
    {
        $user = User::factory()->create(); $service = app(PhoneVerificationService::class);
        $service->sendCode($user, '+1 (555) 123-4567');
        User::factory()->create(['phone' => '15551234567', 'phone_verified_at' => now()]);
        $this->actingAs($user)->postJson('/api/me/phone/verify-code', ['code' => '123456'])->assertUnprocessable();
        $this->postJson('/api/me/phone/send-code', ['phone' => '+1 555 123 4567'])->assertUnprocessable();
        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_five_wrong_attempts_persist_and_correct_code_is_then_rejected(): void
    {
        $user = User::factory()->create(); $service = app(PhoneVerificationService::class); $record = $service->sendCode($user, '+15551234567');
        for ($i = 0; $i < 5; $i++) {
            try { $service->verifyCode($user, '999999'); $this->fail('Wrong code'); } catch (ValidationException) {}
        }
        $this->assertSame(5, $record->fresh()->attempts);
        $this->expectException(ValidationException::class); $service->verifyCode($user, '123456');
    }

    public function test_route_throttle_still_limits_phone_attempts(): void
    {
        $this->actingAs(User::factory()->create());
        for ($i = 0; $i < 6; $i++) $this->postJson('/api/me/phone/verify-code', ['code' => '123456'])->assertUnprocessable();
        $this->postJson('/api/me/phone/verify-code', ['code' => '123456'])->assertStatus(429);
    }
}
