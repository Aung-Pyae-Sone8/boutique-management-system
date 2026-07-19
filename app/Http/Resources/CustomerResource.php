<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'gender' => $this->gender,
            'city' => $this->city,
            'country' => $this->country,
            'profile_photo_url' => $this->profile_photo_path
                ? Storage::disk('public')->url($this->profile_photo_path)
                : null,
            'orders_count' => $this->whenCounted('orders'),
            'lifetime_value' => $this->when(
                isset($this->orders_sum_total),
                fn (): float => (float) $this->orders_sum_total,
            ),
            'last_order_at' => $this->when(
                isset($this->orders_max_ordered_at),
                fn (): ?string => $this->orders_max_ordered_at
                    ? Carbon::parse($this->orders_max_ordered_at)->toISOString()
                    : null,
            ),
            'is_registered' => $this->user_id !== null,
            'role' => $this->whenLoaded(
                'user',
                fn (): ?string => $this->user?->role,
            ),
            'email_verified' => $this->whenLoaded(
                'user',
                fn (): ?bool => $this->user?->hasVerifiedEmail(),
            ),
            'registered_at' => $this->whenLoaded(
                'user',
                fn (): ?string => $this->user?->created_at?->toISOString(),
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
