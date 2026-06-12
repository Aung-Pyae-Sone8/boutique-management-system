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

type Order = {
    id: number;
    order_number: string;
    customer: string;
    status: string;
    payment_status: string;
    items_count: number;
    subtotal: number;
    total: number;
    ordered_at: string | null;
};

type Props = {
    orders: Order[];
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

export default function Orders({ orders }: Props) {
    return (
        <>
            <Head title="Orders" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">Orders</h1>
                        <p className="text-sm text-muted-foreground">
                            Review sales, fulfillment state, and payment status.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/api/v1/orders">
                            <Plus className="size-4" />
                            API endpoint
                        </Link>
                    </Button>
                </div>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle>Order queue</CardTitle>
                        <CardDescription>{orders.length} total orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[880px] text-sm">
                                <thead className="border-b text-left text-xs text-muted-foreground">
                                    <tr>
                                        <th className="pb-3 font-medium">Order</th>
                                        <th className="pb-3 font-medium">Customer</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Payment</th>
                                        <th className="pb-3 text-right font-medium">Items</th>
                                        <th className="pb-3 text-right font-medium">Subtotal</th>
                                        <th className="pb-3 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="py-3">
                                                <div className="font-medium">{order.order_number}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {order.ordered_at}
                                                </div>
                                            </td>
                                            <td className="py-3">{order.customer}</td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={statusTone[order.status] ?? 'outline'}
                                                    className="capitalize"
                                                >
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={statusTone[order.payment_status] ?? 'outline'}
                                                    className="capitalize"
                                                >
                                                    {order.payment_status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">{order.items_count}</td>
                                            <td className="py-3 text-right">
                                                {money.format(order.subtotal)}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {money.format(order.total)}
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

Orders.layout = {
    breadcrumbs: [
        {
            title: 'Orders',
            href: '/admin/orders',
        },
    ],
};
