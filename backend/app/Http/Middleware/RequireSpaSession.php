<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireSpaSession
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->hasSession() && $request->attributes->get('sanctum'), 419);

        return $next($request);
    }
}
