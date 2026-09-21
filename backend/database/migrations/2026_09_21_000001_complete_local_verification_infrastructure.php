<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phone_verification_codes', function (Blueprint $table) {
            // Older MySQL/MariaDB defaults can give the first TIMESTAMP an implicit
            // ON UPDATE CURRENT_TIMESTAMP. Delivery/attempt updates must not alter expiry.
            $table->dateTime('expires_at')->change();
            $table->timestamp('delivered_at')->nullable();
        });
        Schema::table('verification_requests', function (Blueprint $table) {
            // Never backfill from internal notes or historical rejection reasons.
            $table->text('participant_message')->nullable();
        });
        Schema::create('verification_evidence_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('verification_request_id')->constrained('verification_requests', indexName: 'verif_access_request_fk')->restrictOnDelete();
            $table->foreignId('verification_evidence_id')->constrained('verification_evidence', indexName: 'verif_access_evidence_fk')->restrictOnDelete();
            $table->string('action', 40);
            $table->timestamp('occurred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_evidence_access_logs');
        Schema::table('verification_requests', fn (Blueprint $table) => $table->dropColumn('participant_message'));
        Schema::table('phone_verification_codes', fn (Blueprint $table) => $table->dropColumn('delivered_at'));
        Schema::table('phone_verification_codes', fn (Blueprint $table) => $table->timestamp('expires_at')->change());
    }
};
