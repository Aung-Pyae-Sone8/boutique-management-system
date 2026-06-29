import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Edit, ImagePlus, Plus, Search, Trash2 } from 'lucide-react';
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
import { categoryDisplayName } from '@/lib/category';

type Paginated<T> = {
    data: T[];
};

type Category = {
    id: number;
    parent_id: number | null;
    parent?: {
        id: number;
        name: string;
        slug: string;
    } | null;
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
    images: ProductImage[];
    variants: ProductVariant[];
    is_active: boolean;
    is_featured: boolean;
    is_low_stock: boolean;
};

type ProductImage = {
    id: number;
    product_variant_id: number | null;
    url: string;
    original_name: string | null;
    sort_order: number;
};

type ProductVariant = {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    price: number;
    cost_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_low_stock: boolean;
    images: ProductImage[];
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
    is_featured: boolean;
    is_active: boolean;
};

type ProductVariantFormData = {
    id?: number;
    sku: string;
    size: string;
    color: string;
    price: string;
    cost_price: string;
    stock_quantity: string;
    low_stock_threshold: string;
    is_active: boolean;
    imageFiles: File[];
    existingImages: ProductImage[];
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
        if (
            !window.confirm(
                `Delete ${product.name}? Existing order history will keep the product snapshot.`,
            )
        ) {
            return;
        }

        await sendJson<void>(`/api/v1/products/${product.id}`, 'DELETE');
        setProducts((current) =>
            current.filter((item) => item.id !== product.id),
        );
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
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Products
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage boutique catalog, pricing, stock, and featured
                        items.
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
                        <CardDescription>
                            {products.length} products in catalog
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search in your browser"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-225 text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="pb-3 font-medium">
                                        Product
                                    </th>
                                    <th className="pb-3 font-medium">
                                        Category
                                    </th>
                                    <th className="pb-3 font-medium">
                                        Variant
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Price
                                    </th>
                                    <th className="min-w-25 pb-3 text-center font-medium">
                                        Stock
                                    </th>
                                    <th className="pb-3 font-medium">State</th>
                                    <th className="pb-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                        {product.image_url ? (
                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImagePlus className="size-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {product.sku}
                                                            {product.images
                                                                .length > 1
                                                                ? ` • ${product.images.length} images`
                                                                : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {product.category
                                                    ? categoryDisplayName(
                                                          product.category,
                                                      )
                                                    : 'Uncategorized'}
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {product.variants.length > 0
                                                    ? `${product.variants.length} variant${
                                                          product.variants
                                                              .length === 1
                                                              ? ''
                                                              : 's'
                                                      }`
                                                    : [
                                                          product.size,
                                                          product.color,
                                                      ]
                                                          .filter(Boolean)
                                                          .join(' / ') ||
                                                      'Standard'}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {money.format(
                                                    Number(product.price),
                                                )}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge
                                                    variant={
                                                        product.is_low_stock
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {/* {product.stock_quantity}/{product.low_stock_threshold} */}
                                                    {product.stock_quantity}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <Badge
                                                        variant={
                                                            product.is_active
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {product.is_active
                                                            ? 'Active'
                                                            : 'Hidden'}
                                                    </Badge>
                                                    {product.is_featured && (
                                                        <Badge variant="secondary">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                product,
                                                            )
                                                        }
                                                    >
                                                        <Edit className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product,
                                                            )
                                                        }
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
                        const exists = current.some(
                            (item) => item.id === product.id,
                        );

                        if (exists) {
                            return current.map((item) =>
                                item.id === product.id ? product : item,
                            );
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
    const [variants, setVariants] = useState<ProductVariantFormData[]>([
        emptyVariantForm(),
    ]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
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
                      is_featured: product.is_featured,
                      is_active: product.is_active,
                  }
                : emptyProductForm(categories[0]?.id),
        );
        setVariants(
            product
                ? product.variants.length > 0
                    ? product.variants.map(productVariantToForm)
                    : [productToVariantForm(product)]
                : [emptyVariantForm()],
        );
        setImageFiles([]);
        setError('');
    }, [categories, product, open]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const primaryVariant = variants[0] ?? emptyVariantForm();
        const payload = new FormData();
        payload.append('category_id', form.category_id);
        payload.append('sku', form.sku);
        payload.append('name', form.name);
        payload.append('slug', form.slug);
        payload.append('description', form.description);
        payload.append('price', primaryVariant.price || '0');
        payload.append('cost_price', primaryVariant.cost_price || '0');
        payload.append('stock_quantity', primaryVariant.stock_quantity || '0');
        payload.append(
            'low_stock_threshold',
            primaryVariant.low_stock_threshold || '0',
        );
        payload.append('size', primaryVariant.size);
        payload.append('color', primaryVariant.color);
        payload.append('is_featured', form.is_featured ? '1' : '0');
        payload.append('is_active', form.is_active ? '1' : '0');

        variants.forEach((variant, index) => {
            if (variant.id) {
                payload.append(`variants[${index}][id]`, String(variant.id));
            }

            payload.append(`variants[${index}][sku]`, variant.sku);
            payload.append(`variants[${index}][size]`, variant.size);
            payload.append(`variants[${index}][color]`, variant.color);
            payload.append(`variants[${index}][price]`, variant.price || '0');
            payload.append(
                `variants[${index}][cost_price]`,
                variant.cost_price || '0',
            );
            payload.append(
                `variants[${index}][stock_quantity]`,
                variant.stock_quantity || '0',
            );
            payload.append(
                `variants[${index}][low_stock_threshold]`,
                variant.low_stock_threshold || '0',
            );
            payload.append(
                `variants[${index}][is_active]`,
                variant.is_active ? '1' : '0',
            );

            variant.imageFiles.forEach((file) => {
                payload.append(`variant_images[${index}][]`, file);
            });
        });

        imageFiles.forEach((file) => payload.append('images[]', file));

        try {
            const response = product
                ? await sendFormData<{ data: Product }>(
                      `/api/v1/products/${product.id}`,
                      'PUT',
                      payload,
                  )
                : await sendFormData<{ data: Product }>(
                      '/api/v1/products',
                      'POST',
                      payload,
                  );

            onSaved(response.data);
        } catch {
            setError(
                'Could not save this product. Check required fields, SKU, slug, category, and images.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {product ? 'Edit product' : 'Create product'}
                    </DialogTitle>
                    <DialogDescription>
                        Products appear in inventory, order creation, and
                        storefront API responses.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name" htmlFor="product-name">
                            <Input
                                id="product-name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value,
                                    })
                                }
                                required
                            />
                        </Field>
                        <Field label="SKU" htmlFor="product-sku">
                            <Input
                                id="product-sku"
                                value={form.sku}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        sku: event.target.value,
                                    })
                                }
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Category" htmlFor="product-category">
                            <select
                                id="product-category"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.category_id}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        category_id: event.target.value,
                                    })
                                }
                                required
                            >
                                <option value="" disabled>
                                    Select category
                                </option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {categoryDisplayName(category)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Slug" htmlFor="product-slug">
                            <Input
                                id="product-slug"
                                value={form.slug}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        slug: event.target.value,
                                    })
                                }
                                placeholder="Auto-generated when empty"
                            />
                        </Field>
                    </div>

                    <VariantEditor variants={variants} onChange={setVariants} />

                    <Field label="Images" htmlFor="product-images">
                        <div className="space-y-3">
                            {product?.images.length ? (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                    {product.images.map((image) => (
                                        <img
                                            key={image.id}
                                            src={image.url}
                                            alt={
                                                image.original_name ??
                                                product.name
                                            }
                                            className="aspect-square rounded-md border object-cover"
                                        />
                                    ))}
                                </div>
                            ) : null}
                            <label
                                htmlFor="product-images"
                                className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-5 text-center text-sm transition hover:bg-muted/50"
                            >
                                <ImagePlus className="size-6 text-muted-foreground" />
                                <span className="font-medium">
                                    Choose product images
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    JPG, PNG, GIF, or WebP up to 4 MB each
                                </span>
                            </label>
                            <Input
                                id="product-images"
                                className="sr-only"
                                type="file"
                                accept="image/*"
                                multiple
                                required={!product}
                                onChange={(event) =>
                                    setImageFiles(
                                        Array.from(event.target.files ?? []),
                                    )
                                }
                            />
                            {imageFiles.length > 0 && (
                                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                                    {imageFiles.length} selected:{' '}
                                    {imageFiles
                                        .map((file) => file.name)
                                        .join(', ')}
                                </div>
                            )}
                        </div>
                    </Field>

                    <Field label="Description" htmlFor="product-description">
                        <textarea
                            id="product-description"
                            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                        />
                    </Field>

                    <div className="flex flex-wrap gap-4">
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
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_featured}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        is_featured: event.target.checked,
                                    })
                                }
                            />
                            Featured
                        </label>
                    </div>

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
                            {submitting ? 'Saving...' : 'Save product'}
                        </Button>
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

