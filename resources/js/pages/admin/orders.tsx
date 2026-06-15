import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Paginated<T> = {
    data: T[];
};

type Customer = {
    id: number;
    name: string;
    email: string | null;
};

type Product = {
    id: number;
    sku: string;
    name: string;
    price: number;
    stock_quantity: number;
};

type OrderItem = {
    id: number;
    product_id: number | null;
    product_name: string;
    sku: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
};

type Order = {
    id: number;
    order_number: string;
    customer: Customer | null;
    status: string;
    payment_status: string;
    subtotal: number;
    discount: number;
    tax: number;
    shipping_fee: number;
    total: number;
    ordered_at: string | null;
    items: OrderItem[];
};

type OrderLineForm = {
    product_id: string;
    quantity: string;
};

type OrderFormData = {
    customer_id: string;
    status: string;
    payment_status: string;
    discount: string;
    tax: string;
    shipping_fee: string;
    notes: string;
    items: OrderLineForm[];
};

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const statusTone: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    completed: 'default',
    processing: 'secondary',
    pending: 'outline',
    cancelled: 'destructive',
    paid: 'default',
    unpaid: 'outline',
    refunded: 'secondary',
};

const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'];
const paymentStatuses = ['unpaid', 'paid', 'refunded'];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        document.title = 'Orders - Boutique Admin';

        Promise.all([
            getJson<Paginated<Order>>('/api/v1/orders'),
            getJson<Paginated<Customer>>('/api/v1/customers'),
            getJson<Paginated<Product>>('/api/v1/products'),
        ])
            .then(([orderPayload, customerPayload, productPayload]) => {
                setOrders(orderPayload.data);
                setCustomers(customerPayload.data);
                setProducts(productPayload.data);
            })
            .finally(() => setLoading(false));
    }, []);

    async function updateOrder(order: Order, field: 'status' | 'payment_status', value: string) {
        const response = await sendJson<{ data: Order }>(`/api/v1/orders/${order.id}`, 'PUT', {
            [field]: value,
        });

        setOrders((current) => current.map((item) => (item.id === order.id ? response.data : item)));
    }

    async function deleteOrder(order: Order) {
        if (!window.confirm(`Delete ${order.order_number}? This removes the order record.`)) {
            return;
        }

        await sendJson<void>(`/api/v1/orders/${order.id}`, 'DELETE');
        setOrders((current) => current.filter((item) => item.id !== order.id));
    }

    if (loading) {
        return (
            <div className="grid min-h-[60vh] place-items-center p-6 text-sm text-muted-foreground">
                Loading orders
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Create sales, track fulfillment, and update payment status.
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="size-4" />
                    New order
                </Button>
            </div>

            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle>Order process</CardTitle>
                    <CardDescription>Pending → Processing → Completed, with payment tracked separately.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-245 text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="pb-3 font-medium">Order</th>
                                    <th className="pb-3 font-medium">Customer</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Payment</th>
                                    <th className="pb-3 text-right font-medium">Items</th>
                                    <th className="pb-3 text-right font-medium">Subtotal</th>
                                    <th className="pb-3 text-right font-medium">Total</th>
                                    <th className="pb-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-6 text-center text-muted-foreground">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="py-3">
                                                <div className="font-medium">{order.order_number}</div>
                                                <div className="text-xs text-muted-foreground">{order.ordered_at}</div>
                                            </td>
                                            <td className="py-3">{order.customer?.name ?? 'Walk-in customer'}</td>
                                            <td className="py-3">
                                                <StatusSelect
                                                    value={order.status}
                                                    options={orderStatuses}
                                                    onChange={(value) => updateOrder(order, 'status', value)}
                                                />
                                            </td>
                                            <td className="py-3">
                                                <StatusSelect
                                                    value={order.payment_status}
                                                    options={paymentStatuses}
                                                    onChange={(value) => updateOrder(order, 'payment_status', value)}
                                                />
                                            </td>
                                            <td className="py-3 text-right">{itemCount(order)}</td>
                                            <td className="py-3 text-right">{money.format(order.subtotal)}</td>
                                            <td className="py-3 text-right font-medium">{money.format(order.total)}</td>
                                            <td className="py-3">
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => deleteOrder(order)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <OrderDialog
                open={dialogOpen}
                customers={customers}
                products={products}
                onOpenChange={setDialogOpen}
                onSaved={(order) => {
                    setOrders((current) => [order, ...current]);
                    setDialogOpen(false);
                }}
            />
        </div>
    );
}

