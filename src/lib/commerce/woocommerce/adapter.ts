import type {
  CommerceAdapter,
  CommerceCart,
  CommerceCollection,
  CommerceProduct,
  GetProductsOptions,
  GetProductsResult,
} from '../types';
import { WooCommerceClient } from './client';
import { mapWCProduct } from './mapper';

interface WooCommerceConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

type WCCategoryResponse = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: { src: string; alt: string } | null;
};

export class WooCommerceAdapter implements CommerceAdapter {
  readonly name = 'woocommerce';
  private readonly client: WooCommerceClient;

  constructor(config: WooCommerceConfig) {
    this.client = new WooCommerceClient(config);
  }

  async getProducts(options: GetProductsOptions = {}): Promise<GetProductsResult> {
    const { page = 1, limit = 20, category, sort } = options;

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(limit),
    });

    if (category) params.set('category', category);
    if (sort === 'price_asc') {
      params.set('orderby', 'price');
      params.set('order', 'asc');
    } else if (sort === 'price_desc') {
      params.set('orderby', 'price');
      params.set('order', 'desc');
    } else if (sort === 'newest') {
      params.set('orderby', 'date');
      params.set('order', 'desc');
    }

    const { data, total } = await this.client.fetchWithTotal<Record<string, unknown>[]>(
      `/products?${params.toString()}`
    );

    return {
      products: data.map(mapWCProduct),
      total,
    };
  }

  async getProduct(slug: string): Promise<CommerceProduct | null> {
    const products = await this.client.fetch<Record<string, unknown>[]>(
      `/products?slug=${encodeURIComponent(slug)}`
    );
    return products.length > 0 && products[0] !== undefined
      ? mapWCProduct(products[0])
      : null;
  }

  async getFeaturedProducts(limit = 8): Promise<CommerceProduct[]> {
    const products = await this.client.fetch<Record<string, unknown>[]>(
      `/products?featured=true&per_page=${limit}`
    );
    return products.map(mapWCProduct);
  }

  async getCollections(): Promise<CommerceCollection[]> {
    const cats = await this.client.fetch<WCCategoryResponse[]>(
      '/products/categories?per_page=100&hide_empty=true'
    );

    return cats.map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image ? { src: c.image.src, alt: c.image.alt } : undefined,
      productCount: c.count,
    }));
  }

  async createCart(): Promise<CommerceCart> {
    return {
      id: crypto.randomUUID(),
      items: [],
      subtotal: 0,
      total: 0,
      currency: 'USD',
      itemCount: 0,
    };
  }

  async getCart(_id: string): Promise<CommerceCart | null> {
    // WooCommerce cart management requires session-based approach
    // In a full implementation this would use WC Store API or a session endpoint
    return null;
  }

  async addToCart(
    _cartId: string,
    _productId: string,
    _quantity: number
  ): Promise<CommerceCart> {
    // Cart is managed client-side via Zustand; server-side WC cart managed via Store API
    return this.createCart();
  }

  async updateCartItem(
    _cartId: string,
    _itemId: string,
    _quantity: number
  ): Promise<CommerceCart> {
    return this.createCart();
  }

  async removeFromCart(_cartId: string, _itemId: string): Promise<CommerceCart> {
    return this.createCart();
  }
}
