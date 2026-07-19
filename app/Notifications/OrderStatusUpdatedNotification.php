<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Order $order,
        public string $previousStatus,
        public string $previousPaymentStatus,
    ) {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Order {$this->order->order_number} status updated")
            ->greeting('Your order has been updated')
            ->line("Order ID: {$this->order->id}")
            ->line("Order number: {$this->order->order_number}")
            ->line('Amount: '.number_format((float) $this->order->total, 2).' MMK')
            ->line("Order status: {$this->previousStatus} -> {$this->order->status}")
            ->line("Payment status: {$this->previousPaymentStatus} -> {$this->order->payment_status}");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'amount' => (float) $this->order->total,
            'previous_status' => $this->previousStatus,
            'status' => $this->order->status,
            'previous_payment_status' => $this->previousPaymentStatus,
            'payment_status' => $this->order->payment_status,
        ];
    }
}
