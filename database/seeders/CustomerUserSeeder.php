<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerUserSeeder extends Seeder
{
    /**
     * Seed the default customer user account.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'customer@boutique.test'],
            [
                'name' => 'Boutique Customer',
                'role' => 'customer',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
