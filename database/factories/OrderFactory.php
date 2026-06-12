<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 40, 400);
        $discount = fake()->randomFloat(2, 0, 20);
        $tax = round($subtotal * 0.05, 2);
        $shippingFee = $subtotal > 120 ? 0 : 5;

        return [
            'customer_id' => Customer::factory(),
            'order_number' => 'BTQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'cancelled']),
            'payment_status' => fake()->randomElement(['unpaid', 'paid', 'refunded']),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'shipping_fee' => $shippingFee,
            'total' => $subtotal - $discount + $tax + $shippingFee,
            'ordered_at' => fake()->dateTimeBetween('-30 days'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
