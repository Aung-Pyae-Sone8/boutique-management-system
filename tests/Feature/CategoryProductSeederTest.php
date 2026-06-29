<?php

use App\Models\Product;
use Database\Seeders\CategoryProductSeeder;
use Illuminate\Support\Facades\Storage;

test('category product seeder creates complete products with variants and images', function () {
    Storage::fake('public');

    $this->seed(CategoryProductSeeder::class);
    $this->seed(CategoryProductSeeder::class);

    $products = Product::query()
        ->whereIn('sku', ['MNS-001', 'MNS-002', 'WNS-001', 'WNS-002', 'BYU-001', 'BYU-002', 'GLU-001', 'GLU-002'])
        ->with(['images', 'variants.images'])
        ->get();

    expect($products)->toHaveCount(8);

    foreach ($products as $product) {
        expect($product->variants)->toHaveCount(6)
            ->and($product->images->whereNull('product_variant_id'))->toHaveCount(2)
            ->and($product->variants->every(fn ($variant): bool => $variant->images->count() === 1))->toBeTrue()
            ->and($product->stock_quantity)->toBe($product->variants->sum('stock_quantity'));

        Storage::disk('public')->assertExists($product->images->first()->path);
    }
});
