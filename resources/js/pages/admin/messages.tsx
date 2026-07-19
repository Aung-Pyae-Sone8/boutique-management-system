import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import FullPageMessage from '@/components/full-page-message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getJson, sendJson } from '@/const/json-tanfer';
import useApi from '@/hooks/use-api';
import {
    index as adminChatIndex,
    show as adminChatShow,
    status as adminChatStatus,
    store as adminChatStore,
} from '@/routes/app/admin/chat';
import type { ChatThread, Paginated } from '@/types/types';

export default function AdminMessages() {
    const inboxUrl = adminChatIndex.url();
    const { data, loading } = useApi<Paginated<ChatThread>>(inboxUrl);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(
        null,
    );
    const [loadingThread, setLoadingThread] = useState(false);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setThreads(data?.data ?? []);
    }, [data]);

    useEffect(() => {
        if (selectedThread || threads.length === 0) {
            return;
        }

        void openThread(threads[0]);
    }, [selectedThread, threads]);

    useEffect(() => {
        let isCancelled = false;
        let isPolling = false;

        async function pollInbox() {
            if (document.hidden || isPolling) {
                return;
            }

            isPolling = true;

            try {
                const response = await getJson<Paginated<ChatThread>>(inboxUrl);

                if (!isCancelled) {
                    setThreads(response.data);
                }
            } catch {
                // Keep the current inbox visible if one live update fails.
            } finally {
                isPolling = false;
            }
        }

        const intervalId = window.setInterval(() => {
            void pollInbox();
        }, 3000);
        const onVisibilityChange = () => {
            if (!document.hidden) {
                void pollInbox();
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
    }, [inboxUrl]);

    useEffect(() => {
        if (!selectedThread) {
            return;
        }

        const selectedThreadId = selectedThread.id;
        let isCancelled = false;
        let isPolling = false;

        async function pollSelectedThread() {
            if (document.hidden || isPolling) {
                return;
            }

            isPolling = true;

            try {
                const response = await getJson<{ data: ChatThread }>(
                    adminChatShow.url(selectedThreadId),
                );

                if (!isCancelled) {
                    setSelectedThread(response.data);
                    setThreads((current) =>
                        current.map((thread) =>
                            thread.id === response.data.id
                                ? response.data
                                : thread,
                        ),
                    );
                }
            } catch {
                // Keep the selected conversation visible if one live update fails.
            } finally {
                isPolling = false;
            }
        }

        const intervalId = window.setInterval(() => {
            void pollSelectedThread();
        }, 2500);
        const onVisibilityChange = () => {
            if (!document.hidden) {
                void pollSelectedThread();
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
    }, [selectedThread?.id]);

    useEffect(() => {
        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }, [selectedThread?.messages?.length]);

    const openThreads = useMemo(
        () => threads.filter((thread) => thread.status === 'open').length,
        [threads],
    );
    const unreadThreads = useMemo(
        () => threads.filter((thread) => thread.admin_unread_count > 0).length,
        [threads],
    );

    async function openThread(thread: ChatThread) {
        setLoadingThread(true);
        setError('');

        try {
            const response = await getJson<{ data: ChatThread }>(
                adminChatShow.url(thread.id),
            );

            setSelectedThread(response.data);
            setThreads((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? { ...item, admin_unread_count: 0 }
                        : item,
                ),
            );
        } catch {
            setError('Conversation could not be loaded.');
        } finally {
            setLoadingThread(false);
        }
    }

    async function submit(event: FormEvent) {
        event.preventDefault();

        if (!selectedThread) {
            return;
        }

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            setError('Please write a reply before sending.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await sendJson<{ data: ChatThread }>(
                adminChatStore.url(selectedThread.id),
                'POST',
                { message: trimmedMessage },
            );

            setSelectedThread(response.data);
            setMessage('');
            setThreads((current) =>
                current.map((thread) =>
                    thread.id === response.data.id ? response.data : thread,
                ),
            );
        } catch {
            setError('Reply could not be sent. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    async function updateStatus(status: ChatThread['status']) {
        if (!selectedThread) {
            return;
        }

        const response = await sendJson<{ data: ChatThread }>(
            adminChatStatus.url(selectedThread.id),
            'POST',
            { status },
        );

        setSelectedThread(response.data);
        setThreads((current) =>
            current.map((thread) =>
                thread.id === response.data.id ? response.data : thread,
            ),
        );
    }

    if (loading) {
        return <FullPageMessage title="Loading messages" />;
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Messages</h1>
                    <p className="text-sm text-muted-foreground">
                        Reply to customer support conversations.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-2 rounded-full bg-green-600" />
                    Live updates
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Conversations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {threads.length}
                    </CardContent>
                </Card>
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Open
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {openThreads}
                    </CardContent>
                </Card>
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Needs reply
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {unreadThreads}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle>Inbox</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {threads.length === 0 ? (
                            <div className="grid min-h-72 place-items-center text-center text-sm text-muted-foreground">
                                <div>
                                    <MessageSquareText className="mx-auto mb-3 size-8" />
                                    No customer messages yet.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {threads.map((thread) => (
                                    <button
                                        key={thread.id}
                                        type="button"
                                        onClick={() => void openThread(thread)}
                                        className={`w-full rounded-md border p-3 text-left transition-colors ${
                                            selectedThread?.id === thread.id
                                                ? 'border-primary bg-muted'
                                                : 'hover:bg-muted/70'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <CustomerAvatar
                                                    name={
                                                        thread.customer?.name ??
                                                        'Customer'
                                                    }
                                                    photoUrl={
                                                        thread.customer
                                                            ?.profile_photo_url
                                                    }
                                                    className="size-10"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {thread.customer
                                                            ?.name ??
                                                            'Customer'}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                                        {thread.customer
                                                            ?.email ??
                                                            'No email'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Badge
                                                    variant={
                                                        thread.status === 'open'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {thread.status}
                                                </Badge>
                                                {thread.admin_unread_count >
                                                    0 && (
                                                    <Badge variant="destructive">
                                                        {
                                                            thread.admin_unread_count
                                                        }
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Last message{' '}
                                            {formatDate(thread.last_message_at)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-lg">
                    <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            {selectedThread && (
                                <CustomerAvatar
                                    name={
                                        selectedThread.customer?.name ??
                                        'Customer'
                                    }
                                    photoUrl={
                                        selectedThread.customer
                                            ?.profile_photo_url
                                    }
                                    className="size-11"
                                />
                            )}
                            <div className="min-w-0">
                                <CardTitle className="truncate">
                                    {selectedThread?.customer?.name ??
                                        'Conversation'}
                                </CardTitle>
                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                    {selectedThread?.customer?.email ??
                                        'Select a conversation to reply.'}
                                </p>
                            </div>
                        </div>
                        {selectedThread && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    void updateStatus(
                                        selectedThread.status === 'open'
                                            ? 'closed'
                                            : 'open',
                                    )
                                }
                            >
                                {selectedThread.status === 'open'
                                    ? 'Close'
                                    : 'Reopen'}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loadingThread ? (
                            <div className="grid min-h-96 place-items-center text-sm text-muted-foreground">
                                Loading conversation
                            </div>
                        ) : !selectedThread ? (
                            <div className="grid min-h-96 place-items-center text-center text-sm text-muted-foreground">
                                <div>
                                    <MessageSquareText className="mx-auto mb-3 size-8" />
                                    Select a conversation.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    ref={messagesContainerRef}
                                    className="max-h-[58vh] min-h-96 space-y-4 overflow-y-auto rounded-md border p-4"
                                >
                                    {(selectedThread.messages ?? []).map(
                                        (chatMessage) => {
                                            const isAdmin =
                                                chatMessage.sender_role ===
                                                'admin';

                                            return (
                                                <article
                                                    key={chatMessage.id}
                                                    className={`flex ${
                                                        isAdmin
                                                            ? 'justify-end'
                                                            : 'justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[82%] rounded-md border p-3 text-sm ${
                                                            isAdmin
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'bg-muted'
                                                        }`}
                                                    >
                                                        <div className="mb-2 flex items-center justify-between gap-4 text-xs opacity-80">
                                                            <span>
                                                                {isAdmin
                                                                    ? 'Admin'
                                                                    : (chatMessage.sender_name ??
                                                                      'Customer')}
                                                            </span>
                                                            <span>
                                                                {formatDate(
                                                                    chatMessage.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p className="leading-6 whitespace-pre-wrap">
                                                            {
                                                                chatMessage.message
                                                            }
                                                        </p>
                                                    </div>
                                                </article>
                                            );
                                        },
                                    )}
                                </div>

                                <form className="mt-4" onSubmit={submit}>
                                    <label className="sr-only" htmlFor="reply">
                                        Reply
                                    </label>
                                    <textarea
                                        id="reply"
                                        className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        value={message}
                                        onChange={(event) =>
                                            setMessage(event.target.value)
                                        }
                                        placeholder="Write a reply"
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-destructive">
                                            {error}
                                        </p>
                                    )}
                                    <div className="mt-3 flex justify-end">
                                        <Button disabled={submitting}>
                                            <Send className="size-4" />
                                            {submitting
                                                ? 'Sending...'
                                                : 'Send reply'}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'never';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function CustomerAvatar({
    name,
    photoUrl,
    className,
}: {
    name: string;
    photoUrl?: string | null;
    className?: string;
}) {
    return (
        <Avatar className={`border ${className ?? ''}`}>
            {photoUrl && (
                <AvatarImage
                    src={photoUrl}
                    alt={`${name} profile photo`}
                    className="object-cover"
                />
            )}
            <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
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
