<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_disclosure_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->onDelete('cascade');
            $table->foreignId('counterparty_user_id')->constrained('users')->onDelete('cascade');
            $table->string('counterparty_role', 32);
            $table->unsignedTinyInteger('stage')->default(1);
            $table->timestamp('interest_expressed_at')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'counterparty_user_id'], 'biz_disc_rel_unique');
            $table->index(['counterparty_user_id', 'stage'], 'biz_disc_user_stage_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_disclosure_relationships');
    }
};
