<?php

use App\Models\User;

test('verified customers can visit the shop page', function () {
    $this->withoutVite();

    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('customer.shop'))
        ->assertOk();
});

test('verified customers can visit a product details page', function () {
    $this->withoutVite();

    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('customer.products.show', ['product' => 123]))
        ->assertOk();
});

test('verified customers can visit the cart page', function () {
    $this->withoutVite();

    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('customer.cart'))
        ->assertOk();
});

test('unverified customers are redirected away from the shop page', function () {
    $customer = User::factory()->unverified()->create();

    $this->actingAs($customer)
        ->get(route('customer.shop'))
        ->assertRedirect(route('verification.notice'));
});
