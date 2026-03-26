import { describe, it, expect } from 'vitest';
import {
  mapShopifyProduct,
  mapShopifyCart,
  mapShopifyCollection,
  type ShopifyProductNode,
  type ShopifyCartNode,
  type ShopifyCollectionNode,
} from '@/lib/commerce/shopify/mapper';

function makeVariant(overrides: Partial<{
  id: string;
  sku: string;
  amount: string;
  currencyCode: string;
  compareAtAmount: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: { name: string; value: string }[];
}> = {}) {
  return {
    id: overrides.id ?? 'variant-gid-1',
    sku: overrides.sku ?? 'SKU-001',
    price: {
      amount: overrides.amount ?? '29.99',
      currencyCode: overrides.currencyCode ?? 'USD',
    },
    compareAtPrice:
      overrides.compareAtAmount != null
        ? { amount: overrides.compareAtAmount, currencyCode: overrides.currencyCode ?? 'USD' }
        : null,
    availableForSale: overrides.availableForSale ?? true,
    quantityAvailable: overrides.quantityAvailable ?? 5,
    selectedOptions: overrides.selectedOptions ?? [{ name: 'Size', value: 'M' }],
  };
}

const baseProduct: ShopifyProductNode = {
  id: 'gid://shopify/Product/1',
  handle: 'premium-tee',
  title: 'Premium Tee',
  description: 'A comfortable premium tee.',
  descriptionHtml: '<p>A comfortable premium tee.</p>',
  tags: ['new', 'sale'],
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-03-01T09:00:00Z',
  priceRange: { minVariantPrice: { amount: '29.99', currencyCode: 'USD' } },
  compareAtPriceRange: { minVariantPrice: { amount: '49.99', currencyCode: 'USD' } },
  images: {
    edges: [
      {
        node: {
          url: 'https://cdn.shopify.com/img1.jpg',
          altText: 'Front',
          width: 1200,
          height: 1200,
        },
      },
      {
        node: {
          url: 'https://cdn.shopify.com/img2.jpg',
          altText: null,
          width: null,
          height: null,
        },
      },
    ],
  },
  collections: {
    edges: [
      {
        node: {
          id: 'gid://shopify/Collection/10',
          handle: 'clothing',
          title: 'Clothing',
        },
      },
    ],
  },
  variants: {
    edges: [
      { node: makeVariant() },
      {
        node: makeVariant({
          id: 'variant-gid-2',
          sku: 'SKU-002',
          amount: '29.99',
          availableForSale: false,
          selectedOptions: [{ name: 'Size', value: 'XL' }],
        }),
      },
    ],
  },
  seo: { title: 'Premium Tee | Store', description: 'Buy premium tee' },
};

