<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return ProductResource::collection(
            Product::query()
                ->with(['category.parent', 'images', 'variants.images'])
                ->when($request->string('search')->toString(), function ($query, string $search): void {
                    $query->where(function ($query) use ($search): void {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
                })
                ->when($request->integer('category_id'), function (Builder $query, int $categoryId): void {
                    $categoryIds = Category::query()
                        ->where('parent_id', $categoryId)
                        ->pluck('id')
                        ->prepend($categoryId);

                    $query->whereIn('category_id', $categoryIds);
                })
                ->when($request->boolean('active'), fn (Builder $query) => $query->where('is_active', true))
                ->when($request->boolean('featured'), fn (Builder $query) => $query->where('is_featured', true))
                ->when($request->boolean('in_stock'), function (Builder $query): void {
                    $query->where(function (Builder $query): void {
                        $query->whereHas('variants', function (Builder $query): void {
                            $query->where('is_active', true)
                                ->where('stock_quantity', '>', 0);
                        })->orWhere(function (Builder $query): void {
                            $query->doesntHave('variants')
                                ->where('stock_quantity', '>', 0);
                        });
                    });
                })
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request): ProductResource
    {
        $data = $request->validate($this->rules());
        $data['slug'] ??= Str::slug($data['name']);

        $images = $request->file('images', []);
        $variantImages = $request->file('variant_images', []);
        $variants = $data['variants'] ?? [];
        unset($data['images'], $data['variant_images'], $data['variants']);

        $data = $this->mergeVariantSummary($data, $variants);

        $product = DB::transaction(function () use ($data, $images, $variantImages, $variants): Product {
            $product = Product::create($data);
            $this->syncVariants($product, $variants, $variantImages);
            $this->storeImages($product, $images);

            return $product;
        });

        return ProductResource::make($product->load(['category.parent', 'images', 'variants.images']));
    }

    public function show(Product $product): ProductResource
    {
        return ProductResource::make($product->load(['category.parent', 'images', 'variants.images']));
    }

    public function update(Request $request, Product $product): ProductResource
    {
        $data = $request->validate($this->rules($product));
        $images = $request->file('images', []);
        $variantImages = $request->file('variant_images', []);
        $variants = $data['variants'] ?? [];
        unset($data['images'], $data['variant_images'], $data['variants']);

        $data = $this->mergeVariantSummary($data, $variants);

        if (array_key_exists('name', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        DB::transaction(function () use ($product, $data, $images, $variantImages, $variants): void {
            $product->update($data);
            $this->syncVariants($product, $variants, $variantImages);
            $this->storeImages($product, $images);
        });

        return ProductResource::make($product->load(['category.parent', 'images', 'variants.images']));
    }

    public function destroy(Product $product): Response
    {
        Storage::disk('public')->deleteDirectory("products/{$product->id}");

        $product->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Product $product = null): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'sku' => ['required', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($product)],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product)],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'size' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'images' => [$product ? 'nullable' : 'required', 'array', 'min:1', 'max:8'],
            'images.*' => ['required', File::image()->max('4mb')],
            'variant_images' => ['nullable', 'array'],
            'variant_images.*' => ['nullable', 'array', 'max:8'],
            'variant_images.*.*' => ['required', File::image()->max('4mb')],
            'variants' => ['nullable', 'array', 'max:50'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.sku' => ['required_with:variants', 'string', 'max:255', 'distinct'],
            'variants.*.size' => ['nullable', 'string', 'max:255'],
            'variants.*.color' => ['nullable', 'string', 'max:255'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array<string, mixed>>  $variants
     * @return array<string, mixed>
     */
    private function mergeVariantSummary(array $data, array $variants): array
    {
        $primaryVariant = collect($variants)->first();

        if (! is_array($primaryVariant)) {
            return $data;
        }

        return array_merge($data, [
            'price' => $primaryVariant['price'],
            'cost_price' => $primaryVariant['cost_price'] ?? 0,
            'stock_quantity' => $primaryVariant['stock_quantity'] ?? 0,
            'low_stock_threshold' => $primaryVariant['low_stock_threshold'] ?? 5,
            'size' => $primaryVariant['size'] ?? null,
            'color' => $primaryVariant['color'] ?? null,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $variants
     * @param  array<int, array<int, UploadedFile>>  $variantImages
     */
    private function syncVariants(Product $product, array $variants, array $variantImages = []): void
    {
        if ($variants === []) {
            return;
        }

        $keptVariantIds = [];

        foreach ($variants as $index => $variant) {
            $variantData = [
                'sku' => $variant['sku'],
                'size' => $variant['size'] ?? null,
                'color' => $variant['color'] ?? null,
                'price' => $variant['price'],
                'cost_price' => $variant['cost_price'] ?? 0,
                'stock_quantity' => $variant['stock_quantity'] ?? 0,
                'low_stock_threshold' => $variant['low_stock_threshold'] ?? 5,
                'is_active' => $variant['is_active'] ?? true,
            ];

            $variantModel = empty($variant['id'])
                ? $product->variants()->create($variantData)
                : $product->variants()->updateOrCreate(['id' => $variant['id']], $variantData);

            $keptVariantIds[] = $variantModel->id;

            $this->storeImages($product, $variantImages[$index] ?? [], $variantModel->id);
        }

        $product->variants()
            ->whereNotIn('id', $keptVariantIds)
            ->delete();
    }

    /**
     * @param  array<int, UploadedFile>  $images
     */
    private function storeImages(Product $product, array $images, ?int $productVariantId = null): void
    {
        $sortOrder = (int) $product->images()
            ->where('product_variant_id', $productVariantId)
            ->max('sort_order');

        foreach ($images as $image) {
            $path = $productVariantId
                ? $image->store("products/{$product->id}/variants/{$productVariantId}", 'public')
                : $image->store("products/{$product->id}", 'public');

            $product->images()->create([
                'product_variant_id' => $productVariantId,
                'path' => $path,
                'original_name' => $image->getClientOriginalName(),
                'mime_type' => $image->getClientMimeType(),
                'size' => $image->getSize() ?: 0,
                'sort_order' => ++$sortOrder,
            ]);
        }
    }
}
