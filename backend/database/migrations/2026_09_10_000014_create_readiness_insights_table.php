<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readiness_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('readiness_assessment_id');
            $table->foreign(['business_id', 'readiness_assessment_id'], 'insight_assessment_business_fk')
                ->references(['business_id', 'id'])->on('readiness_assessments')->restrictOnDelete();
            $table->unsignedInteger('version');
            $table->json('source_snapshot');
            $table->char('source_fingerprint', 64);
            $table->text('summary');
            $table->json('strengths');
            $table->json('weaknesses');
            $table->json('opportunities');
            $table->json('risks');
            $table->json('recommendations');
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['business_id', 'version']);
            $table->unique(['business_id', 'source_fingerprint'], 'insight_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_insights');
    }
};
