<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/app/user', fn (Request $request) => response()->json([
    'user' => $request->user(),
]))->name('app.user');

Route::view('/', 'app')->name('home');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::view('/dashboard', 'app')->name('dashboard');
    Route::view('/customer', 'app')->name('customer.home');
    Route::view('/admin/products', 'app')->name('admin.products');
    Route::view('/admin/categories', 'app')->name('admin.categories');
    Route::view('/admin/customers', 'app')->name('admin.customers');
    Route::view('/admin/orders', 'app')->name('admin.orders');
});

Route::view('/{path?}', 'app')
    ->where('path', '^(?!api|up|storage|_debugbar).*$')
    ->name('app');
