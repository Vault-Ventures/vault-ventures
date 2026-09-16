<?php

use App\Http\Middleware\EnsureVerificationTier;
use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'verification.tier' => EnsureVerificationTier::class,
            'admin' => \App\Http\Middleware\EnsureAdminAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api', 'api/*') || $request->expectsJson()
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if (! $request->is('api', 'api/*') || $response->getStatusCode() < 400) {
                return $response;
            }

            $status = $response->getStatusCode();
            $validation = $exception instanceof ValidationException;
            $json = ApiResponse::error(
                $validation ? 'The given data was invalid.' : (Response::$statusTexts[$status] ?? 'Request failed.'),
                $validation ? 'VALIDATION_ERROR' : 'HTTP_'.$status,
                $status,
                $validation ? $exception->errors() : [],
            );

            // Preserve protocol headers such as Allow and Retry-After.
            foreach ($response->headers->all() as $name => $values) {
                if (! in_array(strtolower($name), ['content-type', 'content-length'], true)) {
                    $json->headers->set($name, $values);
                }
            }

            return $json;
        });
    })->create();
