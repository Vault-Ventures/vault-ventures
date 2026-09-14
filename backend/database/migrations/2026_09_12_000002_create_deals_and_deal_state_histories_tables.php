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
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connection_id')->constrained('business_connections')->cascadeOnDelete();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('founder_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('counterparty_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('counterparty_role');
            $table->string('stage')->default('matched');
            $table->timestamps();

            $table->unique('connection_id', 'unique_deal_connection');
            $table->unique(
                ['business_id', 'counterparty_user_id', 'counterparty_role'],
                'unique_business_deal_participant'
            );

            $table->index(['business_id', 'stage'], 'idx_deals_business_stage');
            $table->index('founder_user_id', 'idx_deals_founder');
            $table->index(['counterparty_user_id', 'counterparty_role'], 'idx_deals_counterparty');
        });

        Schema::create('deal_state_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->string('previous_state')->nullable();
            $table->string('new_state');
            $table->foreignId('changed_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            $table->index(['deal_id', 'created_at'], 'idx_history_deal_created');
            $table->index('changed_by_user_id', 'idx_history_changed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deal_state_histories');
        Schema::dropIfExists('deals');
    }
};
