<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_ndas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->onDelete('cascade');
            $table->foreignId('counterparty_user_id')->constrained('users')->onDelete('cascade');
            $table->string('counterparty_role', 32);
            $table->string('status', 32)->default('pending');
            $table->string('nda_version', 32)->default('v1.0');
            $table->string('agreement_hash', 64);
            $table->foreignId('requested_by_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('requested_at');
            $table->timestamp('founder_accepted_at')->nullable();
            $table->timestamp('counterparty_accepted_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->foreignId('declined_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['business_id', 'counterparty_user_id'], 'biz_nda_bus_counterparty_unique');
            $table->index(['counterparty_user_id', 'status'], 'biz_nda_user_status_idx');
            $table->index(['business_id', 'status'], 'biz_nda_business_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_ndas');
    }
};
