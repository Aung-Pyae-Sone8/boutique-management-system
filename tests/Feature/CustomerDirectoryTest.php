<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;

test('customer directory returns registered account and order activity', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create([
        'email' => $user->email,
    ]);
    Order::factory()->for($customer)->create([
        'total' => 75.25,
        'ordered_at' => now()->subDay(),
    ]);
    $latestOrder = Order::factory()->for($customer)->create([
        'total' => 124.75,
        'ordered_at' => now(),
    ]);

    $response = $this->getJson(route('api.v1.customers.index'));

    $response->assertSuccessful()
        ->assertJsonPath('data.0.id', $customer->id)
        ->assertJsonPath('data.0.email', $user->email)
        ->assertJsonPath('data.0.orders_count', 2)
        ->assertJsonPath('data.0.lifetime_value', 200)
        ->assertJsonPath('data.0.is_registered', true)
        ->assertJsonPath('data.0.email_verified', true)
        ->assertJsonPath('data.0.last_order_at', $latestOrder->ordered_at->toISOString());
});
