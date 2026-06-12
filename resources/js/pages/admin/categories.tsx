import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
    is_active: boolean;
};

type Props = {
    categories: Category[];
};

export default function Categories({ categories }: Props) {
    return (
        <>
            <Head title="Categories" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            Organize products into storefront collections.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/api/v1/categories">
                            <Plus className="size-4" />
                            API endpoint
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => (
                        <Card key={category.id} className="rounded-lg">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <CardTitle>{category.name}</CardTitle>
                                        <CardDescription>{category.slug}</CardDescription>
                                    </div>
                                    <Badge variant={category.is_active ? 'default' : 'outline'}>
                                        {category.is_active ? 'Active' : 'Hidden'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="min-h-10 text-sm text-muted-foreground">
                                    {category.description ?? 'No description yet.'}
                                </p>
                                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                                    <span>Products</span>
                                    <span className="font-semibold">{category.products_count}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

Categories.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: '/admin/categories',
        },
    ],
};
