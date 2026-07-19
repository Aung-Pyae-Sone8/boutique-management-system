import {
    Boxes,
    CreditCard,
    LayoutGrid,
    MessageSquareText,
    ReceiptText,
    Tags,
    Users,
} from 'lucide-react';

export const csrfToken = () => {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
};

export const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export const statusTone: Record<
    string,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    completed: 'default',
    processing: 'secondary',
    pending: 'outline',
    cancelled: 'destructive',
    paid: 'default',
    unpaid: 'outline',
    refunded: 'secondary',
};

export const navItems = [
    {
        screen: 'dashboard' as const,
        label: 'Dashboard',
        icon: LayoutGrid,
        path: '/dashboard',
    },
    {
        screen: 'products' as const,
        label: 'Products',
        icon: Boxes,
        path: '/admin/products',
    },
    {
        screen: 'categories' as const,
        label: 'Categories',
        icon: Tags,
        path: '/admin/categories',
    },
    {
        screen: 'customers' as const,
        label: 'Customers',
        icon: Users,
        path: '/admin/customers',
    },
    {
        screen: 'orders' as const,
        label: 'Orders',
        icon: ReceiptText,
        path: '/admin/orders',
    },
    {
        screen: 'paymentMethods' as const,
        label: 'Payments',
        icon: CreditCard,
        path: '/admin/payment-methods',
    },
    {
        screen: 'adminMessages' as const,
        label: 'Messages',
        icon: MessageSquareText,
        path: '/admin/messages',
    },
];
