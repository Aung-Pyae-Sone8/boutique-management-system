<?php

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            $user = User::where('email', $request->string(Fortify::username())->toString())->first();

            return response()->json([
                'user' => $user?->fresh(),
            ], 201);
        }

        return redirect()->intended(Fortify::redirects('register'));
    }
}
