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
    onRegistered: (user: User) => void;
    onLoginClick: () => void;
};

export default function Register({ onRegistered, onLoginClick }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

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
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            if (!response.ok) {
                const message = await errorMessageFromResponse(
                    response,
                    'Unable to create your account. Check the form and try again.',
                );
                setError(message);
                return;
            }

            const payload = await userFromRegisterResponse(response);

            if (!payload.user) {
                setError('Your account was created, but we could not start the verification step. Please sign in.');
                return;
            }

            window.history.replaceState({}, '', '/email/verify');
            onRegistered(payload.user);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Registration could not finish. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-md rounded-lg">
                <CardHeader>
                    <CardTitle>Create customer account</CardTitle>
                    <CardDescription>Sign up to browse boutique products. We will email you a verification code.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="register-name">
                                Name
                            </label>
                            <Input
                                id="register-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="register-email">
                                Email
                            </label>
                            <Input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="register-password">
                                Password
                            </label>
                            <Input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="register-password-confirmation">
                                Confirm password
                            </label>
                            <Input
                                id="register-password-confirmation"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(event) => setPasswordConfirmation(event.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button className="w-full" disabled={submitting}>
                            {submitting ? 'Creating account...' : 'Create account'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Button className="h-auto p-0" type="button" variant="link" onClick={onLoginClick}>
                            Sign in
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function errorMessageFromResponse(response: Response, fallback: string) {
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

async function userFromRegisterResponse(response: Response): Promise<{ user: User | null }> {
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
