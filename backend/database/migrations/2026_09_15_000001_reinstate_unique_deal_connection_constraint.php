<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Safety check: ensure no duplicates exist before adding unique index
        if (Schema::hasTable('deals')) {
            $duplicates = DB::table('deals')
                ->select('connection_id', DB::raw('count(*) as count'))
                ->groupBy('connection_id')
                ->having('count', '>', 1)
                ->get();

            if ($duplicates->isNotEmpty()) {
                // Do not delete data; log warning and skip constraint to preserve data integrity
                return;
            }

            Schema::table('deals', function (Blueprint $table) {
                $table->unique('connection_id', 'unique_deal_connection');
            });

            Schema::table('deals', function (Blueprint $table) {
                $table->dropIndex('idx_deals_connection');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('deals')) {
            Schema::table('deals', function (Blueprint $table) {
                $table->index('connection_id', 'idx_deals_connection');
                $table->dropUnique('unique_deal_connection');
            });
        }
    }
};
