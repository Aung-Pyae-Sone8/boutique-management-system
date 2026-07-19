<?php

return [
    'methods' => [
        'kbz_pay' => [
            'label' => 'KBZPay',
            'provider' => 'kbzpay',
            'qr_url' => env('KBZPAY_QR_URL', '/storage/payment/kbzpay.svg'),
        ],
        'wave_money' => [
            'label' => 'Wave Money',
            'provider' => 'wave_money',
            'qr_url' => env('WAVE_MONEY_QR_URL', '/storage/payment/wave-money.svg'),
        ],
        'aya_pay' => [
            'label' => 'AYA Pay',
            'provider' => 'aya_pay',
            'qr_url' => env('AYA_PAY_QR_URL', '/storage/payment/aya-pay.svg'),
        ],
    ],
];
