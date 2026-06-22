<?php

namespace App\Providers;

use App\Notifications\LoginSuccessfulNotification;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Event::listen(function (Login $event): void {
        //     if ($event->user instanceof MustVerifyEmail && ! $event->user->hasVerifiedEmail()) {
        //         return;
        //     }

        //     Notification::route('mail', 'aungps.dev@gmail.com')
        //         ->notify(new LoginSuccessfulNotification(
        //             user: $event->user,
        //             ipAddress: request()->ip(),
        //             userAgent: request()->userAgent(),
        //             loggedInAt: now()->toDateTimeString(),
        //         ));
        // });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
