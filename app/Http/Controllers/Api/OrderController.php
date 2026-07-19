<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Notifications\OrderStatusUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(
            Order::query()
                ->with(['customer', 'items'])
                ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
                ->latest('ordered_at')
                ->latest()
                ->paginate(15)
        );
    }

    public function store(): OrderResource
    {
        $data = request()->validate($this->storeRules());

        $order = DB::transaction(function () use ($data): Order {
            $products = Product::query()
                ->whereIn('id', collect($data['items'])->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0;
            $items = [];

            foreach ($data['items'] as $item) {
                /** @var Product|null $product */
                $product = $products->get($item['product_id']);

                if (! $product) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more products are no longer available.',
                    ]);
                }

                if ($product->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name} only has {$product->stock_quantity} item(s) in stock.",
                    ]);
                }

                $lineTotal = (float) $product->price * $item['quantity'];
                $subtotal += $lineTotal;
                $product->decrement('stock_quantity', $item['quantity']);

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'line_total' => $lineTotal,
                ];
            }

            $discount = (float) ($data['discount'] ?? 0);
            $tax = (float) ($data['tax'] ?? 0);
            $shippingFee = (float) ($data['shipping_fee'] ?? 0);

            $order = Order::create([
                'customer_id' => $data['customer_id'] ?? null,
                'order_number' => $data['order_number'] ?? 'BTQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
                'status' => $data['status'] ?? 'pending',
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'shipping_fee' => $shippingFee,
                'total' => $subtotal - $discount + $tax + $shippingFee,
                'ordered_at' => $data['ordered_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($items);

            return $order;
        });

        return OrderResource::make($order->load(['customer', 'items']));
    }

    public function show(Order $order): OrderResource
    {
        return OrderResource::make($order->load(['customer', 'items']));
    }

    public function update(Order $order): OrderResource
    {
        $data = request()->validate([
            'status' => ['sometimes', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['unpaid', 'paid', 'refunded'])],
            'notes' => ['nullable', 'string'],
        ]);

        $previousStatus = $order->status;
        $previousPaymentStatus = $order->payment_status;

        $order->update($data);

        if ($order->wasChanged(['status', 'payment_status'])) {
            $user = $order->loadMissing('customer.user')->customer?->user;

            $user?->notify(new OrderStatusUpdatedNotification(
                order: $order,
                previousStatus: $previousStatus,
                previousPaymentStatus: $previousPaymentStatus,
            ));
        }

        return OrderResource::make($order->load(['customer', 'items']));
    }

    public function destroy(Order $order): Response
    {
        $order->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function storeRules(): array
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'order_number' => ['nullable', 'string', 'max:255', 'unique:orders,order_number'],
            'status' => ['nullable', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'refunded'])],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'shipping_fee' => ['nullable', 'numeric', 'min:0'],
            'ordered_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
