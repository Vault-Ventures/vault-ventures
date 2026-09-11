<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_request_id')->constrained('verification_requests')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 50);
            $table->string('previous_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('occurred_at');

            $table->index(['verification_request_id', 'occurred_at'], 'verif_audit_req_time_idx');
            $table->index('actor_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_audit_logs');
    }
};
