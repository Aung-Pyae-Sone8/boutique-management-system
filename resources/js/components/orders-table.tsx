import type { Order } from "../types/types"
import { money, statusTone } from "../const/data";
import { Badge } from './ui/badge';

const customerName = (customer: Order['customer']) => {
    if (!customer) return 'Walk-in customer';
    if (typeof customer === 'string') return customer;

    return customer.name;
}

const OrdersTable = ({ orders, compact = false }: { orders: Order[]; compact?: boolean }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="pb-3 font-medium">Order</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Payment</th>
                        {!compact && <th className="pb-3 text-right font-medium">Items</th>}
                        <th className="pb-3 text-right font-medium">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td className="py-3">
                                <div className="font-medium">{order.order_number}</div>
                                <div className="text-xs text-muted-foreground">{order.ordered_at}</div>
                            </td>
                            <td className="py-3">{customerName(order.customer)}</td>
                            <td className="py-3">
                                <Badge variant={statusTone[order.status] ?? 'outline'} className="capitalize">
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
                            {!compact && (
                                <td className="py-3 text-right">
                                    {order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
                                </td>
                            )}
                            <td className="py-3 text-right font-medium">{money.format(order.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default OrdersTable;