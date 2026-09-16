<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('headline', 255)->nullable()->after('name');
            $table->text('bio')->nullable()->after('headline');
            $table->string('location', 255)->nullable()->after('bio');
            $table->string('avatar_url', 1024)->nullable()->after('location');
            $table->string('cover_photo_url', 1024)->nullable()->after('avatar_url');
            $table->json('experience')->nullable()->after('cover_photo_url');
            $table->json('portfolio')->nullable()->after('experience');
            $table->json('preferences')->nullable()->after('portfolio');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'headline',
                'bio',
                'location',
                'avatar_url',
                'cover_photo_url',
                'experience',
                'portfolio',
                'preferences',
            ]);
        });
    }
};
