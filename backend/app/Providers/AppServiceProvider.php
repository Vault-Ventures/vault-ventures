<?php

namespace App\Providers;

use App\Contracts\OtpGeneratorInterface;
use App\Enums\VerificationTier;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Policies\VerificationRequestPolicy;
use App\Services\BusinessAnalysis\AnalysisProvider;
use App\Services\BusinessAnalysis\DisabledAnalysisProvider;
use App\Services\RandomOtpGenerator;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AnalysisProvider::class, DisabledAnalysisProvider::class);
        $this->app->bind(OtpGeneratorInterface::class, RandomOtpGenerator::class);
        $this->app->bind(\App\Contracts\PhoneVerificationCodeDeliveryInterface::class, function () {
            $this->assertPhoneDeliveryConfiguration();
            return config('verification.phone_delivery') === 'local_capture'
                ? new \App\Services\Verification\LocalPhoneCodeDelivery
                : new \App\Services\Verification\UnavailablePhoneCodeDelivery;
        });
    }

    private function assertPhoneDeliveryConfiguration(): void
    {
        $driver = config('verification.phone_delivery', 'disabled');
        if (! in_array($driver, ['disabled', 'local_capture'], true)
            || ($driver === 'local_capture' && ! $this->app->environment('local'))) {
            throw new \LogicException('Unsafe or unsupported phone verification delivery configuration.');
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->assertPhoneDeliveryConfiguration();
        // This application uses only first-party session cookies, never bearer tokens.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);

        Gate::policy(VerificationRequest::class, VerificationRequestPolicy::class);

        Gate::define('tier-0', fn (User $user) => $user->hasTier0Verification());
        Gate::define('identity-verified', fn (User $user) => $user->isIdentityVerified());
        Gate::define('track-record-verified', fn (User $user) => $user->isTrackRecordVerified());
        Gate::define('verification-tier', fn (User $user, int|VerificationTier $tier) => $user->hasVerificationTier($tier));

        RateLimiter::for('login', function (Request $request) {
            $email = $request->input('email');
            $key = hash('sha256', is_string($email) ? mb_strtolower(trim($email)) : 'invalid');

            return [Limit::perMinute(5)->by('login:'.$key.':'.$request->ip()), Limit::perMinute(30)->by('login-ip:'.$request->ip())];
        });
        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('recovery', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('verification', fn (Request $request) => Limit::perMinute(6)->by((string) ($request->user()?->id ?? $request->ip())));
        RateLimiter::for('phone_verification', fn (Request $request) => Limit::perMinute(6)->by((string) ($request->user()?->id ?? $request->ip())));

        ResetPassword::createUrlUsing(fn ($user, string $token) => config('cors.allowed_origins')[0].'/reset-password?'.http_build_query([
            'token' => $token, 'email' => $user->getEmailForPasswordReset(),
        ])
        );
    }
}
