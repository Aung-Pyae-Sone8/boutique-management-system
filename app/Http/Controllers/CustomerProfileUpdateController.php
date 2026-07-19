<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCustomerProfileRequest;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class CustomerProfileUpdateController extends Controller
{
    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => 'A customer profile is required before updating profile information.',
            ]);
        }

        $emailChanged = $user->email !== $data['email'];
        $name = trim($data['first_name'].' '.$data['last_name']);

        $user->forceFill([
            'name' => $name,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'address' => $data['address'],
            'gender' => $data['gender'],
        ]);

        if ($emailChanged) {
            $user->markEmailAsUnverified();
        }

        $user->save();

        $customer->forceFill([
            ...Arr::only($data, ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'country', 'gender']),
            'name' => $name,
        ])->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'user' => $user->fresh(),
            'customer' => CustomerResource::make(
                $customer->refresh()
                    ->loadCount('orders')
                    ->loadSum('orders', 'total'),
            ),
            'email_changed' => $emailChanged,
        ]);
    }
}
