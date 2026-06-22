<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illumina\Support\Facades\Notification;
use Illuminate\Http\Request;

// use App\Notifications\SendOtpNotification;

class LoginController extends Controller
{
    // public function login(Request $request) {
    //     $credentials = $request->validate([
    //         'email' => ['required', 'email'],
    //         'password' => ['required'],
    //     ]);

    //     $otp = random_int(100000, 999999);
    //     Notification::send('apyae8263@gmail.com', new SendOtpNotification($otp));

    //     if (Auth::attempt($credentials)) {
    //         $request->session()->regenerate();
    //         return "hello world"
    //         // return redirect()->intended('dashboard');
    //     }

    //     // $otp = random_int(100000, 999999);
    //     // Notification::send('apyae8263@gmail.com', new SendOtpNotification($otp));
    //     return back()->withErrors(['email' => 'The provided credentials do not match our records.']);
    // }
}
