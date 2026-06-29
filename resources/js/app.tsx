import { StrictMode, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Edit,
    LogOut,
    PackageCheck,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { initializeTheme } from '@/hooks/use-appearance';
import Products from '@/pages/admin/products';
import Orders from '@/pages/admin/orders';
import CustomerCart from '@/pages/customer/cart';
import CustomerHome from '@/pages/customer/home';
import CustomerProductDetail from '@/pages/customer/product-detail';
import CustomerShop from '@/pages/customer/shop';
import { cartItemCount, customerCartChangedEvent } from '@/lib/customer-cart';
import { categoryDisplayName } from '@/lib/category';
import useApi from './hooks/use-api';
import { getJson, sendJson } from './const/json-tanfer';
import FullPageMessage from './components/full-page-message';
import Dashboard from './pages/admin/dashboard';
import Page from './components/ui/page';
import type {
    Customer,
    Order,
    User,
    Paginated,
    Category,
    CategoryFormData,
    Screen,
} from './types/types';
import OrdersTable from './components/orders-table';
import { navItems, csrfToken, money } from './const/data';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import VerifyEmailOtp from '@/pages/auth/verify-email-otp';
import { index as customersIndex } from '@/routes/api/v1/customers';
import {
    destroy as destroyCategoryRoute,
    index as categoriesIndex,
    store as storeCategoryRoute,
    update as updateCategoryRoute,
} from '@/routes/api/v1/categories';

const currentScreen = (): Screen => {
    const path = window.location.pathname;

    if (path.includes('/customer/products/')) return 'customerProductDetail';
    if (path.includes('/customer/cart')) return 'customerCart';
    if (path.includes('/customer/shop')) return 'customerShop';
    if (path.includes('/customer')) return 'customer';
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/customers')) return 'customers';
    if (path.includes('/admin/orders')) return 'orders';

    return 'dashboard';
};

const currentAuthPath = () =>
    window.location.pathname === '/register' ? '/register' : '/login';

const currentCustomerProductId = (): number | null => {
    const match = window.location.pathname.match(
        /^\/customer\/products\/(\d+)/,
    );

    return match ? Number(match[1]) : null;
};

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [screen, setScreen] = useState<Screen>(currentScreen);
    const [authPath, setAuthPath] = useState(currentAuthPath);
    const [customerProductId, setCustomerProductId] = useState<number | null>(
        currentCustomerProductId,
    );
    const [customerCartCount, setCustomerCartCount] = useState(cartItemCount);

    useEffect(() => {
        getJson<{ user: User | null }>('/app/user')
            .then((payload) => setUser(payload.user))
            .finally(() => setCheckingAuth(false));
    }, []);

    useEffect(() => {
        const onPopState = () => {
            setScreen(currentScreen());
            setAuthPath(currentAuthPath());
            setCustomerProductId(currentCustomerProductId());
        };
        window.addEventListener('popstate', onPopState);

        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        const updateCartCount = () => setCustomerCartCount(cartItemCount());

        window.addEventListener(customerCartChangedEvent, updateCartCount);
        window.addEventListener('storage', updateCartCount);

        return () => {
            window.removeEventListener(
                customerCartChangedEvent,
                updateCartCount,
            );
            window.removeEventListener('storage', updateCartCount);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        if (!user.email_verified_at) return;

        if (
            user.role === 'customer' &&
            !window.location.pathname.startsWith('/customer')
        ) {
            window.history.replaceState({}, '', '/customer');
            setScreen('customer');
        }

        if (
            user.role === 'admin' &&
            window.location.pathname.startsWith('/customer')
        ) {
            window.history.replaceState({}, '', '/dashboard');
            setScreen('dashboard');
        }
    }, [user]);

    function navigate(nextScreen: Screen) {
        const item = navItems.find((navItem) => navItem.screen === nextScreen);

        if (!item) return;

        window.history.pushState({}, '', item.path);
        setScreen(nextScreen);
    }

    function navigateAuth(path: '/login' | '/register') {
        window.history.pushState({}, '', path);
        setAuthPath(path);
    }

    function navigateCustomer(
        nextScreen: 'customer' | 'customerShop' | 'customerCart',
    ) {
        window.history.pushState(
            {},
            '',
            nextScreen === 'customerShop'
                ? '/customer/shop'
                : nextScreen === 'customerCart'
                  ? '/customer/cart'
                  : '/customer',
        );
        setCustomerProductId(null);
        setScreen(nextScreen);
    }

    function navigateCustomerProduct(productId: number) {
        window.history.pushState({}, '', `/customer/products/${productId}`);
        setCustomerProductId(productId);
        setScreen('customerProductDetail');
    }

    if (checkingAuth) {
        return <FullPageMessage title="Loading boutique admin" />;
    }

    if (!user) {
        if (authPath === '/register') {
            return (
                <Register
                    onRegistered={setUser}
                    onLoginClick={() => navigateAuth('/login')}
                />
            );
        }

        return (
            <Login
                onLogin={setUser}
                onRegisterClick={() => navigateAuth('/register')}
            />
        );
    }

    if (!user.email_verified_at) {
        return <VerifyEmailOtp user={user} onVerified={setUser} />;
    }

    if (user.role === 'customer') {
        if (screen === 'customerProductDetail') {
            return customerProductId ? (
                <CustomerProductDetail
                    key={customerProductId}
                    productId={customerProductId}
                    user={user}
                    cartCount={customerCartCount}
                    onBackClick={() => navigateCustomer('customerShop')}
                    onCartClick={() => navigateCustomer('customerCart')}
                    onLogout={() => setUser(null)}
                />
            ) : (
                <CustomerShop
                    user={user}
                    cartCount={customerCartCount}
                    onProductClick={navigateCustomerProduct}
                    onHomeClick={() => navigateCustomer('customer')}
                    onCartClick={() => navigateCustomer('customerCart')}
                    onLogout={() => setUser(null)}
                />
            );
        }

        if (screen === 'customerCart') {
            return (
                <CustomerCart
                    user={user}
                    cartCount={customerCartCount}
                    onHomeClick={() => navigateCustomer('customer')}
                    onShopClick={() => navigateCustomer('customerShop')}
                    onCartClick={() => navigateCustomer('customerCart')}
                    onLogout={() => setUser(null)}
                />
            );
        }

        if (screen === 'customerShop') {
            return (
                <CustomerShop
                    user={user}
                    cartCount={customerCartCount}
                    onProductClick={navigateCustomerProduct}
                    onHomeClick={() => navigateCustomer('customer')}
                    onCartClick={() => navigateCustomer('customerCart')}
                    onLogout={() => setUser(null)}
                />
            );
        }

        return (
            <CustomerHome
                user={user}
                cartCount={customerCartCount}
                onProductClick={navigateCustomerProduct}
                onShopClick={() => navigateCustomer('customerShop')}
                onCartClick={() => navigateCustomer('customerCart')}
                onLogout={() => setUser(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
                <div className="flex h-16 items-center border-b px-5">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <PackageCheck className="size-5" />
                    </div>
                    <div className="ml-3">
                        <div className="font-semibold">Boutique Admin</div>
                        <div className="text-xs text-muted-foreground">
                            React + Laravel API
                        </div>
                    </div>
                </div>
                <nav className="space-y-1 p-3">
                    {navItems.map((item) => (
                        <button
                            key={item.screen}
                            type="button"
                            onClick={() => navigate(item.screen)}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                screen === item.screen
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                            }`}
                        >
                            <item.icon className="size-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Signed in as
                        </div>
                        <div className="font-medium">{user.email}</div>
                    </div>
                    <LogoutButton onLogout={() => setUser(null)} />
                </header>

                <main>
                    {screen === 'dashboard' && <Dashboard />}
                    {screen === 'products' && <Products />}
                    {screen === 'categories' && <CategoriesScreen />}
                    {screen === 'customers' && <CustomersScreen />}
                    {screen === 'orders' && <Orders />}
                </main>
            </div>
        </div>
    );
};

function LogoutButton({ onLogout }: { onLogout: () => void }) {
    async function logout() {
        await fetch('/logout', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });

        onLogout();
        window.history.replaceState({}, '', '/login');
    }

    return (
        <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" />
            Logout
        </Button>
    );
}

function CategoriesScreen() {
    const { data, loading } = useApi<Paginated<Category>>(
        categoriesIndex.url({ query: { per_page: 100 } }),
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        setCategories(data?.data ?? []);
    }, [data]);

    if (loading) return <FullPageMessage title="Loading categories" />;

    function openCreateDialog() {
        setEditingCategory(null);
        setDialogOpen(true);
    }

    function openEditDialog(category: Category) {
        setEditingCategory(category);
        setDialogOpen(true);
    }

    async function deleteCategory(category: Category) {
        if (
            !window.confirm(
                `Delete ${category.name}? Direct products will be deleted and its subcategories will become top-level categories.`,
            )
        ) {
            return;
        }

        await sendJson<void>(destroyCategoryRoute.url(category.id), 'DELETE');
        setCategories((current) =>
            current.filter((item) => item.id !== category.id),
        );
    }

    return (
        <Page
            title="Categories"
            description="Organize products into storefront collections."
        >
            <div className="flex justify-end">
                <Button onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    New category
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className="rounded-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle>
                                        {categoryDisplayName(category)}
                                    </CardTitle>
                                    <CardDescription>
                                        {category.slug}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant={
                                        category.is_active
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {category.is_active ? 'Active' : 'Hidden'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="min-h-10 text-sm text-muted-foreground">
                                {category.description ?? 'No description yet.'}
                            </p>
                            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                                <span>Products</span>
                                <span className="font-semibold">
                                    {category.products_count ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Subcategories</span>
                                <span>{category.children_count ?? 0}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(category)}
                                >
                                    <Edit className="size-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteCategory(category)}
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <CategoryDialog
                category={editingCategory}
                categories={categories}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSaved={(category) => {
                    setCategories((current) => {
                        const exists = current.some(
                            (item) => item.id === category.id,
                        );

                        if (exists) {
                            return current.map((item) =>
                                item.id === category.id ? category : item,
                            );
                        }

                        return [category, ...current];
                    });
                    setDialogOpen(false);
                }}
            />
        </Page>
    );
}

function CategoryDialog({
    category,
    categories,
    open,
    onOpenChange,
    onSaved,
}: {
    category: Category | null;
    categories: Category[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (category: Category) => void;
}) {
    const [form, setForm] = useState<CategoryFormData>(emptyCategoryForm());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        setForm(
            category
                ? {
                      parent_id: category.parent_id
                          ? String(category.parent_id)
                          : '',
                      name: category.name,
                      slug: category.slug,
                      description: category.description ?? '',
                      is_active: category.is_active,
                  }
                : emptyCategoryForm(),
        );
        setError('');
    }, [category, open]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const payload = {
            parent_id: form.parent_id ? Number(form.parent_id) : null,
            name: form.name,
            slug: form.slug || null,
            description: form.description || null,
            is_active: form.is_active,
        };

        try {
            const response = category
                ? await sendJson<{ data: Category }>(
                      updateCategoryRoute.url(category.id),
                      'PUT',
                      payload,
                  )
                : await sendJson<{ data: Category }>(
                      storeCategoryRoute.url(),
                      'POST',
                      payload,
                  );

            onSaved(response.data);
        } catch {
            setError(
                'Could not save this category. Check the name or slug and try again.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Edit category' : 'Create category'}
                    </DialogTitle>
                    <DialogDescription>
                        Categories organize products for the storefront and
                        admin inventory.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="category-parent"
                        >
                            Parent category
                        </label>
                        <select
                            id="category-parent"
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={form.parent_id}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    parent_id: event.target.value,
                                })
                            }
                        >
                            <option value="">None (top-level category)</option>
                            {categories
                                .filter(
                                    (item) =>
                                        item.parent_id === null &&
                                        item.id !== category?.id,
                                )
                                .map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="category-name"
                        >
                            Name
                        </label>
                        <Input
                            id="category-name"
                            value={form.name}
                            onChange={(event) =>
                                setForm({ ...form, name: event.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="category-slug"
                        >
                            Slug
                        </label>
                        <Input
                            id="category-slug"
                            value={form.slug}
                            onChange={(event) =>
                                setForm({ ...form, slug: event.target.value })
                            }
                            placeholder="Auto-generated when empty"
                        />
                    </div>
                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="category-description"
                        >
                            Description
                        </label>
                        <textarea
                            id="category-description"
                            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    is_active: event.target.checked,
                                })
                            }
                        />
                        Active
                    </label>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function emptyCategoryForm(): CategoryFormData {
    return {
        parent_id: '',
        name: '',
        slug: '',
        description: '',
        is_active: true,
    };
}

function CustomersScreen() {
    const { data, loading, refreshing, updatedAt, refresh } = useApi<
        Paginated<Customer>
    >(customersIndex.url());
    const customers = data?.data ?? [];
    const [search, setSearch] = useState('');

    useEffect(() => {
        const interval = window.setInterval(() => void refresh(), 30_000);

        return () => window.clearInterval(interval);
    }, [refresh]);

    const filteredCustomers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return customers;
        }

        return customers.filter((customer) =>
            [customer.name, customer.email, customer.phone, customer.city]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(query)),
        );
    }, [customers, search]);

    if (loading) return <FullPageMessage title="Loading customers" />;

    return (
        <Page
            title="Customers"
            description="Track contact details and order activity."
        >
            <Card className="rounded-lg">
                <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle>Customer directory</CardTitle>
                        <CardDescription>
                            {customers.length} database profiles loaded
                            {updatedAt &&
                                ` · Updated ${updatedAt.toLocaleTimeString()}`}
                        </CardDescription>
                    </div>
                    <div className="flex w-full gap-2 md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search customers"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            title="Refresh customers"
                            disabled={refreshing}
                            onClick={() => void refresh()}
                        >
                            <RefreshCw
                                className={`size-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-250 text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="pb-3 font-medium">Name</th>
                                    <th className="pb-3 font-medium">
                                        Contact
                                    </th>
                                    <th className="pb-3 font-medium">
                                        Account
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Orders
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Lifetime value
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Last order
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="py-3 font-medium">
                                            {customer.name}
                                        </td>
                                        <td className="py-3">
                                            <div>
                                                {customer.email ?? 'No email'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {customer.phone ?? 'No phone'}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge
                                                    variant={
                                                        customer.is_registered
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                >
                                                    {customer.is_registered
                                                        ? 'Registered'
                                                        : 'Guest'}
                                                </Badge>
                                                {customer.is_registered && (
                                                    <Badge
                                                        variant={
                                                            customer.email_verified
                                                                ? 'secondary'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {customer.email_verified
                                                            ? 'Verified'
                                                            : 'Unverified'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {[
                                                    customer.city,
                                                    customer.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ') ||
                                                    'No location'}
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            {customer.orders_count ?? 0}
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            {money.format(
                                                customer.lifetime_value ?? 0,
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-muted-foreground">
                                            {formatCustomerDate(
                                                customer.last_order_at,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </Page>
    );
}

function formatCustomerDate(value: string | null | undefined): string {
    if (!value) {
        return 'No orders';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function OrdersScreen() {
    const { data, loading } = useApi<Paginated<Order>>('/api/v1/orders');
    const orders = data?.data ?? [];

    if (loading) return <FullPageMessage title="Loading orders" />;

    return (
        <Page
            title="Orders"
            description="Review sales, fulfillment state, and payment status."
        >
            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle>Order queue</CardTitle>
                    <CardDescription>
                        {orders.length} orders loaded
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OrdersTable orders={orders} />
                </CardContent>
            </Card>
        </Page>
    );
}

initializeTheme();

type GlobalWithReactRoot = typeof globalThis & {
    boutiqueReactRoot?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById('root')!;
const globalScope = globalThis as GlobalWithReactRoot;
const root = globalScope.boutiqueReactRoot ?? createRoot(rootElement);

globalScope.boutiqueReactRoot = root;

root.render(
    <StrictMode>
        <App />
    </StrictMode>,
);
