<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
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
            RegisteredCustomerSeeder::class,
            PaymentMethodSeeder::class,
            CategoryHierarchySeeder::class,
            CategoryProductSeeder::class,
        ]);

        Storage::disk('public')->deleteDirectory('seed/products');

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
            ['category' => 'Dresses', 'sku' => 'DRS-001', 'name' => 'Celeste Pleated Midi Dress', 'price' => 136, 'cost_price' => 64, 'stock_quantity' => 16, 'low_stock_threshold' => 5, 'size' => 'S / M / L', 'color' => 'Sage / Ivory', 'is_featured' => true],
            ['category' => 'Dresses', 'sku' => 'DRS-002', 'name' => 'Noelle Linen Column Dress', 'price' => 112, 'cost_price' => 51, 'stock_quantity' => 6, 'low_stock_threshold' => 6, 'size' => 'XS / S / M', 'color' => 'Oat / Clay', 'is_featured' => true],
            ['category' => 'Tops', 'sku' => 'TOP-014', 'name' => 'Serin Draped Satin Blouse', 'price' => 72, 'cost_price' => 32, 'stock_quantity' => 22, 'low_stock_threshold' => 8, 'size' => 'S / M / L', 'color' => 'Champagne / Cocoa', 'is_featured' => false],
            ['category' => 'Tops', 'sku' => 'TOP-021', 'name' => 'Ayla Ribbed Knit Tank', 'price' => 46, 'cost_price' => 19, 'stock_quantity' => 9, 'low_stock_threshold' => 7, 'size' => 'M / L', 'color' => 'Black / Stone', 'is_featured' => false],
            ['category' => 'Accessories', 'sku' => 'ACC-008', 'name' => 'Maris Woven Mini Tote', 'price' => 84, 'cost_price' => 34, 'stock_quantity' => 14, 'low_stock_threshold' => 4, 'size' => null, 'color' => 'Blush / Natural', 'is_featured' => true],
            ['category' => 'Outerwear', 'sku' => 'OTW-005', 'name' => 'Eloise Textured Crop Jacket', 'price' => 156, 'cost_price' => 74, 'stock_quantity' => 8, 'low_stock_threshold' => 5, 'size' => 'S / M / L', 'color' => 'Cream / Charcoal', 'is_featured' => true],
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

            $this->seedProductVariants($model);
            $this->seedProductImages($model);

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

    private function seedProductVariants(Product $product): void
    {
        $sizes = $this->variantOptions($product->size);
        $colors = $this->variantOptions($product->color);
        $variantNumber = 1;

        $product->variants()->delete();

        foreach ($colors as $color) {
            foreach ($sizes as $size) {
                $product->variants()->create([
                    'sku' => $product->sku.'-'.str_pad((string) $variantNumber, 2, '0', STR_PAD_LEFT),
                    'size' => $size === 'Standard' ? null : $size,
                    'color' => $color === 'Standard' ? null : $color,
                    'price' => $product->price,
                    'cost_price' => $product->cost_price,
                    'stock_quantity' => max(1, (int) floor($product->stock_quantity / max(1, count($sizes) * count($colors)))),
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'is_active' => $product->is_active,
                ]);

                $variantNumber++;
            }
        }
    }

    /**
     * @return array<int, string>
     */
    private function variantOptions(?string $value): array
    {
        if (! $value) {
            return ['Standard'];
        }

        return collect(explode('/', $value))
            ->map(fn (string $option): string => trim($option))
            ->filter()
            ->values()
            ->all();
    }

    private function seedProductImages(Product $product): void
    {
        $disk = Storage::disk('public');
        $colors = $this->imagePalette($product->sku);

        $product->images()
            ->where('path', 'like', 'seed/products/%')
            ->delete();

        foreach ([1, 2] as $sortOrder) {
            $path = 'seed/products/'.Str::slug($product->sku.'-'.$product->slug).'-'.$sortOrder.'.svg';
            $contents = $this->productImageSvg(
                sku: $product->sku,
                title: $product->name,
                subtitle: $sortOrder === 1 ? $product->category->name : ($product->color ?? 'Boutique'),
                background: $colors[$sortOrder - 1][0],
                foreground: $colors[$sortOrder - 1][1],
                sortOrder: $sortOrder,
            );

            $disk->put($path, $contents);

            $product->images()->updateOrCreate(
                ['path' => $path],
                [
                    'original_name' => Str::slug($product->name).'-'.$sortOrder.'.svg',
                    'mime_type' => 'image/svg+xml',
                    'size' => strlen($contents),
                    'sort_order' => $sortOrder,
                ],
            );
        }
    }

    /**
     * @return array<int, array{0: string, 1: string}>
     */
    private function imagePalette(string $sku): array
    {
        return match ($sku) {
            'DRS-001' => [['#9caf9f', '#26352d'], ['#f2eee4', '#52665a']],
            'DRS-002' => [['#d8c6b5', '#50372d'], ['#b8725e', '#fff7ee']],
            'TOP-014' => [['#dbc7a8', '#463626'], ['#6f5345', '#f7ead5']],
            'TOP-021' => [['#191919', '#f1ede5'], ['#c8c2b8', '#2e2d2b']],
            'ACC-008' => [['#ecc9ce', '#633744'], ['#d6b889', '#4b382a']],
            'OTW-005' => [['#eee0ca', '#493e32'], ['#4a4945', '#f5eee4']],
            default => [['#ece7df', '#3f3a34'], ['#d7cec2', '#2f2a25']],
        };
    }

    private function productImageSvg(
        string $sku,
        string $title,
        string $subtitle,
        string $background,
        string $foreground,
        int $sortOrder,
    ): string {
        $artwork = $this->productImageArtwork($sku, $foreground, $sortOrder);
        $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $safeSubtitle = htmlspecialchars($subtitle, ENT_QUOTES | ENT_XML1, 'UTF-8');

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="{$safeTitle}">
  <rect width="1200" height="1500" fill="{$background}"/>
  <rect x="90" y="90" width="1020" height="1320" rx="36" fill="none" stroke="{$foreground}" stroke-opacity=".28" stroke-width="4"/>
  <circle cx="600" cy="520" r="250" fill="{$foreground}" opacity=".11"/>
  {$artwork}
  <text x="600" y="1110" text-anchor="middle" fill="{$foreground}" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700">{$safeTitle}</text>
  <text x="600" y="1184" text-anchor="middle" fill="{$foreground}" opacity=".72" font-family="Inter, Arial, sans-serif" font-size="30" letter-spacing="8">{$safeSubtitle}</text>
</svg>
SVG;
    }

    private function productImageArtwork(string $sku, string $foreground, int $sortOrder): string
    {
        $opacity = $sortOrder === 1 ? '.2' : '.28';
        $accentOpacity = $sortOrder === 1 ? '.55' : '.42';

        return match ($sku) {
            'DRS-001' => <<<SVG
  <path d="M468 330h264l76 560c11 82-53 154-136 154H528c-83 0-147-72-136-154l76-560Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M514 330c12 94 41 142 86 142s74-48 86-142" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="16" stroke-linecap="round"/>
  <path d="M426 766h348" fill="none" stroke="{$foreground}" stroke-opacity=".36" stroke-width="18" stroke-linecap="round"/>
SVG,
            'DRS-002' => <<<SVG
  <path d="M512 315h176l86 706H426l86-706Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M512 315h176l-88 190-88-190Z" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="14" stroke-linejoin="round"/>
  <path d="M461 574h278" fill="none" stroke="{$foreground}" stroke-opacity=".34" stroke-width="16" stroke-linecap="round"/>
SVG,
            'TOP-014' => <<<SVG
  <path d="M438 430c74-58 250-58 324 0l74 402c13 70-41 134-112 134H476c-71 0-125-64-112-134l74-402Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M518 410c20 88 144 88 164 0" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="16" stroke-linecap="round"/>
  <path d="M414 492l-96 126M786 492l96 126" fill="none" stroke="{$foreground}" stroke-opacity=".38" stroke-width="18" stroke-linecap="round"/>
SVG,
            'TOP-021' => <<<SVG
  <path d="M486 348h228l56 594H430l56-594Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M490 348v-62M710 348v-62" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="18" stroke-linecap="round"/>
  <path d="M486 514h228M470 668h260M456 822h288" fill="none" stroke="{$foreground}" stroke-opacity=".3" stroke-width="14" stroke-linecap="round"/>
SVG,
            'ACC-008' => <<<SVG
  <path d="M388 560h424l-48 390H436l-48-390Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M494 560c0-102 212-102 212 0" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="20" stroke-linecap="round"/>
  <path d="M444 646h312" fill="none" stroke="{$foreground}" stroke-opacity=".34" stroke-width="16" stroke-linecap="round"/>
SVG,
            'OTW-005' => <<<SVG
  <path d="M430 394h340l96 470-142 66-50-328-74 104-74-104-50 328-142-66 96-470Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M526 394l74 312 74-312" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="18" stroke-linejoin="round"/>
  <path d="M430 394l-104 182M770 394l104 182" fill="none" stroke="{$foreground}" stroke-opacity=".34" stroke-width="18" stroke-linecap="round"/>
SVG,
            default => <<<SVG
  <path d="M448 372h304l96 660H352l96-660Z" fill="{$foreground}" opacity="{$opacity}"/>
  <path d="M500 372c18 86 52 128 100 128s82-42 100-128" fill="none" stroke="{$foreground}" stroke-opacity="{$accentOpacity}" stroke-width="16" stroke-linecap="round"/>
SVG,
        };
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
