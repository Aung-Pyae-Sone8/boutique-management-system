<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmailOtpVerificationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['user' => $user]);
        }

        if (! $user->email_otp_code || ! $user->email_otp_expires_at || $user->email_otp_expires_at->isPast()) {
            return $this->invalidOtp('This verification code has expired. Please request a new code.');
        }

        if (! Hash::check($request->string('otp')->toString(), $user->email_otp_code)) {
            return $this->invalidOtp('The verification code is incorrect.');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $user->forceFill([
            'email_otp_code' => null,
            'email_otp_expires_at' => null,
        ])->save();

        return response()->json(['user' => $user->fresh()]);
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'A new verification code has been sent.',
        ]);
    }

    private function invalidOtp(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => [
                'otp' => [$message],
            ],
        ], 422);
    }
}
