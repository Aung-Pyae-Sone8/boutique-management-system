<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusUpdatedNotification;
use Illuminate\Support\Facades\Notification;

test('customer is emailed when order and payment statuses change', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $customer = Customer::factory()->for($user)->create();
    $order = Order::factory()->for($customer)->create([
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'total' => 125000,
    ]);
    Notification::fake();

    $this->putJson(route('api.v1.orders.update', $order), [
        'status' => 'processing',
        'payment_status' => 'paid',
    ])->assertSuccessful();

    Notification::assertSentTo(
        $user,
        OrderStatusUpdatedNotification::class,
        function (OrderStatusUpdatedNotification $notification) use ($order, $user): bool {
            $mail = $notification->toMail($user);

            return $notification->order->is($order)
                && $notification->previousStatus === 'pending'
                && $notification->order->status === 'processing'
                && $notification->previousPaymentStatus === 'unpaid'
                && $notification->order->payment_status === 'paid'
                && in_array('Amount: 125,000.00 MMK', $mail->introLines, true);
        },
    );
});

test('customer is not emailed when statuses stay unchanged', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $customer = Customer::factory()->for($user)->create();
    $order = Order::factory()->for($customer)->create([
        'status' => 'processing',
        'payment_status' => 'paid',
    ]);
    Notification::fake();

    $this->putJson(route('api.v1.orders.update', $order), [
        'status' => 'processing',
        'payment_status' => 'paid',
        'notes' => 'No status change.',
    ])->assertSuccessful();

    Notification::assertNothingSent();
});
