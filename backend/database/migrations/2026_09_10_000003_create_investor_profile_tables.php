<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
        Schema::create('investor_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_profile_id')->unique()->constrained()->cascadeOnDelete();
            foreach (['available_investment', 'minimum_investment', 'maximum_investment'] as $field) {
                $table->decimal($field, 15, 2)->nullable();
            }
            foreach (['industry', 'risk_level', 'business_stage', 'involvement'] as $field) {
                $table->string($field, 100)->nullable();
            }
            $table->string('location', 255)->nullable();
            $table->json('investment_types');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investor_preferences');
        Schema::dropIfExists('investor_profiles');
    }
};
