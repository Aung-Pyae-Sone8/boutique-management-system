<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatThreadResource extends JsonResource
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
            'customer_id' => $this->customer_id,
            'customer' => CustomerResource::make($this->whenLoaded('customer')),
            'subject' => $this->subject,
            'status' => $this->status,
            'customer_unread_count' => $this->customer_unread_count,
            'admin_unread_count' => $this->admin_unread_count,
            'last_message_at' => $this->last_message_at?->toISOString(),
            'messages_count' => $this->whenCounted('messages'),
            'messages' => ChatMessageResource::collection($this->whenLoaded('messages')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
