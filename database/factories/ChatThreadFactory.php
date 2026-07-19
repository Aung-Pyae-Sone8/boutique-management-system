<?php

namespace Database\Factories;

use App\Models\ChatThread;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChatThread>
 */
class ChatThreadFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'subject' => fake()->optional()->sentence(4),
            'status' => 'open',
            'customer_unread_count' => 0,
            'admin_unread_count' => 0,
            'last_message_at' => now(),
        ];
    }
}
