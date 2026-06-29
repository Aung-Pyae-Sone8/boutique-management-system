<?php

use App\Models\Product;
use App\Models\ProductVariant;

test('adding a variant product to cart reduces stock', function () {
    $product = Product::factory()->create([
        'stock_quantity' => 10,
    ]);
    $variant = ProductVariant::factory()->for($product)->create([
        'stock_quantity' => 6,
    ]);

    $response = $this->postJson(route('api.v1.cart.stock.store'), [
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.stock_quantity', 8)
        ->assertJsonPath('data.variants.0.stock_quantity', 4);

    expect($product->refresh()->stock_quantity)->toBe(8);
    expect($variant->refresh()->stock_quantity)->toBe(4);
});

test('cart stock reservation rejects unavailable quantity', function () {
    $product = Product::factory()->create([
        'stock_quantity' => 1,
    ]);

    $response = $this->postJson(route('api.v1.cart.stock.store'), [
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('quantity');

    expect($product->refresh()->stock_quantity)->toBe(1);
});

test('decreasing cart quantity restores product and variant stock', function () {
    $product = Product::factory()->create(['stock_quantity' => 8]);
    $variant = ProductVariant::factory()->for($product)->create(['stock_quantity' => 4]);

    $this->patchJson(route('api.v1.cart.stock.update'), [
        'items' => [[
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity_change' => -2,
        ]],
    ])->assertNoContent();

    expect($product->refresh()->stock_quantity)->toBe(10);
    expect($variant->refresh()->stock_quantity)->toBe(6);
});

test('increasing cart quantity reserves available stock', function () {
    $product = Product::factory()->create(['stock_quantity' => 5]);

    $this->patchJson(route('api.v1.cart.stock.update'), [
        'items' => [[
            'product_id' => $product->id,
            'product_variant_id' => null,
            'quantity_change' => 2,
        ]],
    ])->assertNoContent();

    expect($product->refresh()->stock_quantity)->toBe(3);
});

test('clearing cart restores all item stock in one request', function () {
    $firstProduct = Product::factory()->create(['stock_quantity' => 4]);
    $secondProduct = Product::factory()->create(['stock_quantity' => 7]);

    $this->patchJson(route('api.v1.cart.stock.update'), [
        'items' => [
            [
                'product_id' => $firstProduct->id,
                'product_variant_id' => null,
                'quantity_change' => -3,
            ],
            [
                'product_id' => $secondProduct->id,
                'product_variant_id' => null,
                'quantity_change' => -2,
            ],
        ],
    ])->assertNoContent();

    expect($firstProduct->refresh()->stock_quantity)->toBe(7);
    expect($secondProduct->refresh()->stock_quantity)->toBe(9);
});
