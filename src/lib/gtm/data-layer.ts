import type { CommerceCart, CommerceProduct } from '@/lib/commerce/types';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(event: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
}

/** GA4 view_item */
export function trackViewItem(product: CommerceProduct): void {
  push({
    event: 'view_item',
    ecommerce: {
      currency: product.currency,
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.categories[0]?.slug ?? '',
          price: product.price,
          quantity: 1,
        },
      ],
    },
  });
}

/** GA4 add_to_cart */
export function trackAddToCart(product: CommerceProduct, quantity: number): void {
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: product.currency,
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.categories[0]?.slug ?? '',
          price: product.price,
          quantity,
        },
      ],
    },
  });
}

/** GA4 remove_from_cart */
export function trackRemoveFromCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number,
  currency = 'USD'
): void {
  push({
    event: 'remove_from_cart',
    ecommerce: {
      currency,
      value: price * quantity,
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
          quantity,
        },
      ],
    },
  });
}

/** GA4 begin_checkout */
export function trackBeginCheckout(cart: CommerceCart): void {
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency: cart.currency,
      value: cart.subtotal,
      items: cart.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });
}

/** GA4 purchase */
export function trackPurchase(
  orderId: string,
  cart: CommerceCart,
  tax = 0,
  shipping = 0
): void {
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: orderId,
      currency: cart.currency,
      value: cart.total,
      tax,
      shipping,
      items: cart.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });
}

/** GA4 view_item_list */
export function trackViewItemList(products: CommerceProduct[], listName: string): void {
  push({
    event: 'view_item_list',
    ecommerce: {
      item_list_name: listName,
      items: products.map((p, index) => ({
        item_id: p.id,
        item_name: p.name,
        item_category: p.categories[0]?.slug ?? '',
        item_list_name: listName,
        index,
        price: p.price,
      })),
    },
  });
}

/** GA4 select_item */
export function trackSelectItem(product: CommerceProduct, listName: string): void {
  push({
    event: 'select_item',
    ecommerce: {
      item_list_name: listName,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.categories[0]?.slug ?? '',
          item_list_name: listName,
          price: product.price,
        },
      ],
    },
  });
}
