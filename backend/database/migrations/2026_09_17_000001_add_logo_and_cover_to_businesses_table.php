<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('logo_url', 1024)->nullable()->after('location');
            $table->string('cover_photo_url', 1024)->nullable()->after('logo_url');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'cover_photo_url']);
        });
    }
};
