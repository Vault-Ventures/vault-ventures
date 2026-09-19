<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('verification_tier')->index();
            $table->text('suspension_reason')->nullable()->after('suspended_at');
            $table->foreignId('suspended_by_user_id')->nullable()->after('suspension_reason')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['suspended_by_user_id']);
            $table->dropIndex(['suspended_at']);
            $table->dropColumn(['suspended_at', 'suspension_reason', 'suspended_by_user_id']);
        });
    }
};
