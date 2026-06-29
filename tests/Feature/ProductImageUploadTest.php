<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('products can be created with multiple uploaded images', function () {
    Storage::fake('public');

    $category = Category::factory()->create();

    $response = $this->post(route('api.v1.products.store'), [
        'category_id' => $category->id,
        'sku' => 'BTQ-UPL-001',
        'name' => 'Uploaded Image Dress',
        'description' => 'A product with real image uploads.',
        'price' => 129.99,
        'cost_price' => 55.00,
        'stock_quantity' => 12,
        'low_stock_threshold' => 4,
        'size' => 'M',
        'color' => 'Black',
        'is_featured' => true,
        'is_active' => true,
        'images' => [
            UploadedFile::fake()->image('front.jpg'),
            UploadedFile::fake()->image('back.jpg'),
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.images.0.original_name', 'front.jpg')
        ->assertJsonPath('data.images.1.original_name', 'back.jpg');

    $product = Product::where('sku', 'BTQ-UPL-001')->firstOrFail();

    expect($product->images)->toHaveCount(2);

    foreach ($product->images as $image) {
        Storage::disk('public')->assertExists($image->path);
    }
});

test('products can be created with multiple variants', function () {
    Storage::fake('public');

    $category = Category::factory()->create();

    $response = $this->post(route('api.v1.products.store'), [
        'category_id' => $category->id,
        'sku' => 'BTQ-VARIANT-001',
        'name' => 'Variant Dress',
        'description' => 'A product with size and color variants.',
        'price' => 0,
        'cost_price' => 0,
        'stock_quantity' => 0,
        'low_stock_threshold' => 0,
        'is_featured' => false,
        'is_active' => true,
        'variants' => [
            [
                'sku' => 'BTQ-VARIANT-001-S-BLK',
                'size' => 'S',
                'color' => 'Black',
                'price' => 89.99,
                'cost_price' => 39.00,
                'stock_quantity' => 6,
                'low_stock_threshold' => 2,
                'is_active' => true,
            ],
            [
                'sku' => 'BTQ-VARIANT-001-M-IVY',
                'size' => 'M',
                'color' => 'Ivory',
                'price' => 94.99,
                'cost_price' => 41.00,
                'stock_quantity' => 4,
                'low_stock_threshold' => 2,
                'is_active' => true,
            ],
        ],
        'images' => [
            UploadedFile::fake()->image('variant-front.jpg'),
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.price', 89.99)
        ->assertJsonPath('data.size', 'S')
        ->assertJsonPath('data.color', 'Black')
        ->assertJsonPath('data.variants.0.sku', 'BTQ-VARIANT-001-S-BLK')
        ->assertJsonPath('data.variants.1.sku', 'BTQ-VARIANT-001-M-IVY');

    $product = Product::where('sku', 'BTQ-VARIANT-001')->firstOrFail();

    expect($product->variants)->toHaveCount(2);
});

test('products can be created with variant images', function () {
    Storage::fake('public');

    $category = Category::factory()->create();

    $response = $this->post(route('api.v1.products.store'), [
        'category_id' => $category->id,
        'sku' => 'BTQ-VARIANT-IMG-001',
        'name' => 'Variant Image Dress',
        'description' => 'A product with variant-specific images.',
        'price' => 0,
        'cost_price' => 0,
        'stock_quantity' => 0,
        'low_stock_threshold' => 0,
        'is_featured' => false,
        'is_active' => true,
        'variants' => [
            [
                'sku' => 'BTQ-VARIANT-IMG-001-BLK',
                'size' => 'S',
                'color' => 'Black',
                'price' => 89.99,
                'cost_price' => 39.00,
                'stock_quantity' => 6,
                'low_stock_threshold' => 2,
                'is_active' => true,
            ],
        ],
        'images' => [
            UploadedFile::fake()->image('product-main.jpg'),
        ],
        'variant_images' => [
            [
                UploadedFile::fake()->image('black-front.jpg'),
                UploadedFile::fake()->image('black-back.jpg'),
            ],
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.images.0.original_name', 'product-main.jpg')
        ->assertJsonPath('data.variants.0.images.0.original_name', 'black-front.jpg')
        ->assertJsonPath('data.variants.0.images.1.original_name', 'black-back.jpg');

    $product = Product::where('sku', 'BTQ-VARIANT-IMG-001')->firstOrFail();
    $variant = $product->variants()->firstOrFail();

    expect($product->images()->whereNull('product_variant_id')->count())->toBe(1);
    expect($variant->images)->toHaveCount(2);

    foreach ($variant->images as $image) {
        Storage::disk('public')->assertExists($image->path);
    }
});

test('product updates can replace variant rows', function () {
    Storage::fake('public');

    $product = Product::factory()->create();
    $keptVariant = ProductVariant::factory()->for($product)->create([
        'sku' => 'BTQ-KEEP-S',
        'size' => 'S',
        'color' => 'Black',
    ]);
    ProductVariant::factory()->for($product)->create([
        'sku' => 'BTQ-REMOVE-M',
    ]);

    $response = $this->post(route('api.v1.products.update', $product), [
        '_method' => 'PUT',
        'category_id' => $product->category_id,
        'sku' => $product->sku,
        'name' => $product->name,
        'slug' => $product->slug,
        'description' => $product->description,
        'price' => $product->price,
        'cost_price' => $product->cost_price,
        'stock_quantity' => $product->stock_quantity,
        'low_stock_threshold' => $product->low_stock_threshold,
        'is_featured' => $product->is_featured,
        'is_active' => $product->is_active,
        'variants' => [
            [
                'id' => $keptVariant->id,
                'sku' => 'BTQ-KEEP-S',
                'size' => 'S',
                'color' => 'Black',
                'price' => 72,
                'cost_price' => 30,
                'stock_quantity' => 11,
                'low_stock_threshold' => 3,
                'is_active' => true,
            ],
            [
                'sku' => 'BTQ-NEW-L',
                'size' => 'L',
                'color' => 'Black',
                'price' => 74,
                'cost_price' => 31,
                'stock_quantity' => 8,
                'low_stock_threshold' => 3,
                'is_active' => true,
            ],
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.variants.0.sku', 'BTQ-KEEP-S')
        ->assertJsonPath('data.variants.1.sku', 'BTQ-NEW-L');

    $product->refresh();

    expect($product->variants)->toHaveCount(2);
    expect($product->variants()->where('sku', 'BTQ-REMOVE-M')->exists())->toBeFalse();
    expect($product->variants()->where('sku', 'BTQ-NEW-L')->exists())->toBeTrue();
});

test('product updates can append uploaded images', function () {
    Storage::fake('public');

    $product = Product::factory()->create();

    $response = $this->post(route('api.v1.products.update', $product), [
        '_method' => 'PUT',
        'category_id' => $product->category_id,
        'sku' => $product->sku,
        'name' => $product->name,
        'slug' => $product->slug,
        'description' => $product->description,
        'price' => $product->price,
        'cost_price' => $product->cost_price,
        'stock_quantity' => $product->stock_quantity,
        'low_stock_threshold' => $product->low_stock_threshold,
        'size' => $product->size,
        'color' => $product->color,
        'is_featured' => $product->is_featured,
        'is_active' => $product->is_active,
        'images' => [
            UploadedFile::fake()->image('detail.jpg'),
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.images.0.original_name', 'detail.jpg');

    $product->refresh();

    expect($product->images)->toHaveCount(1);
    Storage::disk('public')->assertExists($product->images->first()->path);
});
