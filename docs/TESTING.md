# Testing

## Overview

The project uses three testing layers:

| Layer | Tool | Location | Speed |
|-------|------|----------|-------|
| Unit | Vitest 2 | `src/__tests__/unit/` | Fast (< 5 s) |
| Integration | Vitest 2 + MSW 2 | `src/__tests__/integration/` | Medium |
| E2E | Playwright 1.49 | `tests/` | Slow (browser) |

## Running Tests

```bash
# All unit + integration tests
pnpm test

# With coverage report
pnpm test:coverage

# Watch mode (development)
pnpm test:watch

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# CI mode (JUnit reporter + coverage)
pnpm test:ci

# E2E (requires running dev server or built app)
pnpm test:e2e

# E2E with Playwright UI
pnpm test:e2e:ui
```

## Mock Mode — Zero Config

All unit and integration tests run against the mock commerce adapter automatically. No environment variables, no external services, no network calls.

Set `COMMERCE_PROVIDER=mock` (already the default in `vitest.config.ts`) and tests work out of the box in any environment including CI.

MSW intercepts any accidental outbound fetch calls during tests and logs a warning, ensuring tests never depend on live APIs.

## Unit Tests

Unit tests cover:

- Commerce adapter types and Zod schema validation
- Zustand cart store — add, remove, update, persist, hydrate
- GTM data layer helpers — event shape, required fields
- Algolia search utilities — query building, facet parsing
- Individual UI components rendered with Vitest + jsdom

Example: cart store test

```ts
import { renderHook, act } from '@testing-library/react'
import { useCartStore } from '@/lib/cart/store'

test('addItem increments itemCount', () => {
  const { result } = renderHook(() => useCartStore())
  act(() => result.current.addItem(mockProduct, 1))
  expect(result.current.itemCount).toBe(1)
})
```

## Integration Tests

Integration tests cover full request-response cycles using MSW handlers defined in `src/mocks/handlers.ts`.

- Product listing API — pagination, filtering, sorting
- Product detail — slug resolution, 404 handling
- Cart API — add/update/remove flow
- Checkout redirect — URL generation

MSW handlers mirror real WooCommerce and Shopify response shapes so integration tests catch serialization regressions.

## E2E Tests

Playwright tests run against a built app with `COMMERCE_PROVIDER=mock`. The mock adapter returns deterministic data so assertions are stable.

Key flows covered:

- Homepage renders featured products
- Product listing — filter by category, sort by price
- Product detail — add to cart, variant selection
- Cart drawer — quantity update, item removal, subtotal
- Search — Algolia InstantSearch results

```bash
# Run against local dev server
pnpm dev &
pnpm test:e2e

# Run against production build
pnpm build && pnpm start &
pnpm test:e2e
```

Playwright config (`playwright.config.ts`) sets `baseURL` from `PLAYWRIGHT_BASE_URL` (defaults to `http://localhost:3000`).

## Coverage

Coverage is collected with `@vitest/coverage-v8`.

```bash
pnpm test:coverage
# Report written to: coverage/index.html
```

CI fails if overall line coverage drops below 80% (configured in `vitest.config.ts`).

## CI Behavior

`pnpm test:ci` runs Vitest with:

- `--coverage` — generates lcov + JSON reports
- `--reporter=junit` — outputs `junit.xml` for CI systems

The GitHub Actions workflow uploads coverage and JUnit artifacts. See `.github/workflows/ci.yml`.
