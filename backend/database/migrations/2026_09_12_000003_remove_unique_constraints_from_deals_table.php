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
        Schema::table('deals', function (Blueprint $table) {
            $table->index('connection_id', 'idx_deals_connection');
            $table->index(['business_id', 'counterparty_user_id', 'counterparty_role'], 'idx_deals_business_counterparty');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropUnique('unique_deal_connection');
            $table->dropUnique('unique_business_deal_participant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->unique('connection_id', 'unique_deal_connection');
            $table->unique(
                ['business_id', 'counterparty_user_id', 'counterparty_role'],
                'unique_business_deal_participant'
            );
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex('idx_deals_connection');
            $table->dropIndex('idx_deals_business_counterparty');
        });
    }
};
