import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { csrfToken, money } from '@/const/data';
import { update as updateCartStock } from '@/actions/App/Http/Controllers/Api/CartStockController';
import type { User } from '@/types/types';
import {
    clearCartItems,
    getCartItems,
    removeCartItem,
    updateCartItemQuantity,
    type CustomerCartItem,
} from '@/lib/customer-cart';

type Props = {
    user: User;
    cartCount: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onCheckoutClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerCart({
    user,
    cartCount,
    onHomeClick,
    onShopClick,
    onCartClick,
    onCheckoutClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const [items, setItems] = useState<CustomerCartItem[]>([]);
    const [updatingStock, setUpdatingStock] = useState(false);
    const [stockError, setStockError] = useState('');

    useEffect(() => {
        document.title = 'Cart - Boutique';
        setItems(getCartItems());
    }, []);

    const subtotal = useMemo(
        () =>
            items.reduce(
                (total, item) => total + item.unit_price * item.quantity,
                0,
            ),
        [items],
    );
    const shipping = subtotal > 120 || subtotal === 0 ? 0 : 5;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;

    async function updateQuantity(item: CustomerCartItem, quantity: number) {
        const quantityChange = quantity - item.quantity;

        await synchronizeCartStock(
            [stockAdjustment(item, quantityChange)],
            () => {
                setItems(updateCartItemQuantity(item.id, quantity));
            },
        );
    }

    async function removeItem(item: CustomerCartItem) {
        await synchronizeCartStock(
            [stockAdjustment(item, -item.quantity)],
            () => {
                setItems(removeCartItem(item.id));
            },
        );
    }

    async function clearCart() {
        await synchronizeCartStock(
            items.map((item) => stockAdjustment(item, -item.quantity)),
            () => setItems(clearCartItems()),
        );
    }

    async function synchronizeCartStock(
        adjustments: CartStockAdjustment[],
        updateLocalCart: () => void,
    ) {
        setUpdatingStock(true);
        setStockError('');

        try {
            await adjustCartStock(adjustments);
            updateLocalCart();
        } catch {
            setStockError(
                'Cart stock could not be updated. Please refresh and try again.',
            );
        } finally {
            setUpdatingStock(false);
        }
    }

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="cart"
                cartCount={cartCount}
                onHomeClick={onHomeClick}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
            />

            <main className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-10 md:grid-cols-[minmax(0,1fr)_360px] md:px-10 md:py-14">
                <section>
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-label-caps font-label-caps text-customer-secondary uppercase">
                                Shopping Bag
                            </span>
                            <h1 className="mt-3 font-headline-md text-4xl text-customer-primary md:text-5xl">
                                Your Cart
                            </h1>
                        </div>
                        {items.length > 0 && (
                            <Button
                                variant="outline"
                                disabled={updatingStock}
                                onClick={clearCart}
                            >
                                <Trash2 className="size-4" />
                                Clear cart
                            </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="grid min-h-96 place-items-center border border-customer-outline-variant/20 text-center">
                            <div>
                                <ShoppingBag className="mx-auto mb-4 size-10 text-customer-secondary" />
                                <p className="font-headline-md text-2xl">
                                    Your cart is empty
                                </p>
                                <Button className="mt-5" onClick={onShopClick}>
                                    Shop products
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-customer-outline-variant/20 border-y border-customer-outline-variant/20">
                            {items.map((item) => (
                                <article
                                    key={item.id}
                                    className="grid gap-4 py-5 sm:grid-cols-[120px_1fr_auto]"
                                >
                                    <div className="aspect-4/5 overflow-hidden bg-customer-surface-container">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.product_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <ImagePlus className="size-7 text-customer-secondary" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-headline-md text-2xl">
                                            {item.product_name}
                                        </p>
                                        <p className="mt-1 text-sm text-customer-secondary">
                                            {item.variant_sku}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-customer-secondary">
                                            <span>
                                                {item.color ?? 'Standard color'}
                                            </span>
                                            <span>/</span>
                                            <span>
                                                {item.size ?? 'Standard size'}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex w-fit items-center border border-customer-outline-variant/30">
                                            <button
                                                type="button"
                                                className="grid size-10 place-items-center disabled:opacity-40"
                                                disabled={
                                                    updatingStock ||
                                                    item.quantity <= 1
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        item,
                                                        item.quantity - 1,
                                                    )
                                                }
                                            >
                                                <Minus className="size-4" />
                                            </button>
                                            <span className="w-12 text-center text-sm">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                className="grid size-10 place-items-center disabled:opacity-40"
                                                disabled={
                                                    updatingStock ||
                                                    item.quantity >=
                                                        item.stock_quantity
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        item,
                                                        item.quantity + 1,
                                                    )
                                                }
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
                                        <p className="text-lg">
                                            {money.format(
                                                item.unit_price * item.quantity,
                                            )}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={updatingStock}
                                            onClick={() => removeItem(item)}
                                        >
                                            <Trash2 className="size-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    {stockError && (
                        <p className="mt-4 text-sm text-destructive">
                            {stockError}
                        </p>
                    )}
                </section>

                <aside className="h-fit border border-customer-outline-variant/20 p-5">
                    <h2 className="font-headline-md text-2xl">Summary</h2>
                    <div className="mt-5 space-y-3 text-sm text-customer-secondary">
                        <SummaryLine
                            label="Subtotal"
                            value={money.format(subtotal)}
                        />
                        <SummaryLine
                            label="Shipping"
                            value={
                                shipping === 0 ? 'Free' : money.format(shipping)
                            }
                        />
                        <SummaryLine label="Tax" value={money.format(tax)} />
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-customer-outline-variant/20 pt-5 text-lg">
                        <span>Total</span>
                        <span>{money.format(total)}</span>
                    </div>
                    <Button
                        className="mt-6 h-12 w-full"
                        disabled={items.length === 0 || updatingStock}
                        onClick={onCheckoutClick}
                    >
                        Checkout
                    </Button>
                </aside>
            </main>
        </div>
    );
}

type CartStockAdjustment = {
    product_id: number;
    product_variant_id: number | null;
    quantity_change: number;
};

function stockAdjustment(
    item: CustomerCartItem,
    quantityChange: number,
): CartStockAdjustment {
    return {
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        quantity_change: quantityChange,
    };
}

async function adjustCartStock(items: CartStockAdjustment[]): Promise<void> {
    const route = updateCartStock();
    const response = await fetch(route.url, {
        method: route.method.toUpperCase(),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({ items }),
    });

    if (!response.ok) {
        throw new Error('Cart stock adjustment failed.');
    }
}

function SummaryLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
