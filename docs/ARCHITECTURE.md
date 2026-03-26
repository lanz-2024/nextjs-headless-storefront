# Architecture

## Overview

The storefront is built on Next.js 15 App Router using React Server Components as the default. Client components are opt-in via `"use client"` and are restricted to interactive leaves (cart drawer, search input, quantity selectors).

## Adapter Pattern

All commerce data flows through a single `CommerceAdapter` interface defined in `src/lib/commerce/types.ts`. The runtime selects the concrete adapter based on the `COMMERCE_PROVIDER` environment variable.

```
COMMERCE_PROVIDER
       │
       ▼
src/lib/commerce/provider.ts   ← resolves at module load time
       │
       ├── "mock"        → src/lib/commerce/mock/
       ├── "woocommerce" → src/lib/commerce/woocommerce/
       └── "shopify"     → src/lib/commerce/shopify/
```

`provider.ts` exports a singleton `commerce` object that implements `CommerceAdapter`. Server components import `commerce` directly — no React context is needed because they run on the server.

### CommerceAdapter Interface

```ts
// src/lib/commerce/types.ts (summary)
export interface CommerceAdapter {
  getProduct(slug: string): Promise<Product>
  getProducts(params: ProductsParams): Promise<ProductsResult>
  getCategories(): Promise<Category[]>
  getCart(id: string): Promise<Cart>
  addCartItem(cartId: string, item: CartItemInput): Promise<Cart>
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart>
  removeCartItem(cartId: string, itemId: string): Promise<Cart>
  createCheckout(cartId: string): Promise<CheckoutUrl>
}
```

Every adapter must satisfy this interface. Zod schemas validate responses at the adapter boundary so the rest of the application receives typed, safe data regardless of provider.

## ISR Strategy

| Route | Strategy | Revalidation |
|-------|----------|-------------|
| `/` (homepage) | ISR | 3600 s |
| `/products` (listing) | ISR | 600 s |
| `/products/[slug]` | ISR | 300 s |
| `/search` | Dynamic (SSR) | — |
| `/cart`, `/checkout` | Dynamic (SSR) | — |
| `/api/*` | Edge runtime | Per-handler |

Product pages use `generateStaticParams` to pre-render the top N products at build time. Remaining products are rendered on-demand and cached by the Next.js data cache.

## Zustand Cart Store

The cart is managed client-side by Zustand (`src/lib/cart/`). Persistence uses Zustand's `persist` middleware with `localStorage`.

```
useCartStore (Zustand)
    │
    ├── state: items[], total, itemCount
    ├── addItem(product, quantity)
    ├── removeItem(itemId)
    ├── updateQuantity(itemId, qty)
    └── clearCart()
```

On first render, the store hydrates from `localStorage`. The cart drawer is a client component that subscribes to the store. Server components read cart data from the commerce adapter for SSR checkout pages.

## Next.js 15 App Router Structure

```
src/app/
  layout.tsx          # Root layout — fonts, GTM, cart provider
  page.tsx            # Homepage (ISR)
  products/
    page.tsx          # Product listing (ISR)
    [slug]/
      page.tsx        # Product detail (ISR)
  cart/
    page.tsx          # Cart page (dynamic)
  checkout/
    page.tsx          # Checkout redirect (dynamic)
  search/
    page.tsx          # Search (dynamic, Algolia)
  api/
    cart/route.ts     # Cart API (edge runtime)
    products/route.ts # Products API (edge runtime)
```

Route groups are used for layout isolation. The `(shop)` group shares the storefront header/footer layout while `(checkout)` renders a minimal layout.

## Data Fetching

Server components fetch directly from the commerce adapter using standard `async/await`. Fetch calls include Next.js cache tags for targeted revalidation via `revalidateTag`.

```ts
// Example: product detail page
const product = await commerce.getProduct(params.slug)
// Next.js caches this fetch and tags it "product-{slug}"
```

Revalidation is triggered by on-demand revalidation routes (`/api/revalidate`) called from webhooks in WooCommerce or Shopify when products are updated.

## Error Handling

- Adapter methods throw typed errors extending `CommerceError`
- Each page segment has a co-located `error.tsx` boundary
- `not-found.tsx` handles 404s at product and category level
- API routes return structured JSON errors with appropriate HTTP status codes

## Security

- All secret credentials are server-only environment variables
- Commerce API calls happen server-side — no keys are exposed to the browser
- CSP headers are configured in `next.config.ts`
- Zod validates all external API responses before use
