import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '../../components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';

type Customer = {
    id: number;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string | null;
    phone: string | null;
    address?: string | null;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    city: string | null;
    country: string | null;
    profile_photo_url?: string | null;
    is_registered?: boolean;
    role?: 'admin' | 'customer' | null;
    orders_count: number;
};

type Props = {
    customers: Customer[];
};

export default function Customers({ customers }: Props) {
    const [rows, setRows] = useState(customers);

    async function updateRole(customer: Customer, role: 'admin' | 'customer') {
        if (!customer.is_registered) {
            return;
        }

        try {
            const response = await fetch(`/api/v1/customers/${customer.id}`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: customer.first_name ?? null,
                    last_name: customer.last_name ?? null,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address ?? null,
                    gender: customer.gender ?? null,
                    city: customer.city,
                    country: customer.country,
                    role,
                }),
            });

            if (!response.ok) {
                throw new Error('Role update failed.');
            }

            const payload = (await response.json()) as { data: Customer };
            setRows((current) =>
                current.map((item) =>
                    item.id === payload.data.id ? payload.data : item,
                ),
            );
        } catch {
            window.alert('Customer role could not be changed.');
        }
    }

    return (
        <>
            <Head title="Customers" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Customers
                        </h1>
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
                        <CardDescription>
                            {rows.length} customer profiles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-190 text-sm">
                                <thead className="border-b text-left text-xs text-muted-foreground">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            Name
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Contact
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Location
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Role
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Orders
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rows.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="py-3 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10 border">
                                                        {customer.profile_photo_url && (
                                                            <AvatarImage
                                                                src={
                                                                    customer.profile_photo_url
                                                                }
                                                                alt={`${customer.name} profile photo`}
                                                                className="object-cover"
                                                            />
                                                        )}
                                                        <AvatarFallback>
                                                            {initials(
                                                                customer.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div>
                                                    {customer.email ??
                                                        'No email'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {customer.phone ??
                                                        'No phone'}
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {[
                                                    customer.city,
                                                    customer.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ') ||
                                                    'Not provided'}
                                            </td>
                                            <td className="py-3">
                                                <select
                                                    className="h-9 rounded-md border bg-background px-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={
                                                        customer.role ??
                                                        'customer'
                                                    }
                                                    disabled={
                                                        !customer.is_registered
                                                    }
                                                    onChange={(event) =>
                                                        void updateRole(
                                                            customer,
                                                            event.target
                                                                .value as
                                                                | 'admin'
                                                                | 'customer',
                                                        )
                                                    }
                                                >
                                                    <option value="customer">
                                                        Customer
                                                    </option>
                                                    <option value="admin">
                                                        Admin
                                                    </option>
                                                </select>
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

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}
