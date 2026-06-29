<?php

use App\Models\Product;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Storage;

test('database seeder creates example product images', function () {
    Storage::fake('public');

    $this->seed(DatabaseSeeder::class);

    $products = Product::query()->with('images')->get();

    expect($products)->toHaveCount(6);

    foreach ($products as $product) {
        expect($product->images)->toHaveCount(2);

        foreach ($product->images as $image) {
            Storage::disk('public')->assertExists($image->path);
            expect($image->mime_type)->toBe('image/svg+xml');
        }
    }
});
