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
        Schema::create('financial_evidence_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_report_evidence_id')->constrained('financial_report_evidence', 'id', 'fk_feal_evidence_id')->cascadeOnDelete();
            $table->foreignId('financial_report_id')->constrained('financial_reports', 'id', 'fk_feal_report_id')->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users', 'id', 'fk_feal_user_id')->nullOnDelete();
            $table->string('actor_role', 32)->nullable();
            $table->string('action', 64)->default('downloaded');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('financial_report_evidence_id', 'idx_feal_evidence');
            $table->index('financial_report_id', 'idx_feal_report');
            $table->index('actor_user_id', 'idx_feal_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_evidence_access_logs');
    }
};
