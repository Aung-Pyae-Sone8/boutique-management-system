<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class BoutiqueAdminController extends Controller
{
    public function products(): Response
    {
        return Inertia::render('admin/products', [
            'products' => Product::query()
                ->with('category')
                ->latest()
                ->get()
                ->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'category' => $product->category?->name,
                    'price' => (float) $product->price,
                    'stock_quantity' => $product->stock_quantity,
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'size' => $product->size,
                    'color' => $product->color,
                    'is_active' => $product->is_active,
                    'is_featured' => $product->is_featured,
                    'is_low_stock' => $product->isLowStock(),
                ]),
        ]);
    }

    public function categories(): Response
    {
        return Inertia::render('admin/categories', [
            'categories' => Category::query()
                ->withCount('products')
                ->latest()
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'products_count' => $category->products_count,
                    'is_active' => $category->is_active,
                ]),
        ]);
    }

    public function customers(): Response
    {
        return Inertia::render('admin/customers', [
            'customers' => Customer::query()
                ->withCount('orders')
                ->latest()
                ->get()
                ->map(fn (Customer $customer): array => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'city' => $customer->city,
                    'country' => $customer->country,
                    'orders_count' => $customer->orders_count,
                ]),
        ]);
    }

    public function orders(): Response
    {
        return Inertia::render('admin/orders', [
            'orders' => Order::query()
                ->with(['customer', 'items'])
                ->latest('ordered_at')
                ->latest()
                ->get()
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->customer?->name ?? 'Walk-in customer',
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'items_count' => $order->items->sum('quantity'),
                    'subtotal' => (float) $order->subtotal,
                    'total' => (float) $order->total,
                    'ordered_at' => $order->ordered_at?->format('M d, Y'),
                ]),
        ]);
    }
}
