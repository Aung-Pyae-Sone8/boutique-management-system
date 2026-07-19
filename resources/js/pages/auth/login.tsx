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
import type { LaravelErrorResponse, User } from '@/types/types';

type Props = {
    onLogin: (user: User) => void;
    onRegisterClick: () => void;
};

type LoginErrors = Partial<Record<'email' | 'password', string>>;

export default function Login({ onLogin, onRegisterClick }: Props) {
    const [email, setEmail] = useState('admin@boutique.test');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
    const [submitting, setSubmitting] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError('');

        const validationErrors = validateLogin(email, password);
        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const responseErrors = await loginErrorsFromResponse(response);
                setFieldErrors(responseErrors.fields);
                setError(responseErrors.message);
                return;
            }

            const payload = await userFromLoginResponse(response);

            if (!payload.user) {
                setError(
                    'Signed in, but the user session could not be loaded. Refresh and try again.',
                );
                return;
            }

            onLogin(payload.user);
            window.history.replaceState(
                {},
                '',
                payload.user.role === 'admin' ? '/dashboard' : '/customer',
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Unable to sign in. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-md rounded-lg">
                <CardHeader>
                    <CardTitle>Boutique Login</CardTitle>
                    <CardDescription>
                        Admins go to the dashboard. Customers go to the shop
                        page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" noValidate onSubmit={submit}>
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                                aria-describedby="login-email-error"
                                className={errorBorder(fieldErrors.email)}
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setFieldErrors((current) => ({
                                        ...current,
                                        email: undefined,
                                    }));
                                }}
                            />
                            <FieldError
                                id="login-email-error"
                                message={fieldErrors.email}
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={Boolean(fieldErrors.password)}
                                aria-describedby="login-password-error"
                                className={errorBorder(fieldErrors.password)}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setFieldErrors((current) => ({
                                        ...current,
                                        password: undefined,
                                    }));
                                }}
                            />
                            <FieldError
                                id="login-password-error"
                                message={fieldErrors.password}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <Button className="w-full" disabled={submitting}>
                            {submitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        New customer?{' '}
                        <Button
                            className="h-auto p-0"
                            type="button"
                            variant="link"
                            onClick={onRegisterClick}
                        >
                            Create an account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function validateLogin(email: string, password: string): LoginErrors {
    const errors: LoginErrors = {};

    if (!email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    if (!password) {
        errors.password = 'Password is required.';
    }

    return errors;
}

function errorBorder(message: string | undefined): string | undefined {
    return message
        ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
        : undefined;
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="text-xs text-destructive" aria-live="polite">
            {message}
        </p>
    );
}

async function loginErrorsFromResponse(response: Response): Promise<{
    fields: LoginErrors;
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
        const fields: LoginErrors = {
            email: payload.errors?.email?.[0],
            password: payload.errors?.password?.[0],
        };
        const hasFieldErrors = Boolean(fields.email || fields.password);

        return {
            fields,
            message: hasFieldErrors
                ? ''
                : (payload.message ??
                  'Unable to sign in. Check your email and password.'),
        };
    } catch {
        return {
            fields: {},
            message: 'Unable to sign in. Check your email and password.',
        };
    }
}

async function userFromLoginResponse(
    response: Response,
): Promise<{ user: User | null }> {
    const text = await response.text();

    if (!text) {
        return getJson<{ user: User | null }>('/app/user');
    }

    try {
        const payload = JSON.parse(text) as { user?: User | null };

        if ('user' in payload) {
            return { user: payload.user ?? null };
        }
    } catch {
        return getJson<{ user: User | null }>('/app/user');
    }

    return getJson<{ user: User | null }>('/app/user');
}
