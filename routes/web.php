<?php

use App\Http\Controllers\Admin\BoutiqueAdminController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('admin/products', [BoutiqueAdminController::class, 'products'])->name('admin.products');
    Route::get('admin/categories', [BoutiqueAdminController::class, 'categories'])->name('admin.categories');
    Route::get('admin/customers', [BoutiqueAdminController::class, 'customers'])->name('admin.customers');
    Route::get('admin/orders', [BoutiqueAdminController::class, 'orders'])->name('admin.orders');
});

require __DIR__.'/settings.php';
