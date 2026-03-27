# ADR-002: ISR over SSR for Product Pages

**Status:** Accepted
**Date:** 2026-03-27

## Context

Product pages need to be fast (good Core Web Vitals) while remaining relatively fresh.
Options: SSR (always fresh, higher TTFB), ISR (cached, low TTFB, configurable staleness), SSG (fastest, manual invalidation).

## Decision

Use ISR with `revalidate: 60` for product listing, `generateStaticParams` + ISR for product detail pages.
Implement an on-demand revalidation webhook (`/api/revalidate`) for immediate invalidation when inventory changes.

## Consequences

**Positive:**
- Sub-100ms TTFB from CDN edge for repeat visitors
- Content freshness within 60 seconds for organic traffic
- Instant freshness on webhook trigger (inventory/price changes)

**Negative:**
- First visitor after stale window pays full SSR cost
- Webhook infrastructure needed for real-time inventory sync
- Slightly stale data possible in the 60s window

## Implementation

See `revalidate: 60` in `src/app/products/page.tsx` and `src/app/api/revalidate/route.ts`.
