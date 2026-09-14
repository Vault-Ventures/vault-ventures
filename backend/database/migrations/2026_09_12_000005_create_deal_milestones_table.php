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
        Schema::create('deal_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('agreement_id')->nullable()->constrained('deal_agreements')->nullOnDelete();
            $table->unsignedInteger('sequence_order');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('target_amount', 15, 2)->default(0.00);
            $table->date('target_date')->nullable();
            $table->string('status', 32)->default('pending')->index();
            $table->unsignedTinyInteger('progress_percentage')->default(0);
            $table->text('evidence_notes')->nullable();
            $table->json('evidence_urls')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('confirmed_at')->nullable();
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('confirmation_notes')->nullable();
            $table->dateTime('funded_at')->nullable();
            $table->text('dispute_reason')->nullable();
            $table->timestamps();

            $table->unique(['deal_id', 'sequence_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deal_milestones');
    }
};
