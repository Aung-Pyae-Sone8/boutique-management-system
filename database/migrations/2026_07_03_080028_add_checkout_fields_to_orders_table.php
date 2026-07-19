<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_name')->nullable()->after('customer_id');
            $table->string('shipping_email')->nullable()->after('shipping_name');
            $table->string('shipping_phone', 50)->nullable()->after('shipping_email');
            $table->text('shipping_address')->nullable()->after('shipping_phone');
            $table->string('shipping_city')->nullable()->after('shipping_address');
            $table->string('shipping_country')->nullable()->after('shipping_city');
            $table->string('payment_method')->default('cash_on_delivery')->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_name',
                'shipping_email',
                'shipping_phone',
                'shipping_address',
                'shipping_city',
                'shipping_country',
                'payment_method',
            ]);
        });
    }
};
