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
import type { LaravelErrorResponse, User } from '@/types/types';

type Props = {
    user: User;
    onVerified: (user: User) => void;
};

export default function VerifyEmailOtp({ user, onVerified }: Props) {
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState(`We sent a verification code to ${user.email}.`);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const response = await sendOtpRequest('/email/otp/verify', { otp });

        if (!response.ok) {
            setError(await errorMessageFromResponse(response, 'Unable to verify this code.'));
            setSubmitting(false);
            return;
        }

        const payload = (await response.json()) as { user: User };
        onVerified(payload.user);
        window.history.replaceState({}, '', payload.user.role === 'admin' ? '/dashboard' : '/customer');
        setSubmitting(false);
    }

    async function resend() {
        setResending(true);
        setError('');

        const response = await sendOtpRequest('/email/otp/resend');

        if (!response.ok) {
            setError(await errorMessageFromResponse(response, 'Unable to send a new code.'));
            setResending(false);
            return;
        }

        setMessage(`A new verification code was sent to ${user.email}.`);
        setResending(false);
    }

    return (
        <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-md rounded-lg">
                <CardHeader>
                    <CardTitle>Verify your email</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email-otp">
                                Verification code
                            </label>
                            <Input
                                id="email-otp"
                                inputMode="numeric"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button className="w-full" disabled={submitting || otp.length !== 6}>
                            {submitting ? 'Verifying...' : 'Verify email'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Button className="h-auto p-0" type="button" variant="link" onClick={resend} disabled={resending}>
                            {resending ? 'Sending...' : 'Send a new code'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function sendOtpRequest(url: string, data?: unknown) {
    return fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: data ? JSON.stringify(data) : undefined,
    });
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
