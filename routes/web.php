<?php

use App\Http\Controllers\Auth\EmailOtpVerificationController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CustomerCheckoutController;
use App\Http\Controllers\CustomerOrderHistoryController;
use App\Http\Controllers\CustomerProfileController;
use App\Http\Controllers\CustomerProfilePhotoController;
use App\Http\Controllers\CustomerProfileUpdateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/app/user', fn (Request $request) => response()->json([
    'user' => $request->user(),
]))->name('app.user');

Route::view('/', 'app')->name('home');

Route::middleware(['auth', 'throttle:6,1'])->group(function (): void {
    Route::post('/email/otp/verify', [EmailOtpVerificationController::class, 'store'])->name('email.otp.verify');
    Route::post('/email/otp/resend', [EmailOtpVerificationController::class, 'resend'])->name('email.otp.resend');
});

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::view('/dashboard', 'app')->name('dashboard');
    Route::view('/customer', 'app')->name('customer.home');
    Route::view('/customer/shop', 'app')->name('customer.shop');
    Route::view('/customer/cart', 'app')->name('customer.cart');
    Route::view('/customer/messages', 'app')->name('customer.messages');
    Route::view('/customer/checkout', 'app')->name('customer.checkout');
    Route::post('/customer/checkout', [CustomerCheckoutController::class, 'store'])->name('customer.checkout.store');
    Route::view('/customer/orders', 'app')->name('customer.orders');
    Route::view('/customer/orders/{order}', 'app')->name('customer.orders.show');
    Route::view('/customer/profile', 'app')->name('customer.profile');
    Route::view('/customer/products/{product}', 'app')->name('customer.products.show');
    Route::get('/app/orders', CustomerOrderHistoryController::class)->name('app.orders');
    Route::get('/app/orders/{order}', [CustomerOrderHistoryController::class, 'show'])->name('app.orders.show');
    Route::get('/app/profile', CustomerProfileController::class)->name('app.profile');
    Route::put('/app/profile', [CustomerProfileUpdateController::class, 'update'])->name('app.profile.update');
    Route::post('/app/profile/photo', [CustomerProfilePhotoController::class, 'store'])->name('app.profile.photo.store');
    Route::get('/app/customer/chat', [ChatController::class, 'customerShow'])->name('app.customer.chat.show');
    Route::post('/app/customer/chat', [ChatController::class, 'customerStore'])->name('app.customer.chat.store');
    Route::get('/app/admin/chat', [ChatController::class, 'adminIndex'])->name('app.admin.chat.index');
    Route::get('/app/admin/chat/{thread}', [ChatController::class, 'adminShow'])->name('app.admin.chat.show');
    Route::post('/app/admin/chat/{thread}', [ChatController::class, 'adminStore'])->name('app.admin.chat.store');
    Route::post('/app/admin/chat/{thread}/status', [ChatController::class, 'adminStatus'])->name('app.admin.chat.status');
    Route::view('/admin/products', 'app')->name('admin.products');
    Route::view('/admin/categories', 'app')->name('admin.categories');
    Route::view('/admin/customers', 'app')->name('admin.customers');
    Route::view('/admin/orders', 'app')->name('admin.orders');
    Route::view('/admin/payment-methods', 'app')->name('admin.payment-methods');
    Route::view('/admin/messages', 'app')->name('admin.messages');
});

Route::view('/{path?}', 'app')
    ->where('path', '^(?!api|up|storage|_debugbar).*$')
    ->name('app');
