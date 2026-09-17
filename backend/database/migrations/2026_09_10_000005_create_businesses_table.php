<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('founder_profile_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            foreach (['industry', 'business_stage', 'risk_level', 'expected_involvement'] as $field) {
                $table->string($field, 100)->nullable();
            }
            $table->string('location')->nullable();
            $table->string('status', 50)->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
