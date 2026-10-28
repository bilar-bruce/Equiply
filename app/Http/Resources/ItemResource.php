<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'item_code' => $this->item_code,
            'name' => $this->name,
            'category' => $this->category,
            'owner_type' => $this->owner_type,
            'owner_user_id' => $this->owner_user_id ? (string) $this->owner_user_id : null,
            'owner' => $this->whenLoaded('owner', fn () => new UserResource($this->owner)),
            'rental_rate_hr' => (float) $this->rental_rate_hr,
            'deposit_required' => (bool) $this->deposit_required,
            'availability_stat' => $this->availability_stat,
            'tags' => $this->tags ?? [],
            'specs' => $this->specs ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
