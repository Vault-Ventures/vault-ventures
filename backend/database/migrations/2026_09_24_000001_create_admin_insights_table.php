<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_insights', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('version')->unique();
            $table->string('source_fingerprint', 64);
            $table->string('source_schema_version', 50)->default('admin-intelligence-source-v1');
            $table->string('output_contract_version', 50)->default('admin-intelligence-output-v1');
            $table->json('source_snapshot');
            $table->text('summary');
            $table->json('governance_observations');
            $table->json('operational_highlights');
            $table->json('attention_areas');
            $table->json('suggested_review_points');
            $table->timestamp('generated_at');
            $table->timestamp('created_at')->nullable();

            $table->index('source_fingerprint');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_insights');
    }
};
