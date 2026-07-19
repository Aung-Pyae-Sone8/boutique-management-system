<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class PaymentMethodController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return PaymentMethodResource::collection(
            PaymentMethod::query()
                ->when($request->boolean('active'), fn ($query) => $query->where('is_active', true))
                ->orderBy('sort_order')
                ->orderBy('label')
                ->paginate(max(1, min($request->integer('per_page', 50), 100)))
        );
    }

    public function store(Request $request): PaymentMethodResource
    {
        $request->merge([
            'code' => $this->normalizeCode($request->input('code') ?: $request->input('label', '')),
        ]);

        $data = $request->validate($this->rules());
        $data['provider'] = ($data['provider'] ?? null) ?: $data['code'];
        $data['qr_path'] = $this->storeQr($request, $data['code']);

        return PaymentMethodResource::make(PaymentMethod::query()->create($data));
    }

    public function show(PaymentMethod $paymentMethod): PaymentMethodResource
    {
        return PaymentMethodResource::make($paymentMethod);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): PaymentMethodResource
    {
        if ($request->filled('code')) {
            $request->merge([
                'code' => $this->normalizeCode($request->string('code')->toString()),
            ]);
        }

        $data = $request->validate($this->rules($paymentMethod));

        if (array_key_exists('code', $data) || array_key_exists('label', $data)) {
            $data['code'] = $this->normalizeCode($data['code'] ?? $data['label']);
        }

        if (array_key_exists('provider', $data) && ! $data['provider']) {
            $data['provider'] = $data['code'] ?? $paymentMethod->code;
        }

        if ($request->hasFile('qr_image')) {
            $this->deleteStoredQr($paymentMethod->qr_path);
            $data['qr_path'] = $this->storeQr($request, $data['code'] ?? $paymentMethod->code);
        }

        $paymentMethod->update($data);

        return PaymentMethodResource::make($paymentMethod->refresh());
    }

    public function destroy(PaymentMethod $paymentMethod): Response
    {
        $this->deleteStoredQr($paymentMethod->qr_path);
        $paymentMethod->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?PaymentMethod $paymentMethod = null): array
    {
        return [
            'code' => [$paymentMethod ? 'sometimes' : 'required', 'string', 'max:80', Rule::unique('payment_methods', 'code')->ignore($paymentMethod)],
            'label' => [$paymentMethod ? 'sometimes' : 'required', 'string', 'max:120'],
            'provider' => ['nullable', 'string', 'max:120'],
            'account_username' => ['nullable', 'string', 'max:120'],
            'account_phone' => ['nullable', 'string', 'max:50'],
            'qr_image' => [$paymentMethod ? 'nullable' : 'required', File::types(['png', 'jpg', 'jpeg', 'webp'])->max('2mb')],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    private function normalizeCode(string $value): string
    {
        return Str::of($value)
            ->slug('_')
            ->lower()
            ->toString();
    }

    private function storeQr(Request $request, string $code): string
    {
        return $request->file('qr_image')->store("payment-methods/{$code}", 'public');
    }

    private function deleteStoredQr(?string $path): void
    {
        if (! $path || ! Str::startsWith($path, 'payment-methods/')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
