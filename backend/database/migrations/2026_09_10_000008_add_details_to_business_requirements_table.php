<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_requirements', function (Blueprint $table) {
            $table->json('accepted_investment_types')->nullable();
            $table->text('micro_proposed_terms')->nullable();
            $table->text('large_standard_proposed_terms')->nullable();
            $table->string('required_experience_level', 100)->nullable();
            $table->string('required_availability', 100)->nullable();
            $table->json('compensation_preferences')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('business_requirements', function (Blueprint $table) {
            $table->dropColumn([
                'accepted_investment_types', 'micro_proposed_terms', 'large_standard_proposed_terms',
                'required_experience_level', 'required_availability', 'compensation_preferences',
            ]);
        });
    }
};