function StatusSelect({
    value,
    options,
    onChange,
}: {
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <Badge variant={statusTone[value] ?? 'outline'} className="capitalize">
                {value}
            </Badge>
            <select
                className="h-8 rounded-md border bg-background px-2 text-xs capitalize outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function OrderDialog({
    open,
    customers,
    products,
    onOpenChange,
    onSaved,
}: {
    open: boolean;
    customers: Customer[];
    products: Product[];
    onOpenChange: (open: boolean) => void;
    onSaved: (order: Order) => void;
}) {
    const [form, setForm] = useState<OrderFormData>(emptyOrderForm());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        setForm(emptyOrderForm(products[0]?.id));
        setError('');
    }, [open, products]);

    const subtotal = useMemo(
        () =>
            form.items.reduce((sum, item) => {
                const product = products.find((candidate) => String(candidate.id) === item.product_id);
                return sum + (product?.price ?? 0) * Number(item.quantity || 0);
            }, 0),
        [form.items, products],
    );
    const total = subtotal - Number(form.discount || 0) + Number(form.tax || 0) + Number(form.shipping_fee || 0);

    function updateLine(index: number, line: Partial<OrderLineForm>) {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...line } : item)),
        }));
    }

    function removeLine(index: number) {
        setForm((current) => ({
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await sendJson<{ data: Order }>('/api/v1/orders', 'POST', {
                customer_id: form.customer_id ? Number(form.customer_id) : null,
                status: form.status,
                payment_status: form.payment_status,
                discount: Number(form.discount || 0),
                tax: Number(form.tax || 0),
                shipping_fee: Number(form.shipping_fee || 0),
                notes: form.notes || null,
                items: form.items.map((item) => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity || 1),
                })),
            });

            onSaved(response.data);
        } catch {
            setError('Could not create this order. Check product stock and required fields.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Create order</DialogTitle>
                    <DialogDescription>Select products, quantities, customer, and payment details.</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Customer" htmlFor="order-customer">
                            <select
                                id="order-customer"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
                                value={form.customer_id}
                                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
                            >
                                <option value="">Walk-in customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Status" htmlFor="order-status">
                            <select
                                id="order-status"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
                                value={form.status}
                                onChange={(event) => setForm({ ...form, status: event.target.value })}
                            >
                                {orderStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Payment" htmlFor="order-payment">
                            <select
                                id="order-payment"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
                                value={form.payment_status}
                                onChange={(event) => setForm({ ...form, payment_status: event.target.value })}
                            >
                                {paymentStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">Items</div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        items: [...form.items, { product_id: products[0] ? String(products[0].id) : '', quantity: '1' }],
                                    })
                                }
                            >
                                <Plus className="size-4" />
                                Add item
                            </Button>
                        </div>
                        {form.items.map((item, index) => {
                            const product = products.find((candidate) => String(candidate.id) === item.product_id);

                            return (
                                <div key={index} className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto]">
                                    <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm outline-none"
                                        value={item.product_id}
                                        onChange={(event) => updateLine(index, { product_id: event.target.value })}
                                        required
                                    >
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.stock_quantity} stock)
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(event) => updateLine(index, { quantity: event.target.value })}
                                        required
                                    />
                                    <div className="flex items-center justify-end text-sm font-medium">
                                        {money.format((product?.price ?? 0) * Number(item.quantity || 0))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => removeLine(index)}>
                                        Remove
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Discount" htmlFor="order-discount">
                            <Input
                                id="order-discount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.discount}
                                onChange={(event) => setForm({ ...form, discount: event.target.value })}
                            />
                        </Field>
                        <Field label="Tax" htmlFor="order-tax">
                            <Input
                                id="order-tax"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.tax}
                                onChange={(event) => setForm({ ...form, tax: event.target.value })}
                            />
                        </Field>
                        <Field label="Shipping" htmlFor="order-shipping">
                            <Input
                                id="order-shipping"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.shipping_fee}
                                onChange={(event) => setForm({ ...form, shipping_fee: event.target.value })}
                            />
                        </Field>
                    </div>

                    <Field label="Notes" htmlFor="order-notes">
                        <textarea
                            id="order-notes"
                            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                            value={form.notes}
                            onChange={(event) => setForm({ ...form, notes: event.target.value })}
                        />
                    </Field>

                    <div className="rounded-lg bg-muted p-3 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{money.format(subtotal)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{money.format(total)}</span>
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button disabled={submitting || form.items.length === 0}>
                            {submitting ? 'Creating...' : 'Create order'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
        </div>
    );
}

function emptyOrderForm(productId?: number): OrderFormData {
    return {
        customer_id: '',
        status: 'pending',
        payment_status: 'unpaid',
        discount: '0',
        tax: '0',
        shipping_fee: '0',
        notes: '',
        items: productId ? [{ product_id: String(productId), quantity: '1' }] : [],
    };
}

function itemCount(order: Order) {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

async function sendJson<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}
