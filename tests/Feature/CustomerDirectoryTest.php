<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('customer directory returns registered account and order activity', function () {
    $profilePhotoPath = 'profile-photos/customer-1/avatar.jpg';
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create([
        'first_name' => 'Aung',
        'last_name' => 'Pyae Sone',
        'email' => $user->email,
        'phone' => '+95 9 123 456 789',
        'address' => 'Taunggyi, Shan State',
        'gender' => 'male',
        'profile_photo_path' => $profilePhotoPath,
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
        ->assertJsonPath('data.0.first_name', 'Aung')
        ->assertJsonPath('data.0.last_name', 'Pyae Sone')
        ->assertJsonPath('data.0.email', $user->email)
        ->assertJsonPath('data.0.phone', '+95 9 123 456 789')
        ->assertJsonPath('data.0.address', 'Taunggyi, Shan State')
        ->assertJsonPath('data.0.gender', 'male')
        ->assertJsonPath('data.0.profile_photo_url', Storage::disk('public')->url($profilePhotoPath))
        ->assertJsonPath('data.0.orders_count', 2)
        ->assertJsonPath('data.0.lifetime_value', 200)
        ->assertJsonPath('data.0.is_registered', true)
        ->assertJsonPath('data.0.role', 'customer')
        ->assertJsonPath('data.0.email_verified', true)
        ->assertJsonPath('data.0.last_order_at', $latestOrder->ordered_at->toISOString());
});

test('admin can change a registered customer user role', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create([
        'name' => 'Aung Pyae',
        'email' => $user->email,
    ]);

    $this->putJson(route('api.v1.customers.update', $customer), [
        'name' => $customer->name,
        'email' => $customer->email,
        'phone' => $customer->phone,
        'address' => $customer->address,
        'gender' => $customer->gender,
        'city' => $customer->city,
        'country' => $customer->country,
        'role' => 'admin',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.role', 'admin');

    expect($user->refresh()->role)->toBe('admin');
});
