<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_requirement_skill', function (Blueprint $table) {
            $table->foreignId('business_requirement_id')->constrained()->restrictOnDelete();
            $table->foreignId('skill_id')->constrained()->restrictOnDelete();
            $table->primary(['business_requirement_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_requirement_skill');
    }
};
