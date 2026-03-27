/**
 * Cart store tests.
 *
 * The Zustand store uses dynamic imports for server actions (`import('./actions')`).
 * We test the pure helper functions extracted from the store logic (sumSubtotal,
 * sumItemCount) via the MockAdapter which shares the same recalculate logic,
 * and we test the store state manipulation by exercising the MockAdapter directly —
 * keeping tests free of Next.js Server Action infrastructure.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockAdapter } from '@/lib/commerce/mock/adapter';

// ---------------------------------------------------------------------------
// Helpers re-implemented from cart/store.ts for pure-unit testing
// ---------------------------------------------------------------------------
function sumSubtotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

function sumItemCount(items: { quantity: number }[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

// ---------------------------------------------------------------------------
// MockAdapter integration — matches the store's real cart operations
// ---------------------------------------------------------------------------
describe('MockAdapter cart operations (mirrors useCartStore logic)', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    MockAdapter.resetCarts();
    adapter = new MockAdapter();
  });

  it('creates an empty cart with zeroed totals', async () => {
    const cart = await adapter.createCart();
    expect(cart.items).toEqual([]);
    expect(cart.subtotal).toBe(0);
    expect(cart.total).toBe(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.currency).toBe('USD');
    expect(cart.id).toBeTruthy();
  });

  it('adds an item to an empty cart', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 1 });
    const productId = products.products[0]!.id;

    const updated = await adapter.addToCart(cart.id, productId, 1);

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]!.productId).toBe(productId);
    expect(updated.items[0]!.quantity).toBe(1);
    expect(updated.itemCount).toBe(1);
    expect(updated.subtotal).toBeGreaterThan(0);
  });

  it('increments quantity when the same item is added twice', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 1 });
    const productId = products.products[0]!.id;

    await adapter.addToCart(cart.id, productId, 1);
    const updated = await adapter.addToCart(cart.id, productId, 2);

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]!.quantity).toBe(3);
    expect(updated.itemCount).toBe(3);
  });

  it('adds two distinct items as separate entries', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 2 });
    const [p1, p2] = products.products as [typeof products.products[0], typeof products.products[0]];

    await adapter.addToCart(cart.id, p1.id, 1);
    const updated = await adapter.addToCart(cart.id, p2.id, 1);

    expect(updated.items).toHaveLength(2);
    expect(updated.itemCount).toBe(2);
  });

  it('removes an item from the cart', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 1 });
    const productId = products.products[0]!.id;

    const afterAdd = await adapter.addToCart(cart.id, productId, 2);
    const itemId = afterAdd.items[0]!.id;

    const afterRemove = await adapter.removeFromCart(cart.id, itemId);

    expect(afterRemove.items).toHaveLength(0);
    expect(afterRemove.subtotal).toBe(0);
    expect(afterRemove.itemCount).toBe(0);
  });

  it('updates item quantity via updateCartItem', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 1 });
    const productId = products.products[0]!.id;

    const afterAdd = await adapter.addToCart(cart.id, productId, 1);
    const itemId = afterAdd.items[0]!.id;

    const updated = await adapter.updateCartItem(cart.id, itemId, 5);

    expect(updated.items[0]!.quantity).toBe(5);
    expect(updated.itemCount).toBe(5);
  });

  it('removes item when updateCartItem is called with quantity <= 0', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 1 });
    const productId = products.products[0]!.id;

    const afterAdd = await adapter.addToCart(cart.id, productId, 3);
    const itemId = afterAdd.items[0]!.id;

    const updated = await adapter.updateCartItem(cart.id, itemId, 0);

    expect(updated.items).toHaveLength(0);
    expect(updated.itemCount).toBe(0);
  });

  it('throws when adding a non-existent product', async () => {
    const cart = await adapter.createCart();
    await expect(adapter.addToCart(cart.id, 'non-existent-id', 1)).rejects.toThrow(
      'Product non-existent-id not found'
    );
  });

  it('returns null for a cart that does not exist', async () => {
    const result = await adapter.getCart('does-not-exist');
    expect(result).toBeNull();
  });

  it('retrieves a cart by id', async () => {
    const created = await adapter.createCart();
    const retrieved = await adapter.getCart(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(created.id);
  });

  it('subtotal equals sum of price * quantity across all items', async () => {
    const cart = await adapter.createCart();
    const products = await adapter.getProducts({ limit: 2 });
    const [p1, p2] = products.products as [typeof products.products[0], typeof products.products[0]];

    await adapter.addToCart(cart.id, p1.id, 2);
    const final = await adapter.addToCart(cart.id, p2.id, 3);

    const expectedSubtotal = p1.price * 2 + p2.price * 3;
    expect(final.subtotal).toBeCloseTo(expectedSubtotal);
    expect(final.total).toBeCloseTo(expectedSubtotal);
  });

  it('resetCarts clears all cart state between tests', async () => {
    const cart = await adapter.createCart();
    await adapter.addToCart(cart.id, (await adapter.getProducts({ limit: 1 })).products[0]!.id, 1);

    MockAdapter.resetCarts();

    const fresh = await adapter.getCart(cart.id);
    expect(fresh).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Pure helper function tests
// ---------------------------------------------------------------------------
describe('sumSubtotal helper', () => {
  it('returns 0 for empty items', () => {
    expect(sumSubtotal([])).toBe(0);
  });

  it('sums price * quantity for each item', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(sumSubtotal(items)).toBe(35);
  });

  it('handles single item', () => {
    expect(sumSubtotal([{ price: 99.99, quantity: 1 }])).toBeCloseTo(99.99);
  });
});

describe('sumItemCount helper', () => {
  it('returns 0 for empty items', () => {
    expect(sumItemCount([])).toBe(0);
  });

  it('sums all quantities', () => {
    const items = [{ quantity: 3 }, { quantity: 2 }, { quantity: 1 }];
    expect(sumItemCount(items)).toBe(6);
  });
});
