<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

return new class extends Migration
{
    /**
     * The database connection that should be used by the migration.
     *
     * @var string
     */
    protected $connection = 'mongodb';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('mongodb')->table('users', function (Blueprint $collection) {
            $collection->unique('id_number');
            $collection->unique('email');
        });

        Schema::connection('mongodb')->table('items', function (Blueprint $collection) {
            $collection->unique('item_code');
        });

        Schema::connection('mongodb')->table('rentals', function (Blueprint $collection) {
            $collection->unique('rental_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->table('users', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['id_number' => 1]);
            $collection->dropIndexIfExists(['email' => 1]);
        });

        Schema::connection('mongodb')->table('items', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['item_code' => 1]);
        });

        Schema::connection('mongodb')->table('rentals', function (Blueprint $collection) {
            $collection->dropIndexIfExists(['rental_code' => 1]);
        });
    }
};
