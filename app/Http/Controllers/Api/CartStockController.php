<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartStockController extends Controller
{
    public function store(Request $request): ProductResource
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = DB::transaction(function () use ($data): Product {
            $product = Product::query()
                ->whereKey($data['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (! empty($data['product_variant_id'])) {
                $variant = ProductVariant::query()
                    ->whereKey($data['product_variant_id'])
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->ensureStockAvailable($variant->stock_quantity, $data['quantity']);

                $variant->decrement('stock_quantity', $data['quantity']);
            } else {
                $this->ensureStockAvailable($product->stock_quantity, $data['quantity']);
            }

            $product->forceFill([
                'stock_quantity' => max(0, $product->stock_quantity - $data['quantity']),
            ])->save();

            return $product->refresh();
        });

        return ProductResource::make($product->load(['category.parent', 'images', 'variants.images']));
    }

    public function update(Request $request): Response
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity_change' => ['required', 'integer', 'not_in:0'],
        ]);

        DB::transaction(function () use ($data): void {
            foreach ($data['items'] as $item) {
                $this->adjustStock($item);
            }
        });

        return response()->noContent();
    }

    /**
     * @param  array{product_id: int, product_variant_id: int|null, quantity_change: int}  $item
     */
    private function adjustStock(array $item): void
    {
        $product = Product::query()
            ->whereKey($item['product_id'])
            ->lockForUpdate()
            ->firstOrFail();
        $quantityChange = $item['quantity_change'];

        if (! empty($item['product_variant_id'])) {
            $variant = ProductVariant::query()
                ->whereKey($item['product_variant_id'])
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($quantityChange > 0) {
                $this->ensureStockAvailable($variant->stock_quantity, $quantityChange);
            }

            if ($quantityChange > 0) {
                $variant->decrement('stock_quantity', $quantityChange);
            } else {
                $variant->increment('stock_quantity', abs($quantityChange));
            }
        }

        if ($quantityChange > 0) {
            $this->ensureStockAvailable($product->stock_quantity, $quantityChange);
        }

        if ($quantityChange > 0) {
            $product->decrement('stock_quantity', $quantityChange);
        } else {
            $product->increment('stock_quantity', abs($quantityChange));
        }
    }

    private function ensureStockAvailable(int $availableQuantity, int $requestedQuantity): void
    {
        if ($availableQuantity >= $requestedQuantity) {
            return;
        }

        throw ValidationException::withMessages([
            'quantity' => 'Not enough stock is available for this product.',
        ]);
    }
}
