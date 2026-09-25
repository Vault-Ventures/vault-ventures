<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matching_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->string('candidate_type');
            $table->unsignedBigInteger('candidate_id');
            $table->string('counterparty_role');
            $table->unsignedInteger('version');
            $table->string('formula_version');
            $table->string('output_contract_version');
            $table->json('source_snapshot');
            $table->char('source_fingerprint', 64);
            $table->text('summary');
            $table->json('factor_explanations');
            $table->decimal('confidence', 5, 4);
            $table->json('strengths');
            $table->json('weaknesses');
            $table->json('opportunities');
            $table->json('risks');
            $table->json('recommendations');
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['business_id', 'candidate_id', 'counterparty_role', 'version'], 'matching_insight_version_unique');
            $table->unique(['business_id', 'candidate_id', 'counterparty_role', 'source_fingerprint'], 'matching_insight_source_unique');
            $table->index(['business_id', 'candidate_id', 'counterparty_role', 'version'], 'matching_insight_history_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_insights');
    }
};