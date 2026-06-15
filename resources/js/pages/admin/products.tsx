import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
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

type Paginated<T> = {
    data: T[];
};

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count?: number;
    is_active: boolean;
};

type Product = {
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

type ProductFormData = {
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

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Products - Boutique Admin';

        Promise.all([
            getJson<Paginated<Product>>('/api/v1/products'),
            getJson<Paginated<Category>>('/api/v1/categories'),
        ])
            .then(([productPayload, categoryPayload]) => {
                setProducts(productPayload.data);
                setCategories(categoryPayload.data);
            })
            .finally(() => setLoading(false));
    }, []);

    function openCreateDialog() {
        setEditingProduct(null);
        setDialogOpen(true);
    }

    function openEditDialog(product: Product) {
        setEditingProduct(product);
        setDialogOpen(true);
    }

    async function deleteProduct(product: Product) {
        if (!window.confirm(`Delete ${product.name}? Existing order history will keep the product snapshot.`)) {
            return;
        }

        await sendJson<void>(`/api/v1/products/${product.id}`, 'DELETE');
        setProducts((current) => current.filter((item) => item.id !== product.id));
    }

    if (loading) {
        return (
            <div className="grid min-h-[60vh] place-items-center p-6 text-sm text-muted-foreground">
                Loading products
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage boutique catalog, pricing, stock, and featured items.
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    New product
                </Button>
            </div>

            <Card className="rounded-lg">
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Inventory</CardTitle>
                        <CardDescription>{products.length} products in catalog</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Search in your browser" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-225 text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium">Category</th>
                                    <th className="pb-3 font-medium">Variant</th>
                                    <th className="pb-3 text-right font-medium">Price</th>
                                    <th className="pb-3 text-center min-w-25 font-medium">Stock</th>
                                    <th className="pb-3 font-medium">State</th>
                                    <th className="pb-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-3">
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.sku}</div>
                                            </td>
                                            <td className="py-3">{product.category?.name ?? 'Uncategorized'}</td>
                                            <td className="py-3 text-muted-foreground">
                                                {[product.size, product.color].filter(Boolean).join(' / ') ||
                                                    'Standard'}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {money.format(Number(product.price))}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge variant={product.is_low_stock ? 'destructive' : 'secondary'}>
                                                    {/* {product.stock_quantity}/{product.low_stock_threshold} */}
                                                    {product.stock_quantity}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <Badge variant={product.is_active ? 'default' : 'outline'}>
                                                        {product.is_active ? 'Active' : 'Hidden'}
                                                    </Badge>
                                                    {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(product)}
                                                    >
                                                        <Edit className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => deleteProduct(product)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ProductDialog
                product={editingProduct}
                categories={categories}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSaved={(product) => {
                    setProducts((current) => {
                        const exists = current.some((item) => item.id === product.id);

                        if (exists) {
                            return current.map((item) => (item.id === product.id ? product : item));
                        }

                        return [product, ...current];
                    });
                    setDialogOpen(false);
                }}
            />
        </div>
    );
}

function ProductDialog({
    product,
    categories,
    open,
    onOpenChange,
    onSaved,
}: {
    product: Product | null;
    categories: Category[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (product: Product) => void;
}) {
    const [form, setForm] = useState<ProductFormData>(emptyProductForm());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        setForm(
            product
                ? {
                      category_id: String(product.category_id),
                      sku: product.sku,
                      name: product.name,
                      slug: product.slug,
                      description: product.description ?? '',
                      price: String(product.price),
                      cost_price: String(product.cost_price),
                      stock_quantity: String(product.stock_quantity),
                      low_stock_threshold: String(product.low_stock_threshold),
                      size: product.size ?? '',
                      color: product.color ?? '',
                      image_url: product.image_url ?? '',
                      is_featured: product.is_featured,
                      is_active: product.is_active,
                  }
                : emptyProductForm(categories[0]?.id),
        );
        setError('');
    }, [categories, product, open]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const payload = {
            category_id: Number(form.category_id),
            sku: form.sku,
            name: form.name,
            slug: form.slug || null,
            description: form.description || null,
            price: Number(form.price),
            cost_price: Number(form.cost_price || 0),
            stock_quantity: Number(form.stock_quantity || 0),
            low_stock_threshold: Number(form.low_stock_threshold || 0),
            size: form.size || null,
            color: form.color || null,
            image_url: form.image_url || null,
            is_featured: form.is_featured,
            is_active: form.is_active,
        };

        try {
            const response = product
                ? await sendJson<{ data: Product }>(`/api/v1/products/${product.id}`, 'PUT', payload)
                : await sendJson<{ data: Product }>('/api/v1/products', 'POST', payload);

            onSaved(response.data);
        } catch {
            setError('Could not save this product. Check required fields, SKU, slug, and category.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit product' : 'Create product'}</DialogTitle>
                    <DialogDescription>
                        Products appear in inventory, order creation, and storefront API responses.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name" htmlFor="product-name">
                            <Input
                                id="product-name"
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                required
                            />
                        </Field>
                        <Field label="SKU" htmlFor="product-sku">
                            <Input
                                id="product-sku"
                                value={form.sku}
                                onChange={(event) => setForm({ ...form, sku: event.target.value })}
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Category" htmlFor="product-category">
                            <select
                                id="product-category"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                value={form.category_id}
                                onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                                required
                            >
                                <option value="" disabled>
                                    Select category
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Slug" htmlFor="product-slug">
                            <Input
                                id="product-slug"
                                value={form.slug}
                                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                                placeholder="Auto-generated when empty"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <Field label="Price" htmlFor="product-price">
                            <Input
                                id="product-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(event) => setForm({ ...form, price: event.target.value })}
                                required
                            />
                        </Field>
                        <Field label="Cost" htmlFor="product-cost-price">
                            <Input
                                id="product-cost-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.cost_price}
                                onChange={(event) => setForm({ ...form, cost_price: event.target.value })}
                            />
                        </Field>
                        <Field label="Stock" htmlFor="product-stock">
                            <Input
                                id="product-stock"
                                type="number"
                                min="0"
                                value={form.stock_quantity}
                                onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })}
                            />
                        </Field>
                        <Field label="Low stock" htmlFor="product-low-stock">
                            <Input
                                id="product-low-stock"
                                type="number"
                                min="0"
                                value={form.low_stock_threshold}
                                onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Size" htmlFor="product-size">
                            <Input
                                id="product-size"
                                value={form.size}
                                onChange={(event) => setForm({ ...form, size: event.target.value })}
                            />
                        </Field>
                        <Field label="Color" htmlFor="product-color">
                            <Input
                                id="product-color"
                                value={form.color}
                                onChange={(event) => setForm({ ...form, color: event.target.value })}
                            />
                        </Field>
                        <Field label="Image URL" htmlFor="product-image">
                            <Input
                                id="product-image"
                                type="url"
                                value={form.image_url}
                                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                            />
                        </Field>
                    </div>

                    <Field label="Description" htmlFor="product-description">
                        <textarea
                            id="product-description"
                            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                        />
                    </Field>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_featured}
                                onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                            />
                            Featured
                        </label>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button disabled={submitting}>{submitting ? 'Saving...' : 'Save product'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
        </div>
    );
}

function emptyProductForm(categoryId?: number): ProductFormData {
    return {
        category_id: categoryId ? String(categoryId) : '',
        sku: '',
        name: '',
        slug: '',
        description: '',
        price: '',
        cost_price: '0',
        stock_quantity: '0',
        low_stock_threshold: '5',
        size: '',
        color: '',
        image_url: '',
        is_featured: false,
        is_active: true,
    };
}

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

async function sendJson<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}
