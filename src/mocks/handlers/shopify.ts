/**
 * MSW handlers for Shopify Storefront API (GraphQL).
 * Intercepts calls to *.myshopify.com/api/*/graphql.json during tests.
 */

import { graphql, HttpResponse } from 'msw';

const mockProducts = [
  {
    id: 'gid://shopify/Product/1',
    handle: 'classic-white-t-shirt',
    title: 'Classic White T-Shirt',
    description: 'Premium cotton t-shirt in classic white.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '29.99', currencyCode: 'USD' },
      maxVariantPrice: { amount: '29.99', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://placehold.co/800x800?text=T-Shirt',
            altText: 'Classic White T-Shirt',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/1',
            title: 'Default',
            availableForSale: true,
            price: { amount: '29.99', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
      ],
    },
  },
];

export const shopifyHandlers = [
  // Product listing query
  graphql.query('GetProducts', () => {
    return HttpResponse.json({
      data: {
        products: {
          edges: mockProducts.map((product) => ({ node: product })),
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
  }),

  // Single product query
  graphql.query('GetProductByHandle', ({ variables }) => {
    const product = mockProducts.find(
      (p) => p.handle === variables['handle'],
    );
    return HttpResponse.json({
      data: { product: product ?? null },
    });
  }),

  // Cart creation
  graphql.mutation('CartCreate', () => {
    return HttpResponse.json({
      data: {
        cartCreate: {
          cart: {
            id: 'gid://shopify/Cart/mock-cart-id',
            checkoutUrl: 'https://mock.myshopify.com/checkout/mock',
            lines: { edges: [] },
            cost: {
              totalAmount: { amount: '0.00', currencyCode: 'USD' },
            },
          },
          userErrors: [],
        },
      },
    });
  }),
];
