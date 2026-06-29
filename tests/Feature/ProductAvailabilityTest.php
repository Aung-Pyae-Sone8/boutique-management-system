<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;

test('customer product filter only returns products with available stock', function () {
    $availableProduct = Product::factory()->create(['stock_quantity' => 5]);
    $soldOutProduct = Product::factory()->create(['stock_quantity' => 0]);

    $response = $this->getJson(route('api.v1.products.index', ['in_stock' => true]));

    $response->assertSuccessful()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $availableProduct->id)
        ->assertJsonMissing(['id' => $soldOutProduct->id]);
});

test('admin product listing still includes sold out products', function () {
    $soldOutProduct = Product::factory()->create(['stock_quantity' => 0]);

    $this->getJson(route('api.v1.products.index'))
        ->assertSuccessful()
        ->assertJsonFragment(['id' => $soldOutProduct->id]);
});

test('customer product filter uses active variant stock when variants exist', function () {
    $availableProduct = Product::factory()->create(['stock_quantity' => 10]);
    ProductVariant::factory()->for($availableProduct)->create([
        'stock_quantity' => 0,
        'is_active' => true,
    ]);
    ProductVariant::factory()->for($availableProduct)->create([
        'stock_quantity' => 2,
        'is_active' => true,
    ]);

    $soldOutProduct = Product::factory()->create(['stock_quantity' => 10]);
    ProductVariant::factory()->for($soldOutProduct)->create([
        'stock_quantity' => 0,
        'is_active' => true,
    ]);

    $response = $this->getJson(route('api.v1.products.index', ['in_stock' => true]));

    $response->assertSuccessful()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $availableProduct->id);

    expect(collect($response->json('data'))->pluck('id'))
        ->not->toContain($soldOutProduct->id);
});

test('featured product filter only returns active featured products', function () {
    $featuredProduct = Product::factory()->create([
        'is_active' => true,
        'is_featured' => true,
        'stock_quantity' => 5,
    ]);
    Product::factory()->create([
        'is_active' => true,
        'is_featured' => false,
        'stock_quantity' => 5,
    ]);
    Product::factory()->create([
        'is_active' => false,
        'is_featured' => true,
        'stock_quantity' => 5,
    ]);

    $response = $this->getJson(route('api.v1.products.index', [
        'active' => true,
        'featured' => true,
        'in_stock' => true,
    ]));

    $response->assertSuccessful()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $featuredProduct->id);
});

test('product index filters available products by category', function () {
    $selectedCategory = Category::factory()->create();
    $otherCategory = Category::factory()->create();
    $matchingProduct = Product::factory()->for($selectedCategory)->create([
        'is_active' => true,
        'stock_quantity' => 5,
    ]);
    Product::factory()->for($otherCategory)->create([
        'is_active' => true,
        'stock_quantity' => 5,
    ]);

    $response = $this->getJson(route('api.v1.products.index', [
        'active' => true,
        'in_stock' => true,
        'category_id' => $selectedCategory->id,
    ]));

    $response->assertSuccessful()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $matchingProduct->id);
});
