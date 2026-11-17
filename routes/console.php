<?php

use App\Mail\LoanDueSoonMail;
use App\Mail\LoanOverdueAlertMail;
use App\Models\Rental;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

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

Artisan::command('equiply:send-loan-reminders', function () {
    $activeRentals = Rental::with(['item', 'borrower'])->where('status', 'active')->get();
    $dueSoonCount = 0;
    $overdueCount = 0;

    foreach ($activeRentals as $rental) {
        if (! $rental->borrower?->email || empty($rental->schedule['due_time'])) {
            continue;
        }

        $dueTime = \Carbon\Carbon::parse($rental->schedule['due_time']);
        $now = now();

        if ($now->greaterThan($dueTime)) {
            if (empty($rental->overdue_alert_sent_at) && empty($rental->schedule['overdue_alert_sent_at'])) {
                Mail::to($rental->borrower->email)->send(new LoanOverdueAlertMail($rental));
                $timestamp = $now->toIso8601String();
                $schedule = $rental->schedule ?? [];
                $schedule['overdue_alert_sent_at'] = $timestamp;
                $rental->overdue_alert_sent_at = $timestamp;
                $rental->schedule = $schedule;
                $rental->save();
                $overdueCount++;
            }
        } elseif ($dueTime->lessThanOrEqualTo($now->copy()->addMinutes(30))) {
            if (empty($rental->reminder_sent_at) && empty($rental->schedule['reminder_sent_at'])) {
                Mail::to($rental->borrower->email)->send(new LoanDueSoonMail($rental));
                $timestamp = $now->toIso8601String();
                $schedule = $rental->schedule ?? [];
                $schedule['reminder_sent_at'] = $timestamp;
                $rental->reminder_sent_at = $timestamp;
                $rental->schedule = $schedule;
                $rental->save();
                $dueSoonCount++;
            }
        }
    }

    $this->info("Processed active rentals: {$dueSoonCount} due-soon reminder(s) and {$overdueCount} overdue alert(s) dispatched.");
    return 0;
})->purpose('Send due-soon (30m) and overdue email reminders for active equipment rentals');

Schedule::command('equiply:send-loan-reminders')->everyFiveMinutes()->withoutOverlapping();

Artisan::command('equiply:expire-unclaimed-reservations', function () {
    $count = \App\Models\Rental::expireUnclaimedReservations();
    $this->info("Expired {$count} unclaimed reservation(s).");
    return 0;
})->purpose('Expire unclaimed equipment reservations past their 30-minute pickup window');

Schedule::command('equiply:expire-unclaimed-reservations')->everyFiveMinutes()->withoutOverlapping();

Artisan::command('equiply:clean-test-artifacts {--dry-run : Preview records that would be removed without deleting}', function () {
    $dryRun = (bool) $this->option('dry-run');

    $testItems = \App\Models\Item::where('item_code', 'like', 'TEST-%')
        ->orWhere('item_code', 'like', 'EQ-TEST-%')
        ->get();

    $testItemIds = $testItems->pluck('_id')->all();

    $testRentals = \App\Models\Rental::whereIn('item_id', $testItemIds)
        ->orWhere('rental_code', 'like', 'TEST-%')
        ->get();

    $testStudents = \App\Models\User::where('role', 'student')
        ->where(function ($q) {
            $q->where('email', 'like', '%@test.%')
                ->orWhere('email', 'like', '%test%@%')
                ->orWhere('id_number', 'like', '202699%');
        })
        ->get();

    $this->info(($dryRun ? '[DRY RUN] ' : '') . "Found {$testItems->count()} test item(s), {$testRentals->count()} test rental(s), and {$testStudents->count()} test student account(s).");

    if ($dryRun) {
        return 0;
    }

    foreach ($testRentals as $rental) {
        $rental->delete();
    }
    foreach ($testItems as $item) {
        $item->delete();
    }
    foreach ($testStudents as $student) {
        $student->delete();
    }

    \Illuminate\Support\Facades\Cache::forget('equiply_category_counts');
    $this->info('Test artifacts cleansed while preserving staff accounts and official facility gear.');

    return 0;
})->purpose('Remove test-generated items, rentals, and test student accounts from the active database');