function VariantEditor({
    variants,
    onChange,
}: {
    variants: ProductVariantFormData[];
    onChange: (variants: ProductVariantFormData[]) => void;
}) {
    function updateVariant(
        index: number,
        changes: Partial<ProductVariantFormData>,
    ) {
        onChange(
            variants.map((variant, currentIndex) =>
                currentIndex === index ? { ...variant, ...changes } : variant,
            ),
        );
    }

    function addVariant() {
        onChange([...variants, emptyVariantForm()]);
    }

    function removeVariant(index: number) {
        if (variants.length === 1) {
            return;
        }

        onChange(variants.filter((_, currentIndex) => currentIndex !== index));
    }

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Variants</h3>
                    <p className="text-xs text-muted-foreground">
                        Add each sellable size and color combination.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                >
                    <Plus className="size-4" />
                    Add variant
                </Button>
            </div>

            <div className="space-y-3">
                {variants.map((variant, index) => (
                    <div
                        key={variant.id ?? index}
                        className="grid gap-3 rounded-md border bg-muted/20 p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-muted-foreground">
                                Variant {index + 1}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={variants.length === 1}
                                onClick={() => removeVariant(index)}
                            >
                                <Trash2 className="size-4" />
                                Remove
                            </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <Field
                                label="Variant SKU"
                                htmlFor={`variant-${index}-sku`}
                            >
                                <Input
                                    id={`variant-${index}-sku`}
                                    value={variant.sku}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            sku: event.target.value,
                                        })
                                    }
                                    required
                                />
                            </Field>
                            <Field
                                label="Size"
                                htmlFor={`variant-${index}-size`}
                            >
                                <Input
                                    id={`variant-${index}-size`}
                                    value={variant.size}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            size: event.target.value,
                                        })
                                    }
                                    placeholder="S, M, L"
                                />
                            </Field>
                            <Field
                                label="Color"
                                htmlFor={`variant-${index}-color`}
                            >
                                <Input
                                    id={`variant-${index}-color`}
                                    value={variant.color}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            color: event.target.value,
                                        })
                                    }
                                    placeholder="Black, Ivory"
                                />
                            </Field>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <Field
                                label="Price"
                                htmlFor={`variant-${index}-price`}
                            >
                                <Input
                                    id={`variant-${index}-price`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            price: event.target.value,
                                        })
                                    }
                                    required
                                />
                            </Field>
                            <Field
                                label="Cost"
                                htmlFor={`variant-${index}-cost`}
                            >
                                <Input
                                    id={`variant-${index}-cost`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.cost_price}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            cost_price: event.target.value,
                                        })
                                    }
                                />
                            </Field>
                            <Field
                                label="Stock"
                                htmlFor={`variant-${index}-stock`}
                            >
                                <Input
                                    id={`variant-${index}-stock`}
                                    type="number"
                                    min="0"
                                    value={variant.stock_quantity}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            stock_quantity: event.target.value,
                                        })
                                    }
                                />
                            </Field>
                            <Field
                                label="Low stock"
                                htmlFor={`variant-${index}-low-stock`}
                            >
                                <Input
                                    id={`variant-${index}-low-stock`}
                                    type="number"
                                    min="0"
                                    value={variant.low_stock_threshold}
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            low_stock_threshold:
                                                event.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={variant.is_active}
                                onChange={(event) =>
                                    updateVariant(index, {
                                        is_active: event.target.checked,
                                    })
                                }
                            />
                            Active variant
                        </label>

                        <Field
                            label="Variant images"
                            htmlFor={`variant-${index}-images`}
                        >
                            <div className="space-y-3">
                                {variant.existingImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                        {variant.existingImages.map((image) => (
                                            <img
                                                key={image.id}
                                                src={image.url}
                                                alt={
                                                    image.original_name ??
                                                    variant.sku
                                                }
                                                className="aspect-square rounded-md border object-cover"
                                            />
                                        ))}
                                    </div>
                                )}

                                <label
                                    htmlFor={`variant-${index}-images`}
                                    className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background px-4 py-4 text-center text-sm transition hover:bg-muted/50"
                                >
                                    <ImagePlus className="size-5 text-muted-foreground" />
                                    <span className="font-medium">
                                        Choose images for this variant
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Used when this size/color is selected
                                    </span>
                                </label>
                                <Input
                                    id={`variant-${index}-images`}
                                    className="sr-only"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) =>
                                        updateVariant(index, {
                                            imageFiles: Array.from(
                                                event.target.files ?? [],
                                            ),
                                        })
                                    }
                                />
                                {variant.imageFiles.length > 0 && (
                                    <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                                        {variant.imageFiles.length} selected:{' '}
                                        {variant.imageFiles
                                            .map((file) => file.name)
                                            .join(', ')}
                                    </div>
                                )}
                            </div>
                        </Field>
                    </div>
                ))}
            </div>
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
        is_featured: false,
        is_active: true,
    };
}

