import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { BadgeCheck, Camera, Mail, ShoppingBag } from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FullPageMessage from '@/components/full-page-message';
import useApi from '@/hooks/use-api';
import { csrfToken, money } from '@/const/data';
import { profile as appProfile } from '@/routes/app';
import { store as storeProfilePhoto } from '@/actions/App/Http/Controllers/CustomerProfilePhotoController';
import { update as updateProfile } from '@/actions/App/Http/Controllers/CustomerProfileUpdateController';
import type { Customer, LaravelErrorResponse, User } from '@/types/types';

type Props = {
    user: User;
    cartCount: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
    onUserUpdated: (user: User) => void;
};

type ProfilePayload = {
    user: User;
    customer: Customer | null;
};

type ProfileForm = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    gender: NonNullable<Customer['gender']>;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

export default function CustomerProfile({
    user,
    cartCount,
    onHomeClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
    onUserUpdated,
}: Props) {
    const { data, loading, refresh } = useApi<ProfilePayload>(appProfile.url());
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [form, setForm] = useState<ProfileForm>(emptyProfileForm(user));
    const [errors, setErrors] = useState<ProfileErrors>({});
    const [profileMessage, setProfileMessage] = useState('');
    const [submittingProfile, setSubmittingProfile] = useState(false);

    useEffect(() => {
        setProfilePhotoUrl(data?.customer?.profile_photo_url ?? null);
    }, [data?.customer?.profile_photo_url]);

    useEffect(() => {
        if (!data) {
            return;
        }

        setForm(profileFormFromPayload(data.user, data.customer));
        setErrors({});
        setProfileMessage('');
    }, [data]);

    if (loading) {
        return <FullPageMessage title="Loading profile" />;
    }

    const profileUser = data?.user ?? user;
    const customer = data?.customer;
    const name = customer?.name ?? profileUser.name;

    function updateField(field: keyof ProfileForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        setProfileMessage('');
    }

    async function submitProfile(event: FormEvent) {
        event.preventDefault();
        setProfileMessage('');

        const validationErrors = validateProfileForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmittingProfile(true);
        setErrors({});

        try {
            const route = updateProfile();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(form),
            });
            const payload = (await response.json()) as {
                user?: User;
                customer?: Customer | null;
                email_changed?: boolean;
            } & LaravelErrorResponse;

            if (!response.ok || !payload.user) {
                setErrors(fieldErrorsFromResponse(payload));
                setProfileMessage(
                    payload.message ?? 'Profile could not be updated.',
                );
                return;
            }

            onUserUpdated(payload.user);

            if (payload.email_changed) {
                window.history.replaceState({}, '', '/email/verify');
                return;
            }

            setForm(
                profileFormFromPayload(payload.user, payload.customer ?? null),
            );
            setProfileMessage('Profile updated.');
            await refresh(false);
        } catch {
            setProfileMessage('Profile could not be updated.');
        } finally {
            setSubmittingProfile(false);
        }
    }

    async function changeProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
        const photo = event.target.files?.[0];
        event.target.value = '';
        setPhotoError('');

        if (!photo) {
            return;
        }

        if (!photo.type.startsWith('image/')) {
            setPhotoError('Please choose an image file.');
            return;
        }

        if (photo.size > 2 * 1024 * 1024) {
            setPhotoError('Profile photo must be 2 MB or smaller.');
            return;
        }

        const formData = new FormData();
        formData.append('photo', photo);
        setUploadingPhoto(true);

        try {
            const route = storeProfilePhoto();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });
            const payload = (await response.json()) as {
                data?: Customer;
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok || !payload.data) {
                setPhotoError(
                    payload.errors?.photo?.[0] ??
                        payload.message ??
                        'Profile photo could not be changed.',
                );
                return;
            }

            setProfilePhotoUrl(payload.data.profile_photo_url ?? null);
            await refresh(false);
        } catch {
            setPhotoError('Profile photo could not be changed.');
        } finally {
            setUploadingPhoto(false);
        }
    }

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={profileUser}
                active="profile"
                cartCount={cartCount}
                onHomeClick={onHomeClick}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
                profilePhotoUrl={profilePhotoUrl}
            />

            <main className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-16">
                <header className="flex flex-col gap-6 border-b border-customer-outline-variant/30 pb-10 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-start gap-3">
                        <Avatar className="size-24 border border-customer-outline-variant/40">
                            {profilePhotoUrl && (
                                <AvatarImage
                                    src={profilePhotoUrl}
                                    alt={`${name} profile photo`}
                                    className="object-cover"
                                />
                            )}
                            <AvatarFallback className="bg-customer-primary text-2xl font-semibold text-customer-surface">
                                {initials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <input
                            id="customer-profile-photo"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={changeProfilePhoto}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingPhoto}
                            asChild
                        >
                            <label
                                className="cursor-pointer"
                                htmlFor="customer-profile-photo"
                            >
                                <Camera className="size-4" />
                                {uploadingPhoto ? 'Uploading...' : 'Change'}
                            </label>
                        </Button>
                        {photoError && (
                            <p className="max-w-48 text-xs text-destructive">
                                {photoError}
                            </p>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-label-caps font-label-caps text-customer-secondary uppercase">
                            Customer profile
                        </p>
                        <h1 className="mt-2 font-headline-md text-4xl tracking-normal md:text-5xl">
                            {name}
                        </h1>
                        <div className="mt-3 flex items-center gap-2 text-sm text-customer-secondary">
                            <BadgeCheck className="size-4" />
                            {profileUser.email_verified_at
                                ? 'Verified account'
                                : 'Email verification pending'}
                        </div>
                    </div>
                </header>

                <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section>
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="font-headline-md text-2xl">
                                Information
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-customer-secondary">
                                <Mail className="size-4" />
                                Email changes require OTP
                            </div>
                        </div>
                        <form
                            className="mt-6 grid gap-5 sm:grid-cols-2"
                            noValidate
                            onSubmit={submitProfile}
                        >
                            <ProfileInput
                                label="First name"
                                value={form.first_name}
                                error={errors.first_name}
                                onChange={(value) =>
                                    updateField('first_name', value)
                                }
                            />
                            <ProfileInput
                                label="Last name"
                                value={form.last_name}
                                error={errors.last_name}
                                onChange={(value) =>
                                    updateField('last_name', value)
                                }
                            />
                            <ProfileInput
                                label="Email"
                                type="email"
                                value={form.email}
                                error={errors.email}
                                onChange={(value) =>
                                    updateField('email', value)
                                }
                            />
                            <ProfileInput
                                label="Phone"
                                type="tel"
                                value={form.phone}
                                error={errors.phone}
                                onChange={(value) =>
                                    updateField('phone', value)
                                }
                            />
                            <div className="sm:col-span-2">
                                <ProfileInput
                                    label="Address"
                                    value={form.address}
                                    error={errors.address}
                                    onChange={(value) =>
                                        updateField('address', value)
                                    }
                                />
                            </div>
                            <ProfileInput
                                label="City"
                                value={form.city}
                                error={errors.city}
                                onChange={(value) => updateField('city', value)}
                            />
                            <ProfileInput
                                label="Country"
                                value={form.country}
                                error={errors.country}
                                onChange={(value) =>
                                    updateField('country', value)
                                }
                            />
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="profile-gender"
                                >
                                    Gender
                                </label>
                                <select
                                    id="profile-gender"
                                    className={`h-10 w-full border bg-customer-surface-container-lowest px-3 text-sm outline-none focus:border-customer-primary ${
                                        errors.gender
                                            ? 'border-destructive'
                                            : 'border-customer-outline-variant/30'
                                    }`}
                                    value={form.gender}
                                    onChange={(event) =>
                                        updateField(
                                            'gender',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">
                                        Prefer not to say
                                    </option>
                                </select>
                                {errors.gender && (
                                    <p className="text-xs text-destructive">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                                <Button disabled={submittingProfile}>
                                    {submittingProfile
                                        ? 'Saving...'
                                        : 'Save profile'}
                                </Button>
                                {profileMessage && (
                                    <p
                                        className={`text-sm ${
                                            Object.keys(errors).length > 0
                                                ? 'text-destructive'
                                                : 'text-customer-secondary'
                                        }`}
                                    >
                                        {profileMessage}
                                    </p>
                                )}
                            </div>
                        </form>
                    </section>

                    <section>
                        <h2 className="font-headline-md text-2xl">Account</h2>
                        <dl className="mt-6 space-y-5">
                            <ProfileRow
                                icon={BadgeCheck}
                                label="Gender"
                                value={formatGender(
                                    customer?.gender ?? profileUser.gender,
                                )}
                            />
                            <ProfileRow
                                icon={ShoppingBag}
                                label="Orders"
                                value={`${customer?.orders_count ?? 0} orders`}
                            />
                            <ProfileRow
                                icon={ShoppingBag}
                                label="Lifetime value"
                                value={money.format(
                                    customer?.lifetime_value ?? 0,
                                )}
                            />
                        </dl>
                    </section>
                </div>
            </main>
        </div>
    );
}

function ProfileInput({
    label,
    type = 'text',
    value,
    error,
    onChange,
}: {
    label: string;
    type?: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const id = `profile-${label.toLowerCase().replaceAll(' ', '-')}`;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={id}>
                {label}
            </label>
            <Input
                id={id}
                type={type}
                value={value}
                aria-invalid={Boolean(error)}
                className={
                    error
                        ? 'border-destructive focus-visible:border-destructive'
                        : undefined
                }
                onChange={(event) => onChange(event.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ProfileRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof BadgeCheck;
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="flex gap-4 border-b border-customer-outline-variant/20 pb-5">
            <Icon className="mt-0.5 size-5 shrink-0 text-customer-secondary" />
            <div className="min-w-0">
                <dt className="text-label-caps font-label-caps text-xs text-customer-secondary uppercase">
                    {label}
                </dt>
                <dd className="mt-1 text-base break-words">
                    {value || 'Not provided'}
                </dd>
            </div>
        </div>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function emptyProfileForm(user: User): ProfileForm {
    return {
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        city: '',
        country: '',
        gender: user.gender ?? 'prefer_not_to_say',
    };
}

function profileFormFromPayload(
    user: User,
    customer: Customer | null,
): ProfileForm {
    return {
        first_name: customer?.first_name ?? user.first_name ?? '',
        last_name: customer?.last_name ?? user.last_name ?? '',
        email: customer?.email ?? user.email,
        phone: customer?.phone ?? user.phone ?? '',
        address: customer?.address ?? user.address ?? '',
        city: customer?.city ?? '',
        country: customer?.country ?? '',
        gender: customer?.gender ?? user.gender ?? 'prefer_not_to_say',
    };
}

function validateProfileForm(form: ProfileForm): ProfileErrors {
    const errors: ProfileErrors = {};

    if (!form.first_name.trim()) errors.first_name = 'First name is required.';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) errors.phone = 'Phone is required.';
    if (!form.address.trim()) errors.address = 'Address is required.';
    if (!form.city.trim()) errors.city = 'City is required.';
    if (!form.country.trim()) errors.country = 'Country is required.';
    if (!form.gender) errors.gender = 'Gender is required.';

    return errors;
}

function fieldErrorsFromResponse(payload: LaravelErrorResponse): ProfileErrors {
    const errors: ProfileErrors = {};

    for (const [field, messages] of Object.entries(payload.errors ?? {})) {
        if (isProfileField(field)) {
            errors[field] = messages[0];
        }
    }

    return errors;
}

function isProfileField(field: string): field is keyof ProfileForm {
    return [
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'gender',
    ].includes(field);
}

function formatGender(value: Customer['gender'] | User['gender']): string {
    if (!value) {
        return 'Not provided';
    }

    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
