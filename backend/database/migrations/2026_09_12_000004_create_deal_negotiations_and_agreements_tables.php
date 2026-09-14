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
        Schema::create('deal_term_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('proposed_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('proposed_by_role');
            $table->string('investment_type');
            $table->decimal('amount', 14, 2)->nullable();
            $table->decimal('equity_percentage', 5, 2)->nullable();
            $table->decimal('profit_sharing_percentage', 5, 2)->nullable();
            $table->text('loss_sharing_terms')->nullable();
            $table->text('proposed_terms')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('proposed');
            $table->foreignId('responded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index('deal_id', 'idx_deal_proposals_deal_id');
            $table->index(['deal_id', 'version'], 'idx_deal_proposals_deal_version');
            $table->index(['deal_id', 'status'], 'idx_deal_proposals_status');
        });

        Schema::create('deal_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->unique('unique_deal_agreement')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('proposal_id')->constrained('deal_term_proposals')->cascadeOnDelete();
            $table->string('agreement_type');
            $table->string('title');
            $table->longText('agreement_text');
            $table->json('terms_snapshot');
            $table->string('status')->default('pending_signatures');
            $table->timestamp('founder_signed_at')->nullable();
            $table->foreignId('founder_signed_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('counterparty_signed_at')->nullable();
            $table->foreignId('counterparty_signed_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();

            $table->index('status', 'idx_deal_agreements_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deal_agreements');
        Schema::dropIfExists('deal_term_proposals');
    }
};
