<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mongo:ping', function () {
    $this->info('Pinging MongoDB Atlas...');
    try {
        /** @var \MongoDB\Laravel\Connection $connection */
        $connection = DB::connection('mongodb');
        $connection->ping();
        $databaseName = $connection->getDatabaseName();
        $result = $connection->command(['ping' => 1])->toArray();

        $this->info("MongoDB Atlas ping successful! Connected to database: {$databaseName}");
        $this->line('Ping response: ' . json_encode($result));
    } catch (\Throwable $e) {
        $this->error('MongoDB Atlas connection failed: ' . $e->getMessage());
        return 1;
    }
    return 0;
})->purpose('Ping the MongoDB Atlas database connection');

Artisan::command('mongo:init-indexes', function () {
    $this->info('Initializing MongoDB indexes...');
    try {
        /** @var \MongoDB\Laravel\Connection $db */
        $db = DB::connection('mongodb');

        $usersCol = $db->getCollection('users');
        // Drop any non-standard named indexes if previously created
        foreach ($usersCol->listIndexes() as $idx) {
            if (in_array($idx->getName(), ['users_id_number_unique', 'users_email_unique'])) {
                $usersCol->dropIndex($idx->getName());
            }
        }
        $usersCol->createIndex(['id_number' => 1], ['unique' => true]);
        $usersCol->createIndex(['email' => 1], ['unique' => true]);
        $this->line('  ✓ Unique indexes created on users: id_number, email');

        $itemsCol = $db->getCollection('items');
        foreach ($itemsCol->listIndexes() as $idx) {
            if ($idx->getName() === 'items_item_code_unique') {
                $itemsCol->dropIndex($idx->getName());
            }
        }
        $itemsCol->createIndex(['item_code' => 1], ['unique' => true]);
        $itemsCol->createIndex(['category' => 1]);
        $itemsCol->createIndex(['availability_stat' => 1]);
        $this->line('  ✓ Unique index created on items: item_code (plus category, availability_stat)');

        $rentalsCol = $db->getCollection('rentals');
        foreach ($rentalsCol->listIndexes() as $idx) {
            if ($idx->getName() === 'rentals_rental_code_unique') {
                $rentalsCol->dropIndex($idx->getName());
            }
        }
        $rentalsCol->createIndex(['rental_code' => 1], ['unique' => true]);
        $rentalsCol->createIndex(['borrower_id' => 1]);
        $rentalsCol->createIndex(['item_id' => 1]);
        $rentalsCol->createIndex(['status' => 1]);
        $this->line('  ✓ Unique index created on rentals: rental_code (plus borrower_id, item_id, status)');

        $this->info('MongoDB indexes initialized successfully!');
    } catch (\Throwable $e) {
        $this->error('Failed to initialize MongoDB indexes: ' . $e->getMessage());
        return 1;
    }
    return 0;
})->purpose('Initialize unique and performance indexes on MongoDB collections');

Artisan::command('mongo:status', function () {
    $this->info('=== Equiply MongoDB Atlas Status ===');
    $this->line('Database: ' . DB::connection('mongodb')->getDatabaseName());

    $users = \App\Models\User::all();
    $this->info("Users count: {$users->count()}");
    foreach ($users as $u) {
        $this->line(" - [{$u->role}] {$u->name} ({$u->id_number}, {$u->email}) | peer_lender: " . ($u->is_peer_lender ? 'YES' : 'NO'));
    }

    $items = \App\Models\Item::all();
    $this->info("Items count: {$items->count()}");
    foreach ($items as $i) {
        $specsJson = json_encode($i->specs);
        $tagsJson = json_encode($i->tags);
        $this->line(" - [{$i->item_code}] {$i->name} ({$i->category}) | Rate: \${$i->rental_rate_hr}/hr | Tags: {$tagsJson} | Specs: {$specsJson}");
    }

    $rentals = \App\Models\Rental::all();
    $this->info("Rentals count: {$rentals->count()}");
    foreach ($rentals as $r) {
        $this->line(" - [{$r->rental_code}] Status: {$r->status} | Item: " . ($r->item_snapshot['name'] ?? 'N/A') . " | Collateral: " . ($r->financials['collateral_held'] ?? 'N/A'));
    }
})->purpose('Display summary of MongoDB Atlas documents in equiply_db');

Artisan::command('mongo:token-test', function () {
    $user = \App\Models\User::first();
    if (! $user) {
        $this->error('No users found.');
        return 1;
    }
    $token = $user->createToken('test-device')->plainTextToken;
    $this->info('Sanctum token successfully created for user: ' . $user->name);
    $this->line('Plain token: ' . $token);

    $tokenCount = \App\Models\PersonalAccessToken::count();
    $this->line('Stored personal_access_tokens in MongoDB: ' . $tokenCount);
    return 0;
})->purpose('Verify Sanctum token creation on MongoDB');



