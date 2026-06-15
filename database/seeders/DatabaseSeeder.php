<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CustomerUserSeeder::class,
        ]);

        $categories = collect([
            ['name' => 'Dresses', 'description' => 'Occasion-ready midi, maxi, and day dresses.'],
            ['name' => 'Tops', 'description' => 'Blouses, camisoles, knit tops, and everyday layers.'],
            ['name' => 'Accessories', 'description' => 'Bags, scarves, belts, and finishing touches.'],
            ['name' => 'Outerwear', 'description' => 'Light jackets, cardigans, and statement layers.'],
        ])->mapWithKeys(function (array $category): array {
            $model = Category::query()->updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    ...$category,
                    'is_active' => true,
                ],
            );

            return [$model->name => $model];
        });

        $products = collect([
            ['category' => 'Dresses', 'sku' => 'DRS-001', 'name' => 'Luna Satin Wrap Dress', 'price' => 129, 'cost_price' => 62, 'stock_quantity' => 18, 'low_stock_threshold' => 5, 'size' => 'M', 'color' => 'Emerald', 'is_featured' => true],
            ['category' => 'Dresses', 'sku' => 'DRS-002', 'name' => 'Aster Floral Midi Dress', 'price' => 98, 'cost_price' => 44, 'stock_quantity' => 4, 'low_stock_threshold' => 6, 'size' => 'S', 'color' => 'Ivory', 'is_featured' => true],
            ['category' => 'Tops', 'sku' => 'TOP-014', 'name' => 'Mira Silk Cami', 'price' => 64, 'cost_price' => 28, 'stock_quantity' => 23, 'low_stock_threshold' => 8, 'size' => 'M', 'color' => 'Champagne', 'is_featured' => false],
            ['category' => 'Tops', 'sku' => 'TOP-021', 'name' => 'Ribbed Square Neck Top', 'price' => 42, 'cost_price' => 18, 'stock_quantity' => 3, 'low_stock_threshold' => 7, 'size' => 'L', 'color' => 'Black', 'is_featured' => false],
            ['category' => 'Accessories', 'sku' => 'ACC-008', 'name' => 'Pearl Handle Mini Bag', 'price' => 76, 'cost_price' => 31, 'stock_quantity' => 12, 'low_stock_threshold' => 4, 'size' => null, 'color' => 'Blush', 'is_featured' => true],
            ['category' => 'Outerwear', 'sku' => 'OTW-005', 'name' => 'Cropped Boucle Jacket', 'price' => 148, 'cost_price' => 71, 'stock_quantity' => 7, 'low_stock_threshold' => 5, 'size' => 'M', 'color' => 'Cream', 'is_featured' => true],
        ])->mapWithKeys(function (array $product) use ($categories): array {
            $model = Product::query()->updateOrCreate(
                ['sku' => $product['sku']],
                [
                    'category_id' => $categories[$product['category']]->id,
                    'name' => $product['name'],
                    'slug' => Str::slug($product['name']),
                    'description' => 'Curated boutique piece selected for everyday styling and seasonal edits.',
                    'price' => $product['price'],
                    'cost_price' => $product['cost_price'],
                    'stock_quantity' => $product['stock_quantity'],
                    'low_stock_threshold' => $product['low_stock_threshold'],
                    'size' => $product['size'],
                    'color' => $product['color'],
                    'is_featured' => $product['is_featured'],
                    'is_active' => true,
                ],
            );

            return [$model->sku => $model];
        });

        $customers = collect([
            ['name' => 'Maya Chen', 'email' => 'maya@example.com', 'phone' => '+95 9 420 100 221', 'city' => 'Yangon', 'country' => 'Myanmar'],
            ['name' => 'Nora Kim', 'email' => 'nora@example.com', 'phone' => '+95 9 420 100 222', 'city' => 'Mandalay', 'country' => 'Myanmar'],
            ['name' => 'Ella Tan', 'email' => 'ella@example.com', 'phone' => '+95 9 420 100 223', 'city' => 'Naypyidaw', 'country' => 'Myanmar'],
        ])->mapWithKeys(function (array $customer): array {
            $model = Customer::query()->updateOrCreate(
                ['email' => $customer['email']],
                $customer,
            );

            return [$model->name => $model];
        });

        if (Order::query()->exists()) {
            return;
        }

        $this->createOrder($customers['Maya Chen'], [
            [$products['DRS-001'], 1],
            [$products['ACC-008'], 1],
        ], 'completed', 'paid', 10);

        $this->createOrder($customers['Nora Kim'], [
            [$products['TOP-014'], 2],
            [$products['OTW-005'], 1],
        ], 'processing', 'paid', 0);

        $this->createOrder($customers['Ella Tan'], [
            [$products['DRS-002'], 1],
        ], 'pending', 'unpaid', 0);
    }

    /**
     * @param  array<int, array{0: Product, 1: int}>  $items
     */
    private function createOrder(Customer $customer, array $items, string $status, string $paymentStatus, float $discount): void
    {
        $subtotal = collect($items)->sum(fn (array $item): float => (float) $item[0]->price * $item[1]);
        $tax = round($subtotal * 0.05, 2);
        $shippingFee = $subtotal > 120 ? 0 : 5;

        $order = Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'BTQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
            'status' => $status,
            'payment_status' => $paymentStatus,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'shipping_fee' => $shippingFee,
            'total' => $subtotal - $discount + $tax + $shippingFee,
            'ordered_at' => now()->subDays(random_int(0, 12)),
        ]);

        foreach ($items as [$product, $quantity]) {
            $order->items()->create([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'quantity' => $quantity,
                'unit_price' => $product->price,
                'line_total' => (float) $product->price * $quantity,
            ]);
        }
    }
}
