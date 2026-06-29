import type { Product, ProductVariant } from '@/types/types';

export const customerCartChangedEvent = 'boutique-customer-cart-changed';

const cartStorageKey = 'boutique.customer.cart';

export type CustomerCartItem = {
    id: string;
    product_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_sku: string;
    size: string | null;
    color: string | null;
    image_url: string | null;
    unit_price: number;
    stock_quantity: number;
    quantity: number;
};

export function getCartItems(): CustomerCartItem[] {
    try {
        const storedCart = window.localStorage.getItem(cartStorageKey);

        return storedCart ? (JSON.parse(storedCart) as CustomerCartItem[]) : [];
    } catch {
        return [];
    }
}

export function cartItemCount(): number {
    return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addCartItem(
    product: Product,
    variant: ProductVariant | null,
    quantity = 1,
): CustomerCartItem[] {
    const cartItem = cartItemFromProduct(product, variant, quantity);
    const nextCart = upsertCartItem(getCartItems(), cartItem);

    saveCartItems(nextCart);

    return nextCart;
}

export function updateCartItemQuantity(
    itemId: string,
    quantity: number,
): CustomerCartItem[] {
    const nextCart = getCartItems()
        .map((item) =>
            item.id === itemId
                ? {
                      ...item,
                      quantity: Math.min(
                          Math.max(quantity, 1),
                          item.stock_quantity,
                      ),
                  }
                : item,
        )
        .filter((item) => item.quantity > 0);

    saveCartItems(nextCart);

    return nextCart;
}

export function removeCartItem(itemId: string): CustomerCartItem[] {
    const nextCart = getCartItems().filter((item) => item.id !== itemId);

    saveCartItems(nextCart);

    return nextCart;
}

export function clearCartItems(): CustomerCartItem[] {
    saveCartItems([]);

    return [];
}

function cartItemFromProduct(
    product: Product,
    variant: ProductVariant | null,
    quantity: number,
): CustomerCartItem {
    const imageUrl =
        variant?.images[0]?.url ?? product.images[0]?.url ?? product.image_url;
    const stockQuantity = variant?.stock_quantity ?? product.stock_quantity;

    return {
        id: `${product.id}:${variant?.id ?? 'standard'}`,
        product_id: product.id,
        product_variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_sku: variant?.sku ?? product.sku,
        size: variant?.size ?? product.size,
        color: variant?.color ?? product.color,
        image_url: imageUrl,
        unit_price: Number(variant?.price ?? product.price),
        stock_quantity: stockQuantity,
        quantity: Math.min(Math.max(quantity, 1), stockQuantity),
    };
}

function upsertCartItem(
    cartItems: CustomerCartItem[],
    cartItem: CustomerCartItem,
): CustomerCartItem[] {
    const existingItem = cartItems.find((item) => item.id === cartItem.id);

    if (!existingItem) {
        return [cartItem, ...cartItems];
    }

    return cartItems.map((item) =>
        item.id === cartItem.id
            ? {
                  ...item,
                  quantity: Math.min(
                      item.quantity + cartItem.quantity,
                      item.stock_quantity,
                  ),
                  stock_quantity: item.quantity + cartItem.stock_quantity,
                  unit_price: cartItem.unit_price,
                  image_url: cartItem.image_url,
              }
            : item,
    );
}

function saveCartItems(cartItems: CustomerCartItem[]): void {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    window.dispatchEvent(
        new CustomEvent(customerCartChangedEvent, { detail: cartItems }),
    );
}
