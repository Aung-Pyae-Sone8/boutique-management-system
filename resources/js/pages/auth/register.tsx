import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { csrfToken } from '@/const/data';
import { getJson } from '@/const/json-tanfer';
import { cn } from '@/lib/utils';
import type { LaravelErrorResponse, User } from '@/types/types';

type Props = {
    onRegistered: (user: User) => void;
    onLoginClick: () => void;
};

type RegisterField =
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'country'
    | 'gender'
    | 'password'
    | 'passwordConfirmation';

type RegisterValues = Record<RegisterField, string>;
type RegisterErrors = Partial<Record<RegisterField, string>>;

export default function Register({ onRegistered, onLoginClick }: Props) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
    const [submitting, setSubmitting] = useState(false);

    function clearFieldError(field: RegisterField) {
        setFieldErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError('');

        const validationErrors = validateRegistration({
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            country,
            gender,
            password,
            passwordConfirmation,
        });

        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/register', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    address,
                    city,
                    country,
                    gender,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            if (!response.ok) {
                const responseErrors =
                    await registrationErrorsFromResponse(response);
                setFieldErrors(responseErrors.fields);
                setError(responseErrors.message);
                return;
            }

            const payload = await userFromRegisterResponse(response);

            if (!payload.user) {
                setError(
                    'Your account was created, but we could not start the verification step. Please sign in.',
                );
                return;
            }

            window.history.replaceState({}, '', '/email/verify');
            onRegistered(payload.user);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Registration could not finish. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl rounded-lg">
                <CardHeader>
                    <CardTitle>Create customer account</CardTitle>
                    <CardDescription>
                        Sign up to browse boutique products. We will email you a
                        verification code.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" noValidate onSubmit={submit}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-first-name"
                                >
                                    First name
                                </label>
                                <Input
                                    id="register-first-name"
                                    autoComplete="given-name"
                                    aria-invalid={Boolean(
                                        fieldErrors.firstName,
                                    )}
                                    aria-describedby="register-first-name-error"
                                    className={errorBorder(
                                        fieldErrors.firstName,
                                    )}
                                    value={firstName}
                                    onChange={(event) => {
                                        setFirstName(event.target.value);
                                        clearFieldError('firstName');
                                    }}
                                />
                                <FieldError
                                    id="register-first-name-error"
                                    message={fieldErrors.firstName}
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-last-name"
                                >
                                    Last name
                                </label>
                                <Input
                                    id="register-last-name"
                                    autoComplete="family-name"
                                    aria-invalid={Boolean(fieldErrors.lastName)}
                                    aria-describedby="register-last-name-error"
                                    className={errorBorder(
                                        fieldErrors.lastName,
                                    )}
                                    value={lastName}
                                    onChange={(event) => {
                                        setLastName(event.target.value);
                                        clearFieldError('lastName');
                                    }}
                                />
                                <FieldError
                                    id="register-last-name-error"
                                    message={fieldErrors.lastName}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-email"
                                >
                                    Email
                                </label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    autoComplete="email"
                                    aria-invalid={Boolean(fieldErrors.email)}
                                    aria-describedby="register-email-error"
                                    className={errorBorder(fieldErrors.email)}
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        clearFieldError('email');
                                    }}
                                />
                                <FieldError
                                    id="register-email-error"
                                    message={fieldErrors.email}
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-phone"
                                >
                                    Phone
                                </label>
                                <Input
                                    id="register-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    aria-invalid={Boolean(fieldErrors.phone)}
                                    aria-describedby="register-phone-error"
                                    className={errorBorder(fieldErrors.phone)}
                                    value={phone}
                                    onChange={(event) => {
                                        setPhone(event.target.value);
                                        clearFieldError('phone');
                                    }}
                                />
                                <FieldError
                                    id="register-phone-error"
                                    message={fieldErrors.phone}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="register-address"
                            >
                                Address
                            </label>
                            <textarea
                                id="register-address"
                                autoComplete="street-address"
                                aria-invalid={Boolean(fieldErrors.address)}
                                aria-describedby="register-address-error"
                                className={cn(
                                    'min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    errorBorder(fieldErrors.address),
                                )}
                                value={address}
                                onChange={(event) => {
                                    setAddress(event.target.value);
                                    clearFieldError('address');
                                }}
                            />
                            <FieldError
                                id="register-address-error"
                                message={fieldErrors.address}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-city"
                                >
                                    City
                                </label>
                                <Input
                                    id="register-city"
                                    autoComplete="address-level2"
                                    aria-invalid={Boolean(fieldErrors.city)}
                                    aria-describedby="register-city-error"
                                    className={errorBorder(fieldErrors.city)}
                                    value={city}
                                    onChange={(event) => {
                                        setCity(event.target.value);
                                        clearFieldError('city');
                                    }}
                                />
                                <FieldError
                                    id="register-city-error"
                                    message={fieldErrors.city}
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-country"
                                >
                                    Country
                                </label>
                                <Input
                                    id="register-country"
                                    autoComplete="country-name"
                                    aria-invalid={Boolean(fieldErrors.country)}
                                    aria-describedby="register-country-error"
                                    className={errorBorder(fieldErrors.country)}
                                    value={country}
                                    onChange={(event) => {
                                        setCountry(event.target.value);
                                        clearFieldError('country');
                                    }}
                                />
                                <FieldError
                                    id="register-country-error"
                                    message={fieldErrors.country}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="register-gender"
                            >
                                Gender
                            </label>
                            <select
                                id="register-gender"
                                aria-invalid={Boolean(fieldErrors.gender)}
                                aria-describedby="register-gender-error"
                                className={cn(
                                    'h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    errorBorder(fieldErrors.gender),
                                )}
                                value={gender}
                                onChange={(event) => {
                                    setGender(event.target.value);
                                    clearFieldError('gender');
                                }}
                            >
                                <option value="" disabled>
                                    Select gender
                                </option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">
                                    Prefer not to say
                                </option>
                            </select>
                            <FieldError
                                id="register-gender-error"
                                message={fieldErrors.gender}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-password"
                                >
                                    Password
                                </label>
                                <Input
                                    id="register-password"
                                    type="password"
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(fieldErrors.password)}
                                    aria-describedby="register-password-error"
                                    className={errorBorder(
                                        fieldErrors.password,
                                    )}
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        clearFieldError('password');
                                    }}
                                />
                                <FieldError
                                    id="register-password-error"
                                    message={fieldErrors.password}
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="register-password-confirmation"
                                >
                                    Confirm password
                                </label>
                                <Input
                                    id="register-password-confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(
                                        fieldErrors.passwordConfirmation,
                                    )}
                                    aria-describedby="register-password-confirmation-error"
                                    className={errorBorder(
                                        fieldErrors.passwordConfirmation,
                                    )}
                                    value={passwordConfirmation}
                                    onChange={(event) => {
                                        setPasswordConfirmation(
                                            event.target.value,
                                        );
                                        clearFieldError('passwordConfirmation');
                                    }}
                                />
                                <FieldError
                                    id="register-password-confirmation-error"
                                    message={fieldErrors.passwordConfirmation}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button className="w-full" disabled={submitting}>
                            {submitting
                                ? 'Creating account...'
                                : 'Create account'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Button
                            className="h-auto p-0"
                            type="button"
                            variant="link"
                            onClick={onLoginClick}
                        >
                            Sign in
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function errorBorder(message: string | undefined): string | undefined {
    return message
        ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
        : undefined;
}

function FieldError({
    id,
    message,
}: {
    id: string;
    message: string | undefined;
}) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="text-xs text-destructive" aria-live="polite">
            {message}
        </p>
    );
}

