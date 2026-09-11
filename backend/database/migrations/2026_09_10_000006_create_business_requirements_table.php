<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->unique()->constrained()->restrictOnDelete();
            $table->decimal('funding_amount', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_requirements');
    }
};
