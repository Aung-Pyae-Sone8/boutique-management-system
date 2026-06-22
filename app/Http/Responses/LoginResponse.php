<?php

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            $user = User::where('email', $request->string(Fortify::username())->toString())->first();

            return response()->json([
                'two_factor' => false,
                'user' => $user?->fresh(),
            ]);
        }

        return redirect()->intended(Fortify::redirects('login'));
    }
}
