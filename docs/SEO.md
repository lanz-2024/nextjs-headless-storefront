# SEO

## Metadata Strategy

Every page uses `generateMetadata()` with full Open Graph and Twitter card support:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  return {
    title: `${product.name} | My Store`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.images[0].url, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: `/products/${product.slug}` },
  };
}
```

## Structured Data

JSON-LD schemas injected server-side:

| Page | Schema Type |
|------|------------|
| Product detail | `Product` with `offers`, `aggregateRating` |
| Homepage | `Organization`, `WebSite` with `potentialAction` |
| Product listing | `BreadcrumbList` |
| Cart/Checkout | No indexing (robots: noindex) |

## Sitemap

`src/app/sitemap.ts` generates dynamic sitemap:
- All product pages (`/products/[slug]`) with `changeFrequency: 'daily'`
- Static pages with `changeFrequency: 'monthly'`
- Automatically excludes cart, checkout, search result pages

## Robots

`src/app/robots.ts` disallows:
- `/cart`, `/checkout`, `/api/`
- `?*` query parameters (prevents duplicate indexing of filter states)

## URL Structure

| Pattern | Example |
|---------|---------|
| Product listing | `/products` |
| Product detail | `/products/classic-white-t-shirt` |
| Category filter | `/products?category=clothing` (canonical: `/products`) |
| Search | `/search?q=shirt` |

## Performance SEO

- LCP images marked `priority` (above fold)
- `next/font` with `display: swap` — no render-blocking fonts
- Critical CSS inlined; Tailwind v4 purges unused styles
- ISR ensures crawlers always get fresh content

## Target Lighthouse Scores

| Metric | Target |
|--------|--------|
| Performance | > 90 |
| SEO | > 95 |
| Accessibility | > 95 |
| Best Practices | > 95 |
