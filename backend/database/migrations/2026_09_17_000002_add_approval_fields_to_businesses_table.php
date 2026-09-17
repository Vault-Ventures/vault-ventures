<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            if (!Schema::hasColumn('businesses', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('submitted_at');
            }
            if (!Schema::hasColumn('businesses', 'approved_by_user_id')) {
                $table->foreignId('approved_by_user_id')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('businesses', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('approved_by_user_id');
            }
            if (!Schema::hasColumn('businesses', 'rejected_by_user_id')) {
                $table->foreignId('rejected_by_user_id')->nullable()->after('rejected_at')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('businesses', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('rejected_by_user_id');
            }
            if (!Schema::hasColumn('businesses', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('rejection_reason');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE businesses MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('businesses', 'approved_by_user_id')) {
                $table->dropForeign(['approved_by_user_id']);
                $columnsToDrop[] = 'approved_by_user_id';
            }
            if (Schema::hasColumn('businesses', 'rejected_by_user_id')) {
                $table->dropForeign(['rejected_by_user_id']);
                $columnsToDrop[] = 'rejected_by_user_id';
            }
            foreach (['approved_at', 'rejected_at', 'rejection_reason', 'published_at'] as $col) {
                if (Schema::hasColumn('businesses', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
