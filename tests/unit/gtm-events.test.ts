import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackViewItemList,
  trackSelectItem,
} from '@/lib/gtm/data-layer';
import type { CommerceCart, CommerceCartItem, CommerceProduct } from '@/lib/commerce/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockProduct: CommerceProduct = {
  id: 'prod-1',
  slug: 'wireless-headphones',
  name: 'Wireless Headphones',
  description: 'Great headphones.',
  price: 249.99,
  compareAtPrice: 329.99,
  currency: 'USD',
  sku: 'WH-001',
  stockStatus: 'instock',
  images: [{ src: 'https://example.com/img.jpg', alt: 'Headphones', width: 800, height: 800 }],
  categories: [{ id: 'cat-1', name: 'Electronics', slug: 'electronics' }],
  tags: ['featured'],
  attributes: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockProductNoCategory: CommerceProduct = {
  ...mockProduct,
  id: 'prod-2',
  slug: 'no-cat-product',
  name: 'No Category Product',
  categories: [],
};

const cartItem: CommerceCartItem = {
  id: 'item-1',
  productId: 'prod-1',
  name: 'Wireless Headphones',
  price: 249.99,
  quantity: 2,
  image: { src: 'https://example.com/img.jpg', alt: 'Headphones' },
  slug: 'wireless-headphones',
};

const mockCart: CommerceCart = {
  id: 'cart-abc',
  items: [cartItem],
  subtotal: 499.98,
  total: 529.97,
  currency: 'USD',
  itemCount: 2,
};

// ---------------------------------------------------------------------------
// dataLayer helper — vitest runs in jsdom, so window is available
// ---------------------------------------------------------------------------
function getLastEvent(): Record<string, unknown> {
  const dl = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer;
  return dl[dl.length - 1];
}

function getEcommerce(event: Record<string, unknown>): Record<string, unknown> {
  return event['ecommerce'] as Record<string, unknown>;
}

beforeEach(() => {
  (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
});

// ---------------------------------------------------------------------------
// view_item
// ---------------------------------------------------------------------------
describe('trackViewItem', () => {
  it('pushes event name "view_item"', () => {
    trackViewItem(mockProduct);
    expect(getLastEvent()['event']).toBe('view_item');
  });

  it('includes required item_id field', () => {
    trackViewItem(mockProduct);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
  });

  it('includes required item_name field', () => {
    trackViewItem(mockProduct);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_name']).toBe('Wireless Headphones');
  });

  it('includes required price field', () => {
    trackViewItem(mockProduct);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['price']).toBe(249.99);
  });

  it('sets ecommerce.currency from product', () => {
    trackViewItem(mockProduct);
    expect(getEcommerce(getLastEvent())['currency']).toBe('USD');
  });

  it('sets ecommerce.value to product price', () => {
    trackViewItem(mockProduct);
    expect(getEcommerce(getLastEvent())['value']).toBe(249.99);
  });

  it('sets quantity to 1', () => {
    trackViewItem(mockProduct);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['quantity']).toBe(1);
  });

  it('uses first category slug for item_category', () => {
    trackViewItem(mockProduct);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_category']).toBe('electronics');
  });

  it('defaults item_category to empty string when no categories', () => {
    trackViewItem(mockProductNoCategory);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_category']).toBe('');
  });
});

