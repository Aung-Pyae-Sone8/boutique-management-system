import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { csrfToken, money } from '@/const/data';
import { profile as appProfile } from '@/routes/app';
import { store as storeCheckout } from '@/actions/App/Http/Controllers/CustomerCheckoutController';
import { update as updateCartStock } from '@/actions/App/Http/Controllers/Api/CartStockController';
import useApi from '@/hooks/use-api';
import {
    clearCartItems,
    getCartItems,
    type CustomerCartItem,
} from '@/lib/customer-cart';
import type { Customer, Order, PaymentMethod, User } from '@/types/types';

type Props = {
    user: User;
    cartCount: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

type ProfilePayload = {
    user: User;
    customer: Customer | null;
    payment_methods: PaymentMethod[];
};

export default function CustomerCheckout({
    user,
    cartCount,
    onHomeClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const { data } = useApi<ProfilePayload>(appProfile.url());
    const [items] = useState<CustomerCartItem[]>(getCartItems);
    const [form, setForm] = useState({
        firstName: user.first_name ?? '',
        lastName: user.last_name ?? '',
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        city: '',
        country: '',
        paymentMethod: '',
        transactionId: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState('');
    const [transactionError, setTransactionError] = useState('');
    const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
    const [qrUnavailable, setQrUnavailable] = useState(false);

    useEffect(() => {
        document.title = 'Checkout - Boutique';
    }, []);

    useEffect(() => {
        if (!data) {
            return;
        }

        setForm((current) => ({
            ...current,
            firstName:
                data.customer?.first_name ??
                data.user.first_name ??
                current.firstName,
            lastName:
                data.customer?.last_name ??
                data.user.last_name ??
                current.lastName,
            email: data.customer?.email ?? data.user.email,
            phone: data.customer?.phone ?? data.user.phone ?? current.phone,
            address:
                data.customer?.address ?? data.user.address ?? current.address,
            city: data.customer?.city ?? current.city,
            country: data.customer?.country ?? current.country,
        }));
    }, [data]);

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
    const paymentMethods = useMemo(
        () => data?.payment_methods ?? [],
        [data?.payment_methods],
    );
    const selectedPaymentMethod =
        paymentMethods.find((method) => method.key === form.paymentMethod) ??
        paymentMethods[0] ??
        null;

    useEffect(() => {
        if (paymentMethods.length === 0) {
            return;
        }

        if (
            paymentMethods.some((method) => method.key === form.paymentMethod)
        ) {
            return;
        }

        setForm((current) => ({
            ...current,
            paymentMethod: paymentMethods[0].key,
        }));
    }, [form.paymentMethod, paymentMethods]);

    useEffect(() => {
        setQrUnavailable(false);
        setTransactionError('');
    }, [form.paymentMethod]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError('');
        setTransactionError('');

        if (items.length === 0) {
            setError('Your cart is empty.');
            return;
        }

        if (!selectedPaymentMethod) {
            setError('No payment method is available right now.');
            return;
        }

        if (!form.transactionId.trim()) {
            setTransactionError(
                `Transaction ID is required for ${selectedPaymentMethod.label}.`,
            );
            return;
        }

        setSubmitting(true);

        try {
            const route = storeCheckout();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    first_name: form.firstName,
                    last_name: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    country: form.country,
                    payment_method: form.paymentMethod,
                    transaction_id: form.transactionId.trim(),
                    notes: form.notes || null,
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        product_variant_id: item.product_variant_id,
                        quantity: item.quantity,
                    })),
                }),
            });
            const payload = (await response.json()) as {
                data?: Order;
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok || !payload.data) {
                setTransactionError(payload.errors?.transaction_id?.[0] ?? '');
                setError(
                    payload.errors?.transaction_id?.[0]
                        ? ''
                        : (Object.values(payload.errors ?? {})[0]?.[0] ??
                              payload.message ??
                              'Order could not be created.'),
                );
                return;
            }

            clearCartItems();
            setCompletedOrder(payload.data);
        } catch {
            setError('Order could not be created. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    async function cancelOrder() {
        if (items.length === 0) {
            onShopClick();
            return;
        }

        setCancelling(true);
        setError('');

        try {
            const route = updateCartStock();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        product_variant_id: item.product_variant_id,
                        quantity_change: -item.quantity,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Stock could not be restored.');
            }

            clearCartItems();
            onShopClick();
        } catch {
            setError('Checkout could not be cancelled. Please try again.');
        } finally {
            setCancelling(false);
        }
    }

    if (completedOrder) {
        return (
            <div className="min-h-screen bg-customer-surface text-customer-primary">
                <CustomerNavbar
                    user={user}
                    active="cart"
                    cartCount={0}
                    onHomeClick={onHomeClick}
                    onShopClick={onShopClick}
                    onCartClick={onCartClick}
                    onOrdersClick={onOrdersClick}
                    onMessagesClick={onMessagesClick}
                    onLogout={onLogout}
                />
                <main className="mx-auto max-w-2xl px-5 py-20 text-center">
                    <p className="text-label-caps font-label-caps text-customer-secondary uppercase">
                        Order received
                    </p>
                    <h1 className="mt-4 font-headline-md text-5xl">
                        Thank you
                    </h1>
                    <p className="mt-5 text-customer-secondary">
                        Order {completedOrder.order_number} is pending
                        confirmation.
                    </p>
                    <Button className="mt-8" onClick={onShopClick}>
                        Continue shopping
                    </Button>
                </main>
            </div>
        );
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

            <main className="mx-auto max-w-screen-2xl px-5 py-10 md:px-10 md:py-14">
                <button
                    type="button"
                    onClick={onCartClick}
                    className="text-label-caps flex items-center gap-2 font-label-caps text-customer-secondary transition-colors hover:text-customer-primary"
                >
                    <ArrowLeft className="size-4" />
                    Back to cart
                </button>

                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <section>
                        <p className="text-label-caps font-label-caps text-customer-secondary uppercase">
                            Checkout
                        </p>
                        <h1 className="mt-3 font-headline-md text-4xl tracking-normal md:text-5xl">
                            Order details
                        </h1>

                        <form
                            className="mt-10 space-y-8"
                            noValidate
                            onSubmit={submit}
                        >
                            <fieldset>
                                <legend className="font-headline-md text-2xl">
                                    Contact
                                </legend>
                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    <CheckoutField
                                        label="First name"
                                        value={form.firstName}
                                        icon={undefined}
                                        onChange={(value) =>
                                            setForm({
                                                ...form,
                                                firstName: value,
                                            })
                                        }
                                    />
                                    <CheckoutField
                                        label="Last name"
                                        value={form.lastName}
                                        icon={undefined}
                                        onChange={(value) =>
                                            setForm({
                                                ...form,
                                                lastName: value,
                                            })
                                        }
                                    />
                                    <CheckoutField
                                        label="Email"
                                        type="email"
                                        value={form.email}
                                        icon={Mail}
                                        onChange={(value) =>
                                            setForm({ ...form, email: value })
                                        }
                                    />
                                    <CheckoutField
                                        label="Phone"
                                        type="tel"
                                        value={form.phone}
                                        icon={Phone}
                                        onChange={(value) =>
                                            setForm({ ...form, phone: value })
                                        }
                                    />
                                </div>
                            </fieldset>

                            <fieldset className="border-t border-customer-outline-variant/20 pt-8">
                                <legend className="font-headline-md text-2xl">
                                    Shipping address
                                </legend>
                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <label
                                            className="text-sm font-medium"
                                            htmlFor="checkout-address"
                                        >
                                            Address
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute top-3 left-3 size-4 text-customer-secondary" />
                                            <Input
                                                id="checkout-address"
                                                className="pl-10"
                                                value={form.address}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        address:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <CheckoutField
                                        label="City"
                                        value={form.city}
                                        icon={undefined}
                                        onChange={(value) =>
                                            setForm({ ...form, city: value })
                                        }
                                    />
                                    <CheckoutField
                                        label="Country"
                                        value={form.country}
                                        icon={undefined}
                                        onChange={(value) =>
                                            setForm({ ...form, country: value })
                                        }
                                    />
                                </div>
                            </fieldset>

                            <fieldset className="border-t border-customer-outline-variant/20 pt-8">
                                <legend className="font-headline-md text-2xl">
                                    Payment
                                </legend>
                                {paymentMethods.length > 0 ? (
                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        {paymentMethods.map((method) => {
                                            const isSelected =
                                                method.key ===
                                                form.paymentMethod;

                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    className={`border p-4 text-left text-sm transition-colors ${
                                                        isSelected
                                                            ? 'border-customer-primary bg-customer-surface-container-low'
                                                            : 'border-customer-outline-variant/30 bg-customer-surface-container-lowest hover:border-customer-primary/50'
                                                    }`}
                                                    aria-pressed={isSelected}
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            paymentMethod:
                                                                method.key,
                                                        })
                                                    }
                                                >
                                                    <span className="font-medium">
                                                        {method.label}
                                                    </span>
                                                    <span className="mt-2 block text-xs text-customer-secondary">
                                                        {method.account_username ??
                                                            'Account name not set'}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-customer-secondary">
                                                        {method.account_phone ??
                                                            'Phone not set'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-5 border border-customer-outline-variant/20 p-4 text-sm text-customer-secondary">
                                        No payment method is available right
                                        now.
                                    </p>
                                )}
                                {selectedPaymentMethod && (
                                    <div className="mt-5 grid gap-5 border border-customer-outline-variant/20 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                                        <div className="grid aspect-square place-items-center overflow-hidden border border-customer-outline-variant/30 bg-white p-2">
                                            {!qrUnavailable &&
                                            selectedPaymentMethod.qr_url ? (
                                                <img
                                                    src={
                                                        selectedPaymentMethod.qr_url
                                                    }
                                                    alt={`${selectedPaymentMethod.label} QR code`}
                                                    className="size-full object-contain"
                                                    onError={() =>
                                                        setQrUnavailable(true)
                                                    }
                                                />
                                            ) : (
                                                <span className="px-3 text-center text-xs text-customer-secondary">
                                                    Merchant QR is not
                                                    configured
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="mb-4 space-y-2 border-b border-customer-outline-variant/20 pb-4 text-sm">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-customer-secondary">
                                                        Account name
                                                    </span>
                                                    <span className="text-right font-medium">
                                                        {selectedPaymentMethod.account_username ??
                                                            'Not configured'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-customer-secondary">
                                                        Phone number
                                                    </span>
                                                    <span className="text-right font-medium">
                                                        {selectedPaymentMethod.account_phone ??
                                                            'Not configured'}
                                                    </span>
                                                </div>
                                            </div>
                                            <label
                                                className="text-sm font-medium"
                                                htmlFor="checkout-transaction-id"
                                            >
                                                Transaction ID
                                            </label>
                                            <Input
                                                id="checkout-transaction-id"
                                                value={form.transactionId}
                                                aria-invalid={Boolean(
                                                    transactionError,
                                                )}
                                                className={
                                                    transactionError
                                                        ? 'border-destructive focus-visible:border-destructive'
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    setForm({
                                                        ...form,
                                                        transactionId:
                                                            event.target.value,
                                                    });
                                                    setTransactionError('');
                                                }}
                                            />
                                            {transactionError && (
                                                <p className="text-xs text-destructive">
                                                    {transactionError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </fieldset>

                            <div className="flex flex-wrap gap-3 border-t border-customer-outline-variant/20 pt-8">
                                {/* <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCartClick}
                                >
                                    Back
                                </Button> */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={cancelling || submitting}
                                    onClick={cancelOrder}
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel'}
                                </Button>
                                <Button
                                    disabled={
                                        submitting ||
                                        cancelling ||
                                        items.length === 0 ||
                                        !selectedPaymentMethod
                                    }
                                >
                                    {submitting ? 'Ordering...' : 'Order'}
                                </Button>
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                        </form>
                    </section>

                    <aside className="h-fit border border-customer-outline-variant/20 p-5 lg:sticky lg:top-28">
                        <h2 className="font-headline-md text-2xl">
                            Order summary
                        </h2>
                        <div className="mt-5 divide-y divide-customer-outline-variant/20">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between gap-4 py-4 text-sm"
                                >
                                    <div>
                                        <p>{item.product_name}</p>
                                        <p className="mt-1 text-xs text-customer-secondary">
                                            {item.quantity} ×{' '}
                                            {money.format(item.unit_price)}
                                        </p>
                                    </div>
                                    <p>
                                        {money.format(
                                            item.quantity * item.unit_price,
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 border-t border-customer-outline-variant/20 pt-5 text-sm text-customer-secondary">
                            <SummaryLine
                                label="Subtotal"
                                value={money.format(subtotal)}
                            />
                            <SummaryLine
                                label="Shipping"
                                value={
                                    shipping === 0
                                        ? 'Free'
                                        : money.format(shipping)
                                }
                            />
                            <SummaryLine
                                label="Tax"
                                value={money.format(tax)}
                            />
                        </div>
                        <div className="mt-5 flex justify-between border-t border-customer-outline-variant/20 pt-5 text-lg">
                            <span>Total</span>
                            <span>{money.format(total)}</span>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function CheckoutField({
    label,
    type = 'text',
    value,
    icon: Icon,
    onChange,
}: {
    label: string;
    type?: string;
    value: string;
    icon?: typeof Mail;
    onChange: (value: string) => void;
}) {
    const id = `checkout-${label.toLowerCase().replaceAll(' ', '-')}`;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={id}>
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon className="absolute top-3 left-3 size-4 text-customer-secondary" />
                )}
                <Input
                    id={id}
                    type={type}
                    className={Icon ? 'pl-10' : undefined}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
