<?php

use App\Actions\Fortify\CreateNewUser;
use App\Models\Customer;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'first_name' => 'Test',
        'last_name' => 'User',
        'email' => 'test@example.com',
        'phone' => '+95 9 123 456 789',
        'address' => '123 Boutique Street, Yangon',
        'city' => 'Yangon',
        'country' => 'Myanmar',
        'gender' => 'female',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = auth()->user();

    expect($user)
        ->name->toBe('Test User')
        ->first_name->toBe('Test')
        ->last_name->toBe('User')
        ->phone->toBe('+95 9 123 456 789')
        ->address->toBe('123 Boutique Street, Yangon')
        ->gender->toBe('female');

    expect(Customer::query()->whereBelongsTo($user)->first())
        ->name->toBe('Test User')
        ->email->toBe('test@example.com')
        ->phone->toBe('+95 9 123 456 789')
        ->address->toBe('123 Boutique Street, Yangon')
        ->city->toBe('Yangon')
        ->country->toBe('Myanmar')
        ->gender->toBe('female');
});

test('registration links an existing unclaimed customer profile', function () {
    $customer = Customer::factory()->create([
        'user_id' => null,
        'name' => 'Imported Customer',
        'email' => 'imported@example.com',
    ]);

    $response = $this->post(route('register.store'), [
        'first_name' => 'Registered',
        'last_name' => 'Customer',
        'email' => 'imported@example.com',
        'phone' => '+95 9 555 555 555',
        'address' => 'Mandalay',
        'city' => 'Mandalay',
        'country' => 'Myanmar',
        'gender' => 'other',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $customer->refresh();

    expect($customer)
        ->user_id->toBe(auth()->id())
        ->name->toBe('Registered Customer')
        ->phone->toBe('+95 9 555 555 555')
        ->address->toBe('Mandalay')
        ->city->toBe('Mandalay')
        ->country->toBe('Myanmar')
        ->gender->toBe('other');

    expect(Customer::query()->where('email', 'imported@example.com')->count())->toBe(1);
});

test('registration requires customer profile fields', function () {
    try {
        app(CreateNewUser::class)->create([
            'email' => 'missing-profile@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKeys([
            'first_name',
            'last_name',
            'phone',
            'address',
            'city',
            'country',
            'gender',
        ]);

        return;
    }

    $this->fail('Registration validation did not fail.');
});
