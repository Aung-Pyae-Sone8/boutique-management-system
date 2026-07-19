<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;

test('verified customer can load order history page', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('customer.orders'))
        ->assertSuccessful();
});

test('verified customer can load order detail page', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create();
    $order = Order::factory()->for($customer)->create();

    $this->actingAs($user)
        ->get(route('customer.orders.show', $order))
        ->assertSuccessful();
});

test('customer can list only their own orders', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create();
    $otherCustomer = Customer::factory()->create();

    $olderOrder = Order::factory()->for($customer)->create([
        'order_number' => 'BTQ-OLDER',
        'ordered_at' => now()->subDays(2),
        'total' => 49000,
    ]);
    OrderItem::factory()->for($olderOrder)->create([
        'product_name' => 'Classic Oxford Shirt',
        'quantity' => 2,
    ]);

    $newerOrder = Order::factory()->for($customer)->create([
        'order_number' => 'BTQ-NEWER',
        'ordered_at' => now(),
        'total' => 99000,
    ]);
    OrderItem::factory()->for($newerOrder)->create([
        'product_name' => 'Tailored Linen Suit',
        'quantity' => 1,
    ]);

    Order::factory()->for($otherCustomer)->create([
        'order_number' => 'BTQ-OTHER',
        'ordered_at' => now()->addDay(),
    ]);

    $this->actingAs($user)
        ->getJson(route('app.orders'))
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.order_number', 'BTQ-NEWER')
        ->assertJsonPath('data.0.items.0.product_name', 'Tailored Linen Suit')
        ->assertJsonPath('data.1.order_number', 'BTQ-OLDER')
        ->assertJsonMissing(['order_number' => 'BTQ-OTHER']);
});

test('customer can view their own order details', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create();
    $order = Order::factory()->for($customer)->create([
        'order_number' => 'BTQ-DETAIL',
        'shipping_name' => 'Aung Pyae Sone',
        'shipping_phone' => '09123456789',
        'shipping_address' => 'Bahan Road',
        'shipping_city' => 'Yangon',
        'shipping_country' => 'Myanmar',
        'payment_method' => 'bank_transfer',
        'total' => 75000,
    ]);
    OrderItem::factory()->for($order)->create([
        'product_name' => 'Ceremony Suit',
        'sku' => 'SUIT-001',
        'quantity' => 1,
    ]);
    $order->payment()->create([
        'method' => 'bank_transfer',
        'provider' => 'mmqr',
        'transaction_id' => 'TXN-12345',
        'amount' => 75000,
        'currency' => 'MMK',
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->getJson(route('app.orders.show', $order))
        ->assertSuccessful()
        ->assertJsonPath('data.order_number', 'BTQ-DETAIL')
        ->assertJsonPath('data.shipping_name', 'Aung Pyae Sone')
        ->assertJsonPath('data.items.0.product_name', 'Ceremony Suit')
        ->assertJsonPath('data.payment.transaction_id', 'TXN-12345');
});

test('customer cannot view another customers order details', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    Customer::factory()->for($user)->create();
    $otherCustomer = Customer::factory()->create();
    $order = Order::factory()->for($otherCustomer)->create();

    $this->actingAs($user)
        ->getJson(route('app.orders.show', $order))
        ->assertNotFound();
});

test('customer without profile receives empty order history', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->getJson(route('app.orders'))
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');
});
