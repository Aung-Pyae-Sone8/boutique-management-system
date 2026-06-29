<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryProductSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CategoryHierarchySeeder::class);

        foreach ($this->products() as $data) {
            $this->seedProduct($data);
        }
    }

    /**
     * @param  array{category: string, sku: string, name: string, description: string, price: float, cost_price: float, sizes: array<int, string>, colors: array<string, string>, variant_stock: int, featured: bool}  $data
     */
    private function seedProduct(array $data): void
    {
        $category = Category::query()->where('slug', $data['category'])->firstOrFail();
        $stockQuantity = count($data['sizes']) * count($data['colors']) * $data['variant_stock'];

        DB::transaction(function () use ($category, $data, $stockQuantity): void {
            $product = Product::query()->updateOrCreate(
                ['sku' => $data['sku']],
                [
                    'category_id' => $category->id,
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'cost_price' => $data['cost_price'],
                    'stock_quantity' => $stockQuantity,
                    'low_stock_threshold' => 5,
                    'size' => implode(' / ', $data['sizes']),
                    'color' => implode(' / ', array_keys($data['colors'])),
                    'image_url' => null,
                    'is_featured' => $data['featured'],
                    'is_active' => true,
                ],
            );

            Storage::disk('public')->deleteDirectory("seed/category-products/{$product->sku}");
            $product->images()->delete();
            $product->variants()->delete();

            $this->seedProductImages($product, $data);
            $this->seedVariants($product, $data);
        });
    }

    /**
     * @param  array{colors: array<string, string>, name: string}  $data
     */
    private function seedProductImages(Product $product, array $data): void
    {
        foreach (array_slice($data['colors'], 0, 2, true) as $color => $hex) {
            $this->storeImage($product, 'product-'.Str::slug($color), $data['name'], $color, $hex);
        }
    }

    /**
     * @param  array{colors: array<string, string>, sizes: array<int, string>, name: string, price: float, cost_price: float, variant_stock: int}  $data
     */
    private function seedVariants(Product $product, array $data): void
    {
        $number = 1;

        foreach ($data['colors'] as $color => $hex) {
            foreach ($data['sizes'] as $size) {
                $variant = $product->variants()->create([
                    'sku' => $product->sku.'-'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                    'size' => $size,
                    'color' => $color,
                    'price' => $data['price'],
                    'cost_price' => $data['cost_price'],
                    'stock_quantity' => $data['variant_stock'],
                    'low_stock_threshold' => 2,
                    'is_active' => true,
                ]);

                $this->storeImage($product, "variant-{$variant->sku}", $data['name'], "{$color} / {$size}", $hex, $variant->id);
                $number++;
            }
        }
    }

    private function storeImage(Product $product, string $filename, string $title, string $subtitle, string $background, ?int $variantId = null): void
    {
        $path = "seed/category-products/{$product->sku}/{$filename}.svg";
        $contents = $this->imageSvg($title, $subtitle, $background);

        Storage::disk('public')->put($path, $contents);
        $product->images()->create([
            'product_variant_id' => $variantId,
            'path' => $path,
            'original_name' => "{$filename}.svg",
            'mime_type' => 'image/svg+xml',
            'size' => strlen($contents),
            'sort_order' => $variantId ? 1 : $product->images()->whereNull('product_variant_id')->count() + 1,
        ]);
    }

    private function imageSvg(string $title, string $subtitle, string $background): string
    {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $safeSubtitle = htmlspecialchars($subtitle, ENT_QUOTES | ENT_XML1, 'UTF-8');

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="{$safeTitle}">
  <rect width="1200" height="1500" fill="{$background}"/>
  <rect x="80" y="80" width="1040" height="1340" fill="#ffffff" opacity=".12"/>
  <path d="M430 330h340l96 520-142 72-52-326-72 114-72-114-52 326-142-72 96-520Z" fill="#ffffff" opacity=".34"/>
  <path d="M525 330l75 380 75-380M430 330 326 548M770 330l104 218" fill="none" stroke="#ffffff" stroke-opacity=".72" stroke-width="18" stroke-linejoin="round"/>
  <path d="M465 938h270l58 210H407l58-210Z" fill="#ffffff" opacity=".24"/>
  <text x="600" y="1270" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="46" font-weight="700">{$safeTitle}</text>
  <text x="600" y="1335" text-anchor="middle" fill="#ffffff" opacity=".82" font-family="Arial, sans-serif" font-size="27">{$safeSubtitle}</text>
</svg>
SVG;
    }

    /**
     * @return array<int, array{category: string, sku: string, name: string, description: string, price: float, cost_price: float, sizes: array<int, string>, colors: array<string, string>, variant_stock: int, featured: bool}>
     */
    private function products(): array
    {
        return [
            ['category' => 'men-suits', 'sku' => 'MNS-001', 'name' => 'Oxford Tailored Two-Piece Suit', 'description' => 'Structured two-piece suit with a clean notch lapel and tapered trousers.', 'price' => 245, 'cost_price' => 118, 'sizes' => ['38', '40', '42'], 'colors' => ['Navy' => '#26364a', 'Charcoal' => '#44464b'], 'variant_stock' => 3, 'featured' => true],
            ['category' => 'men-suits', 'sku' => 'MNS-002', 'name' => 'Regent Linen Blend Suit', 'description' => 'Breathable linen-blend tailoring designed for warm-weather occasions.', 'price' => 218, 'cost_price' => 102, 'sizes' => ['38', '40', '42'], 'colors' => ['Stone' => '#9b9488', 'Olive' => '#66705b'], 'variant_stock' => 2, 'featured' => false],
            ['category' => 'women-suits', 'sku' => 'WNS-001', 'name' => 'Elara Sculpted Blazer Suit', 'description' => 'Sculpted blazer and straight-leg trouser set with refined shaping.', 'price' => 226, 'cost_price' => 106, 'sizes' => ['XS', 'S', 'M'], 'colors' => ['Black' => '#242424', 'Ivory' => '#c7bda9'], 'variant_stock' => 3, 'featured' => true],
            ['category' => 'women-suits', 'sku' => 'WNS-002', 'name' => 'Camille Wide-Leg Suit', 'description' => 'Relaxed single-button jacket paired with fluid wide-leg trousers.', 'price' => 204, 'cost_price' => 94, 'sizes' => ['S', 'M', 'L'], 'colors' => ['Sage' => '#788878', 'Cocoa' => '#705548'], 'variant_stock' => 2, 'featured' => false],
            ['category' => 'boys-uniforms', 'sku' => 'BYU-001', 'name' => 'Academy Boys Blazer Set', 'description' => 'Durable school blazer, shirt, and trouser set for everyday uniform wear.', 'price' => 96, 'cost_price' => 43, 'sizes' => ['8Y', '10Y', '12Y'], 'colors' => ['Navy' => '#293a56', 'Black' => '#272727'], 'variant_stock' => 4, 'featured' => false],
            ['category' => 'boys-uniforms', 'sku' => 'BYU-002', 'name' => 'Scholar Boys Shirt and Trouser Set', 'description' => 'Easy-care uniform shirt and tailored trouser set with reinforced seams.', 'price' => 68, 'cost_price' => 29, 'sizes' => ['8Y', '10Y', '12Y'], 'colors' => ['White' => '#b7b8b5', 'Sky' => '#7394aa'], 'variant_stock' => 4, 'featured' => false],
            ['category' => 'girls-uniforms', 'sku' => 'GLU-001', 'name' => 'Academy Girls Pinafore Set', 'description' => 'Classic pleated pinafore with a soft cotton blouse for daily school wear.', 'price' => 74, 'cost_price' => 32, 'sizes' => ['8Y', '10Y', '12Y'], 'colors' => ['Navy' => '#32405c', 'Maroon' => '#75414a'], 'variant_stock' => 4, 'featured' => false],
            ['category' => 'girls-uniforms', 'sku' => 'GLU-002', 'name' => 'Scholar Girls Blazer and Skirt Set', 'description' => 'Polished blazer and pleated skirt set made from resilient uniform cloth.', 'price' => 102, 'cost_price' => 46, 'sizes' => ['8Y', '10Y', '12Y'], 'colors' => ['Charcoal' => '#515258', 'Forest' => '#405c4b'], 'variant_stock' => 3, 'featured' => true],
        ];
    }
}
