import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, ListFilter, Search, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Category, Product, User } from '@/types/types';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { getProducts } from '@/api/products';
import { getCategories } from '@/api/categories';
import { categoryDisplayName } from '@/lib/category';

type Props = {
    user: User;
    cartCount: number;
    onProductClick: (productId: number) => void;
    onHomeClick: () => void;
    onCartClick: () => void;
    onLogout: () => void;
};

export default function CustomerShop({
    user,
    cartCount,
    onProductClick,
    onHomeClick,
    onCartClick,
    onLogout,
}: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Products - Boutique';

        getCategories().then((payload) =>
            setCategories(
                payload.data.filter((category) => category.is_active),
            ),
        );
    }, []);

    useEffect(() => {
        let isCurrentRequest = true;

        setLoading(true);

        getProducts(selectedCategoryId ? Number(selectedCategoryId) : undefined)
            .then((payload) => {
                if (isCurrentRequest) {
                    setProducts(payload.data);
                }
            })
            .finally(() => {
                if (isCurrentRequest) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [selectedCategoryId]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return products;
        }

        return products.filter((product) =>
            [
                product.name,
                product.sku,
                product.category?.name,
                product.color,
                product.size,
            ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(query)),
        );
    }, [products, search]);

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="shop"
                cartCount={cartCount}
                onHomeClick={onHomeClick}
                onShopClick={() => undefined}
                onCartClick={onCartClick}
                onLogout={onLogout}
            />

            <main>
                <section className="px-5 py-10 md:px-10 md:py-14">
                    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <span className="text-label-caps mb-3 block font-label-caps text-customer-secondary uppercase">
                                Boutique Catalog
                            </span>
                            <h1 className="font-headline-md text-4xl leading-tight tracking-normal text-customer-primary md:text-6xl">
                                Shop Products
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-customer-secondary">
                                Browse active products loaded directly from the
                                Laravel products API.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                            <label className="relative sm:w-56">
                                <span className="sr-only">
                                    Filter by category
                                </span>
                                <ListFilter className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-customer-secondary" />
                                <select
                                    className="h-11 w-full appearance-none border border-customer-outline-variant/30 bg-customer-surface pr-8 pl-9 text-sm outline-none focus-visible:border-customer-primary"
                                    value={selectedCategoryId}
                                    onChange={(event) =>
                                        setSelectedCategoryId(
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">All categories</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {categoryDisplayName(category)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="relative sm:w-80">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-customer-secondary" />
                                <Input
                                    className="h-11 border-customer-outline-variant/30 bg-customer-surface pl-9"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search products"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-5 pb-16 md:px-10">
                    <div className="mx-auto max-w-screen-2xl">
                        {loading ? (
                            <div className="grid min-h-80 place-items-center text-sm text-customer-secondary">
                                Loading products
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="grid min-h-80 place-items-center border border-customer-outline-variant/20 text-center">
                                <div>
                                    <ShoppingBag className="mx-auto mb-4 size-8 text-customer-secondary" />
                                    <p className="font-headline-md text-2xl text-customer-primary">
                                        No products found
                                    </p>
                                    <p className="mt-2 text-sm text-customer-secondary">
                                        Try another search term or category.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() =>
                                            onProductClick(product.id)
                                        }
                                        className="group text-left"
                                    >
                                        <div className="mb-4 aspect-4/5 overflow-hidden bg-customer-surface-container">
                                            {primaryProductImage(product) ? (
                                                <img
                                                    src={
                                                        primaryProductImage(
                                                            product,
                                                        ) ?? undefined
                                                    }
                                                    alt={product.name}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <ImagePlus className="size-8 text-customer-secondary" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="mb-1 font-label-caps text-[10px] text-customer-secondary uppercase">
                                                {product.category
                                                    ? categoryDisplayName(
                                                          product.category,
                                                      )
                                                    : 'Uncategorized'}
                                            </p>
                                            <h2 className="font-headline-md text-xl text-customer-primary transition-colors group-hover:text-customer-secondary">
                                                {product.name}
                                            </h2>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

function primaryProductImage(product: Product): string | null {
    return product.images[0]?.url ?? product.image_url;
}
