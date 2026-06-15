import { StrictMode, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Edit,
    LogOut,
    PackageCheck,
    Plus,
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
import CustomerHome from '@/pages/customer/home';
import useApi from './hooks/use-api';
import { getJson, sendJson } from './const/json-tanfer';
import FullPageMessage from './components/full-page-message';
import Dashboard from './pages/admin/dashboard';
import Page from './components/ui/page'
import type { 
    Customer, 
    Order, 
    User, 
    Paginated, 
    LaravelErrorResponse,
    Category,
    CategoryFormData,
    Screen
} from './types/types'
import OrdersTable from './components/orders-table';
import { navItems, csrfToken } from './const/data'

const errorMessageFromResponse = async (response: Response, fallback: string) => {
    if (response.status === 419) {
        return 'Your session expired. Refresh the page and try again.';
    }

    try {
        const payload = (await response.json()) as LaravelErrorResponse;
        const fieldError = Object.values(payload.errors ?? {})[0]?.[0];

        return fieldError ?? payload.message ?? fallback;
    } catch {
        return fallback;
    }
}

const currentScreen = (): Screen => {
    const path = window.location.pathname;

    if (path.includes('/customer')) return 'customer';
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/customers')) return 'customers';
    if (path.includes('/admin/orders')) return 'orders';

    return 'dashboard';
}

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [screen, setScreen] = useState<Screen>(currentScreen);

    useEffect(() => {
        getJson<{ user: User | null }>('/app/user')
            .then((payload) => setUser(payload.user))
            .finally(() => setCheckingAuth(false));
    }, []);

    useEffect(() => {
        const onPopState = () => setScreen(currentScreen());
        window.addEventListener('popstate', onPopState);

        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        if (!user) return;

        if (user.role === 'customer' && window.location.pathname !== '/customer') {
            window.history.replaceState({}, '', '/customer');
            setScreen('customer');
        }

        if (user.role === 'admin' && window.location.pathname === '/customer') {
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

    if (checkingAuth) {
        return <FullPageMessage title="Loading boutique admin" />;
    }

    if (!user) {
        return <LoginScreen onLogin={setUser} />;
    }

    if (user.role === 'customer') {
        return <CustomerHome user={user} onLogout={() => setUser(null)} />;
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
                        <div className="text-xs text-muted-foreground">React + Laravel API</div>
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
                        <div className="text-sm text-muted-foreground">Signed in as</div>
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
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
    const [email, setEmail] = useState('admin@boutique.test');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const message = await errorMessageFromResponse(
                response,
                'Unable to sign in. Check your email and password.',
            );
            setSubmitting(false);
            setError(message);
            return;
        }

        const payload = await getJson<{ user: User }>('/app/user');
        onLogin(payload.user);
        window.history.replaceState({}, '', payload.user.role === 'admin' ? '/dashboard' : '/customer');
        setSubmitting(false);
    }

    return (
        <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-md rounded-lg">
                <CardHeader>
                    <CardTitle>Boutique Login</CardTitle>
                    <CardDescription>Admins go to the dashboard. Customers go to the shop page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="password">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button className="w-full" disabled={submitting}>
                            {submitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

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
    const { data, loading } = useApi<Paginated<Category>>('/api/v1/categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
        if (!window.confirm(`Delete ${category.name}? Products in this category will also be deleted.`)) {
            return;
        }

        await sendJson<void>(`/api/v1/categories/${category.id}`, 'DELETE');
        setCategories((current) => current.filter((item) => item.id !== category.id));
    }

    return (
        <Page title="Categories" description="Organize products into storefront collections.">
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
                                    <CardTitle>{category.name}</CardTitle>
                                    <CardDescription>{category.slug}</CardDescription>
                                </div>
                                <Badge variant={category.is_active ? 'default' : 'outline'}>
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
                                <span className="font-semibold">{category.products_count ?? 0}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                                    <Edit className="size-4" />
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteCategory(category)}>
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
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSaved={(category) => {
                    setCategories((current) => {
                        const exists = current.some((item) => item.id === category.id);

                        if (exists) {
                            return current.map((item) => (item.id === category.id ? category : item));
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
    open,
    onOpenChange,
    onSaved,
}: {
    category: Category | null;
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
            name: form.name,
            slug: form.slug || null,
            description: form.description || null,
            is_active: form.is_active,
        };

        try {
            const response = category
                ? await sendJson<{ data: Category }>(`/api/v1/categories/${category.id}`, 'PUT', payload)
                : await sendJson<{ data: Category }>('/api/v1/categories', 'POST', payload);

            onSaved(response.data);
        } catch {
            setError('Could not save this category. Check the name or slug and try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit category' : 'Create category'}</DialogTitle>
                    <DialogDescription>
                        Categories organize products for the storefront and admin inventory.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="category-name">
                            Name
                        </label>
                        <Input
                            id="category-name"
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="category-slug">
                            Slug
                        </label>
                        <Input
                            id="category-slug"
                            value={form.slug}
                            onChange={(event) => setForm({ ...form, slug: event.target.value })}
                            placeholder="Auto-generated when empty"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="category-description">
                            Description
                        </label>
                        <textarea
                            id="category-description"
                            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                        />
                        Active
                    </label>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button disabled={submitting}>{submitting ? 'Saving...' : 'Save category'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function emptyCategoryForm(): CategoryFormData {
    return {
        name: '',
        slug: '',
        description: '',
        is_active: true,
    };
}

function CustomersScreen() {
    const { data, loading } = useApi<Paginated<Customer>>('/api/v1/customers');
    const customers = data?.data ?? [];

    if (loading) return <FullPageMessage title="Loading customers" />;

    return (
        <Page title="Customers" description="Track contact details and order activity.">
            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle>Customer directory</CardTitle>
                    <CardDescription>{customers.length} customer profiles loaded</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-190 text-sm">
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
                                        <td className="py-3 text-right font-medium">{customer.orders_count ?? 0}</td>
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

function OrdersScreen() {
    const { data, loading } = useApi<Paginated<Order>>('/api/v1/orders');
    const orders = data?.data ?? [];

    if (loading) return <FullPageMessage title="Loading orders" />;

    return (
        <Page title="Orders" description="Review sales, fulfillment state, and payment status.">
            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle>Order queue</CardTitle>
                    <CardDescription>{orders.length} orders loaded</CardDescription>
                </CardHeader>
                <CardContent>
                    <OrdersTable orders={orders} />
                </CardContent>
            </Card>
        </Page>
    );
}

initializeTheme();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
