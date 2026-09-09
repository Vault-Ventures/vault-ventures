<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // This application uses only first-party session cookies, never bearer tokens.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);

        RateLimiter::for('login', function (Request $request) {
            $email = $request->input('email');
            $key = hash('sha256', is_string($email) ? mb_strtolower(trim($email)) : 'invalid');
            return [Limit::perMinute(5)->by('login:'.$key.':'.$request->ip()), Limit::perMinute(30)->by('login-ip:'.$request->ip())];
        });
        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('recovery', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('verification', fn (Request $request) => Limit::perMinute(6)->by((string) ($request->user()?->id ?? $request->ip())));

        ResetPassword::createUrlUsing(fn ($user, string $token) =>
            config('cors.allowed_origins')[0].'/reset-password?'.http_build_query([
                'token' => $token, 'email' => $user->getEmailForPasswordReset(),
            ])
        );
    }
}
