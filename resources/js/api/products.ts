import {
    index as productsIndex,
    show as productShow,
} from '@/routes/api/v1/products';
import type { Paginated, Product } from '@/types/types';
import { getJson } from '@/const/json-tanfer';

export function getProducts(categoryId?: number): Promise<Paginated<Product>> {
    return getJson<Paginated<Product>>(
        productsIndex.url({
            query: {
                active: true,
                in_stock: true,
                category_id: categoryId,
            },
        }),
    );
}

export function getFeaturedProducts(): Promise<Paginated<Product>> {
    return getJson<Paginated<Product>>(
        productsIndex.url({
            query: { active: true, featured: true, in_stock: true },
        }),
    );
}

export function getProduct(productId: number): Promise<{ data: Product }> {
    return getJson<{ data: Product }>(productShow.url(productId));
}
