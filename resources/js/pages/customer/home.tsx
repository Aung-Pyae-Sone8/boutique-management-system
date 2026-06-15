import { useEffect, useState } from 'react';
import { LogOut, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Paginated, Product, User } from '@/types/types';
import { getJson } from '@/const/json-tanfer';
import { csrfToken, money } from '@/const/data';

type Props = {
    user: User;
    onLogout: () => void;
};

export default function CustomerHome({ user, onLogout }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Shop - Boutique';

        getJson<Paginated<Product>>('/api/v1/products')
            .then((payload) => setProducts(payload.data.filter((product) => product.is_active)))
            .finally(() => setLoading(false));
    }, []);

    async function logout() {
        await fetch('/logout', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });

        onLogout();
        window.history.replaceState({}, '', '/login');
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <ShoppingBag className="size-5" />
                        </div>
                        <div>
                            <div className="font-semibold">Boutique Shop</div>
                            <div className="text-xs text-muted-foreground">Welcome, {user.name}</div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={logout}>
                        <LogOut className="size-4" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
                <section>
                    <h1 className="text-2xl font-semibold tracking-normal">New arrivals</h1>
                    <p className="text-sm text-muted-foreground">
                        Browse active boutique products from the customer site.
                    </p>
                </section>

                {loading ? (
                    <div className="grid min-h-60 place-items-center text-sm text-muted-foreground">
                        Loading products
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Card key={product.id} className="rounded-lg">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle>{product.name}</CardTitle>
                                            <CardDescription>
                                                {product.category?.name ?? 'Boutique item'}
                                            </CardDescription>
                                        </div>
                                        {product.is_featured && <Badge>Featured</Badge>}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="min-h-12 text-sm text-muted-foreground">
                                        {product.description ?? 'Curated boutique piece ready for your wardrobe.'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-lg font-semibold">{money.format(product.price)}</div>
                                        <Badge variant={product.stock_quantity > 0 ? 'secondary' : 'destructive'}>
                                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Sold out'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
