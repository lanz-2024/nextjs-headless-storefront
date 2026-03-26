export interface CommerceProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku: string;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;
  images: { src: string; alt: string; width: number; height: number }[];
  categories: { id: string; name: string; slug: string }[];
  tags: string[];
  attributes: { name: string; options: string[] }[];
  variants?: CommerceProductVariant[];
  seo?: { title: string; description: string };
  createdAt: string;
  updatedAt: string;
}

export interface CommerceProductVariant {
  id: string;
  sku: string;
  price: number;
  stockStatus: 'instock' | 'outofstock';
  attributes: Record<string, string>;
}

export interface CommerceCartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: { src: string; alt: string };
  slug: string;
}

export interface CommerceCart {
  id: string;
  items: CommerceCartItem[];
  subtotal: number;
  total: number;
  currency: string;
  itemCount: number;
}

export interface CommerceCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { src: string; alt: string };
  productCount: number;
}

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
}

export interface GetProductsResult {
  products: CommerceProduct[];
  total: number;
}

export interface CommerceAdapter {
  readonly name: string;

  getProducts(options?: GetProductsOptions): Promise<GetProductsResult>;
  getProduct(slug: string): Promise<CommerceProduct | null>;
  getFeaturedProducts(limit?: number): Promise<CommerceProduct[]>;
  getCollections(): Promise<CommerceCollection[]>;

  createCart(): Promise<CommerceCart>;
  getCart(id: string): Promise<CommerceCart | null>;
  addToCart(
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<CommerceCart>;
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CommerceCart>;
  removeFromCart(cartId: string, itemId: string): Promise<CommerceCart>;
}
