# Commerce Adapters

## How It Works

The storefront uses a provider pattern to abstract all commerce operations behind a single `CommerceAdapter` interface. Swapping providers is a one-line environment variable change — no UI code is touched.

```
COMMERCE_PROVIDER=woocommerce   # or shopify, mock
```

## CommerceAdapter Interface

Defined in `src/lib/commerce/types.ts`:

```ts
export interface CommerceAdapter {
  // Products
  getProduct(slug: string): Promise<Product>
  getProducts(params: ProductsParams): Promise<ProductsResult>
  getCategories(): Promise<Category[]>

  // Cart
  getCart(id: string): Promise<Cart>
  addCartItem(cartId: string, item: CartItemInput): Promise<Cart>
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart>
  removeCartItem(cartId: string, itemId: string): Promise<Cart>

  // Checkout
  createCheckout(cartId: string): Promise<CheckoutUrl>
}
```

All return types use shared domain types (`Product`, `Cart`, `Category`, etc.) defined in the same file. Zod schemas (`ProductSchema`, `CartSchema`, etc.) validate raw API responses at the adapter boundary.

## Provider Resolution

`src/lib/commerce/provider.ts` reads `process.env.COMMERCE_PROVIDER` at module load time and returns the matching adapter singleton:

```ts
// src/lib/commerce/provider.ts
import { MockAdapter } from './mock'
import { WooCommerceAdapter } from './woocommerce'
import { ShopifyAdapter } from './shopify'

function resolveAdapter(): CommerceAdapter {
  switch (process.env.COMMERCE_PROVIDER) {
    case 'woocommerce': return new WooCommerceAdapter()
    case 'shopify':     return new ShopifyAdapter()
    default:            return new MockAdapter()
  }
}

export const commerce = resolveAdapter()
```

Server components import `commerce` directly:

```ts
import { commerce } from '@/lib/commerce/provider'

const product = await commerce.getProduct(params.slug)
```

## Built-in Providers

### Mock

Location: `src/lib/commerce/mock/`

Returns hard-coded fixture data. No environment variables required. Used by default in development (`pnpm dev`) and in all tests.

The mock adapter ships with:
- 12 sample products across 3 categories
- Working cart operations (in-memory, resets on server restart)
- Deterministic slugs for stable Playwright assertions

### WooCommerce

Location: `src/lib/commerce/woocommerce/`

Calls the WooCommerce REST API v3.

Required environment variables:

```env
COMMERCE_PROVIDER=woocommerce
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_KEY=ck_xxxxxxxxxxxx
WOOCOMMERCE_SECRET=cs_xxxxxxxxxxxx
```

Cart operations use WooCommerce Store API (no authentication required from the browser — calls are proxied through Next.js API routes).

ISR revalidation is triggered by WooCommerce webhooks pointing to `/api/revalidate`.

### Shopify

Location: `src/lib/commerce/shopify/`

Calls the Shopify Storefront API (GraphQL).

Required environment variables:

```env
COMMERCE_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxx
```

Cart operations use the Shopify Cart API. Checkout redirects to Shopify-hosted checkout.

## Adding a New Provider

1. Create a directory: `src/lib/commerce/your-provider/`

2. Create `index.ts` implementing `CommerceAdapter`:

```ts
import type { CommerceAdapter, Product, ProductsParams, ProductsResult, Category, Cart, CartItemInput, CheckoutUrl } from '../types'

export class YourProviderAdapter implements CommerceAdapter {
  async getProduct(slug: string): Promise<Product> {
    // fetch from your API and validate with ProductSchema
  }

  async getProducts(params: ProductsParams): Promise<ProductsResult> { ... }
  async getCategories(): Promise<Category[]> { ... }
  async getCart(id: string): Promise<Cart> { ... }
  async addCartItem(cartId: string, item: CartItemInput): Promise<Cart> { ... }
  async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart> { ... }
  async removeCartItem(cartId: string, itemId: string): Promise<Cart> { ... }
  async createCheckout(cartId: string): Promise<CheckoutUrl> { ... }
}
```

3. Register it in `src/lib/commerce/provider.ts`:

```ts
import { YourProviderAdapter } from './your-provider'

case 'your-provider': return new YourProviderAdapter()
```

4. Add MSW handlers in `src/mocks/handlers.ts` so integration tests can cover your adapter without live API calls.

5. Document required environment variables in `.env.example`.

## Validation Pattern

Every adapter method must validate the raw API response with the corresponding Zod schema before returning:

```ts
import { ProductSchema } from '../types'

async getProduct(slug: string): Promise<Product> {
  const raw = await fetch(`${BASE_URL}/products/${slug}`).then(r => r.json())
  return ProductSchema.parse(raw)  // throws ZodError on invalid shape
}
```

This ensures type safety is enforced at runtime, not just at compile time, and prevents invalid data from reaching UI components.
