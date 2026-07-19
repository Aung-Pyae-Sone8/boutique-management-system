<?php

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'first_name', 'last_name', 'name', 'email', 'phone', 'address', 'gender', 'city', 'country', 'profile_photo_path'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return HasMany<ChatThread, $this>
     */
    public function chatThreads(): HasMany
    {
        return $this->hasMany(ChatThread::class);
    }

    /**
     * @return HasOne<ChatThread, $this>
     */
    public function chatThread(): HasOne
    {
        return $this->hasOne(ChatThread::class);
    }
}
