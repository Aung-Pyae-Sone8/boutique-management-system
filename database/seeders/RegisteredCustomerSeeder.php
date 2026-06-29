<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class RegisteredCustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::query()
            ->where('role', 'customer')
            ->eachById(function (User $user): void {
                $customer = Customer::query()
                    ->where('user_id', $user->id)
                    ->orWhere('email', $user->email)
                    ->firstOrNew();

                $customer->fill([
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ])->save();
            });
    }
}
