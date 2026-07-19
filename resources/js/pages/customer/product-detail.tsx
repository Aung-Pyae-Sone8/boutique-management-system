import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product, ProductVariant, User } from '@/types/types';
import { csrfToken, money } from '@/const/data';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { getProduct } from '@/api/products';
import { addCartItem } from '@/lib/customer-cart';
import { categoryDisplayName } from '@/lib/category';

type Props = {
    productId: number;
    user: User;
    cartCount: number;
    onBackClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerProductDetail({
    productId,
    user,
    cartCount,
    onBackClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
        null,
    );
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [reservingStock, setReservingStock] = useState(false);
    const [addedMessage, setAddedMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCurrentRequest = true;

        setProduct(null);
        setSelectedImageUrl(null);
        setLoading(true);

        getProduct(productId)
            .then((payload) => {
                if (!isCurrentRequest) {
                    return;
                }

                setProduct(payload.data);
                setSelectedImageUrl(primaryProductImage(payload.data));
                const firstVariant = firstAvailableVariant(payload.data);

                setSelectedSize(firstVariant?.size ?? payload.data.size ?? '');
                setSelectedColor(
                    firstVariant?.color ?? payload.data.color ?? '',
                );
                setQuantity(1);
                setAddedMessage('');
                document.title = `${payload.data.name} - Boutique`;
            })
            .finally(() => {
                if (isCurrentRequest) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [productId]);

    const activeVariants = useMemo(
        () => product?.variants.filter((variant) => variant.is_active) ?? [],
        [product],
    );
    const sizes = useMemo(
        () =>
            activeVariants.length > 0
                ? uniqueVariantOptions(activeVariants, 'size')
                : uniqueOptions(product?.size),
        [activeVariants, product],
    );
    const colors = useMemo(
        () =>
            activeVariants.length > 0
                ? uniqueVariantOptions(activeVariants, 'color')
                : uniqueOptions(product?.color),
        [activeVariants, product],
    );
    const selectedVariant = useMemo(
        () =>
            activeVariants.find(
                (variant) =>
                    optionValue(variant.size) === optionValue(selectedSize) &&
                    optionValue(variant.color) === optionValue(selectedColor),
            ) ?? null,
        [activeVariants, selectedColor, selectedSize],
    );
    const galleryImages = selectedVariant?.images.length
        ? selectedVariant.images
        : (product?.images ?? []);
    const displayedPrice = selectedVariant?.price ?? product?.price ?? 0;
    const displayedStock =
        selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0;
    const needsVariantSelection = activeVariants.length > 0;
    const canAddToCart =
        displayedStock > 0 && (!needsVariantSelection || selectedVariant);

    useEffect(() => {
        if (!product) {
            return;
        }

        setSelectedImageUrl(primaryProductImage(product, selectedVariant));
        setQuantity(1);
    }, [product, selectedVariant]);

    async function addSelectedItemToCart() {
        if (!product || !canAddToCart) {
            return;
        }

        setReservingStock(true);
        setAddedMessage('');

        try {
            const productBeforeReservation = product;
            const selectedVariantBeforeReservation = selectedVariant;
            const response = await reserveCartStock(
                product.id,
                selectedVariant?.id ?? null,
                quantity,
            );

            addCartItem(
                productBeforeReservation,
                selectedVariantBeforeReservation,
                quantity,
            );
            setProduct(response.data);
            setAddedMessage('Added to cart');
        } catch {
            setAddedMessage('Not enough stock is available.');
        } finally {
            setReservingStock(false);
        }
    }

    function chooseColor(color: string) {
        const nextVariant =
            activeVariants.find(
                (variant) =>
                    optionValue(variant.color) === optionValue(color) &&
                    optionValue(variant.size) === optionValue(selectedSize),
            ) ??
            activeVariants.find(
                (variant) => optionValue(variant.color) === optionValue(color),
            );

        setSelectedColor(color);

        if (nextVariant) {
            setSelectedSize(optionValue(nextVariant.size));
        }
    }

    function chooseSize(size: string) {
        const nextVariant =
            activeVariants.find(
                (variant) =>
                    optionValue(variant.size) === optionValue(size) &&
                    optionValue(variant.color) === optionValue(selectedColor),
            ) ??
            activeVariants.find(
                (variant) => optionValue(variant.size) === optionValue(size),
            );

        setSelectedSize(size);

        if (nextVariant) {
            setSelectedColor(optionValue(nextVariant.color));
        }
    }

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="detail"
                cartCount={cartCount}
                onHomeClick={onBackClick}
                onShopClick={onBackClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
            />

            {loading ? (
                <main className="grid min-h-[70vh] place-items-center text-sm text-customer-secondary">
                    Loading product
                </main>
            ) : !product ? (
                <main className="grid min-h-[70vh] place-items-center text-center">
                    <div>
                        <p className="font-headline-md text-2xl">
                            Product not found
                        </p>
                        <Button className="mt-4" onClick={onBackClick}>
                            Back to shop
                        </Button>
                    </div>
                </main>
            ) : (
                <main className="mx-auto grid max-w-screen-2xl gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] md:px-10 md:py-14">
                    <section className="space-y-4">
                        <div className="aspect-4/5 overflow-hidden bg-customer-surface-container">
                            {selectedImageUrl ? (
                                <img
                                    key={selectedImageUrl}
                                    src={selectedImageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <ImagePlus className="size-10 text-customer-secondary" />
                                </div>
                            )}
                        </div>
                        {galleryImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                {galleryImages.map((image) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedImageUrl(image.url)
                                        }
                                        className={`aspect-square overflow-hidden border ${
                                            selectedImageUrl === image.url
                                                ? 'border-customer-primary'
                                                : 'border-customer-outline-variant/20'
                                        }`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={
                                                image.original_name ??
                                                product.name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="flex flex-col justify-start">
                        <p className="text-label-caps mb-3 font-label-caps text-customer-secondary uppercase">
                            {product.category
                                ? categoryDisplayName(product.category)
                                : 'Uncategorized'}
                        </p>
                        <h1 className="font-headline-md text-4xl leading-tight text-customer-primary md:text-5xl">
                            {product.name}
                        </h1>
                        {product.description && (
                            <p className="mt-5 text-base leading-7 text-customer-secondary">
                                {product.description}
                            </p>
                        )}

                        <div className="mt-8 text-3xl text-customer-primary">
                            {money.format(Number(displayedPrice))}
                        </div>

                        <div className="mt-8 grid gap-5">
                            <ProductOption
                                label="Color"
                                value={selectedColor}
                                options={colors}
                                fallback="Standard"
                                onChange={chooseColor}
                            />
                            <ProductOption
                                label="Size"
                                value={selectedSize}
                                options={sizes}
                                fallback="Standard"
                                onChange={chooseSize}
                            />
                        </div>

                        <div className="mt-8 flex items-center justify-between border-y border-customer-outline-variant/20 py-5 text-sm text-customer-secondary">
                            <span>Availability</span>
                            <span>
                                {displayedStock > 0
                                    ? `${displayedStock} in stock`
                                    : 'Out of stock'}
                            </span>
                        </div>

                        <div className="mt-6 flex w-fit items-center border border-customer-outline-variant/30">
                            <button
                                type="button"
                                className="grid size-11 place-items-center disabled:opacity-40"
                                disabled={quantity <= 1}
                                onClick={() =>
                                    setQuantity((current) =>
                                        Math.max(1, current - 1),
                                    )
                                }
                            >
                                <Minus className="size-4" />
                            </button>
                            <span className="w-14 text-center text-sm">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                className="grid size-11 place-items-center disabled:opacity-40"
                                disabled={quantity >= displayedStock}
                                onClick={() =>
                                    setQuantity((current) =>
                                        Math.min(displayedStock, current + 1),
                                    )
                                }
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>

                        <Button
                            className="mt-8 h-12 w-full"
                            disabled={!canAddToCart || reservingStock}
                            onClick={addSelectedItemToCart}
                        >
                            <ShoppingBag className="size-4" />
                            {reservingStock ? 'Adding...' : 'Add to cart'}
                        </Button>
                        {addedMessage && (
                            <p className="mt-3 text-sm text-customer-secondary">
                                {addedMessage}
                            </p>
                        )}
                    </section>
                </main>
            )}
        </div>
    );
}

function ProductOption({
    label,
    value,
    options,
    fallback,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    fallback: string;
    onChange: (value: string) => void;
}) {
    const resolvedOptions = options.length > 0 ? options : [fallback];

    return (
        <label className="space-y-2">
            <span className="text-label-caps font-label-caps text-customer-secondary uppercase">
                {label}
            </span>
            <select
                className="h-11 w-full border border-customer-outline-variant/30 bg-customer-surface px-3 text-sm outline-none focus-visible:border-customer-primary"
                value={value || resolvedOptions[0]}
                onChange={(event) => onChange(event.target.value)}
            >
                {resolvedOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function uniqueOptions(value: string | null | undefined): string[] {
    return value
        ? Array.from(
              new Set(
                  value
                      .split('/')
                      .map((item) => item.trim())
                      .filter(Boolean),
              ),
          )
        : [];
}

function firstAvailableVariant(product: Product): ProductVariant | null {
    return (
        product.variants.find(
            (variant) => variant.is_active && variant.stock_quantity > 0,
        ) ?? null
    );
}

function uniqueVariantOptions(
    variants: ProductVariant[],
    field: 'size' | 'color',
): string[] {
    return Array.from(
        new Set(variants.map((variant) => optionValue(variant[field]))),
    );
}

function optionValue(value: string | null | undefined): string {
    return value?.trim() || 'Standard';
}

function primaryProductImage(
    product: Product,
    variant: ProductVariant | null = null,
): string | null {
    return (
        variant?.images[0]?.url ?? product.images[0]?.url ?? product.image_url
    );
}

async function reserveCartStock(
    productId: number,
    productVariantId: number | null,
    quantity: number,
): Promise<{ data: Product }> {
    const response = await fetch('/api/v1/cart/stock', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({
            product_id: productId,
            product_variant_id: productVariantId,
            quantity,
        }),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<{ data: Product }>;
}
