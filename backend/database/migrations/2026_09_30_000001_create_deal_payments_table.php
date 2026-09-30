<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('payer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('BDT');
            $table->string('payment_method', 32);
            $table->string('transaction_reference', 100)->nullable();
            $table->text('note')->nullable();
            $table->string('status', 32)->default('pending')->index();
            $table->date('payment_date');
            $table->dateTime('completed_at')->nullable();
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->decimal('commission_amount', 15, 2)->nullable();
            $table->decimal('net_amount', 15, 2)->nullable();
            $table->foreignId('status_updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['deal_id', 'status']);
            $table->unique(['deal_id', 'payment_method', 'transaction_reference'], 'deal_payments_unique_ref');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_payments');
    }
};
