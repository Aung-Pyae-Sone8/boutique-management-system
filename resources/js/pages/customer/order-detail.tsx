import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    CreditCard,
    MapPin,
    PackageCheck,
    Phone,
    ReceiptText,
} from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import FullPageMessage from '@/components/full-page-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getJson } from '@/const/json-tanfer';
import { money, statusTone } from '@/const/data';
import { show as appOrderShow } from '@/routes/app/orders';
import type { Order, User } from '@/types/types';

type Props = {
    orderId: number;
    user: User;
    cartCount: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerOrderDetail({
    orderId,
    user,
    cartCount,
    onHomeClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isCurrentRequest = true;

        setLoading(true);
        setError('');

        getJson<{ data: Order }>(appOrderShow.url(orderId))
            .then((payload) => {
                if (!isCurrentRequest) {
                    return;
                }

                setOrder(payload.data);
                document.title = `${payload.data.order_number} - Boutique`;
            })
            .catch(() => {
                if (isCurrentRequest) {
                    setError('This order could not be loaded.');
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
    }, [orderId]);

    if (loading) {
        return <FullPageMessage title="Loading order" />;
    }

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
                <Button variant="outline" onClick={onOrdersClick}>
                    <ArrowLeft className="size-4" />
                    Back to orders
                </Button>

                {error || !order ? (
                    <section className="mt-8 grid min-h-96 place-items-center border border-customer-outline-variant/20 text-center">
                        <div>
                            <ReceiptText className="mx-auto mb-4 size-10 text-customer-secondary" />
                            <p className="font-headline-md text-2xl">
                                Order unavailable
                            </p>
                            <p className="mt-2 text-sm text-customer-secondary">
                                {error || 'This order could not be loaded.'}
                            </p>
                        </div>
                    </section>
                ) : (
                    <>
                        <header className="mt-8 border-b border-customer-outline-variant/20 pb-8">
                            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <span className="text-label-caps font-label-caps text-customer-secondary uppercase">
                                        Order details
                                    </span>
                                    <h1 className="mt-3 font-headline-md text-4xl tracking-normal md:text-5xl">
                                        {order.order_number}
                                    </h1>
                                    <div className="mt-4 flex flex-wrap gap-3">
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
                                            {formatStatus(order.payment_status)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-sm text-customer-secondary">
                                        Total amount
                                    </p>
                                    <p className="mt-1 text-3xl">
                                        {money.format(order.total)}
                                    </p>
                                </div>
                            </div>
                        </header>

                        <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-6">
                                <InfoPanel title="Items">
                                    <div className="divide-y divide-customer-outline-variant/20">
                                        {(order.items ?? []).map((item) => (
                                            <div
                                                key={item.id}
                                                className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="mt-1 text-sm text-customer-secondary">
                                                        {item.sku}
                                                    </p>
                                                </div>
                                                <div className="flex gap-5 text-sm text-customer-secondary sm:text-right">
                                                    <span>
                                                        Qty {item.quantity}
                                                    </span>
                                                    <span>
                                                        {money.format(
                                                            item.unit_price,
                                                        )}{' '}
                                                        each
                                                    </span>
                                                    <span className="font-medium text-customer-primary">
                                                        {money.format(
                                                            item.line_total,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </InfoPanel>

                                <InfoPanel title="Shipping">
                                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                                        <DetailRow
                                            icon={PackageCheck}
                                            label="Name"
                                            value={order.shipping_name}
                                        />
                                        <DetailRow
                                            icon={Phone}
                                            label="Phone"
                                            value={order.shipping_phone}
                                        />
                                        <DetailRow
                                            icon={MapPin}
                                            label="Address"
                                            value={[
                                                order.shipping_address,
                                                order.shipping_city,
                                                order.shipping_country,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        />
                                        <DetailRow
                                            icon={CalendarDays}
                                            label="Ordered at"
                                            value={formatDate(order.ordered_at)}
                                        />
                                    </div>
                                </InfoPanel>
                            </div>

                            <aside className="space-y-6">
                                <InfoPanel title="Payment">
                                    <div className="space-y-4 text-sm">
                                        <DetailRow
                                            icon={CreditCard}
                                            label="Method"
                                            value={formatStatus(
                                                order.payment_method ??
                                                    order.payment?.method ??
                                                    'pending',
                                            )}
                                        />
                                        <DetailRow
                                            icon={ReceiptText}
                                            label="Transaction ID"
                                            value={
                                                order.payment?.transaction_id
                                            }
                                        />
                                        <DetailRow
                                            icon={PackageCheck}
                                            label="Payment status"
                                            value={formatStatus(
                                                order.payment?.status ??
                                                    order.payment_status,
                                            )}
                                        />
                                    </div>
                                </InfoPanel>

                                <InfoPanel title="Summary">
                                    <SummaryLine
                                        label="Subtotal"
                                        value={money.format(
                                            order.subtotal ?? 0,
                                        )}
                                    />
                                    <SummaryLine
                                        label="Discount"
                                        value={money.format(
                                            order.discount ?? 0,
                                        )}
                                    />
                                    <SummaryLine
                                        label="Tax"
                                        value={money.format(order.tax ?? 0)}
                                    />
                                    <SummaryLine
                                        label="Shipping"
                                        value={money.format(
                                            order.shipping_fee ?? 0,
                                        )}
                                    />
                                    <div className="mt-4 border-t border-customer-outline-variant/20 pt-4">
                                        <SummaryLine
                                            label="Total"
                                            value={money.format(order.total)}
                                            strong
                                        />
                                    </div>
                                </InfoPanel>
                            </aside>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

function InfoPanel({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border border-customer-outline-variant/20 bg-customer-surface-container-lowest p-5 shadow-sm">
            <h2 className="font-headline-md text-2xl">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof PackageCheck;
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-customer-secondary" />
            <div>
                <p className="text-label-caps font-label-caps text-xs text-customer-secondary uppercase">
                    {label}
                </p>
                <p className="mt-1 break-words">{value || 'Not provided'}</p>
            </div>
        </div>
    );
}

function SummaryLine({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-between gap-4 py-2 text-sm ${
                strong ? 'font-semibold text-customer-primary' : ''
            }`}
        >
            <span className="text-customer-secondary">{label}</span>
            <span>{value}</span>
        </div>
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
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatStatus(status: string): string {
    return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
