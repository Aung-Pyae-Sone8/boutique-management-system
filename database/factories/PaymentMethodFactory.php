<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = fake()->unique()->randomElement(['KBZPay', 'Wave Money', 'AYA Pay', 'CB Pay', 'UAB Pay']).' '.fake()->unique()->randomNumber(3);

        return [
            'code' => Str::slug($label, '_'),
            'label' => $label,
            'provider' => Str::slug($label, '_'),
            'account_username' => fake()->name(),
            'account_phone' => fake()->phoneNumber(),
            'qr_path' => null,
            'is_active' => true,
            'sort_order' => fake()->numberBetween(1, 20),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }
}
