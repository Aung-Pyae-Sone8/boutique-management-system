<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'sku' => fake()->unique()->bothify('BTQ-###'),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 25, 250),
            'cost_price' => fake()->randomFloat(2, 10, 120),
            'stock_quantity' => fake()->numberBetween(0, 40),
            'low_stock_threshold' => fake()->numberBetween(3, 8),
            'size' => fake()->randomElement(['XS', 'S', 'M', 'L', null]),
            'color' => fake()->safeColorName(),
            'image_url' => null,
            'is_featured' => fake()->boolean(25),
            'is_active' => true,
        ];
    }
}
