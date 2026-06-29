<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('BTQ-VAR-###'),
            'size' => fake()->randomElement(['XS', 'S', 'M', 'L', null]),
            'color' => fake()->safeColorName(),
            'price' => fake()->randomFloat(2, 25, 250),
            'cost_price' => fake()->randomFloat(2, 10, 120),
            'stock_quantity' => fake()->numberBetween(0, 40),
            'low_stock_threshold' => fake()->numberBetween(3, 8),
            'is_active' => true,
        ];
    }
}
