import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, Edit, Plus, Trash2, Upload } from 'lucide-react';
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
import Page from '@/components/ui/page';
import { csrfToken } from '@/const/data';
import useApi from '@/hooks/use-api';
import type {
    LaravelErrorResponse,
    Paginated,
    PaymentMethod,
} from '@/types/types';
import {
    destroy as destroyPaymentMethod,
    index as paymentMethodsIndex,
    store as storePaymentMethod,
    update as updatePaymentMethod,
} from '@/routes/api/v1/payment-methods';

type PaymentMethodFormData = {
    code: string;
    label: string;
    provider: string;
    account_username: string;
    account_phone: string;
    sort_order: string;
    is_active: boolean;
    qr_image: File | null;
};

const emptyForm = (): PaymentMethodFormData => ({
    code: '',
    label: '',
    provider: '',
    account_username: '',
    account_phone: '',
    sort_order: '0',
    is_active: true,
    qr_image: null,
});

export default function PaymentMethods() {
    const { data, loading } = useApi<Paginated<PaymentMethod>>(
        paymentMethodsIndex.url({ query: { per_page: 100 } }),
    );
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        setPaymentMethods(data?.data ?? []);
    }, [data]);

    if (loading) {
        return (
            <Page title="Payment Methods" description="Loading payment setup.">
                <div />
            </Page>
        );
    }

    function openCreateDialog() {
        setEditingMethod(null);
        setDialogOpen(true);
    }

    function openEditDialog(paymentMethod: PaymentMethod) {
        setEditingMethod(paymentMethod);
        setDialogOpen(true);
    }

    async function deletePaymentMethod(paymentMethod: PaymentMethod) {
        if (
            !window.confirm(
                `Delete ${paymentMethod.label}? Customers will no longer see this payment option.`,
            )
        ) {
            return;
        }

        const route = destroyPaymentMethod(paymentMethod.id);
        await fetch(route.url, {
            method: route.method.toUpperCase(),
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });
        setPaymentMethods((current) =>
            current.filter((item) => item.id !== paymentMethod.id),
        );
    }

    return (
        <Page
            title="Payment Methods"
            description="Manage checkout payment choices and their customer-facing QR codes."
        >
            <div className="flex justify-end">
                <Button onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    New payment method
                </Button>
            </div>

            <Card className="rounded-lg">
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Checkout payments</CardTitle>
                        <CardDescription>
                            {paymentMethods.length} methods configured
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">
                        {
                            paymentMethods.filter((method) => method.is_active)
                                .length
                        }{' '}
                        active
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paymentMethods.map((paymentMethod) => (
                            <div
                                key={paymentMethod.id}
                                className="flex min-h-48 flex-col justify-between rounded-lg border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="size-4 text-muted-foreground" />
                                            <h3 className="truncate font-semibold">
                                                {paymentMethod.label}
                                            </h3>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {paymentMethod.code}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            paymentMethod.is_active
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        {paymentMethod.is_active
                                            ? 'Active'
                                            : 'Hidden'}
                                    </Badge>
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                        {paymentMethod.qr_url ? (
                                            <img
                                                src={paymentMethod.qr_url}
                                                alt={`${paymentMethod.label} QR`}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <CreditCard className="size-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div>
                                            Provider:{' '}
                                            <span className="font-medium">
                                                {paymentMethod.provider ??
                                                    paymentMethod.code}
                                            </span>
                                        </div>
                                        <div>
                                            Account:{' '}
                                            <span className="font-medium">
                                                {paymentMethod.account_username ??
                                                    'Not set'}
                                            </span>
                                        </div>
                                        <div>
                                            Phone:{' '}
                                            <span className="font-medium">
                                                {paymentMethod.account_phone ??
                                                    'Not set'}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            Sort order{' '}
                                            {paymentMethod.sort_order}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            openEditDialog(paymentMethod)
                                        }
                                    >
                                        <Edit className="size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            void deletePaymentMethod(
                                                paymentMethod,
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <PaymentMethodDialog
                paymentMethod={editingMethod}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSaved={(paymentMethod) => {
                    setPaymentMethods((current) => {
                        const exists = current.some(
                            (item) => item.id === paymentMethod.id,
                        );
                        const next = exists
                            ? current.map((item) =>
                                  item.id === paymentMethod.id
                                      ? paymentMethod
                                      : item,
                              )
                            : [paymentMethod, ...current];

                        return next.sort(
                            (left, right) =>
                                left.sort_order - right.sort_order ||
                                left.label.localeCompare(right.label),
                        );
                    });
                    setDialogOpen(false);
                }}
            />
        </Page>
    );
}

function PaymentMethodDialog({
    paymentMethod,
    open,
    onOpenChange,
    onSaved,
}: {
    paymentMethod: PaymentMethod | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (paymentMethod: PaymentMethod) => void;
}) {
    const [form, setForm] = useState<PaymentMethodFormData>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(
            paymentMethod
                ? {
                      code: paymentMethod.code,
                      label: paymentMethod.label,
                      provider: paymentMethod.provider ?? '',
                      account_username: paymentMethod.account_username ?? '',
                      account_phone: paymentMethod.account_phone ?? '',
                      sort_order: String(paymentMethod.sort_order),
                      is_active: paymentMethod.is_active,
                      qr_image: null,
                  }
                : emptyForm(),
        );
        setError('');
    }, [open, paymentMethod]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const payload = new FormData();
        payload.append('label', form.label);
        payload.append('code', form.code);
        payload.append('provider', form.provider);
        payload.append('account_username', form.account_username);
        payload.append('account_phone', form.account_phone);
        payload.append('sort_order', form.sort_order || '0');
        payload.append('is_active', form.is_active ? '1' : '0');

        if (form.qr_image) {
            payload.append('qr_image', form.qr_image);
        }

        try {
            const route = paymentMethod
                ? updatePaymentMethod(paymentMethod.id)
                : storePaymentMethod();

            if (paymentMethod) {
                payload.append('_method', route.method.toUpperCase());
            }

            const response = await fetch(route.url, {
                method: paymentMethod ? 'POST' : route.method.toUpperCase(),
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: payload,
            });
            const responsePayload = (await response.json()) as
                | { data?: PaymentMethod }
                | LaravelErrorResponse;

            if (
                !response.ok ||
                !('data' in responsePayload) ||
                !responsePayload.data
            ) {
                throw responsePayload;
            }

            onSaved(responsePayload.data);
        } catch (exception) {
            const response = exception as LaravelErrorResponse;
            setError(
                Object.values(response.errors ?? {})[0]?.[0] ??
                    response.message ??
                    'Payment method could not be saved.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {paymentMethod
                            ? 'Edit payment method'
                            : 'Create payment method'}
                    </DialogTitle>
                    <DialogDescription>
                        Active methods appear in customer checkout.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-label"
                            >
                                Name
                            </label>
                            <Input
                                id="payment-label"
                                value={form.label}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        label: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-code"
                            >
                                Code
                            </label>
                            <Input
                                id="payment-code"
                                value={form.code}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        code: event.target.value,
                                    })
                                }
                                placeholder="Auto from name"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-provider"
                            >
                                Provider
                            </label>
                            <Input
                                id="payment-provider"
                                value={form.provider}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        provider: event.target.value,
                                    })
                                }
                                placeholder="Same as code"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-sort"
                            >
                                Sort order
                            </label>
                            <Input
                                id="payment-sort"
                                type="number"
                                min="0"
                                value={form.sort_order}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        sort_order: event.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-account-username"
                            >
                                Account username
                            </label>
                            <Input
                                id="payment-account-username"
                                value={form.account_username}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        account_username: event.target.value,
                                    })
                                }
                                placeholder="Bank or wallet account name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="payment-account-phone"
                            >
                                Account phone
                            </label>
                            <Input
                                id="payment-account-phone"
                                type="tel"
                                value={form.account_phone}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        account_phone: event.target.value,
                                    })
                                }
                                placeholder="+95 9 ..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="payment-qr"
                        >
                            QR image
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed px-3 py-3 text-sm">
                            <span className="truncate text-muted-foreground">
                                {form.qr_image?.name ??
                                    (paymentMethod
                                        ? 'Choose a new QR image'
                                        : 'Choose QR image')}
                            </span>
                            <span className="inline-flex items-center gap-2 font-medium">
                                <Upload className="size-4" />
                                Upload
                            </span>
                            <input
                                id="payment-qr"
                                className="sr-only"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        qr_image:
                                            event.target.files?.[0] ?? null,
                                    })
                                }
                            />
                        </label>
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
                        Active in checkout
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
                            {submitting ? 'Saving...' : 'Save method'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
