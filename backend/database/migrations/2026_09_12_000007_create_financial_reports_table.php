<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('financial_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->constrained('users');
            $table->date('reporting_period_start');
            $table->date('reporting_period_end');
            $table->decimal('revenue', 15, 2);
            $table->decimal('expenses', 15, 2);
            $table->decimal('net_profit_loss', 15, 2);
            $table->decimal('cash_position', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('self_reported');
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('admin_review_notes')->nullable();
            $table->timestamps();

            $table->index(['deal_id', 'reporting_period_start', 'reporting_period_end'], 'idx_deal_period');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_reports');
    }
};
