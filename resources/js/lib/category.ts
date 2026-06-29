import type { Category } from '@/types/types';

export function categoryDisplayName(category: Category): string {
    return category.parent
        ? `${category.parent.name} / ${category.name}`
        : category.name;
}
