# Changelog

## [0.1.0] - 2026-03-27

### Added
- Next.js 15 App Router with React 19 and TypeScript
- Commerce adapter pattern: swap WooCommerce ↔ Shopify via `COMMERCE_PROVIDER` env var
- WooCommerce REST adapter with retry, deduplication, and ISR caching
- Shopify Storefront GraphQL adapter with typed fragments
- Mock adapter: 20 seeded products, works fully offline (`COMMERCE_PROVIDER=mock`)
- ISR product pages: `revalidate: 60` for listings, `generateStaticParams` for PDPs
- On-demand ISR webhook with HMAC-SHA256 verification
- Algolia InstantSearch integration with faceted filtering
- Zustand cart store with optimistic updates and localStorage persistence
- Google Tag Manager integration with type-safe GA4 events (view_item, add_to_cart, purchase)
- WCAG AA accessibility: skip links, focus management, `aria-live` regions
- MSW handlers: WooCommerce REST and Shopify GraphQL mock handlers for tests
- Vitest unit tests: WC mapper, Shopify mapper, cart store, GTM events
- docs/: ARCHITECTURE.md, TESTING.md, COMMERCE-ADAPTERS.md, DEPLOYMENT.md, SECURITY.md, CHANGELOG.md, GTM-EVENTS.md
- GitHub Actions CI: typecheck → test → mock build
- Docker Compose: WordPress + WooCommerce + MySQL + WP-CLI seed + Adminer

### Depends on
- react-storefront-ui (component library)
- node-api-gateway (optional API routing path)
