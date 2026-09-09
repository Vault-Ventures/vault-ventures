<?php

$origin = trim((string) env('FRONTEND_ORIGIN', ''));
if ($origin !== '' && ! preg_match('~^https?://(?:localhost|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[a-f0-9:]+\])(?::[0-9]{1,5})?$~i', $origin)) {
    throw new InvalidArgumentException('FRONTEND_ORIGIN must be one exact HTTP(S) origin without a path or wildcard.');
}

return [
    'paths' => ['api', 'api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Allow only the configured browser origin; empty configuration denies cross-origin access.
    'allowed_origins' => $origin === '' ? [] : [$origin],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
