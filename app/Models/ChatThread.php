<?php

namespace App\Models;

use Database\Factories\ChatThreadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['customer_id', 'subject', 'status', 'customer_unread_count', 'admin_unread_count', 'last_message_at'])]
class ChatThread extends Model
{
    /** @use HasFactory<ChatThreadFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<ChatMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }
}
