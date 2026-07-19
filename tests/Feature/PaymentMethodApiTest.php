<?php

use App\Models\PaymentMethod;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('payment methods can be listed for admin setup', function () {
    PaymentMethod::factory()->create([
        'code' => 'wave_money',
        'label' => 'Wave Money',
        'sort_order' => 2,
    ]);
    PaymentMethod::factory()->create([
        'code' => 'kbz_pay',
        'label' => 'KBZPay',
        'sort_order' => 1,
    ]);

    $this->getJson(route('api.v1.payment-methods.index'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.key', 'kbz_pay')
        ->assertJsonPath('data.1.key', 'wave_money');
});

test('payment method can be created with a qr image', function () {
    Storage::fake('public');

    $response = $this->post(route('api.v1.payment-methods.store'), [
        'label' => 'CB Pay',
        'code' => 'cb_pay',
        'provider' => 'cb_pay',
        'account_username' => 'Boutique Collection',
        'account_phone' => '+95 9 420 100 444',
        'sort_order' => 4,
        'is_active' => true,
        'qr_image' => UploadedFile::fake()->image('cb-pay.png', 400, 400),
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.key', 'cb_pay')
        ->assertJsonPath('data.label', 'CB Pay')
        ->assertJsonPath('data.account_username', 'Boutique Collection')
        ->assertJsonPath('data.account_phone', '+95 9 420 100 444')
        ->assertJsonPath('data.is_active', true);

    $method = PaymentMethod::query()->where('code', 'cb_pay')->firstOrFail();

    expect($method->qr_path)->toStartWith('payment-methods/cb_pay/');
    Storage::disk('public')->assertExists($method->qr_path);
});

test('payment method qr image can be replaced', function () {
    Storage::fake('public');

    $method = PaymentMethod::factory()->create([
        'code' => 'aya_pay',
        'label' => 'AYA Pay',
        'qr_path' => 'payment-methods/aya_pay/old.png',
    ]);
    Storage::disk('public')->put($method->qr_path, 'old');

    $response = $this->post(route('api.v1.payment-methods.update', $method), [
        '_method' => 'PUT',
        'label' => 'AYA Pay',
        'code' => 'aya_pay',
        'provider' => 'aya_pay',
        'account_username' => 'AYA Boutique',
        'account_phone' => '+95 9 420 100 333',
        'sort_order' => 3,
        'is_active' => false,
        'qr_image' => UploadedFile::fake()->image('aya-pay.png', 400, 400),
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.account_username', 'AYA Boutique')
        ->assertJsonPath('data.account_phone', '+95 9 420 100 333')
        ->assertJsonPath('data.is_active', false);

    $method->refresh();

    Storage::disk('public')->assertMissing('payment-methods/aya_pay/old.png');
    Storage::disk('public')->assertExists($method->qr_path);
});

test('payment method can be deleted', function () {
    Storage::fake('public');

    $method = PaymentMethod::factory()->create([
        'qr_path' => 'payment-methods/delete_me/qr.png',
    ]);
    Storage::disk('public')->put($method->qr_path, 'old');

    $this->deleteJson(route('api.v1.payment-methods.destroy', $method))
        ->assertNoContent();

    expect(PaymentMethod::query()->whereKey($method)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing('payment-methods/delete_me/qr.png');
});
