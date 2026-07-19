<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerCheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerCheckoutController extends Controller
{
    public function store(StoreCustomerCheckoutRequest $request): OrderResource
    {
        $data = $request->validated();
        $customer = $request->user()->customer;
        $paymentMethod = PaymentMethod::query()
            ->where('is_active', true)
            ->where('code', $data['payment_method'])
            ->firstOrFail();

        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => 'A customer profile is required before checkout.',
            ]);
        }

        $order = DB::transaction(function () use ($data, $customer, $paymentMethod): Order {
            $items = collect($data['items'])->map(function (array $item): array {
                $product = Product::query()->findOrFail($item['product_id']);
                $variant = isset($item['product_variant_id'])
                    ? ProductVariant::query()
                        ->whereBelongsTo($product)
                        ->find($item['product_variant_id'])
                    : null;

                if (isset($item['product_variant_id']) && ! $variant) {
                    throw ValidationException::withMessages([
                        'items' => "The selected variant for {$product->name} is invalid.",
                    ]);
                }

                $unitPrice = (float) ($variant?->price ?? $product->price);

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $variant?->sku ?? $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'line_total' => $unitPrice * $item['quantity'],
                ];
            });

            $subtotal = (float) $items->sum('line_total');
            $shippingFee = $subtotal > 120 || $subtotal === 0.0 ? 0.0 : 5.0;
            $tax = $subtotal * 0.05;
            $total = $subtotal + $shippingFee + $tax;

            $order = Order::query()->create([
                'customer_id' => $customer->id,
                'shipping_name' => trim($data['first_name'].' '.$data['last_name']),
                'shipping_email' => $data['email'],
                'shipping_phone' => $data['phone'],
                'shipping_address' => $data['address'],
                'shipping_city' => $data['city'],
                'shipping_country' => $data['country'],
                'order_number' => 'BTQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $data['payment_method'],
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => $tax,
                'shipping_fee' => $shippingFee,
                'total' => $total,
                'ordered_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($items->all());
            $order->payment()->create([
                'method' => $data['payment_method'],
                'provider' => $paymentMethod->provider,
                'transaction_id' => $data['transaction_id'] ?? null,
                'amount' => $total,
                'currency' => 'MMK',
                'status' => 'pending',
            ]);

            return $order;
        });

        $request->user()->notify(new OrderPlacedNotification($order));

        return OrderResource::make($order->load(['customer', 'items', 'payment']));
    }
}
