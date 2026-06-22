import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Boxes,
    PackageCheck,
    ReceiptText,
    ShoppingBag,
    Users,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import { dashboard } from '../routes';

type DashboardProps = {
    stats: {
        revenue: number;
        orders: number;
        products: number;
        customers: number;
        lowStock: number;
    };
    salesByStatus: Record<string, number>;
    recentOrders: Array<{
        id: number;
        order_number: string;
        customer: string;
        status: string;
        payment_status: string;
        total: number;
        ordered_at: string | null;
    }>;
    lowStockProducts: Array<{
        id: number;
        name: string;
        sku: string;
        category: string | null;
        stock_quantity: number;
        low_stock_threshold: number;
    }>;
    topProducts: Array<{
        id: number;
        name: string;
        sku: string;
        sold: number;
    }>;
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

export default function Dashboard({
    stats,
    salesByStatus,
    recentOrders,
    lowStockProducts,
    topProducts,
}: DashboardProps) {
    const kpis = [
        {
            label: 'Revenue',
            value: money.format(stats.revenue),
            icon: Banknote,
            accent: 'text-emerald-600',
        },
        {
            label: 'Orders',
            value: stats.orders.toString(),
            icon: ReceiptText,
            accent: 'text-blue-600',
        },
        {
            label: 'Products',
            value: stats.products.toString(),
            icon: Boxes,
            accent: 'text-violet-600',
        },
        {
            label: 'Customers',
            value: stats.customers.toString(),
            icon: Users,
            accent: 'text-rose-600',
        },
    ];

    return (
        <>
            <Head title="Boutique Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal text-foreground">
                            Boutique operations
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Inventory, orders, and customer activity at a glance.
                        </p>
                    </div>
                    <Badge
                        variant={stats.lowStock > 0 ? 'destructive' : 'secondary'}
                        className="h-8 rounded-md px-3"
                    >
                        <AlertTriangle className="size-4" />
                        {stats.lowStock} low stock
                    </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((item) => (
                        <Card key={item.label} className="rounded-lg py-5">
                            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>{item.label}</CardDescription>
                                <item.icon className={`size-5 ${item.accent}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold tracking-normal">
                                    {item.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle>Recent orders</CardTitle>
                            <CardDescription>
                                Latest sales coming through the boutique.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-160 text-sm">
                                    <thead className="border-b text-left text-xs text-muted-foreground">
                                        <tr>
                                            <th className="pb-3 font-medium">Order</th>
                                            <th className="pb-3 font-medium">Customer</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Payment</th>
                                            <th className="pb-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="py-3">
                                                    <div className="font-medium">
                                                        {order.order_number}
                                                    </div>
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
                                                        variant={
                                                            statusTone[order.payment_status] ??
                                                            'outline'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {order.payment_status}
                                                    </Badge>
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

                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle>Order status</CardTitle>
                            <CardDescription>
                                Current fulfillment mix.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(salesByStatus).map(([status, count]) => (
                                <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="capitalize">{status}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-primary"
                                            style={{
                                                width: `${Math.max(
                                                    12,
                                                    (count / Math.max(stats.orders, 1)) * 100,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="size-5 text-amber-600" />
                                Low-stock products
                            </CardTitle>
                            <CardDescription>
                                Restock these items before the next campaign.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{product.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {product.sku} · {product.category ?? 'Uncategorized'}
                                        </div>
                                    </div>
                                    <Badge variant="destructive" className="shrink-0">
                                        {product.stock_quantity}/{product.low_stock_threshold}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PackageCheck className="size-5 text-emerald-600" />
                                Top sellers
                            </CardTitle>
                            <CardDescription>
                                Products ranked by units sold.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topProducts.map((product, index) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {product.sku}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold">{product.sold} sold</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
