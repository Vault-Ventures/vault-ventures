<?php

namespace Tests\Fixtures;

use App\Services\BusinessAnalysis\AnalysisProvider;
use Closure;
use LogicException;

final class FakeAnalysisProvider implements AnalysisProvider
{
    public int $calls = 0;

    public array $snapshots = [];

    public function __construct(private Closure $callback)
    {
        if (! app()->runningUnitTests() || ! defined('PHPUNIT_COMPOSER_INSTALL')) {
            throw new LogicException('The fake analysis adapter is restricted to automated tests.');
        }
    }

    public function identifier(): string
    {
        return 'test_fake';
    }

    public function modelIdentifier(): ?string
    {
        return null;
    }

    public function enabled(): bool
    {
        return true;
    }

    public function generate(array $snapshot): string
    {
        $this->calls++;
        $this->snapshots[] = $snapshot;

        return ($this->callback)($snapshot);
    }

    public static function validOutput(array $snapshot): string
    {
        return json_encode([
            'business_summary' => ['source_refs' => ['name']],
            'information_coverage' => array_map(fn ($key) => ['factor_key' => $key], array_keys($snapshot['assessment']['factors'])),
            'review_points' => [],
            'recommended_actions' => array_map(fn ($item) => ['suggestion_id' => $item['id']], array_slice($snapshot['assessment']['suggestions'], 0, 8)),
        ], JSON_THROW_ON_ERROR);
    }
}
