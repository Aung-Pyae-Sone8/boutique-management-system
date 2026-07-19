<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        collect([
            [
                'code' => 'kbz_pay',
                'label' => 'KBZPay',
                'provider' => 'kbzpay',
                'account_username' => 'Boutique KBZPay',
                'account_phone' => '+95 9 420 100 111',
                'qr_path' => 'payment/kbzpay.svg',
                'sort_order' => 1,
            ],
            [
                'code' => 'wave_money',
                'label' => 'Wave Money',
                'provider' => 'wave_money',
                'account_username' => 'Boutique Wave Money',
                'account_phone' => '+95 9 420 100 222',
                'qr_path' => 'payment/wave-money.svg',
                'sort_order' => 2,
            ],
            [
                'code' => 'aya_pay',
                'label' => 'AYA Pay',
                'provider' => 'aya_pay',
                'account_username' => 'Boutique AYA Pay',
                'account_phone' => '+95 9 420 100 333',
                'qr_path' => 'payment/aya-pay.svg',
                'sort_order' => 3,
            ],
        ])->each(fn (array $method): PaymentMethod => PaymentMethod::query()->updateOrCreate(
            ['code' => $method['code']],
            [
                ...$method,
                'is_active' => true,
            ],
        ));
    }
}
