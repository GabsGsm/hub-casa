<?php

namespace App\Http\Controllers;

use App\Http\Requests\Financeiro\StoreCategoryRequest;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryRepository $repo,
    ) {}

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $this->repo->create(
            $request->user()->house_id,
            $request->user()->id,
            $request->validated(),
        );

        return back()->with('success', 'Categoria criada.');
    }

    public function update(StoreCategoryRequest $request, Category $category): RedirectResponse
    {
        $this->ensureBelongsToHouse($request, $category);

        $this->repo->update($category, $request->validated());

        return back()->with('success', 'Categoria atualizada.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $this->ensureBelongsToHouse($request, $category);

        $this->repo->delete($category);

        return back()->with('success', 'Categoria removida.');
    }

    private function ensureBelongsToHouse(Request $request, Category $category): void
    {
        if ($category->house_id !== $request->user()->house_id) {
            abort(403);
        }
    }
}
