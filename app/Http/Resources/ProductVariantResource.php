<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'sku' => $this->sku,
            'size' => $this->size,
            'color' => $this->color,
            'price' => (float) $this->price,
            'cost_price' => (float) $this->cost_price,
            'stock_quantity' => $this->stock_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'is_active' => $this->is_active,
            'is_low_stock' => $this->isLowStock(),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
