<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\User;
use App\Services\Connection\ConnectionService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\Support\SafeConnectionFactory;
use Tests\TestCase;

class BusinessConnectionConcurrencyTest extends TestCase
{
    public function test_concurrent_reciprocal_requests_create_one_connection_and_two_notifications(): void
    {
        $config = config('database.connections.mysql');
        SafeConnectionFactory::assertSafe($config);
        $founder = User::factory()->create();
        $investor = User::factory()->create();
        $workers = [];
        try {
            $founder->roles()->create(['role' => 'founder']);
            $investor->roles()->create(['role' => 'investor']);
            $profile = $founder->founderProfile()->create([]);
            $business = new Business;
            $business->forceFill(['founder_profile_id' => $profile->id, 'name' => 'Concurrent connection', 'status' => 'submitted'])->save();
            BusinessDisclosureRelationship::create(['business_id' => $business->id, 'counterparty_user_id' => $investor->id,
                'counterparty_role' => 'investor', 'stage' => 2, 'interest_expressed_at' => now()]);
            app(ConnectionService::class)->expressFounderInterest($business, $founder, $investor);
            $environment = ['APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_HOST' => '127.0.0.1',
                'DB_PORT' => '3307', 'DB_DATABASE' => 'vault_ventures_test', 'DB_URL' => '',
                'DB_USERNAME' => $config['username'], 'DB_PASSWORD' => $config['password'],
                'SESSION_DRIVER' => 'array', 'CACHE_STORE' => 'array',
                'CONNECTION_TEST_BUSINESS' => (string) $business->id, 'CONNECTION_TEST_USER' => (string) $investor->id];
            $script = <<<'PHP'
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->registered(function () use ($app) {
    $app->singleton('db.factory', fn ($app) => new Tests\Support\SafeConnectionFactory($app));
});
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
Tests\Support\SafeConnectionFactory::assertSafe(config('database.connections.mysql'));
if (! $app->environment('testing')) { throw new RuntimeException('Testing only'); }
$business = App\Models\Business::findOrFail(getenv('CONNECTION_TEST_BUSINESS'));
$user = App\Models\User::findOrFail(getenv('CONNECTION_TEST_USER'));
echo "READY\n";
$result = app(App\Services\Connection\ConnectionService::class)->expressReciprocalInterest($business, $user);
echo $result['connection']->id;
PHP;
            DB::beginTransaction();
            Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
            for ($i = 0; $i < 2; $i++) {
                $worker = new Process([PHP_BINARY, '-r', $script], base_path(), $environment, null, 60);
                $worker->start();
                $workers[] = $worker;
            }
            foreach ($workers as $worker) {
                while (! str_contains($worker->getOutput(), 'READY') && $worker->isRunning()) {
                    $worker->checkTimeout();
                    usleep(10000);
                }
                $this->assertStringContainsString('READY', $worker->getOutput(), $worker->getErrorOutput());
                $this->assertTrue($worker->isRunning());
            }
            DB::commit();
            $ids = [];
            foreach ($workers as $worker) {
                $worker->wait();
                $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput().$worker->getOutput());
                $ids[] = trim(substr($worker->getOutput(), strlen("READY\n")));
            }
            $this->assertSame($ids[0], $ids[1]);
            $this->assertSame(1, DB::table('business_connections')->where('business_id', $business->id)->count());
            $this->assertSame(2, DB::table('business_interests')->where('business_id', $business->id)->count());
            $this->assertSame(1, $founder->notifications()->count());
            $this->assertSame(1, $investor->notifications()->count());
        } finally {
            if (DB::transactionLevel() > 0) DB::rollBack();
            foreach ($workers as $worker) {
                if ($worker->isRunning()) $worker->stop();
            }
            $founder->notifications()->delete();
            $investor->notifications()->delete();
            if (isset($business)) $business->delete();
            $founder->delete();
            $investor->delete();
        }
    }
}
