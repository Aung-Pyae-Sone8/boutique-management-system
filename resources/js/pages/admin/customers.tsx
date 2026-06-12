import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Customer = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    orders_count: number;
};

type Props = {
    customers: Customer[];
};

export default function Customers({ customers }: Props) {
    return (
        <>
            <Head title="Customers" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">Customers</h1>
                        <p className="text-sm text-muted-foreground">
                            Track customer contact details and order activity.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/api/v1/customers">
                            <Plus className="size-4" />
                            API endpoint
                        </Link>
                    </Button>
                </div>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle>Customer directory</CardTitle>
                        <CardDescription>{customers.length} customer profiles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="border-b text-left text-xs text-muted-foreground">
                                    <tr>
                                        <th className="pb-3 font-medium">Name</th>
                                        <th className="pb-3 font-medium">Contact</th>
                                        <th className="pb-3 font-medium">Location</th>
                                        <th className="pb-3 text-right font-medium">Orders</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="py-3 font-medium">{customer.name}</td>
                                            <td className="py-3">
                                                <div>{customer.email ?? 'No email'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {customer.phone ?? 'No phone'}
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {[customer.city, customer.country].filter(Boolean).join(', ') ||
                                                    'Not provided'}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {customer.orders_count}
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

Customers.layout = {
    breadcrumbs: [
        {
            title: 'Customers',
            href: '/admin/customers',
        },
    ],
};
