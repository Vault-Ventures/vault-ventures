<?php

namespace Tests\Feature;

use RuntimeException;
use Tests\Support\SafeConnectionFactory;
use Tests\TestCase;

class TestDatabaseSafetyTest extends TestCase
{
    public function test_factory_is_guarded_before_database_traits_run(): void
    {
        $this->assertInstanceOf(SafeConnectionFactory::class, $this->app->make('db.factory'));
        $this->assertSame('vault_ventures_test', config('database.connections.mysql.database'));
    }

    public function test_runtime_switch_to_main_database_is_blocked_before_connecting(): void
    {
        config(['database.connections.mysql.database' => 'vault_ventures']);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unsafe test database configuration');
        $this->app->make('db')->connection('mysql');
    }

    public function test_named_connection_cannot_bypass_guard(): void
    {
        config(['database.connections.unsafe' => array_replace(config('database.connections.mysql'), [
            'database' => 'vault_ventures',
        ])]);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unsafe test database configuration');
        $this->app->make('db')->connection('unsafe');
    }
}
