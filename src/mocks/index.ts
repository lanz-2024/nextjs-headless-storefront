/**
 * MSW setup for tests and mock development mode.
 * Import this in vitest setup or app entry point when COMMERCE_PROVIDER=mock.
 */

import { setupServer } from 'msw/node';
import { woocommerceHandlers } from './handlers/woocommerce';
import { shopifyHandlers } from './handlers/shopify';

export const server = setupServer(
  ...woocommerceHandlers,
  ...shopifyHandlers,
);

export { woocommerceHandlers, shopifyHandlers };
