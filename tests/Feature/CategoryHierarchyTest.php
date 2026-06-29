<?php

use App\Models\Category;
use App\Models\Product;

test('category API creates a subcategory under a root category', function () {
    $parent = Category::factory()->create(['name' => 'Men']);

    $response = $this->postJson(route('api.v1.categories.store'), [
        'parent_id' => $parent->id,
        'name' => 'Suits',
        'description' => 'Tailored suits for men.',
        'is_active' => true,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.parent_id', $parent->id)
        ->assertJsonPath('data.parent.name', 'Men')
        ->assertJsonPath('data.name', 'Suits');
});

test('parent category product filter includes products from its subcategories', function () {
    $parent = Category::factory()->create(['name' => 'Boys']);
    $subcategory = Category::factory()->for($parent, 'parent')->create([
        'name' => 'Uniforms',
    ]);
    $product = Product::factory()->for($subcategory)->create([
        'is_active' => true,
        'stock_quantity' => 5,
    ]);

    $response = $this->getJson(route('api.v1.products.index', [
        'active' => true,
        'in_stock' => true,
        'category_id' => $parent->id,
    ]));

    $response->assertSuccessful()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $product->id);
});
