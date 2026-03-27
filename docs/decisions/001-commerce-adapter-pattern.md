# ADR-001: Commerce Adapter Pattern

**Status:** Accepted
**Date:** 2026-03-27

## Context

The storefront needs to support multiple commerce backends (WooCommerce, Shopify) without
duplicating business logic. Switching backends should require only an environment variable change,
not code changes.

## Decision

Implement a Strategy pattern via a `CommerceAdapter` interface with concrete implementations
for WooCommerce and Shopify. A factory function (`getCommerceProvider()`) reads `COMMERCE_PROVIDER`
env var and returns the correct adapter. All Server Actions and page components depend only on the
interface, not the concrete implementations.

## Consequences

**Positive:**
- Zero code changes to add a new commerce backend (only a new adapter file)
- Backend-agnostic tests using the mock adapter
- Type safety enforced at the interface level

**Negative:**
- Lowest-common-denominator API — backend-specific features (Shopify metafields, WC custom fields)
  require extension points beyond the base interface
- Additional abstraction layer increases cognitive load for new contributors

## Implementation

See `src/lib/commerce/types.ts` for the interface and `src/lib/commerce/provider.ts` for the factory.
