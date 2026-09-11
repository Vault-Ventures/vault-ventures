<?php

namespace App\Services\BusinessAnalysis;

use App\Models\Business;
use App\Models\BusinessAnalysis;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Cache\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class BusinessAnalysisService
{
    public function provider(): AnalysisProvider
    {
        // Test doubles require explicit PHPUnit injection; application mode always stays disabled.
        if (! app()->runningUnitTests() || ! defined('PHPUNIT_COMPOSER_INSTALL')) {
            return new DisabledAnalysisProvider;
        }

        return app(AnalysisProvider::class);
    }

    public function capture(Business $business): array
    {
        return app(AnalysisInputBuilder::class)->capture($business->id, $this->provider());
    }

    public function current(Business $business, array $state): ?BusinessAnalysis
    {
        if ($state['eligibility_reasons'] !== []) {
            return null;
        }

        return $business->analyses()->where('source_fingerprint', $state['fingerprint'])->first();
    }

    public function metadata(Business $business, array $state): array
    {
        return ['generation_enabled' => $this->provider()->enabled(), 'eligible' => $state['eligibility_reasons'] === [],
            'eligibility_reasons' => $state['eligibility_reasons'], 'current_version' => $this->current($business, $state)?->version];
    }

    public function freshness(BusinessAnalysis $analysis, array $state): array
    {
        return ['is_current' => $state['eligibility_reasons'] === [] && hash_equals($analysis->source_fingerprint, $state['fingerprint'])];
    }

    private function eligible(array $state): void
    {
        if ($state['eligibility_reasons'] !== []) {
            throw ValidationException::withMessages(['business_analysis' => $state['eligibility_reasons']]);
        }
    }

    private function consumeAllowance(User $user): void
    {
        $cache = Cache::store('database');
        $lock = $cache->lock('business-analysis:allowance:'.$user->id, 60);
        if (! $lock->get()) {
            throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
        }
        try {
            $limiter = new RateLimiter($cache);
            $key = 'business-analysis:attempts:'.$user->id;
            $limit = max(1, (int) config('business_analysis.generation_limit_per_founder_per_hour', 3));
            if ($limiter->tooManyAttempts($key, $limit)) {
                throw new AnalysisFailure('ANALYSIS_RATE_LIMIT', 429);
            }
            $limiter->hit($key, 3600);
        } finally {
            $lock->release();
        }
    }

    public function generate(User $user, Business $business): array
    {
        Gate::forUser($user)->authorize('create', [BusinessAnalysis::class, $business]);
        $provider = $this->provider();
        $state = app(AnalysisInputBuilder::class)->capture($business->id, $provider);
        $this->eligible($state);
        if ($current = $this->current($business, $state)) {
            return [$current, false];
        }
        if (! $provider->enabled()) {
            throw new AnalysisFailure('ANALYSIS_DISABLED', 503);
        }
        $cache = Cache::store('database');
        $key = 'business-analysis:generate:'.$business->id;
        $lock = $cache->lock($key, 60);
        if (! $lock->get()) {
            throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
        }
        $started = microtime(true);
        try {
            $state = app(AnalysisInputBuilder::class)->capture($business->id, $provider);
            $this->eligible($state);
            if ($current = $this->current($business, $state)) {
                return [$current, false];
            }
            $this->consumeAllowance($user);
            try {
                $raw = $provider->generate($state['snapshot']);
            } catch (Throwable) {
                throw new AnalysisFailure('ANALYSIS_ADAPTER_FAILURE', 503);
            }
            $output = app(AnalysisOutputValidator::class)->validate($raw, $state['snapshot']);
            $rendered = app(AnalysisRenderer::class)->render($output, $state['snapshot']);

            return DB::transaction(function () use ($user, $business, $state, $output, $rendered, $lock, $key, $cache) {
                $owned = Business::query()->lockForUpdate()->findOrFail($business->id);
                Gate::forUser($user->fresh())->authorize('create', [BusinessAnalysis::class, $owned]);
                $currentState = $this->capture($owned);
                if ($currentState['eligibility_reasons'] !== [] || $currentState['fingerprint'] !== $state['fingerprint']) {
                    throw new AnalysisFailure('SOURCE_CHANGED', 409);
                }
                // Lock and inspect the database lease, including expiry, until this insert commits.
                $connection = DB::connection(config('cache.stores.database.lock_connection') ?? config('cache.stores.database.connection'));
                $lease = $connection->table(config('cache.stores.database.lock_table') ?? 'cache_locks')
                    ->where('key', $cache->getStore()->getPrefix().$key)->lockForUpdate()->first();
                if ($lease === null || $lease->owner !== $lock->owner() || $lease->expiration <= now()->timestamp) {
                    throw new AnalysisFailure('GENERATION_LOCK_LOST', 409);
                }
                if ($current = $this->current($owned, $currentState)) {
                    return [$current, false];
                }
                $latest = $owned->analyses()->orderByDesc('version')->lockForUpdate()->first();
                $analysis = new BusinessAnalysis;
                $analysis->forceFill($state['snapshot']['configuration'] + [
                    'business_id' => $owned->id, 'readiness_assessment_id' => $state['snapshot']['assessment']['id'],
                    'version' => ($latest?->version ?? 0) + 1, 'source_snapshot' => $state['snapshot'], 'source_fingerprint' => $state['fingerprint'],
                    'validated_output' => $output, 'rendered_output' => $rendered, 'generated_at' => now(),
                ])->save();

                return [$analysis, true];
            });
        } catch (Throwable $failure) {
            try {
                Log::warning('Business analysis failed.', [
                    'business_id' => $business->id, 'failure_code' => $failure instanceof AnalysisFailure ? $failure->reason : 'ANALYSIS_FAILURE',
                    'elapsed_ms' => (int) ((microtime(true) - $started) * 1000),
                ]);
            } catch (Throwable) { /* Do not expose source or adapter data through logging. */
            }
            if ($failure instanceof AnalysisFailure || $failure instanceof ValidationException || $failure instanceof AuthorizationException) {
                throw $failure;
            }
            throw new AnalysisFailure('ANALYSIS_FAILURE',503);
        } finally {
            $lock->release();
        }
    }
}
