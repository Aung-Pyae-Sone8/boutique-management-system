<?php

namespace Database\Factories;

use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChatMessage>
 */
class ChatMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'chat_thread_id' => ChatThread::factory(),
            'sender_id' => User::factory(),
            'sender_role' => fake()->randomElement(['customer', 'admin']),
            'message' => fake()->paragraph(),
            'read_at' => null,
        ];
    }
}