describe('mapShopifyProduct', () => {
  describe('core fields', () => {
    it('maps id from Shopify GID', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.id).toBe('gid://shopify/Product/1');
    });

    it('maps slug from handle', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.slug).toBe('premium-tee');
    });

    it('maps name from title', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.name).toBe('Premium Tee');
    });

    it('maps description', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.description).toBe('A comfortable premium tee.');
    });

    it('maps tags array directly', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.tags).toEqual(['new', 'sale']);
    });

    it('maps seo field when present', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.seo).toEqual({ title: 'Premium Tee | Store', description: 'Buy premium tee' });
    });

    it('omits seo field when absent', () => {
      const { seo: _, ...rest } = baseProduct;
      const product = mapShopifyProduct(rest as ShopifyProductNode);
      expect(product.seo).toBeUndefined();
    });

    it('maps timestamps', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.createdAt).toBe('2024-01-10T08:00:00Z');
      expect(product.updatedAt).toBe('2024-03-01T09:00:00Z');
    });

    it('attributes is always empty array (Shopify uses variants)', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.attributes).toEqual([]);
    });
  });

  describe('price mapping', () => {
    it('maps base price from priceRange.minVariantPrice', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.price).toBe(29.99);
    });

    it('maps compareAtPrice from compareAtPriceRange', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.compareAtPrice).toBe(49.99);
    });

    it('omits compareAtPrice when compareAtPriceRange absent', () => {
      const { compareAtPriceRange: _, ...rest } = baseProduct;
      const product = mapShopifyProduct(rest as ShopifyProductNode);
      expect(product.compareAtPrice).toBeUndefined();
    });

    it('maps currency from priceRange currencyCode', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.currency).toBe('USD');
    });
  });

  describe('availability from variants', () => {
    it('is instock when at least one variant is availableForSale', () => {
      // baseProduct has variant-1 available
      const product = mapShopifyProduct(baseProduct);
      expect(product.stockStatus).toBe('instock');
    });

    it('is outofstock when no variants are availableForSale', () => {
      const allUnavailable: ShopifyProductNode = {
        ...baseProduct,
        variants: {
          edges: [
            { node: makeVariant({ availableForSale: false }) },
            { node: makeVariant({ id: 'v2', availableForSale: false }) },
          ],
        },
      };
      const product = mapShopifyProduct(allUnavailable);
      expect(product.stockStatus).toBe('outofstock');
    });

    it('uses sku from first variant', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.sku).toBe('SKU-001');
    });

    it('defaults sku to empty string when no variants', () => {
      const noVariants: ShopifyProductNode = {
        ...baseProduct,
        variants: { edges: [] },
      };
      const product = mapShopifyProduct(noVariants);
      expect(product.sku).toBe('');
    });
  });

  describe('variants mapping', () => {
    it('maps variant id, sku, price', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.variants).toHaveLength(2);
      expect(product.variants![0]).toMatchObject({
        id: 'variant-gid-1',
        sku: 'SKU-001',
        price: 29.99,
      });
    });

    it('maps variant stockStatus from availableForSale', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.variants![0].stockStatus).toBe('instock');
      expect(product.variants![1].stockStatus).toBe('outofstock');
    });

    it('maps variant selectedOptions into attributes record', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.variants![0].attributes).toEqual({ Size: 'M' });
      expect(product.variants![1].attributes).toEqual({ Size: 'XL' });
    });

    it('defaults variant sku to empty string when absent', () => {
      const noSkuVariant: ShopifyProductNode = {
        ...baseProduct,
        variants: {
          edges: [{ node: makeVariant({ sku: undefined }) }],
        },
      };
      // makeVariant with sku: undefined uses 'SKU-001' by default — test explicit undefined
      const raw = {
        ...baseProduct,
        variants: {
          edges: [
            {
              node: {
                id: 'v-no-sku',
                price: { amount: '10.00', currencyCode: 'USD' },
                compareAtPrice: null,
                availableForSale: true,
                quantityAvailable: 1,
                selectedOptions: [],
                // sku intentionally omitted
              },
            },
          ],
        },
      };
      const product = mapShopifyProduct(raw as ShopifyProductNode);
      expect(product.variants![0].sku).toBe('');
    });
  });

  describe('images mapping', () => {
    it('maps image url and altText', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.images[0]).toMatchObject({
        src: 'https://cdn.shopify.com/img1.jpg',
        alt: 'Front',
        width: 1200,
        height: 1200,
      });
    });

    it('falls back to product title when altText is null', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.images[1].alt).toBe('Premium Tee');
    });

    it('defaults width and height to 800 when null', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.images[1].width).toBe(800);
      expect(product.images[1].height).toBe(800);
    });

    it('returns empty images when edges empty', () => {
      const product = mapShopifyProduct({ ...baseProduct, images: { edges: [] } });
      expect(product.images).toEqual([]);
    });
  });

  describe('collections mapping', () => {
    it('maps collections to categories', () => {
      const product = mapShopifyProduct(baseProduct);
      expect(product.categories).toHaveLength(1);
      expect(product.categories[0]).toEqual({
        id: 'gid://shopify/Collection/10',
        name: 'Clothing',
        slug: 'clothing',
      });
    });

    it('returns empty categories when no collections', () => {
      const product = mapShopifyProduct({ ...baseProduct, collections: { edges: [] } });
      expect(product.categories).toEqual([]);
    });
  });
});

