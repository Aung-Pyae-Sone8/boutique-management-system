<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategoryHierarchySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->hierarchy() as $parentName => $children) {
            $parent = Category::query()->updateOrCreate(
                ['slug' => Str::slug($parentName)],
                [
                    'parent_id' => null,
                    'name' => $parentName,
                    'description' => "{$parentName} boutique collections.",
                    'is_active' => true,
                ],
            );

            foreach ($children as $childName) {
                Category::query()->updateOrCreate(
                    ['slug' => Str::slug($parentName.'-'.$childName)],
                    [
                        'parent_id' => $parent->id,
                        'name' => $childName,
                        'description' => "{$childName} for {$parentName}.",
                        'is_active' => true,
                    ],
                );
            }
        }
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function hierarchy(): array
    {
        return [
            'Men' => ['Suits'],
            'Women' => ['Suits'],
            'Boys' => ['Uniforms'],
            'Girls' => ['Uniforms'],
        ];
    }
}
