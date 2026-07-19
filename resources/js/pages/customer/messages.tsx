import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import FullPageMessage from '@/components/full-page-message';
import { Button } from '@/components/ui/button';
import { getJson, sendJson } from '@/const/json-tanfer';
import useApi from '@/hooks/use-api';
import {
    show as customerChatShow,
    store as customerChatStore,
} from '@/routes/app/customer/chat';
import type { ChatThread, User } from '@/types/types';

type Props = {
    user: User;
    cartCount: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerMessages({
    user,
    cartCount,
    onHomeClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const chatUrl = customerChatShow.url();
    const { data, loading } = useApi<{
        data: ChatThread;
    }>(chatUrl);
    const [thread, setThread] = useState<ChatThread | null>(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.title = 'Messages - Boutique';
    }, []);

    useEffect(() => {
        setThread(data?.data ?? null);
    }, [data]);

    useEffect(() => {
        let isCancelled = false;
        let isPolling = false;

        async function pollMessages() {
            if (document.hidden || isPolling) {
                return;
            }

            isPolling = true;

            try {
                const response = await getJson<{ data: ChatThread }>(chatUrl);

                if (!isCancelled) {
                    setThread(response.data);
                }
            } catch {
                // Keep the current conversation visible if one live update fails.
            } finally {
                isPolling = false;
            }
        }

        const intervalId = window.setInterval(() => {
            void pollMessages();
        }, 3000);
        const onVisibilityChange = () => {
            if (!document.hidden) {
                void pollMessages();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            isCancelled = true;
            window.clearInterval(intervalId);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
    }, [chatUrl]);

    useEffect(() => {
        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }, [thread?.messages?.length]);

    async function submit(event: FormEvent) {
        event.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            setError('Please write a message before sending.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await sendJson<{ data: ChatThread }>(
                customerChatStore.url(),
                'POST',
                { message: trimmedMessage },
            );

            setThread(response.data);
            setMessage('');
        } catch {
            setError('Message could not be sent. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <FullPageMessage title="Loading messages" />;
    }

    const messages = thread?.messages ?? [];

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="messages"
                cartCount={cartCount}
                onHomeClick={onHomeClick}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
            />

            <main className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
                <header className="mb-8 flex flex-col gap-4 border-b border-customer-outline-variant/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="text-label-caps font-label-caps text-customer-secondary uppercase">
                            Support
                        </span>
                        <h1 className="mt-3 font-headline-md text-4xl tracking-normal md:text-5xl">
                            Messages
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-customer-secondary">
                            Send questions about orders, payment, sizing, or
                            boutique products to the admin team.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-customer-secondary">
                        <span className="size-2 rounded-full bg-green-600" />
                        Live updates
                    </div>
                </header>

                <section className="border border-customer-outline-variant/20 bg-customer-surface-container-lowest">
                    <div
                        ref={messagesContainerRef}
                        className="max-h-[60vh] min-h-96 space-y-4 overflow-y-auto p-5"
                    >
                        {messages.length === 0 ? (
                            <div className="grid min-h-80 place-items-center text-center">
                                <div>
                                    <MessageSquareText className="mx-auto mb-4 size-10 text-customer-secondary" />
                                    <p className="font-headline-md text-2xl">
                                        No messages yet
                                    </p>
                                    <p className="mt-2 text-sm text-customer-secondary">
                                        Start a conversation with the admin
                                        team.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((chatMessage) => {
                                const isCustomer =
                                    chatMessage.sender_role === 'customer';

                                return (
                                    <article
                                        key={chatMessage.id}
                                        className={`flex ${
                                            isCustomer
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[82%] border p-4 text-sm ${
                                                isCustomer
                                                    ? 'border-customer-primary bg-customer-primary text-customer-surface'
                                                    : 'border-customer-outline-variant/20 bg-customer-surface'
                                            }`}
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-4 text-xs opacity-80">
                                                <span>
                                                    {isCustomer
                                                        ? 'You'
                                                        : (chatMessage.sender_name ??
                                                          'Admin')}
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        chatMessage.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="leading-6 whitespace-pre-wrap">
                                                {chatMessage.message}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>

                    <form
                        className="border-t border-customer-outline-variant/20 p-5"
                        onSubmit={submit}
                    >
                        <label className="sr-only" htmlFor="customer-message">
                            Message
                        </label>
                        <textarea
                            id="customer-message"
                            className="min-h-28 w-full border border-customer-outline-variant/30 bg-customer-surface px-4 py-3 text-sm outline-none focus-visible:border-customer-primary"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Write your message"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-destructive">
                                {error}
                            </p>
                        )}
                        <div className="mt-4 flex justify-end">
                            <Button disabled={submitting}>
                                <Send className="size-4" />
                                {submitting ? 'Sending...' : 'Send message'}
                            </Button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}
