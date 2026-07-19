<?php

use App\Models\User;
use App\Notifications\LoginSuccessfulNotification;
use App\Notifications\VerifyEmailOtp;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
});

test('new users receive an email verification otp', function () {
    Notification::fake();

    $this->postJson(route('register.store'), [
        'first_name' => 'Test',
        'last_name' => 'User',
        'email' => 'test@example.com',
        'phone' => '+95 9 123 456 789',
        'address' => 'Yangon',
        'city' => 'Yangon',
        'country' => 'Myanmar',
        'gender' => 'female',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertCreated();

    $user = User::where('email', 'test@example.com')->firstOrFail();

    expect($user->email_verified_at)->toBeNull()
        ->and($user->email_otp_code)->not->toBeNull()
        ->and($user->email_otp_expires_at)->not->toBeNull();

    Notification::assertSentTo(
        $user,
        VerifyEmailOtp::class,
        fn (VerifyEmailOtp $notification): bool => $notification instanceof ShouldQueue
            && $user->routeNotificationFor('mail', $notification) === $user->email,
    );

    Notification::assertSentOnDemandTimes(LoginSuccessfulNotification::class, 0);
});

test('registered json users can load their unverified session user', function () {
    Notification::fake();

    $this->postJson(route('register.store'), [
        'first_name' => 'Session',
        'last_name' => 'User',
        'email' => 'session@example.com',
        'phone' => '+95 9 987 654 321',
        'address' => 'Mandalay',
        'city' => 'Mandalay',
        'country' => 'Myanmar',
        'gender' => 'prefer_not_to_say',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])
        ->assertCreated()
        ->assertJsonPath('user.email', 'session@example.com')
        ->assertJsonPath('user.email_verified_at', null);

    $this->getJson(route('app.user'))
        ->assertOk()
        ->assertJsonPath('user.email', 'session@example.com')
        ->assertJsonPath('user.email_verified_at', null);
});

test('users can verify their email with a valid otp', function () {
    $user = User::factory()->unverified()->create([
        'email_otp_code' => Hash::make('123456'),
        'email_otp_expires_at' => now()->addMinutes(10),
    ]);

    $this->actingAs($user)
        ->postJson(route('email.otp.verify'), ['otp' => '123456'])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id);

    $user->refresh();

    expect($user->email_verified_at)->not->toBeNull()
        ->and($user->email_otp_code)->toBeNull()
        ->and($user->email_otp_expires_at)->toBeNull();
});

test('expired otps are rejected', function () {
    $user = User::factory()->unverified()->create([
        'email_otp_code' => Hash::make('123456'),
        'email_otp_expires_at' => now()->subMinute(),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('email.otp.verify'), ['otp' => '123456']);

    expect($response->getStatusCode())->toBe(422)
        ->and($response->json('errors.otp.0'))
        ->toBe('This verification code has expired. Please request a new code.');

    expect($user->refresh()->email_verified_at)->toBeNull();
});

test('users can request a new otp', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->postJson(route('email.otp.resend'))
        ->assertOk();

    $user->refresh();

    expect($user->email_otp_code)->not->toBeNull()
        ->and($user->email_otp_expires_at)->not->toBeNull();

    Notification::assertSentTo($user, VerifyEmailOtp::class);
});
