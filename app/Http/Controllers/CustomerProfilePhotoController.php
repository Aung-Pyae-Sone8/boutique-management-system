<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCustomerProfilePhotoRequest;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CustomerProfilePhotoController extends Controller
{
    public function store(UpdateCustomerProfilePhotoRequest $request): JsonResponse
    {
        $customer = $request->user()->customer;

        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => 'A customer profile is required before uploading a profile photo.',
            ]);
        }

        $previousPath = $customer->profile_photo_path;
        $path = $request->file('photo')->storePublicly(
            "profile-photos/customer-{$customer->id}",
            'public',
        );

        $customer->forceFill([
            'profile_photo_path' => $path,
        ])->save();

        if ($previousPath) {
            Storage::disk('public')->delete($previousPath);
        }

        return response()->json([
            'data' => CustomerResource::make($customer->refresh()),
        ]);
    }
}
