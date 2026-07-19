<?php

use App\Models\ChatThread;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('verified customer can load messages page', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('customer.messages'))
        ->assertSuccessful();
});

test('customer can send a message to admin', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    Customer::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson(route('app.customer.chat.store'), [
            'message' => 'Can I change my order size?',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.messages.0.message', 'Can I change my order size?')
        ->assertJsonPath('data.admin_unread_count', 1);

    $this->assertDatabaseHas('chat_messages', [
        'sender_id' => $user->id,
        'sender_role' => 'customer',
        'message' => 'Can I change my order size?',
    ]);
});

test('admin can list read and reply to customer messages', function () {
    $profilePhotoPath = 'profile-photos/customer-1/avatar.jpg';
    $customerUser = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);
    $customer = Customer::factory()->for($customerUser)->create([
        'profile_photo_path' => $profilePhotoPath,
    ]);
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $threadId = $this->actingAs($customerUser)
        ->postJson(route('app.customer.chat.store'), [
            'message' => 'Is bank transfer available?',
        ])
        ->json('data.id');

    $this->actingAs($admin)
        ->getJson(route('app.admin.chat.index'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $threadId)
        ->assertJsonPath('data.0.customer.id', $customer->id)
        ->assertJsonPath('data.0.customer.profile_photo_url', Storage::disk('public')->url($profilePhotoPath))
        ->assertJsonPath('data.0.admin_unread_count', 1);

    $this->actingAs($admin)
        ->getJson(route('app.admin.chat.show', $threadId))
        ->assertSuccessful()
        ->assertJsonPath('data.admin_unread_count', 0)
        ->assertJsonPath('data.customer.profile_photo_url', Storage::disk('public')->url($profilePhotoPath))
        ->assertJsonPath('data.messages.0.message', 'Is bank transfer available?');

    $this->actingAs($admin)
        ->postJson(route('app.admin.chat.store', $threadId), [
            'message' => 'Yes, please use the QR on checkout.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.customer_unread_count', 1)
        ->assertJsonPath('data.messages.1.sender_role', 'admin');

    $this->actingAs($customerUser)
        ->getJson(route('app.customer.chat.show'))
        ->assertSuccessful()
        ->assertJsonPath('data.customer_unread_count', 0)
        ->assertJsonPath('data.messages.1.message', 'Yes, please use the QR on checkout.');
});

test('customer cannot access admin chat inbox', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->getJson(route('app.admin.chat.index'))
        ->assertForbidden();
});

test('admin can close and reopen a chat thread', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $thread = ChatThread::factory()->create(['status' => 'open']);

    $this->actingAs($admin)
        ->postJson(route('app.admin.chat.status', $thread), [
            'status' => 'closed',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'closed');

    $this->actingAs($admin)
        ->postJson(route('app.admin.chat.status', $thread), [
            'status' => 'open',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'open');
});
