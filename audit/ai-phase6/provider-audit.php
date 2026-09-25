<?php
// Read configuration and scan approved paths without displaying credential values.
require __DIR__.'/../../backend/vendor/autoload.php';
$root = dirname(__DIR__, 2);
$backend = $root.'/backend';
$dotenv = Dotenv\Dotenv::createImmutable($backend);
$dotenv->safeLoad();
$cached = is_file($backend.'/bootstrap/cache/config.php') ? require $backend.'/bootstrap/cache/config.php' : null;
$get = fn ($key, $fallback) => $_ENV[$key] ?? getenv($key) ?: $fallback;
$ai = $cached['ai'] ?? ['provider' => $get('AI_PROVIDER', 'gemini'), 'model' => $get('GEMINI_MODEL', 'gemini-3.8-flash'),
    'api_key' => $get('GEMINI_API_KEY', ''), 'timeout' => max(1, min(45, (int) $get('AI_TIMEOUT_SECONDS', 20)))];
$secret = (string) ($ai['api_key'] ?? '');
$findings = []; $count = 0;
foreach (['src', 'dist', 'backend/app', 'backend/config', 'backend/routes', 'backend/tests', 'backend/docs', 'backend/storage/logs'] as $directory) {
    if (!is_dir($root.'/'.$directory)) continue;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/'.$directory, FilesystemIterator::SKIP_DOTS)) as $file) {
        if (!$file->isFile()) continue;
        $text = file_get_contents($file->getPathname()); $count++;
        if (($secret !== '' && str_contains($text, $secret)) || preg_match('/AIza[0-9A-Za-z_-]{35}/', $text)) {
            $findings[] = str_replace($root.'/', '', str_replace('\\', '/', $file->getPathname()));
        }
    }
}
$example = file_get_contents($backend.'/.env.example');
$diff = shell_exec('git -C '.escapeshellarg($root).' diff --no-ext-diff 2>NUL') ?? '';
echo json_encode(['provider' => $ai['provider'], 'model' => $ai['model'], 'timeout' => $ai['timeout'], 'connection_timeout' => 5,
    'credentials_configured' => trim($secret) !== '' ? 'YES' : 'NO', 'cached_config' => $cached !== null,
    'files_scanned' => $count, 'secret_match_paths' => $findings,
    'example_key_empty' => preg_match('/^GEMINI_API_KEY=\s*$/m', $example) === 1,
    'secret_in_diff' => $secret !== '' && str_contains($diff, $secret)], JSON_PRETTY_PRINT).PHP_EOL;
