<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

return new class extends Migration
{
    /**
     * The database connection that should be used by the migration.
     */
    protected $connection = 'mongodb';

    /**
     * Add secondary indexes for hot Equiply queries (catalog filters, rental lists,
     * Sanctum token authentication, and admin user metrics).
     */
    public function up(): void
    {
        Schema::connection('mongodb')->table('personal_access_tokens', function (Blueprint $collection) {
            $collection->index('token');
            $collection->index('tokenable_id');
        });

        Schema::connection('mongodb')->table('items', function (Blueprint $collection) {
            $collection->index('availability_stat');
            $collection->index('category');
            $collection->index('owner_type');
            $collection->index('owner_user_id');
            $collection->index('created_at');
        });

        Schema::connection('mongodb')->table('rentals', function (Blueprint $collection) {
            $collection->index('borrower_id');
            $collection->index('status');
            $collection->index('item_id');
            $collection->index('created_at');
        });

        Schema::connection('mongodb')->table('users', function (Blueprint $collection) {
            $collection->index('role');
            $collection->index('status');
            $collection->index('is_peer_lender');
            $collection->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->table('personal_access_tokens', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['token' => 1]);
            $collection->dropIndexIfExists(['tokenable_id' => 1]);
        });

        Schema::connection('mongodb')->table('items', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['availability_stat' => 1]);
            $collection->dropIndexIfExists(['category' => 1]);
            $collection->dropIndexIfExists(['owner_type' => 1]);
            $collection->dropIndexIfExists(['owner_user_id' => 1]);
            $collection->dropIndexIfExists(['created_at' => 1]);
        });

        Schema::connection('mongodb')->table('rentals', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['borrower_id' => 1]);
            $collection->dropIndexIfExists(['status' => 1]);
            $collection->dropIndexIfExists(['item_id' => 1]);
            $collection->dropIndexIfExists(['created_at' => 1]);
        });

        Schema::connection('mongodb')->table('users', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['role' => 1]);
            $collection->dropIndexIfExists(['status' => 1]);
            $collection->dropIndexIfExists(['is_peer_lender' => 1]);
            $collection->dropIndexIfExists(['created_at' => 1]);
        });
    }
};
