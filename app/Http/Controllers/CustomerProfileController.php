<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerResource;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $customer = $user->customer()
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->first();
        $paymentMethods = PaymentMethod::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get();

        return response()->json([
            'user' => $user,
            'customer' => $customer ? CustomerResource::make($customer) : null,
            'payment_methods' => PaymentMethodResource::collection($paymentMethods)->resolve($request),
        ]);
    }
}