function validateRegistration(values: RegisterValues): RegisterErrors {
    const errors: RegisterErrors = {};
    const requiredFields: Array<[RegisterField, string]> = [
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['address', 'Address'],
        ['city', 'City'],
        ['country', 'Country'],
        ['gender', 'Gender'],
        ['password', 'Password'],
        ['passwordConfirmation', 'Password confirmation'],
    ];

    for (const [field, label] of requiredFields) {
        if (!values[field].trim()) {
            errors[field] = `${label} is required.`;
        }
    }

    if (
        values.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
        errors.email = 'Enter a valid email address.';
    }

    if (values.firstName.length > 100) {
        errors.firstName = 'First name must be 100 characters or fewer.';
    }

    if (values.lastName.length > 100) {
        errors.lastName = 'Last name must be 100 characters or fewer.';
    }

    if (values.phone.length > 50) {
        errors.phone = 'Phone must be 50 characters or fewer.';
    }

    if (values.address.length > 1000) {
        errors.address = 'Address must be 1,000 characters or fewer.';
    }

    if (values.city.length > 100) {
        errors.city = 'City must be 100 characters or fewer.';
    }

    if (values.country.length > 100) {
        errors.country = 'Country must be 100 characters or fewer.';
    }

    if (values.password && values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    }

    if (
        values.passwordConfirmation &&
        values.password !== values.passwordConfirmation
    ) {
        errors.passwordConfirmation = 'Password confirmation must match.';
    }

    return errors;
}

async function registrationErrorsFromResponse(response: Response): Promise<{
    fields: RegisterErrors;
    message: string;
}> {
    if (response.status === 419) {
        return {
            fields: {},
            message: 'Your session expired. Refresh the page and try again.',
        };
    }

    try {
        const payload = (await response.json()) as LaravelErrorResponse;
        const fieldMap: Record<string, RegisterField> = {
            first_name: 'firstName',
            last_name: 'lastName',
            email: 'email',
            phone: 'phone',
            address: 'address',
            city: 'city',
            country: 'country',
            gender: 'gender',
            password: 'password',
            password_confirmation: 'passwordConfirmation',
        };
        const fields: RegisterErrors = {};

        for (const [serverField, messages] of Object.entries(
            payload.errors ?? {},
        )) {
            const field = fieldMap[serverField];

            if (field && messages[0]) {
                fields[field] = messages[0];
            }
        }

        return {
            fields,
            message:
                Object.keys(fields).length === 0
                    ? (payload.message ??
                      'Unable to create your account. Check the form and try again.')
                    : '',
        };
    } catch {
        return {
            fields: {},
            message:
                'Unable to create your account. Check the form and try again.',
        };
    }
}

async function userFromRegisterResponse(
    response: Response,
): Promise<{ user: User | null }> {
    const text = await response.text();

    if (!text) {
        return getJson<{ user: User | null }>('/app/user');
    }

    try {
        return JSON.parse(text) as { user: User | null };
    } catch {
        return getJson<{ user: User | null }>('/app/user');
    }
}
