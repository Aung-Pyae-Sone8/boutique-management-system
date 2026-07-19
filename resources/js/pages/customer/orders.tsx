import { useEffect } from 'react';
import {
    CalendarDays,
    PackageCheck,
    ReceiptText,
    ShoppingBag,
} from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import FullPageMessage from '@/components/full-page-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { money, statusTone } from '@/const/data';
import useApi from '@/hooks/use-api';
import { orders as appOrders } from '@/routes/app';
import type { Order, Paginated, User } from '@/types/types';

type Props = {
    user: User;
    cartCount: number;
    onOrderClick: (orderId: number) => void;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerOrders({
    user,
    cartCount,
    onOrderClick,
    onHomeClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const { data, loading } = useApi<Paginated<Order>>(appOrders.url());

    useEffect(() => {
        document.title = 'Order History - Boutique';
    }, []);

    if (loading) {
        return <FullPageMessage title="Loading orders" />;
    }

    const orders = data?.data ?? [];

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="orders"
                cartCount={cartCount}
                onHomeClick={onHomeClick}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
            />

            <main className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
                <header className="mb-8 flex flex-col gap-4 border-b border-customer-outline-variant/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="text-label-caps font-label-caps text-customer-secondary uppercase">
                            Account
                        </span>
                        <h1 className="mt-3 font-headline-md text-4xl tracking-normal md:text-5xl">
                            Order History
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-customer-secondary">
                            Track your previous boutique orders and payment
                            progress.
                        </p>
                    </div>
                    <Button onClick={onShopClick}>
                        <ShoppingBag className="size-4" />
                        Shop again
                    </Button>
                </header>

                {orders.length === 0 ? (
                    <section className="grid min-h-96 place-items-center border border-customer-outline-variant/20 text-center">
                        <div>
                            <ReceiptText className="mx-auto mb-4 size-10 text-customer-secondary" />
                            <p className="font-headline-md text-2xl">
                                No orders yet
                            </p>
                            <p className="mt-2 text-sm text-customer-secondary">
                                Your completed checkouts will appear here.
                            </p>
                            <Button className="mt-5" onClick={onShopClick}>
                                Start shopping
                            </Button>
                        </div>
                    </section>
                ) : (
                    <section className="space-y-5">
                        {orders.map((order) => (
                            <article
                                key={order.id}
                                className="border border-customer-outline-variant/20 bg-customer-surface-container-lowest p-5 shadow-sm"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="font-headline-md text-2xl">
                                                {order.order_number}
                                            </h2>
                                            <Badge
                                                variant={
                                                    statusTone[order.status] ??
                                                    'outline'
                                                }
                                            >
                                                {formatStatus(order.status)}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    statusTone[
                                                        order.payment_status
                                                    ] ?? 'outline'
                                                }
                                            >
                                                Payment{' '}
                                                {formatStatus(
                                                    order.payment_status,
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-customer-secondary">
                                            <span className="flex items-center gap-2">
                                                <CalendarDays className="size-4" />
                                                {formatDate(order.ordered_at)}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <PackageCheck className="size-4" />
                                                {itemCount(order)} item
                                                {itemCount(order) === 1
                                                    ? ''
                                                    : 's'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-2xl">
                                        {money.format(order.total)}
                                    </p>
                                </div>

                                <div className="mt-5 divide-y divide-customer-outline-variant/20 border-t border-customer-outline-variant/20">
                                    {(order.items ?? []).map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-customer-secondary">
                                                    {item.sku}
                                                </p>
                                            </div>
                                            <div className="flex gap-4 text-customer-secondary sm:text-right">
                                                <span>Qty {item.quantity}</span>
                                                <span>
                                                    {money.format(
                                                        item.line_total,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOrderClick(order.id)}
                                    >
                                        View details
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}

function itemCount(order: Order): number {
    return (order.items ?? []).reduce(
        (total, item) => total + item.quantity,
        0,
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Date pending';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatStatus(status: string): string {
    return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
