<?php

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Notifications\VerifyEmailOtp;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

test('customer can load their own profile', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $customer = Customer::factory()->for($user)->create([
        'first_name' => 'Aung',
        'last_name' => 'Pyae Sone',
        'city' => 'Yangon',
        'country' => 'Myanmar',
    ]);
    PaymentMethod::factory()->create([
        'code' => 'wave_money',
        'label' => 'Wave Money',
        'sort_order' => 2,
    ]);
    PaymentMethod::factory()->create([
        'code' => 'kbz_pay',
        'label' => 'KBZPay',
        'account_username' => 'Boutique KBZPay',
        'account_phone' => '+95 9 420 100 111',
        'sort_order' => 1,
    ]);
    PaymentMethod::factory()->inactive()->create([
        'code' => 'hidden_pay',
        'label' => 'Hidden Pay',
        'sort_order' => 3,
    ]);

    $this->actingAs($user)
        ->getJson(route('app.profile'))
        ->assertSuccessful()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('customer.id', $customer->id)
        ->assertJsonPath('customer.first_name', 'Aung')
        ->assertJsonPath('customer.last_name', 'Pyae Sone')
        ->assertJsonPath('customer.city', 'Yangon')
        ->assertJsonPath('customer.country', 'Myanmar')
        ->assertJsonPath('customer.profile_photo_url', null)
        ->assertJsonPath('payment_methods.0.key', 'kbz_pay')
        ->assertJsonPath('payment_methods.0.label', 'KBZPay')
        ->assertJsonPath('payment_methods.0.account_username', 'Boutique KBZPay')
        ->assertJsonPath('payment_methods.0.account_phone', '+95 9 420 100 111')
        ->assertJsonPath('payment_methods.1.key', 'wave_money')
        ->assertJsonMissingPath('payment_methods.2');
});

test('customer can change their profile photo', function () {
    Storage::fake('public');

    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create();
    $photo = UploadedFile::fake()->image('profile.jpg', 600, 600)->size(500);

    $response = $this->actingAs($user)
        ->post(route('app.profile.photo.store'), [
            'photo' => $photo,
        ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $customer->id);

    $path = $customer->refresh()->profile_photo_path;

    expect($path)->toStartWith("profile-photos/customer-{$customer->id}/");
    Storage::disk('public')->assertExists($path);

    $this->actingAs($user)
        ->getJson(route('app.profile'))
        ->assertSuccessful()
        ->assertJsonPath('customer.profile_photo_url', Storage::disk('public')->url($path));
});

test('customer can update profile information without changing email', function () {
    Notification::fake();

    $user = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@example.com',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create([
        'email' => 'customer@example.com',
    ]);

    $this->actingAs($user)
        ->putJson(route('app.profile.update'), [
            'first_name' => 'Aung',
            'last_name' => 'Updated',
            'email' => 'customer@example.com',
            'phone' => '+95 9 111 222 333',
            'address' => 'New address',
            'city' => 'Mandalay',
            'country' => 'Myanmar',
            'gender' => 'male',
        ])
        ->assertSuccessful()
        ->assertJsonPath('user.email', 'customer@example.com')
        ->assertJsonPath('customer.first_name', 'Aung')
        ->assertJsonPath('customer.city', 'Mandalay')
        ->assertJsonPath('email_changed', false);

    expect($user->refresh()->email_verified_at)->not->toBeNull()
        ->and($customer->refresh()->email)->toBe('customer@example.com')
        ->and($customer->name)->toBe('Aung Updated');

    Notification::assertNotSentTo($user, VerifyEmailOtp::class);
});

test('customer email change clears verification and sends a new otp', function () {
    Notification::fake();

    $user = User::factory()->create([
        'role' => 'customer',
        'email' => 'old@example.com',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create([
        'email' => 'old@example.com',
    ]);

    $this->actingAs($user)
        ->putJson(route('app.profile.update'), [
            'first_name' => 'Aung',
            'last_name' => 'Pyae',
            'email' => 'new@example.com',
            'phone' => '+95 9 111 222 333',
            'address' => 'Bahan Road',
            'city' => 'Yangon',
            'country' => 'Myanmar',
            'gender' => 'prefer_not_to_say',
        ])
        ->assertSuccessful()
        ->assertJsonPath('user.email', 'new@example.com')
        ->assertJsonPath('user.email_verified_at', null)
        ->assertJsonPath('customer.email', 'new@example.com')
        ->assertJsonPath('email_changed', true);

    $user->refresh();

    expect($user->email_verified_at)->toBeNull()
        ->and($user->email_otp_code)->not->toBeNull()
        ->and($user->email_otp_expires_at)->not->toBeNull()
        ->and($customer->refresh()->email)->toBe('new@example.com');

    Notification::assertSentTo($user, VerifyEmailOtp::class);
});

test('profile photo upload requires an image', function () {
    Storage::fake('public');

    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    Customer::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('app.profile.photo.store'), [
            'photo' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
        ])
        ->assertInvalid('photo');

    Storage::disk('public')->assertDirectoryEmpty('profile-photos');
});

test('guests cannot load customer profiles', function () {
    $this->get(route('app.profile'))->assertRedirect(route('login'));
});
