import { Head, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Product = {
    id: number;
    sku: string;
    name: string;
    category: string | null;
    price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    size: string | null;
    color: string | null;
    is_active: boolean;
    is_featured: boolean;
    is_low_stock: boolean;
};

type Props = {
    products: Product[];
};

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function Products({ products }: Props) {
    return (
        <>
            <Head title="Products" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">Products</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage boutique catalog, pricing, stock, and featured items.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/api/v1/products">
                            <Plus className="size-4" />
                            API endpoint
                        </Link>
                    </Button>
                </div>

                <Card className="rounded-lg">
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Inventory</CardTitle>
                            <CardDescription>{products.length} products in catalog</CardDescription>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search in your browser" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="border-b text-left text-xs text-muted-foreground">
                                    <tr>
                                        <th className="pb-3 font-medium">Product</th>
                                        <th className="pb-3 font-medium">Category</th>
                                        <th className="pb-3 font-medium">Variant</th>
                                        <th className="pb-3 text-right font-medium">Price</th>
                                        <th className="pb-3 text-right font-medium">Stock</th>
                                        <th className="pb-3 font-medium">State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-3">
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {product.sku}
                                                </div>
                                            </td>
                                            <td className="py-3">{product.category ?? 'Uncategorized'}</td>
                                            <td className="py-3 text-muted-foreground">
                                                {[product.size, product.color].filter(Boolean).join(' / ') ||
                                                    'Standard'}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {money.format(product.price)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <Badge
                                                    variant={product.is_low_stock ? 'destructive' : 'secondary'}
                                                >
                                                    {product.stock_quantity}/{product.low_stock_threshold}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <Badge variant={product.is_active ? 'default' : 'outline'}>
                                                        {product.is_active ? 'Active' : 'Hidden'}
                                                    </Badge>
                                                    {product.is_featured && (
                                                        <Badge variant="secondary">Featured</Badge>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Products.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: '/admin/products',
        },
    ],
};
