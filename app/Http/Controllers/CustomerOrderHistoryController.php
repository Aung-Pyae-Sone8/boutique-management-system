<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class CustomerOrderHistoryController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $customer = $request->user()->customer;

        return OrderResource::collection(
            Order::query()
                ->with(['items', 'payment'])
                ->when(
                    $customer,
                    fn ($query) => $query->whereBelongsTo($customer),
                    fn ($query) => $query->whereKey([])
                )
                ->latest('ordered_at')
                ->latest()
                ->paginate(10)
        );
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $customer = $request->user()->customer;

        abort_unless(
            $customer && $order->customer()->is($customer),
            Response::HTTP_NOT_FOUND
        );

        return OrderResource::make($order->load(['items', 'payment']));
    }
}
