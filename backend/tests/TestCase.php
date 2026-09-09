<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Contracts\Console\Kernel;
use RuntimeException;
use Tests\Support\SafeConnectionFactory;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $this->traitsUsedByTest = array_flip(class_uses_recursive(static::class));

        // Install before providers boot and before Laravel runs database-reset traits.
        $app->registered(function () use ($app) {
            $app->singleton('db.factory', fn ($app) => new SafeConnectionFactory($app));
        });

        $app->make(Kernel::class)->bootstrap();

        if (! $app->environment('testing')) {
            throw new RuntimeException('Backend tests must run in the testing environment.');
        }

        SafeConnectionFactory::assertSafe(
            $app['config']->get('database.connections.'.$app['config']->get('database.default'), [])
        );

        return $app;
    }
}
