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
        Schema::create('business_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('professional_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('founder_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('submitted'); // submitted, under_review, accepted, rejected, withdrawn
            $table->string('role_title')->nullable();
            $table->text('note')->nullable();
            $table->json('skills')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'status']);
            $table->index(['founder_user_id', 'status']);
            $table->index(['professional_user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_applications');
    }
};