describe('mapShopifyCart', () => {
  const cartNode: ShopifyCartNode = {
    id: 'gid://shopify/Cart/abc123',
    cost: {
      subtotalAmount: { amount: '59.98', currencyCode: 'USD' },
      totalAmount: { amount: '64.97', currencyCode: 'USD' },
    },
    lines: {
      edges: [
        {
          node: {
            id: 'line-1',
            quantity: 2,
            cost: { totalAmount: { amount: '59.98', currencyCode: 'USD' } },
            merchandise: {
              id: 'variant-gid-1',
              title: 'Premium Tee / M',
              price: { amount: '29.99', currencyCode: 'USD' },
              product: {
                id: 'gid://shopify/Product/1',
                handle: 'premium-tee',
                title: 'Premium Tee',
                images: {
                  edges: [
                    {
                      node: {
                        url: 'https://cdn.shopify.com/img1.jpg',
                        altText: 'Front',
                        width: 800,
                        height: 800,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
  };

  it('maps cart id', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.id).toBe('gid://shopify/Cart/abc123');
  });

  it('maps subtotal and total as floats', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.subtotal).toBeCloseTo(59.98);
    expect(cart.total).toBeCloseTo(64.97);
  });

  it('maps currency from subtotalAmount', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.currency).toBe('USD');
  });

  it('calculates itemCount as sum of quantities', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.itemCount).toBe(2);
  });

  it('maps line items correctly', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.items).toHaveLength(1);
    const item = cart.items[0];
    expect(item.id).toBe('line-1');
    expect(item.productId).toBe('gid://shopify/Product/1');
    expect(item.variantId).toBe('variant-gid-1');
    expect(item.name).toBe('Premium Tee');
    expect(item.price).toBeCloseTo(29.99);
    expect(item.quantity).toBe(2);
    expect(item.slug).toBe('premium-tee');
  });

  it('maps first product image onto cart item', () => {
    const cart = mapShopifyCart(cartNode);
    expect(cart.items[0].image).toEqual({
      src: 'https://cdn.shopify.com/img1.jpg',
      alt: 'Front',
    });
  });

  it('defaults image to empty strings when no product images', () => {
    const noImageCart: ShopifyCartNode = {
      ...cartNode,
      lines: {
        edges: [
          {
            node: {
              ...cartNode.lines.edges[0].node,
              merchandise: {
                ...cartNode.lines.edges[0].node.merchandise,
                product: {
                  ...cartNode.lines.edges[0].node.merchandise.product,
                  images: { edges: [] },
                },
              },
            },
          },
        ],
      },
    };
    const cart = mapShopifyCart(noImageCart);
    expect(cart.items[0].image).toEqual({ src: '', alt: 'Premium Tee' });
  });

  it('returns empty items array for empty cart', () => {
    const emptyCart: ShopifyCartNode = {
      ...cartNode,
      lines: { edges: [] },
      cost: {
        subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
        totalAmount: { amount: '0.00', currencyCode: 'USD' },
      },
    };
    const cart = mapShopifyCart(emptyCart);
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
  });
});

describe('mapShopifyCollection', () => {
  const collectionNode: ShopifyCollectionNode = {
    id: 'gid://shopify/Collection/10',
    handle: 'clothing',
    title: 'Clothing',
  };

  it('maps id, name, slug', () => {
    const collection = mapShopifyCollection(collectionNode);
    expect(collection.id).toBe('gid://shopify/Collection/10');
    expect(collection.name).toBe('Clothing');
    expect(collection.slug).toBe('clothing');
  });

  it('sets productCount to 0 (Shopify collection node has no count)', () => {
    const collection = mapShopifyCollection(collectionNode);
    expect(collection.productCount).toBe(0);
  });
});
