<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'method' => 'kbz_pay',
            'provider' => 'kbzpay',
            'transaction_id' => fake()->unique()->bothify('TXN-########'),
            'amount' => fake()->randomFloat(2, 10, 1000),
            'currency' => 'MMK',
            'status' => 'pending',
        ];
    }
}
