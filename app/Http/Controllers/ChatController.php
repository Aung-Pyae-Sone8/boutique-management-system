<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatThreadResource;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class ChatController extends Controller
{
    public function customerShow(Request $request): ChatThreadResource
    {
        $customer = $request->user()->customer;

        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => 'A customer profile is required before using chat.',
            ]);
        }

        $thread = $customer->chatThread()
            ->with(['customer', 'messages.sender'])
            ->first();

        if (! $thread) {
            $thread = $customer->chatThread()->create([
                'subject' => 'Support conversation',
                'status' => 'open',
            ])->load(['customer', 'messages.sender']);
        }

        $this->markCustomerMessagesRead($thread);

        return ChatThreadResource::make($thread->refresh()->load(['customer', 'messages.sender']));
    }

    public function customerStore(Request $request): ChatThreadResource
    {
        $customer = $request->user()->customer;

        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => 'A customer profile is required before using chat.',
            ]);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $thread = DB::transaction(function () use ($customer, $data, $request): ChatThread {
            $thread = $customer->chatThread()->firstOrCreate(
                [],
                [
                    'subject' => 'Support conversation',
                    'status' => 'open',
                ]
            );

            $thread->messages()->create([
                'sender_id' => $request->user()->id,
                'sender_role' => 'customer',
                'message' => $data['message'],
            ]);

            $thread->forceFill([
                'status' => 'open',
                'admin_unread_count' => $thread->admin_unread_count + 1,
                'last_message_at' => now(),
            ])->save();

            return $thread;
        });

        return ChatThreadResource::make($thread->load(['customer', 'messages.sender']));
    }

    public function adminIndex(Request $request): AnonymousResourceCollection
    {
        $this->abortUnlessAdmin($request->user());

        return ChatThreadResource::collection(
            ChatThread::query()
                ->with(['customer'])
                ->withCount('messages')
                ->latest('last_message_at')
                ->latest()
                ->paginate(20)
        );
    }

    public function adminShow(Request $request, ChatThread $thread): ChatThreadResource
    {
        $this->abortUnlessAdmin($request->user());
        $this->markAdminMessagesRead($thread);

        return ChatThreadResource::make($thread->refresh()->load(['customer', 'messages.sender']));
    }

    public function adminStore(Request $request, ChatThread $thread): ChatThreadResource
    {
        $this->abortUnlessAdmin($request->user());

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($thread, $data, $request): void {
            $thread->messages()->create([
                'sender_id' => $request->user()->id,
                'sender_role' => 'admin',
                'message' => $data['message'],
            ]);

            $thread->forceFill([
                'status' => 'open',
                'customer_unread_count' => $thread->customer_unread_count + 1,
                'last_message_at' => now(),
            ])->save();
        });

        return ChatThreadResource::make($thread->refresh()->load(['customer', 'messages.sender']));
    }

    public function adminStatus(Request $request, ChatThread $thread): ChatThreadResource
    {
        $this->abortUnlessAdmin($request->user());

        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'closed'])],
        ]);

        $thread->update(['status' => $data['status']]);

        return ChatThreadResource::make($thread->load(['customer', 'messages.sender']));
    }

    private function abortUnlessAdmin(?User $user): void
    {
        abort_unless($user?->isAdmin(), Response::HTTP_FORBIDDEN);
    }

    private function markCustomerMessagesRead(ChatThread $thread): void
    {
        $thread->messages()
            ->where('sender_role', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $thread->forceFill(['customer_unread_count' => 0])->save();
    }

    private function markAdminMessagesRead(ChatThread $thread): void
    {
        $thread->messages()
            ->where('sender_role', 'customer')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $thread->forceFill(['admin_unread_count' => 0])->save();
    }
}
