<?php

namespace App\Models;

use App\Notifications\VerifyEmailOtp;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailBehavior;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string $email
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $gender
 * @property string $role
 * @property Carbon|null $email_verified_at
 * @property string|null $email_otp_code
 * @property Carbon|null $email_otp_expires_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'first_name', 'last_name', 'email', 'phone', 'address', 'gender', 'role', 'password', 'email_otp_code', 'email_otp_expires_at'])]
#[Hidden(['password', 'email_otp_code', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, MustVerifyEmailBehavior, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * @return HasOne<Customer, $this>
     */
    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function sendEmailVerificationNotification(): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        $this->forceFill([
            'email_otp_code' => Hash::make($code),
            'email_otp_expires_at' => $expiresAt,
        ])->save();

        $this->notify(new VerifyEmailOtp($code, $expiresAt));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
