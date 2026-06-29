<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'sku' => $this->sku,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'cost_price' => (float) $this->cost_price,
            'stock_quantity' => $this->stock_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'size' => $this->size,
            'color' => $this->color,
            'image_url' => $this->whenLoaded(
                'images',
                function (): ?string {
                    $path = $this->images->whereNull('product_variant_id')->first()?->path
                        ?? $this->images->first()?->path;

                    return $path ? Storage::disk('public')->url($path) : $this->image_url;
                },
                $this->image_url,
            ),
            'images' => $this->whenLoaded(
                'images',
                fn () => ProductImageResource::collection($this->images->whereNull('product_variant_id')->values()),
            ),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'is_low_stock' => $this->isLowStock(),
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
