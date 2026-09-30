<?php

namespace Tests\Unit;

use App\Enums\DealStage;
use App\Models\User;
use App\Services\Financial\AdminFinancialGovernanceService;
use App\Services\Financial\AdminFinancialReportService;
use App\Services\Financial\FinancialReportService;
use Illuminate\Database\ConnectionResolver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\MySqlConnection;
use Illuminate\Pagination\Paginator;
use Mockery;
use PHPUnit\Framework\TestCase;

class AdminAnalyticsQueriesTest extends TestCase
{
    private $previousResolver;
    private MySqlConnection $connection;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousResolver = Model::getConnectionResolver();
        // Compile real Eloquent queries without connecting or changing any records.
        $this->connection = new class extends MySqlConnection {
            public array $queries = [];
            public function __construct() { parent::__construct(null); }
            public function select($query, $bindings = [], $useReadPdo = true)
            {
                $this->queries[] = [$query, $bindings];
                return str_contains($query, 'aggregate') ? [(object) ['aggregate' => 16]] : [];
            }
        };
        $resolver = new ConnectionResolver(['test' => $this->connection]);
        $resolver->setDefaultConnection('test');
        Model::setConnectionResolver($resolver);
    }

    protected function tearDown(): void
    {
        if ($this->previousResolver) Model::setConnectionResolver($this->previousResolver);
        else Model::unsetConnectionResolver();
        Paginator::currentPageResolver(fn () => 1);
        Mockery::close();
        parent::tearDown();
    }

    private function admin(): User
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('hasAdminAccess')->andReturn(true);
        return $user;
    }

    public function test_active_count_filters_existing_active_stage_and_preserves_historical_total(): void
    {
        (new AdminFinancialGovernanceService)->getGovernanceOverview($this->admin());
        $queries = $this->connection->queries;
        [$activeSql, $bindings] = $queries[count($queries) - 1];
        $this->assertStringContainsString('count(distinct `deal_id`)', $activeSql);
        $this->assertStringContainsString('exists (select * from `deals`', $activeSql);
        $this->assertStringContainsString('`stage` = ?', $activeSql);
        $this->assertSame([DealStage::MilestoneFundingActive->value], $bindings);
        $this->assertNotContains(DealStage::Completed->value, $bindings);
        $this->assertStringNotContainsString('exists', $queries[count($queries) - 2][0]);
    }

    public function test_search_and_status_are_applied_before_pagination(): void
    {
        Paginator::currentPageResolver(fn () => 2);
        $service = new AdminFinancialReportService(Mockery::mock(FinancialReportService::class));
        $result = $service->listReports($this->admin(), ['q' => 'Older', 'status' => 'verified']);
        $this->assertSame(2, $result->currentPage());
        $this->assertSame(2, $result->lastPage());
        foreach ($this->connection->queries as [$sql, $bindings]) {
            $this->assertStringContainsString('`status` = ?', $sql);
            $this->assertStringContainsString('`id` like ?', $sql);
            $this->assertStringContainsString('`deal_id` like ?', $sql);
            $this->assertStringContainsString('`name` like ?', $sql);
            $this->assertContains('verified', $bindings);
            $this->assertContains('%Older%', $bindings);
        }
        $this->assertStringContainsString('limit 15 offset 15', $this->connection->queries[1][0]);
    }

    public function test_history_groups_exact_persisted_periods_without_estimating_gaps(): void
    {
        $result = (new AdminFinancialGovernanceService)->getGovernanceOverview($this->admin());
        $this->assertSame([], $result['reporting_periods']);
        $history = array_values(array_filter($this->connection->queries, fn ($query) => str_contains($query[0], 'period_revenue')));
        $this->assertCount(1, $history);
        $this->assertStringContainsString('SUM(revenue)', $history[0][0]);
        $this->assertStringContainsString('SUM(expenses)', $history[0][0]);
        $this->assertStringContainsString('SUM(net_profit_loss)', $history[0][0]);
        $this->assertStringContainsString('group by `reporting_period_start`, `reporting_period_end`', $history[0][0]);
        $this->assertStringContainsString('order by `reporting_period_start` asc, `reporting_period_end` asc', $history[0][0]);
    }
}
