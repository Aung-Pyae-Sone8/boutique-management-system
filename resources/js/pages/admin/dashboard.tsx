import useApi from "../../hooks/use-api";
import type { DashboardData } from "../../types/types";
import { money, statusTone } from "../../const/data";
import {
    AlertTriangle,
    Banknote,
    Boxes,
    Edit,
    LayoutGrid,
    LogOut,
    PackageCheck,
    Plus,
    ReceiptText,
    Search,
    Tags,
    Trash2,
    Users,
} from 'lucide-react';
import Page from "../../components/ui/page";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import FullPageMessage from "../../components/full-page-message";
import OrdersTable from '../../components/orders-table'

const DashboardScreen = () => {
    const { data, loading } = useApi<DashboardData>('/api/v1/dashboard');

    if (loading || !data) return <FullPageMessage title="Loading dashboard" />;

    const kpis = [
        { label: 'Revenue', value: money.format(data.stats.revenue), icon: Banknote, accent: 'text-emerald-600' },
        { label: 'Orders', value: data.stats.orders.toString(), icon: ReceiptText, accent: 'text-blue-600' },
        { label: 'Products', value: data.stats.products.toString(), icon: Boxes, accent: 'text-violet-600' },
        { label: 'Customers', value: data.stats.customers.toString(), icon: Users, accent: 'text-rose-600' },
    ];

    return (
        <Page title="Boutique operations" description="Inventory, orders, and customer activity at a glance.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <Card key={item.label} className="rounded-lg py-5">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                            <CardDescription>{item.label}</CardDescription>
                            <item.icon className={`size-5 ${item.accent}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{item.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle>Recent orders</CardTitle>
                        <CardDescription>Latest sales coming through the boutique.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OrdersTable orders={data.recentOrders} compact />
                    </CardContent>
                </Card>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle>Order status</CardTitle>
                        <CardDescription>Current fulfillment mix.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(data.salesByStatus).map(([status, count]) => (
                            <div key={status} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="capitalize">{status}</span>
                                    <span className="font-medium">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{
                                            width: `${Math.max(12, (count / Math.max(data.stats.orders, 1)) * 100)}%`,
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
                            <AlertTriangle className="size-5 text-amber-600" />
                            Low-stock products
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.lowStockProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {product.sku} · {product.category ?? 'Uncategorized'}
                                    </div>
                                </div>
                                <Badge variant="destructive">
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
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.topProducts.map((product, index) => (
                            <div key={product.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-md bg-muted text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold">{product.sold} sold</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </Page>
    );
}

export default DashboardScreen;