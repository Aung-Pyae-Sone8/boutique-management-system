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
                ->with('user:id,role,email_verified_at,created_at')
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
        $data = request()->validate($this->rules($customer));
        $role = $data['role'] ?? null;
        unset($data['role']);

        $customer->update($data);

        if ($role && $customer->user) {
            $customer->user->update(['role' => $role]);
        }

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
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'customer'])],
        ];
    }

    private function loadDirectoryData(Customer $customer): Customer
    {
        return $customer
            ->load('user:id,role,email_verified_at,created_at')
            ->loadCount('orders')
            ->loadSum('orders', 'total')
            ->loadMax('orders', 'ordered_at');
    }
}
