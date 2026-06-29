<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CustomerResource::collection(
            Customer::query()
                ->with('user:id,email_verified_at,created_at')
                ->withCount('orders')
                ->withSum('orders', 'total')
                ->withMax('orders', 'ordered_at')
                ->latest()
                ->paginate(15)
        );
    }

    public function store(): CustomerResource
    {
        return CustomerResource::make(Customer::create(request()->validate($this->rules())));
    }

    public function show(Customer $customer): CustomerResource
    {
        return CustomerResource::make($this->loadDirectoryData($customer));
    }

    public function update(Customer $customer): CustomerResource
    {
        $customer->update(request()->validate($this->rules($customer)));

        return CustomerResource::make($this->loadDirectoryData($customer));
    }

    public function destroy(Customer $customer): Response
    {
        $customer->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Customer $customer = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function loadDirectoryData(Customer $customer): Customer
    {
        return $customer
            ->load('user:id,email_verified_at,created_at')
            ->loadCount('orders')
            ->loadSum('orders', 'total')
            ->loadMax('orders', 'ordered_at');
    }
}
