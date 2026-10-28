<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalResource extends JsonResource
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
            'rental_code' => $this->rental_code,
            'item_id' => (string) $this->item_id,
            'item' => $this->whenLoaded('item', fn () => new ItemResource($this->item)),
            'borrower_id' => (string) $this->borrower_id,
            'borrower' => $this->whenLoaded('borrower', fn () => new UserResource($this->borrower)),
            'custodian_id' => $this->custodian_id ? (string) $this->custodian_id : null,
            'custodian' => $this->whenLoaded('custodian', fn () => new UserResource($this->custodian)),
            'status' => $this->status,
            'schedule' => $this->schedule ?? [],
            'item_snapshot' => $this->item_snapshot ?? [],
            'condition_logs' => $this->condition_logs ?? [],
            'financials' => $this->financials ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