// ---------------------------------------------------------------------------
// add_to_cart
// ---------------------------------------------------------------------------
describe('trackAddToCart', () => {
  it('pushes event name "add_to_cart"', () => {
    trackAddToCart(mockProduct, 2);
    expect(getLastEvent()['event']).toBe('add_to_cart');
  });

  it('includes required item_id field', () => {
    trackAddToCart(mockProduct, 2);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
  });

  it('includes required item_name field', () => {
    trackAddToCart(mockProduct, 2);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_name']).toBe('Wireless Headphones');
  });

  it('sets value to price * quantity', () => {
    trackAddToCart(mockProduct, 3);
    expect(getEcommerce(getLastEvent())['value']).toBeCloseTo(249.99 * 3);
  });

  it('sets item quantity correctly', () => {
    trackAddToCart(mockProduct, 4);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['quantity']).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// remove_from_cart
// ---------------------------------------------------------------------------
describe('trackRemoveFromCart', () => {
  it('pushes event name "remove_from_cart"', () => {
    trackRemoveFromCart('prod-1', 'Wireless Headphones', 249.99, 1);
    expect(getLastEvent()['event']).toBe('remove_from_cart');
  });

  it('maps item_id and item_name from parameters', () => {
    trackRemoveFromCart('prod-1', 'Wireless Headphones', 249.99, 1);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
    expect(items[0]['item_name']).toBe('Wireless Headphones');
  });

  it('sets value to price * quantity', () => {
    trackRemoveFromCart('prod-1', 'Test', 50, 2);
    expect(getEcommerce(getLastEvent())['value']).toBe(100);
  });

  it('defaults currency to USD when not provided', () => {
    trackRemoveFromCart('prod-1', 'Test', 50, 1);
    expect(getEcommerce(getLastEvent())['currency']).toBe('USD');
  });

  it('uses provided currency when specified', () => {
    trackRemoveFromCart('prod-1', 'Test', 50, 1, 'EUR');
    expect(getEcommerce(getLastEvent())['currency']).toBe('EUR');
  });
});

// ---------------------------------------------------------------------------
// purchase
// ---------------------------------------------------------------------------
describe('trackPurchase', () => {
  it('pushes event name "purchase"', () => {
    trackPurchase('ORDER-001', mockCart);
    expect(getLastEvent()['event']).toBe('purchase');
  });

  it('includes transaction_id in ecommerce', () => {
    trackPurchase('ORDER-001', mockCart);
    expect(getEcommerce(getLastEvent())['transaction_id']).toBe('ORDER-001');
  });

  it('includes items array in ecommerce', () => {
    trackPurchase('ORDER-001', mockCart);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('maps each cart item with item_id and item_name', () => {
    trackPurchase('ORDER-001', mockCart);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
    expect(items[0]['item_name']).toBe('Wireless Headphones');
  });

  it('sets value to cart.total', () => {
    trackPurchase('ORDER-001', mockCart);
    expect(getEcommerce(getLastEvent())['value']).toBe(529.97);
  });

  it('includes tax and shipping when provided', () => {
    trackPurchase('ORDER-001', mockCart, 10, 5);
    const ecommerce = getEcommerce(getLastEvent());
    expect(ecommerce['tax']).toBe(10);
    expect(ecommerce['shipping']).toBe(5);
  });

  it('defaults tax and shipping to 0', () => {
    trackPurchase('ORDER-001', mockCart);
    const ecommerce = getEcommerce(getLastEvent());
    expect(ecommerce['tax']).toBe(0);
    expect(ecommerce['shipping']).toBe(0);
  });

  it('maps currency from cart', () => {
    trackPurchase('ORDER-001', mockCart);
    expect(getEcommerce(getLastEvent())['currency']).toBe('USD');
  });
});

// ---------------------------------------------------------------------------
// begin_checkout
// ---------------------------------------------------------------------------
describe('trackBeginCheckout', () => {
  it('pushes event name "begin_checkout"', () => {
    trackBeginCheckout(mockCart);
    expect(getLastEvent()['event']).toBe('begin_checkout');
  });

  it('sets value to cart.subtotal', () => {
    trackBeginCheckout(mockCart);
    expect(getEcommerce(getLastEvent())['value']).toBe(499.98);
  });

  it('includes all cart items in items array', () => {
    trackBeginCheckout(mockCart);
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items).toHaveLength(mockCart.items.length);
  });
});

// ---------------------------------------------------------------------------
// view_item_list
// ---------------------------------------------------------------------------
describe('trackViewItemList', () => {
  it('pushes event name "view_item_list"', () => {
    trackViewItemList([mockProduct], 'Homepage Featured');
    expect(getLastEvent()['event']).toBe('view_item_list');
  });

  it('sets item_list_name on ecommerce', () => {
    trackViewItemList([mockProduct], 'Homepage Featured');
    expect(getEcommerce(getLastEvent())['item_list_name']).toBe('Homepage Featured');
  });

  it('maps each product with item_id, item_name, price, and index', () => {
    trackViewItemList([mockProduct, mockProductNoCategory], 'Search Results');
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
    expect(items[0]['index']).toBe(0);
    expect(items[1]['item_id']).toBe('prod-2');
    expect(items[1]['index']).toBe(1);
  });

  it('includes item_list_name on each item', () => {
    trackViewItemList([mockProduct], 'Sale Items');
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_list_name']).toBe('Sale Items');
  });
});

// ---------------------------------------------------------------------------
// select_item
// ---------------------------------------------------------------------------
describe('trackSelectItem', () => {
  it('pushes event name "select_item"', () => {
    trackSelectItem(mockProduct, 'Featured');
    expect(getLastEvent()['event']).toBe('select_item');
  });

  it('includes item_id and item_name', () => {
    trackSelectItem(mockProduct, 'Featured');
    const items = getEcommerce(getLastEvent())['items'] as Record<string, unknown>[];
    expect(items[0]['item_id']).toBe('prod-1');
    expect(items[0]['item_name']).toBe('Wireless Headphones');
  });

  it('sets item_list_name on ecommerce and on the item', () => {
    trackSelectItem(mockProduct, 'Trending');
    const ecommerce = getEcommerce(getLastEvent());
    expect(ecommerce['item_list_name']).toBe('Trending');
    const items = ecommerce['items'] as Record<string, unknown>[];
    expect(items[0]['item_list_name']).toBe('Trending');
  });
});

// ---------------------------------------------------------------------------
// dataLayer accumulation
// ---------------------------------------------------------------------------
describe('dataLayer accumulation', () => {
  it('pushes multiple events sequentially', () => {
    trackViewItem(mockProduct);
    trackAddToCart(mockProduct, 1);
    const dl = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer;
    expect(dl).toHaveLength(2);
    expect(dl[0]['event']).toBe('view_item');
    expect(dl[1]['event']).toBe('add_to_cart');
  });

  it('initialises dataLayer when window.dataLayer is undefined', () => {
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
    trackViewItem(mockProduct);
    const dl = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer;
    expect(Array.isArray(dl)).toBe(true);
    expect(dl).toHaveLength(1);
  });
});
