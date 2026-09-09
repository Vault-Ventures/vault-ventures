<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('industry_experience')->nullable();
            $table->string('experience_level', 100)->nullable();
            $table->string('availability', 100)->nullable();
            $table->string('location', 255)->nullable();
            $table->json('compensation_preferences');
            $table->timestamps();
        });
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('normalized_name', 100)->collation('utf8mb4_bin')->unique();
            $table->timestamps();
        });
        Schema::create('professional_profile_skill', function (Blueprint $table) {
            $table->foreignId('professional_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->primary(['professional_profile_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_profile_skill');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('professional_profiles');
    }
};
