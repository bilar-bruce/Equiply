<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;
use MongoDB\Laravel\Relations\HasMany;

class Item extends Model
{
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
    protected $collection = 'items';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'item_code',
        'name',
        'category',
        'owner_type',
        'owner_user_id',
        'rental_rate_hr',
        'deposit_required',
        'availability_stat',
        'tags',
        'specs',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'owner_type' => 'facility',
        'rental_rate_hr' => 0.0,
        'deposit_required' => false,
        'availability_stat' => 'available',
        'tags' => [],
        'specs' => [],
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rental_rate_hr' => 'float',
            'deposit_required' => 'boolean',
            'tags' => 'array',
            'specs' => 'array',
        ];
    }

    /**
     * Get the student owner of this item if it is a peer-to-peer item.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * Get all rental records associated with this item.
     */
    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class, 'item_id');
    }
}
