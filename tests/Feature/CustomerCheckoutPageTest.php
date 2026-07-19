<?php

use App\Models\User;

test('verified customer can load checkout page', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('customer.checkout'))
        ->assertSuccessful();
});

test('guests are redirected from checkout to login', function () {
    $this->get(route('customer.checkout'))->assertRedirect(route('login'));
});
