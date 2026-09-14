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
        Schema::create('business_interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('founder_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('counterparty_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('counterparty_role');
            $table->foreignId('expressed_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('active');
            $table->timestamp('expressed_at')->useCurrent();
            $table->timestamps();

            $table->unique(
                ['business_id', 'counterparty_user_id', 'counterparty_role', 'expressed_by_user_id'],
                'unique_business_interest_expression'
            );

            $table->index(['business_id', 'counterparty_user_id', 'counterparty_role'], 'idx_business_counterparty_role');
            $table->index('expressed_by_user_id', 'idx_interest_expressed_by');
            $table->index('founder_user_id', 'idx_interest_founder');
        });

        Schema::create('business_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('founder_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('counterparty_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('counterparty_role');
            $table->timestamps();

            $table->unique(
                ['business_id', 'counterparty_user_id', 'counterparty_role'],
                'unique_business_connection'
            );

            $table->index(['business_id', 'founder_user_id'], 'idx_connection_business_founder');
            $table->index(['counterparty_user_id', 'counterparty_role'], 'idx_connection_counterparty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_connections');
        Schema::dropIfExists('business_interests');
    }
};
