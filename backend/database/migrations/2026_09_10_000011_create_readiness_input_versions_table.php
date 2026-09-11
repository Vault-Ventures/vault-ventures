<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readiness_input_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('version');
            $table->string('schema_version', 50);
            $table->json('answers');
            $table->timestamp('created_at');
            $table->unique(['business_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_input_versions');
    }
};