function emptyVariantForm(): ProductVariantFormData {
    return {
        sku: '',
        size: '',
        color: '',
        price: '',
        cost_price: '0',
        stock_quantity: '0',
        low_stock_threshold: '5',
        is_active: true,
        imageFiles: [],
        existingImages: [],
    };
}

function productVariantToForm(variant: ProductVariant): ProductVariantFormData {
    return {
        id: variant.id,
        sku: variant.sku,
        size: variant.size ?? '',
        color: variant.color ?? '',
        price: String(variant.price),
        cost_price: String(variant.cost_price),
        stock_quantity: String(variant.stock_quantity),
        low_stock_threshold: String(variant.low_stock_threshold),
        is_active: variant.is_active,
        imageFiles: [],
        existingImages: variant.images,
    };
}

function productToVariantForm(product: Product): ProductVariantFormData {
    return {
        sku: product.sku,
        size: product.size ?? '',
        color: product.color ?? '',
        price: String(product.price),
        cost_price: String(product.cost_price),
        stock_quantity: String(product.stock_quantity),
        low_stock_threshold: String(product.low_stock_threshold),
        is_active: product.is_active,
        imageFiles: [],
        existingImages: [],
    };
}

function csrfToken() {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
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

async function sendJson<T>(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data?: unknown,
): Promise<T> {
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

async function sendFormData<T>(
    url: string,
    method: 'POST' | 'PUT',
    data: FormData,
): Promise<T> {
    if (method === 'PUT') {
        data.append('_method', 'PUT');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: data,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}
