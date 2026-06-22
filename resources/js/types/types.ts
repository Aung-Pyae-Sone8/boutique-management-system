export type Customer = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    orders_count?: number;
};

export type Order = {
    id: number;
    order_number: string;
    customer?: string | Customer | null;
    status: string;
    payment_status: string;
    total: number;
    subtotal?: number;
    ordered_at: string | null;
    items?: Array<{ quantity: number }>;
};

export type DashboardData = {
    stats: {
        revenue: number;
        orders: number;
        products: number;
        customers: number;
        lowStock: number;
    };
    salesByStatus: Record<string, number>;
    recentOrders: Order[];
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

export type User = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'customer';
    email_verified_at: string | null;
};

export type Paginated<T> = {
    data: T[];
};

export type LaravelErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count?: number;
    is_active: boolean;
};

export type CategoryFormData = {
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
};

export type Product = {
    id: number;
    category_id: number;
    sku: string;
    name: string;
    slug: string;
    description: string | null;
    category: Category | null;
    price: number;
    cost_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    size: string | null;
    color: string | null;
    image_url: string | null;
    is_active: boolean;
    is_featured: boolean;
    is_low_stock: boolean;
};

export type ProductFormData = {
    category_id: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    cost_price: string;
    stock_quantity: string;
    low_stock_threshold: string;
    size: string;
    color: string;
    image_url: string;
    is_featured: boolean;
    is_active: boolean;
};

export type Screen = 'dashboard' | 'products' | 'categories' | 'customers' | 'orders' | 'customer';
