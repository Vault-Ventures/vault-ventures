<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVerificationTier
{
    public function handle(Request $request, Closure $next, int|string $requiredTier = 1): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $tierValue = is_numeric($requiredTier)
            ? (int) $requiredTier
            : match (strtolower((string) $requiredTier)) {
                'tier0', 'tier_0', '0' => 0,
                'tier1', 'tier_1', '1', 'identity', 'identity_verified' => 1,
                'tier2', 'tier_2', '2', 'track_record', 'track_record_verified' => 2,
                default => 1,
            };

        if (! $user->hasVerificationTier($tierValue)) {
            $requiredLabel = match ($tierValue) {
                1 => 'Identity verification (Tier 1)',
                2 => 'Track-record verification (Tier 2)',
                default => 'Verification (Tier '.$tierValue.')',
            };

            abort(403, "{$requiredLabel} is required to perform this action.");
        }

        return $next($request);
    }
}
