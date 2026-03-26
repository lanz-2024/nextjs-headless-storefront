'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommerceCartItem } from '@/lib/commerce/types';

interface CartState {
  cartId: string | null;
  items: CommerceCartItem[];
  subtotal: number;
  total: number;
  currency: string;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;

  /** Initialise — creates a cart if none exists */
  initCart(): Promise<void>;
  addItem(productId: string, quantity: number, variantId?: string): Promise<void>;
  updateItem(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clearError(): void;
  openCart(): void;
  closeCart(): void;
}

function sumSubtotal(items: CommerceCartItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

function sumItemCount(items: CommerceCartItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      subtotal: 0,
      total: 0,
      currency: 'USD',
      itemCount: 0,
      isLoading: false,
      isOpen: false,
      error: null,

      async initCart() {
        if (get().cartId) return;
        set({ isLoading: true });
        try {
          const { createCartAction } = await import('./actions');
          const cart = await createCartAction();
          set({
            cartId: cart.id,
            items: cart.items,
            subtotal: cart.subtotal,
            total: cart.total,
            currency: cart.currency,
            itemCount: cart.itemCount,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Cart init failed' });
        }
      },

      async addItem(productId, quantity, variantId) {
        const state = get();
        if (!state.cartId) {
          await get().initCart();
        }
        const cartId = get().cartId;
        if (!cartId) return;

        // Optimistic update: find product in current items
        const existing = state.items.find((i) => i.productId === productId);
        let optimisticItems: CommerceCartItem[];

        if (existing) {
          optimisticItems = state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          // We don't know the product name/price without the server, so we defer to server
          // and just show loading
          optimisticItems = state.items;
        }

        set({
          items: optimisticItems,
          subtotal: sumSubtotal(optimisticItems),
          total: sumSubtotal(optimisticItems),
          itemCount: sumItemCount(optimisticItems),
          isLoading: true,
        });

        try {
          const { addToCartAction } = await import('./actions');
          const cart = await addToCartAction(cartId, productId, quantity, variantId);
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount,
            currency: cart.currency,
            isLoading: false,
          });
        } catch (err) {
          // Revert on failure
          set({
            items: state.items,
            subtotal: state.subtotal,
            total: state.total,
            itemCount: state.itemCount,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to add item',
          });
        }
      },

      async updateItem(itemId, quantity) {
        const state = get();
        const cartId = state.cartId;
        if (!cartId) return;

        // Optimistic update
        const optimisticItems =
          quantity <= 0
            ? state.items.filter((i) => i.id !== itemId)
            : state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));

        set({
          items: optimisticItems,
          subtotal: sumSubtotal(optimisticItems),
          total: sumSubtotal(optimisticItems),
          itemCount: sumItemCount(optimisticItems),
          isLoading: true,
        });

        try {
          const { updateCartItemAction } = await import('./actions');
          const cart = await updateCartItemAction(cartId, itemId, quantity);
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount,
            isLoading: false,
          });
        } catch (err) {
          // Revert
          set({
            items: state.items,
            subtotal: state.subtotal,
            total: state.total,
            itemCount: state.itemCount,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to update item',
          });
        }
      },

      async removeItem(itemId) {
        const state = get();
        const cartId = state.cartId;
        if (!cartId) return;

        // Optimistic update
        const optimisticItems = state.items.filter((i) => i.id !== itemId);
        set({
          items: optimisticItems,
          subtotal: sumSubtotal(optimisticItems),
          total: sumSubtotal(optimisticItems),
          itemCount: sumItemCount(optimisticItems),
          isLoading: true,
        });

        try {
          const { removeCartItemAction } = await import('./actions');
          const cart = await removeCartItemAction(cartId, itemId);
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount,
            isLoading: false,
          });
        } catch (err) {
          // Revert
          set({
            items: state.items,
            subtotal: state.subtotal,
            total: state.total,
            itemCount: state.itemCount,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to remove item',
          });
        }
      },

      clearError() {
        set({ error: null });
      },

      openCart() {
        set({ isOpen: true });
      },

      closeCart() {
        set({ isOpen: false });
      },
    }),
    {
      name: 'commerce-cart',
      partialize: (state) => ({
        cartId: state.cartId,
        items: state.items,
        subtotal: state.subtotal,
        total: state.total,
        currency: state.currency,
        itemCount: state.itemCount,
      }),
    }
  )
);
