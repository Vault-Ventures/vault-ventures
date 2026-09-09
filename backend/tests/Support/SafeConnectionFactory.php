<?php

namespace Tests\Support;

use Illuminate\Database\Connectors\ConnectionFactory;
use RuntimeException;

final class SafeConnectionFactory extends ConnectionFactory
{
    public static function assertSafe(array $config): void
    {
        if (($config['driver'] ?? null) !== 'mysql'
            || ($config['database'] ?? null) !== 'vault_ventures_test'
            || ($config['host'] ?? null) !== '127.0.0.1'
            || (string) ($config['port'] ?? '') !== '3307'
            || ! empty($config['url'])
            || ! empty($config['unix_socket'])
            || isset($config['read'])
            || isset($config['write'])) {
            throw new RuntimeException('Unsafe test database configuration. Only vault_ventures_test on 127.0.0.1:3307 is allowed.');
        }
    }

    public function make(array $config, $name = null)
    {
        self::assertSafe($config);

        return parent::make($config, $name);
    }
}
