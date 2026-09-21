<?php

namespace Tests\Feature;

use App\Contracts\OtpGeneratorInterface;
use App\Contracts\PhoneVerificationCodeDeliveryInterface;
use App\Models\User;
use App\Services\PhoneVerificationService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\Support\RecordingPhoneCodeDelivery;
use Tests\Support\TestingOtpGenerator;
use Tests\TestCase;

class PhoneVerificationConcurrencyTest extends TestCase
{
    // Committed fixtures are required so independent worker connections can see them.
    use DatabaseMigrations;

    private array $workers = [];
    private TestingOtpGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = (new TestingOtpGenerator)->setNextCode('123456');
        $this->app->instance(OtpGeneratorInterface::class, $this->generator);
        $this->app->instance(PhoneVerificationCodeDeliveryInterface::class, new RecordingPhoneCodeDelivery);
    }

    protected function tearDown(): void
    {
        while (DB::transactionLevel() > 0) DB::rollBack();
        foreach ($this->workers as $worker) if ($worker->isRunning()) $worker->stop();
        parent::tearDown();
    }

    private function startWorker(User $user, string $code): Process
    {
        $connection = config('database.connections.mysql');
        $worker = new Process([PHP_BINARY, base_path('tests/Fixtures/verify-phone-worker.php'), (string) $user->id, $code], base_path(), [
            'APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3307', 'DB_DATABASE' => 'vault_ventures_test', 'DB_URL' => '',
            'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'VERIFICATION_PHONE_DELIVERY' => 'disabled', 'CACHE_STORE' => 'array',
        ], null, 30);
        $worker->start(); $this->workers[] = $worker;
        $deadline = microtime(true) + 15;
        while (! str_contains($worker->getOutput(), 'ready') && $worker->isRunning() && microtime(true) < $deadline) usleep(20000);
        $this->assertStringContainsString('ready', $worker->getOutput(), $worker->getErrorOutput());
        return $worker;
    }

    public function test_two_simultaneous_verifications_cannot_both_succeed(): void
    {
        $user = User::factory()->create(); $record = app(PhoneVerificationService::class)->sendCode($user, '+15551234567');
        DB::beginTransaction(); User::whereKey($user->id)->lockForUpdate()->first();
        $first = $this->startWorker($user, '123456'); $second = $this->startWorker($user, '123456');
        DB::commit(); $first->wait(); $second->wait();
        $this->assertSame(0, $first->getExitCode()); $this->assertSame(0, $second->getExitCode());
        $combined = $first->getOutput().$second->getOutput();
        $this->assertSame(1, substr_count($combined, 'accepted'));
        $this->assertSame(1, substr_count($combined, 'rejected'));
        $this->assertNotNull($record->fresh()->verified_at);
    }

    public function test_waiting_verifier_cannot_consume_a_challenge_superseded_by_resend(): void
    {
        $user = User::factory()->create(); $service = app(PhoneVerificationService::class);
        $old = $service->sendCode($user, '+15551234567');
        // Simulate elapsed resend cooldown without changing the worker clock.
        $old->update(['created_at' => now()->subSeconds(61)]);
        DB::beginTransaction(); User::whereKey($user->id)->lockForUpdate()->first();
        $worker = $this->startWorker($user, '123456');
        $this->generator->setNextCode('654321'); $new = $service->sendCode($user, '+15551234567');
        DB::commit(); $worker->wait();
        $this->assertSame(0, $worker->getExitCode()); $this->assertStringContainsString('rejected', $worker->getOutput());
        $this->assertNull($old->fresh()->verified_at); $this->assertNull($user->fresh()->phone_verified_at);
        $this->assertTrue($service->verifyCode($user, '654321'));
        $this->assertNotNull($new->fresh()->verified_at);
    }

    public function test_parallel_wrong_attempts_cannot_exceed_five_or_lose_accounting(): void
    {
        $user = User::factory()->create(); $record = app(PhoneVerificationService::class)->sendCode($user, '+15551234567');
        $record->update(['attempts' => 4]);
        DB::beginTransaction(); User::whereKey($user->id)->lockForUpdate()->first();
        $first = $this->startWorker($user, '999999'); $second = $this->startWorker($user, '999999');
        DB::commit(); $first->wait(); $second->wait();
        $this->assertSame(0, $first->getExitCode()); $this->assertSame(0, $second->getExitCode());
        $this->assertSame(5, $record->fresh()->attempts);
        $this->assertNull($user->fresh()->phone_verified_at);
    }
}
