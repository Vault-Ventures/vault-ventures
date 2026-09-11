<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_disclosure_relationships', function (Blueprint $table) {
            $table->timestamp('stage_4_confirmed_at')->nullable()->after('interest_expressed_at');
        });
    }

    public function down(): void
    {
        Schema::table('business_disclosure_relationships', function (Blueprint $table) {
            $table->dropColumn('stage_4_confirmed_at');
        });
    }
};
