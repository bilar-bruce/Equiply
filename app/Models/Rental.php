<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class Rental extends Model
{
    public const OVERDUE_RATE_PER_HOUR = 15.00;

    /**
     * The connection name for the model.
     *
     * @var string|null
     */
    protected $connection = 'mongodb';

    /**
     * The collection associated with the model.
     *
     * @var string
     */
    protected $collection = 'rentals';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'rental_code',
        'item_id',
        'borrower_id',
        'custodian_id',
        'status',
        'schedule',
        'item_snapshot',
        'condition_logs',
        'financials',
        'reminder_sent_at',
        'overdue_alert_sent_at',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'schedule' => 'array',
            'item_snapshot' => 'array',
            'condition_logs' => 'array',
            'financials' => 'array',
        ];
    }

    /**
     * Get the item being rented.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * Get the borrower (user) of this rental.
     */
    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    /**
     * Get the custodian (user) who facilitated this rental.
     */
    public function custodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'custodian_id');
    }

    /**
     * Auto-expire unclaimed pending/reserved reservations past their 30-minute pickup window.
     * Throttled to once every 10 seconds to avoid redundant cloud MongoDB sweeps on concurrent requests.
     */
    public static function expireUnclaimedReservations(): int
    {
        if (! app()->runningUnitTests() && ! \Illuminate\Support\Facades\Cache::add('equiply_expiry_sweep_lock', true, 10)) {
            return 0;
        }

        $unclaimed = static::whereIn('status', ['pending', 'reserved'])->get();
        $expiredCount = 0;
        $now = now();

        foreach ($unclaimed as $rental) {
            $expiresAt = $rental->schedule['expires_at'] ?? null;
            if ($expiresAt && \Carbon\Carbon::parse($expiresAt)->lessThanOrEqualTo($now)) {
                $schedule = $rental->schedule ?? [];
                $schedule['expired_at'] = $now->toIso8601String();
                $rental->status = 'expired';
                $rental->schedule = $schedule;
                $rental->save();

                $item = Item::where('_id', $rental->item_id)->first();
                if ($item && $item->availability_stat === 'reserved') {
                    $item->availability_stat = 'available';
                    $item->save();
                }

                $expiredCount++;
            }
        }

        if ($expiredCount > 0) {
            \Illuminate\Support\Facades\Cache::forget('equiply_category_counts');
        }

        return $expiredCount;
    }
}
