<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ReadinessInputVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\Support\SafeConnectionFactory;
use Tests\TestCase;

class ReadinessAssessmentConcurrencyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
        parent::tearDown();
    }

    private function cleanDatabase(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = [
            'readiness_assessments', 'business_analyses', 'readiness_input_versions',
            'business_requirements', 'businesses', 'founder_profiles', 'user_roles', 'users',
        ];
        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    public function test_two_independent_workers_create_one_assessment_and_reuse_it(): void
    {
        $connection = config('database.connections.mysql');
        SafeConnectionFactory::assertSafe($connection);
        $owner = User::factory()->create();
        $this->actingAs($owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $id = $this->postJson('/api/me/businesses', [
            'name' => 'Concurrency', 'description' => 'Idea', 'industry' => 'Technology',
            'business_stage' => 'Idea', 'location' => 'Dhaka',
        ])->assertCreated()->json('data.id');
        $this->postJson("/api/me/businesses/$id/submit")->assertOk();
        $input = new ReadinessInputVersion;
        $input->forceFill(['business_id' => $id, 'version' => 1, 'schema_version' => '1', 'answers' => []])->save();
        $environment = [
            'APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3307', 'DB_DATABASE' => 'vault_ventures_test', 'DB_URL' => '',
            'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'SESSION_DRIVER' => 'array', 'CACHE_STORE' => 'array', 'ASSESSMENT_TEST_BUSINESS_ID' => (string) $id,
        ];
        $script = <<<'PHP'
<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->registered(function () use ($app) {
    $app->singleton('db.factory', fn ($app) => new Tests\Support\SafeConnectionFactory($app));
});
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
Tests\Support\SafeConnectionFactory::assertSafe(config('database.connections.mysql'));
if (! $app->environment('testing')) { throw new RuntimeException('Testing only'); }
fwrite(STDOUT, "READY\n");
[$assessment, $created] = app(App\Services\Readiness\ReadinessAssessmentService::class)
    ->assess((int) getenv('ASSESSMENT_TEST_BUSINESS_ID'));
echo json_encode(['id' => $assessment->id, 'created' => $created, 'version' => $assessment->version]);
PHP;
        $workers = [];
        DB::beginTransaction();
        try {
            Business::query()->lockForUpdate()->findOrFail($id);
            for ($i = 0; $i < 2; $i++) {
                // Avoid inherited stdin handles between concurrent Windows children.
                $worker = new Process([PHP_BINARY, '-r', substr($script, 6)], base_path(), $environment, null, 90);
                $workers[] = $worker;
                $worker->start();
            }
            foreach ($workers as $worker) {
                // Include output already consumed into Process's buffer during start/status checks.
                while (! str_contains($worker->getOutput(), 'READY') && $worker->isRunning()) {
                    $worker->checkTimeout();
                    usleep(10000);
                }
                $this->assertStringContainsString('READY', $worker->getOutput(), 'Worker must reach the guarded service.');
                $this->assertTrue($worker->isRunning(), 'Worker waits while the business lock is held.');
            }
            DB::commit();
            $results = [];
            foreach ($workers as $worker) {
                $worker->wait();
                $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput());
                $results[] = json_decode(trim(substr($worker->getOutput(), strlen("READY\n"))), true, flags: JSON_THROW_ON_ERROR);
            }
            $this->assertSame($results[0]['id'], $results[1]['id']);
            $this->assertEqualsCanonicalizing([true, false], array_column($results, 'created'));
            $this->assertSame([1, 1], array_column($results, 'version'));
            $this->assertDatabaseCount('readiness_assessments', 1);
        } finally {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            foreach ($workers as $worker) {
                if ($worker->isRunning()) {
                    $worker->stop();
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('readiness_assessments')->truncate();
            DB::table('readiness_input_versions')->truncate();
            DB::table('businesses')->truncate();
            DB::table('founder_profiles')->truncate();
            DB::table('user_roles')->truncate();
            DB::table('users')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }
}
