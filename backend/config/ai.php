<?php

return [
    'provider' => env('AI_PROVIDER') ?: 'gemini',
    'api_key' => env('GEMINI_API_KEY', ''),
    'model' => env('GEMINI_MODEL') ?: 'gemini-3.8-flash',
    // Keep the total timeout below the existing 60-second generation lease.
    'timeout' => max(1, min(45, (int) (env('AI_TIMEOUT_SECONDS') ?: 20))),
];
