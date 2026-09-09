<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Tests\Support\SafeConnectionFactory;

class TestDatabaseGuardTest extends TestCase
{
    public static function unsafeConfigurations(): array
    {
        return [
            'main database' => [['database' => 'vault_ventures']],
            'other database' => [['database' => 'other_test']],
            'wrong driver' => [['driver' => 'sqlite']],
            'wrong host' => [['host' => 'remote.example.test']],
            'wrong port' => [['port' => 3306]],
            'url override' => [['url' => 'mysql://127.0.0.1:3307/vault_ventures']],
            'read override' => [['read' => ['database' => 'vault_ventures']]],
            'write override' => [['write' => ['database' => 'vault_ventures']]],
            'socket override' => [['unix_socket' => '/tmp/mysql.sock']],
        ];
    }

    private function safeConfig(): array
    {
        return ['driver' => 'mysql', 'host' => '127.0.0.1', 'port' => '3307', 'database' => 'vault_ventures_test'];
    }

    public function test_exact_test_database_is_allowed(): void
    {
        SafeConnectionFactory::assertSafe($this->safeConfig());
        $this->addToAssertionCount(1);
    }

    #[DataProvider('unsafeConfigurations')]
    public function test_unsafe_targets_are_rejected_without_connecting(array $overrides): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unsafe test database configuration');
        SafeConnectionFactory::assertSafe(array_replace($this->safeConfig(), $overrides));
    }
}
