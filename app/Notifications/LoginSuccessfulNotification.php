<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoginSuccessfulNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(
        private readonly User $user,
        private readonly ?string $ipAddress,
        private readonly ?string $userAgent,
        private readonly string $loggedInAt,
    ) {}

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
            ->subject('Boutique System Login Alert')
            ->greeting('Login detected')
            ->line("{$this->user->name} logged in to the boutique system.")
            ->line("Email: {$this->user->email}")
            ->line("Role: {$this->user->role}")
            ->line("IP address: {$this->ipAddress}")
            ->line("User agent: {$this->userAgent}")
            ->line("Login time: {$this->loggedInAt}");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'role' => $this->user->role,
            'ip_address' => $this->ipAddress,
            'logged_in_at' => $this->loggedInAt,
        ];
    }
}
