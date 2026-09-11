<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('readiness_input_versions', function (Blueprint $table) {
            $table->unique(['business_id', 'id'], 'readiness_inputs_business_id_id_unique');
        });
        Schema::create('readiness_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('readiness_input_version_id');
            $table->foreign(['business_id', 'readiness_input_version_id'], 'assessment_input_business_fk')
                ->references(['business_id', 'id'])->on('readiness_input_versions')->restrictOnDelete();
            $table->unsignedInteger('version');
            $table->unsignedInteger('input_version');
            $table->string('input_schema_version', 50);
            $table->string('rubric_version', 50);
            $table->json('source_snapshot');
            $table->char('source_fingerprint', 64);
            $table->json('factor_results');
            $table->decimal('overall_score', 5, 2);
            $table->json('weak_areas');
            $table->json('suggestions');
            $table->boolean('is_incomplete');
            $table->json('calculation');
            $table->timestamp('evaluated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['business_id', 'version']);
            $table->unique(['business_id', 'source_fingerprint'], 'assessment_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_assessments');
        Schema::table('readiness_input_versions', fn (Blueprint $table) => $table->dropUnique('readiness_inputs_business_id_id_unique'));
    }
};
