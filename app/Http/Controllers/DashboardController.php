<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $revenue = (float) Order::query()
            ->where('payment_status', 'paid')
            ->sum('total');

        $salesByStatus = Order::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('dashboard', [
            'stats' => [
                'revenue' => $revenue,
                'orders' => Order::count(),
                'products' => Product::count(),
                'customers' => Customer::count(),
                'lowStock' => Product::query()->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
            ],
            'salesByStatus' => $salesByStatus,
            'recentOrders' => Order::query()
                ->with('customer')
                ->latest('ordered_at')
                ->latest()
                ->take(6)
                ->get()
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->customer?->name ?? 'Walk-in customer',
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'total' => (float) $order->total,
                    'ordered_at' => $order->ordered_at?->format('M d, Y'),
                ]),
            'lowStockProducts' => Product::query()
                ->with('category')
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->orderBy('stock_quantity')
                ->take(6)
                ->get()
                ->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'stock_quantity' => $product->stock_quantity,
                    'low_stock_threshold' => $product->low_stock_threshold,
                ]),
            'topProducts' => Product::query()
                ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
                ->select('products.id', 'products.name', 'products.sku', DB::raw('coalesce(sum(order_items.quantity), 0) as sold'))
                ->groupBy('products.id', 'products.name', 'products.sku')
                ->orderByDesc('sold')
                ->take(5)
                ->get(),
        ]);
    }
}
