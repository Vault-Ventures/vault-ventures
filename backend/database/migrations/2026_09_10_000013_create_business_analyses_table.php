<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('readiness_assessments', fn (Blueprint $table) => $table->unique(['business_id', 'id'], 'assessment_business_id_id_unique'));
        Schema::create('business_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('readiness_assessment_id');
            $table->foreign(['business_id', 'readiness_assessment_id'], 'analysis_assessment_business_fk')->references(['business_id', 'id'])->on('readiness_assessments')->restrictOnDelete();
            $table->unsignedInteger('version');
            foreach (['input_contract_version', 'output_contract_version', 'instruction_version', 'renderer_version'] as $field) {
                $table->string($field, 50);
            }
            $table->string('provider_identifier', 128);
            $table->string('model_identifier', 128)->nullable();
            $table->json('source_snapshot');
            $table->char('source_fingerprint', 64);
            $table->json('validated_output');
            $table->json('rendered_output');
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['business_id', 'version']);
            $table->unique(['business_id', 'source_fingerprint'], 'analysis_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_analyses');
        Schema::table('readiness_assessments', fn (Blueprint $table) => $table->dropUnique('assessment_business_id_id_unique'));
    }
};
