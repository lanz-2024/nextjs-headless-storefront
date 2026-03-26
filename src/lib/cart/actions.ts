'use server';

import { getCommerceAdapter } from '@/lib/commerce/provider';
import type { CommerceCart } from '@/lib/commerce/types';

export async function createCartAction(): Promise<CommerceCart> {
  const adapter = await getCommerceAdapter();
  return adapter.createCart();
}

export async function getCartAction(cartId: string): Promise<CommerceCart | null> {
  const adapter = await getCommerceAdapter();
  return adapter.getCart(cartId);
}

export async function addToCartAction(
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<CommerceCart> {
  const adapter = await getCommerceAdapter();
  return adapter.addToCart(cartId, productId, quantity, variantId);
}

export async function updateCartItemAction(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<CommerceCart> {
  const adapter = await getCommerceAdapter();
  return adapter.updateCartItem(cartId, itemId, quantity);
}

export async function removeCartItemAction(
  cartId: string,
  itemId: string
): Promise<CommerceCart> {
  const adapter = await getCommerceAdapter();
  return adapter.removeFromCart(cartId, itemId);
}
