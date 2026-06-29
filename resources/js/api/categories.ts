import { index as categoriesIndex } from '@/routes/api/v1/categories';
import { getJson } from '@/const/json-tanfer';
import type { Category, Paginated } from '@/types/types';

export function getCategories(): Promise<Paginated<Category>> {
    return getJson<Paginated<Category>>(
        categoriesIndex.url({ query: { per_page: 100 } }),
    );
}
