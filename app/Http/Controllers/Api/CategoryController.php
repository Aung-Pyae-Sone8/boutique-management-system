<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()
                ->with('parent')
                ->withCount(['products', 'children', 'childrenProducts'])
                ->orderBy('parent_id')
                ->orderBy('name')
                ->paginate(max(1, min($request->integer('per_page', 50), 100)))
        );
    }

    public function store(Request $request): CategoryResource
    {
        $data = $request->validate($this->rules());

        $data['slug'] ??= Str::slug($data['name']);

        return CategoryResource::make($this->loadDirectoryData(Category::create($data)));
    }

    public function show(Category $category): CategoryResource
    {
        return CategoryResource::make($this->loadDirectoryData($category));
    }

    public function update(Request $request, Category $category): CategoryResource
    {
        $data = $request->validate($this->rules($category));

        if (array_key_exists('name', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return CategoryResource::make($this->loadDirectoryData($category));
    }

    public function destroy(Category $category): Response
    {
        $category->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Category $category = null): array
    {
        return [
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->whereNull('parent_id'),
                Rule::notIn([$category?->id]),
            ],
            'name' => [...($category ? ['sometimes'] : []), 'required', 'string', 'max:255'],
            'slug' => [$category ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }

    private function loadDirectoryData(Category $category): Category
    {
        return $category->load('parent')->loadCount(['products', 'children', 'childrenProducts']);
    }
}
