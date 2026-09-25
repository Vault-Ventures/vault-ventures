<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('source_fingerprint', 64);
            $table->string('source_schema_version', 50)->default('deal-insight-source-v1');
            $table->string('output_contract_version', 50)->default('deal-insight-output-v1');
            $table->json('source_snapshot');
            $table->text('summary');
            $table->text('current_stage_summary');
            $table->json('key_points');
            $table->json('open_items');
            $table->json('discussion_points');
            $table->json('cautions');
            $table->timestamp('generated_at');
            $table->timestamp('created_at')->nullable();

            $table->unique(['deal_id', 'version']);
            $table->index(['deal_id', 'source_fingerprint']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_insights');
    }
};