Artisan::command('equiply:prune-users {--dry-run : Preview changes without modifying the database} {--personal-id= : Optional 10-digit school ID to assign to bilar.bruce@gmail.com}', function () {
    $dryRun = (bool) $this->option('dry-run');
    $personalId = $this->option('personal-id');

    if ($personalId !== null && $personalId !== '' && ! preg_match('/^\d{10}$/', $personalId)) {
        $this->error('Invalid --personal-id: must be a 10-digit USTP ID number (e.g. 2024300616).');
        return 1;
    }

    $keepEmails = [
        'bilar.bruce@gmail.com',
        'bilarbrucesteven@gmail.com',
        'bilarcaroljane540@gmail.com',
        'sheenamaeparco@gmail.com',
    ];

    $usersToDelete = \App\Models\User::whereNotIn('role', ['admin', 'custodian'])
        ->whereNotIn('email', $keepEmails)
        ->get();

    $deleteIds = $usersToDelete->pluck('_id')->map(fn ($id) => (string) $id)->all();
    $deleteObjectIds = $usersToDelete->pluck('_id')->all();

    $orphanedP2pItems = empty($deleteObjectIds)
        ? collect()
        : \App\Models\Item::where('owner_type', 'student')
            ->where(function ($q) use ($deleteIds, $deleteObjectIds) {
                $q->whereIn('owner_user_id', $deleteObjectIds)->orWhereIn('owner_user_id', $deleteIds);
            })
            ->get();

    $orphanedItemIds = $orphanedP2pItems->pluck('_id')->all();

    $orphanedRentals = (empty($deleteObjectIds) && empty($orphanedItemIds))
        ? collect()
        : \App\Models\Rental::where(function ($q) use ($deleteIds, $deleteObjectIds, $orphanedItemIds) {
            if (! empty($deleteObjectIds)) {
                $q->whereIn('borrower_id', $deleteObjectIds)->orWhereIn('borrower_id', $deleteIds);
            }
            if (! empty($orphanedItemIds)) {
                $q->orWhereIn('item_id', $orphanedItemIds);
            }
        })->get();

    $this->info(($dryRun ? '[DRY RUN] ' : '') . "Users to remove: {$usersToDelete->count()}");
    foreach ($usersToDelete as $u) {
        $this->line(" - {$u->name} <{$u->email}> ({$u->id_number})");
    }
    $this->info(($dryRun ? '[DRY RUN] ' : '') . "Orphaned P2P items to remove: {$orphanedP2pItems->count()}");
    $this->info(($dryRun ? '[DRY RUN] ' : '') . "Orphaned rentals to remove: {$orphanedRentals->count()}");

    if ($dryRun) {
        return 0;
    }

    // 1. Reset any non-orphaned items currently held by orphaned rentals back to 'available'
    foreach ($orphanedRentals as $rental) {
        if (in_array($rental->status, ['pending', 'reserved', 'active'], true) && ! in_array($rental->item_id, $orphanedItemIds)) {
            $heldItem = \App\Models\Item::find($rental->item_id);
            if ($heldItem && in_array($heldItem->availability_stat, ['reserved', 'rented'], true)) {
                $heldItem->availability_stat = 'available';
                $heldItem->save();
            }
        }
        $rental->delete();
    }

    // 2. Delete orphaned P2P items
    foreach ($orphanedP2pItems as $item) {
        $item->delete();
    }

    // 3. Delete Sanctum tokens and pruned users (frees up taken id_numbers like 2024300616)
    if (! empty($deleteIds)) {
        \App\Models\PersonalAccessToken::whereIn('tokenable_id', $deleteObjectIds)
            ->orWhereIn('tokenable_id', $deleteIds)
            ->delete();
    }
    foreach ($usersToDelete as $u) {
        $u->delete();
    }

    // 4. Align kept personal & peer lender accounts
    $renter = \App\Models\User::where('email', 'bilar.bruce@gmail.com')->first();
    if ($renter) {
        $renter->role = 'student';
        $renter->is_peer_lender = false;
        if ($personalId) {
            $renter->id_number = $personalId;
        }
        $renter->save();
        $this->info("Updated bilar.bruce@gmail.com -> student renter" . ($personalId ? " (ID: {$personalId})" : '') . '.');
    } else {
        $this->warn('Account bilar.bruce@gmail.com not found in database.');
    }

    $lender = \App\Models\User::where('email', 'bilarbrucesteven@gmail.com')->first();
    if ($lender) {
        $lender->role = 'student';
        $lender->is_peer_lender = true;
        $lender->save();
        $this->info('Updated bilarbrucesteven@gmail.com -> student peer lender (is_peer_lender=true).');
    } else {
        $this->warn('Account bilarbrucesteven@gmail.com not found in database.');
    }

    \Illuminate\Support\Facades\Cache::forget('equiply_category_counts');
    $this->info('User pruning and account updates completed.');

    return 0;
})->purpose('Prune non-whitelisted student accounts, clean orphaned records, and configure personal/lender accounts');

