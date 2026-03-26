import type {
  CommerceAdapter,
  CommerceCart,
  CommerceCollection,
  CommerceProduct,
  GetProductsOptions,
  GetProductsResult,
} from '../types';
import { ShopifyClient } from './client';
import { CART_FRAGMENT, IMAGE_FRAGMENT, PRODUCT_FRAGMENT } from './fragments';
import {
  mapShopifyCart,
  mapShopifyProduct,
  type ShopifyCartNode,
  type ShopifyCollectionNode,
  type ShopifyProductNode,
} from './mapper';

interface ShopifyAdapterConfig {
  storeDomain: string;
  storefrontAccessToken: string;
}

type ProductsQueryResult = {
  products: {
    edges: { node: ShopifyProductNode }[];
    pageInfo: { hasNextPage: boolean };
    totalCount?: number;
  };
};

type ProductQueryResult = { productByHandle: ShopifyProductNode | null };
type CartQueryResult = { cart: ShopifyCartNode | null };
type CartCreateResult = { cartCreate: { cart: ShopifyCartNode } };
type CartLinesAddResult = { cartLinesAdd: { cart: ShopifyCartNode } };
type CartLinesUpdateResult = { cartLinesUpdate: { cart: ShopifyCartNode } };
type CartLinesRemoveResult = { cartLinesRemove: { cart: ShopifyCartNode } };
type CollectionsQueryResult = {
  collections: { edges: { node: ShopifyCollectionNode }[] };
};

const PRODUCTS_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
      edges { node { ...ProductFields } }
      pageInfo { hasNextPage }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ...ProductFields
    }
  }
`;

const COLLECTIONS_QUERY = /* GraphQL */ `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          productsCount { count }
          image { url altText }
        }
      }
    }
  }
`;

const CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query GetCart($id: ID!) {
    cart(id: $id) { ...CartFields }
  }
`;

const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) { cart { ...CartFields } }
  }
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
  }
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
  }
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } }
  }
`;

export class ShopifyAdapter implements CommerceAdapter {
  readonly name = 'shopify';
  private readonly client: ShopifyClient;

  constructor(config: ShopifyAdapterConfig) {
    this.client = new ShopifyClient(config);
  }

  async getProducts(options: GetProductsOptions = {}): Promise<GetProductsResult> {
    const { page = 1, limit = 20, category, sort } = options;

    let sortKey: string | undefined;
    if (sort === 'price_asc' || sort === 'price_desc') sortKey = 'PRICE';
    else if (sort === 'newest') sortKey = 'CREATED_AT';
    else if (sort === 'name_asc') sortKey = 'TITLE';

    const queryParts: string[] = [];
    if (category) queryParts.push(`collection:${category}`);

    const data = await this.client.query<ProductsQueryResult>(PRODUCTS_QUERY, {
      first: limit,
      after: page > 1 ? btoa(`arrayconnection:${(page - 1) * limit - 1}`) : undefined,
      query: queryParts.join(' ') || undefined,
      sortKey,
    });

    const products = data.products.edges.map((e) => mapShopifyProduct(e.node));
    return { products, total: products.length };
  }

  async getProduct(slug: string): Promise<CommerceProduct | null> {
    const data = await this.client.query<ProductQueryResult>(PRODUCT_BY_HANDLE_QUERY, {
      handle: slug,
    });
    return data.productByHandle ? mapShopifyProduct(data.productByHandle) : null;
  }

  async getFeaturedProducts(limit = 8): Promise<CommerceProduct[]> {
    const data = await this.client.query<ProductsQueryResult>(PRODUCTS_QUERY, {
      first: limit,
      query: 'tag:featured',
    });
    return data.products.edges.map((e) => mapShopifyProduct(e.node));
  }

  async getCollections(): Promise<CommerceCollection[]> {
    const data = await this.client.query<CollectionsQueryResult>(COLLECTIONS_QUERY, { first: 50 });
    return data.collections.edges.map((e) => {
      const n = e.node as ShopifyCollectionNode & {
        description?: string;
        productsCount?: { count: number };
        image?: { url: string; altText: string | null };
      };
      return {
        id: n.id,
        name: n.title,
        slug: n.handle,
        description: n.description,
        image: n.image ? { src: n.image.url, alt: n.image.altText ?? n.title } : undefined,
        productCount: n.productsCount?.count ?? 0,
      };
    });
  }

  async createCart(): Promise<CommerceCart> {
    const data = await this.client.query<CartCreateResult>(CART_CREATE_MUTATION, { input: {} });
    return mapShopifyCart(data.cartCreate.cart);
  }

  async getCart(id: string): Promise<CommerceCart | null> {
    const data = await this.client.query<CartQueryResult>(CART_QUERY, { id });
    return data.cart ? mapShopifyCart(data.cart) : null;
  }

  async addToCart(
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<CommerceCart> {
    const merchandiseId = variantId ?? productId;
    const data = await this.client.query<CartLinesAddResult>(CART_LINES_ADD_MUTATION, {
      cartId,
      lines: [{ merchandiseId, quantity }],
    });
    return mapShopifyCart(data.cartLinesAdd.cart);
  }

  async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CommerceCart> {
    const data = await this.client.query<CartLinesUpdateResult>(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [{ id: itemId, quantity }],
    });
    return mapShopifyCart(data.cartLinesUpdate.cart);
  }

  async removeFromCart(cartId: string, itemId: string): Promise<CommerceCart> {
    const data = await this.client.query<CartLinesRemoveResult>(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds: [itemId],
    });
    return mapShopifyCart(data.cartLinesRemove.cart);
  }
}
