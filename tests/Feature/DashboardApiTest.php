<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;

test('dashboard API returns aggregates from database records', function () {
    $customer = Customer::factory()->create();
    $lowStockProduct = Product::factory()->create([
        'stock_quantity' => 2,
        'low_stock_threshold' => 5,
    ]);
    $topProduct = Product::factory()->create([
        'stock_quantity' => 20,
        'low_stock_threshold' => 5,
    ]);
    $paidOrder = Order::factory()->for($customer)->create([
        'status' => 'completed',
        'payment_status' => 'paid',
        'total' => 125.50,
        'ordered_at' => now()->subDay(),
    ]);
    $unpaidOrder = Order::factory()->for($customer)->create([
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'total' => 80,
        'ordered_at' => now(),
    ]);

    $paidOrder->items()->create([
        'product_id' => $lowStockProduct->id,
        'product_name' => $lowStockProduct->name,
        'sku' => $lowStockProduct->sku,
        'quantity' => 2,
        'unit_price' => 20,
        'line_total' => 40,
    ]);
    $unpaidOrder->items()->create([
        'product_id' => $topProduct->id,
        'product_name' => $topProduct->name,
        'sku' => $topProduct->sku,
        'quantity' => 5,
        'unit_price' => 16,
        'line_total' => 80,
    ]);

    $response = $this->getJson(route('api.v1.dashboard'));

    $response->assertSuccessful()
        ->assertJsonPath('stats.revenue', 125.5)
        ->assertJsonPath('stats.orders', 2)
        ->assertJsonPath('stats.products', 2)
        ->assertJsonPath('stats.customers', 1)
        ->assertJsonPath('stats.lowStock', 1)
        ->assertJsonPath('salesByStatus.completed', 1)
        ->assertJsonPath('salesByStatus.pending', 1)
        ->assertJsonPath('recentOrders.0.id', $unpaidOrder->id)
        ->assertJsonPath('lowStockProducts.0.id', $lowStockProduct->id)
        ->assertJsonPath('topProducts.0.id', $topProduct->id)
        ->assertJsonPath('topProducts.0.sold', 5);
});
