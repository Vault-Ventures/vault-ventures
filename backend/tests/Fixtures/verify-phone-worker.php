<?php

// Test-only worker. Reject every database except the guarded disposable database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->registered(function () use ($app) {
    $app->singleton('db.factory', fn ($app) => new \Tests\Support\SafeConnectionFactory($app));
});
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('testing')) {
    throw new RuntimeException('Test worker requires testing environment.');
}
\Tests\Support\SafeConnectionFactory::assertSafe(config('database.connections.'.config('database.default')));
$user = \App\Models\User::findOrFail((int) $argv[1]);
echo "ready\n";
flush();
try {
    app(\App\Services\PhoneVerificationService::class)->verifyCode($user, $argv[2]);
    echo "accepted\n";
} catch (\Illuminate\Validation\ValidationException) {
    echo "rejected\n";
}
