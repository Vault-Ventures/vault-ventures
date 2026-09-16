<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAdminAccess()) {
            return ApiResponse::error(
                'Unauthorized. Admin access required.',
                'HTTP_403',
                403
            );
        }

        return $next($request);
    }
}
