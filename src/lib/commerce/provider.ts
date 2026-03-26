import type { CommerceAdapter } from './types';

let adapter: CommerceAdapter | null = null;

export async function getCommerceAdapter(): Promise<CommerceAdapter> {
  if (adapter) return adapter;

  const provider = process.env['COMMERCE_PROVIDER'] ?? 'mock';

  switch (provider) {
    case 'woocommerce': {
      const { WooCommerceAdapter } = await import('./woocommerce/adapter');
      adapter = new WooCommerceAdapter({
        baseUrl: process.env['WC_BASE_URL'] ?? '',
        consumerKey: process.env['WC_CONSUMER_KEY'] ?? '',
        consumerSecret: process.env['WC_CONSUMER_SECRET'] ?? '',
      });
      break;
    }
    case 'shopify': {
      const { ShopifyAdapter } = await import('./shopify/adapter');
      adapter = new ShopifyAdapter({
        storeDomain: process.env['SHOPIFY_STORE_DOMAIN'] ?? '',
        storefrontAccessToken: process.env['SHOPIFY_STOREFRONT_TOKEN'] ?? '',
      });
      break;
    }
    case 'mock':
    default: {
      const { MockAdapter } = await import('./mock/adapter');
      adapter = new MockAdapter();
      break;
    }
  }

  return adapter;
}

/**
 * Reset the cached adapter — useful in tests to switch providers.
 */
export function resetCommerceAdapter(): void {
  adapter = null;
}
