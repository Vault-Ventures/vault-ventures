<?php

namespace App\Console\Commands;

use App\Models\Deal;
use App\Services\Deal\DealService;
use Illuminate\Console\Command;

class ReconcileDealNdaLifecycleCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'deals:reconcile-nda-lifecycle {deal_id? : Optional specific Deal ID to reconcile}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Idempotently reconciles Deal lifecycle stages against active bilateral NDAs.';

    /**
     * Execute the console command.
     */
    public function handle(DealService $dealService): int
    {
        $dealId = $this->argument('deal_id');

        $query = Deal::query();
        if ($dealId !== null) {
            $query->where('id', $dealId);
        }

        $deals = $query->get();

        if ($deals->isEmpty()) {
            $this->warn('No deals found for reconciliation.');
            return self::SUCCESS;
        }

        $reconciledCount = 0;

        foreach ($deals as $deal) {
            $previousStage = $deal->stage;
            $reconciledDeal = $dealService->reconcileNdaSignedStage($deal);

            if ($previousStage !== $reconciledDeal->stage) {
                $this->info("Deal #{$deal->id} reconciled: {$previousStage->value} -> {$reconciledDeal->stage->value}");
                $reconciledCount++;
            }
        }

        $this->info("Reconciliation complete. {$reconciledCount} deal(s) updated.");

        return self::SUCCESS;
    }
}
