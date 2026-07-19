<?php

use App\Http\Requests\StoreCustomerCheckoutRequest;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;

test('customer can place a kbzpay order using reserved cart stock', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($user)->create();
    $product = Product::factory()->create([
        'price' => 100,
        'stock_quantity' => 3,
    ]);
    PaymentMethod::factory()->create([
        'code' => 'kbz_pay',
        'label' => 'KBZPay',
        'provider' => 'kbzpay',
    ]);
    Notification::fake();

    $response = $this->actingAs($user)->postJson(route('customer.checkout.store'), [
        'first_name' => 'Aung',
        'last_name' => 'Pyae Sone',
        'email' => 'customer@example.com',
        'phone' => '+95 9 123 456 789',
        'address' => '123 Boutique Street',
        'city' => 'Yangon',
        'country' => 'Myanmar',
        'payment_method' => 'kbz_pay',
        'transaction_id' => 'KBZ-123456',
        'items' => [[
            'product_id' => $product->id,
            'product_variant_id' => null,
            'quantity' => 2,
        ]],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.customer_id', $customer->id)
        ->assertJsonPath('data.payment_method', 'kbz_pay')
        ->assertJsonPath('data.payment.provider', 'kbzpay')
        ->assertJsonPath('data.payment.transaction_id', 'KBZ-123456')
        ->assertJsonPath('data.payment.status', 'pending');

    expect($product->refresh()->stock_quantity)->toBe(3);
    expect(Payment::query()->where('transaction_id', 'KBZ-123456')->exists())->toBeTrue();

    Notification::assertSentTo(
        $user,
        OrderPlacedNotification::class,
        function (OrderPlacedNotification $notification) use ($response, $user): bool {
            $mail = $notification->toMail($user);

            return $notification->order->id === $response->json('data.id')
                && (float) $notification->order->total === 210.0
                && $notification->order->status === 'pending'
                && $user->routeNotificationFor('mail', $notification) === $user->email
                && in_array("Order ID: {$notification->order->id}", $mail->introLines, true)
                && in_array('Amount: 210.00 MMK', $mail->introLines, true)
                && in_array('Status: pending', $mail->introLines, true);
        },
    );
});

test('wallet payment requires a transaction id', function () {
    $product = Product::factory()->create();
    PaymentMethod::factory()->create([
        'code' => 'wave_money',
        'label' => 'Wave Money',
        'provider' => 'wave_money',
    ]);
    $payload = [
        'first_name' => 'Aung',
        'last_name' => 'Pyae Sone',
        'email' => 'customer@example.com',
        'phone' => '+95 9 123 456 789',
        'address' => '123 Boutique Street',
        'city' => 'Yangon',
        'country' => 'Myanmar',
        'payment_method' => 'wave_money',
        'items' => [[
            'product_id' => $product->id,
            'quantity' => 1,
        ]],
    ];
    $request = StoreCustomerCheckoutRequest::create(
        route('customer.checkout.store'),
        'POST',
        $payload,
    );
    $request->setContainer(app());

    $validator = Validator::make($payload, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('transaction_id'))->toBeTrue();
});
