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
        Schema::create('financial_report_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_report_id')->constrained('financial_reports')->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users');
            $table->string('original_filename', 255);
            $table->string('disk', 64)->default('financial_evidence');
            $table->string('path', 255);
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 128);
            $table->string('evidence_type', 64)->default('other');
            $table->timestamps();

            $table->index('financial_report_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_report_evidence');
    }
};
