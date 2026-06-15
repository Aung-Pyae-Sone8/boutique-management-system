<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default admin user account.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@boutique.test'],
            [
                'name' => 'Boutique Admin',
                'role' => 'admin',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
