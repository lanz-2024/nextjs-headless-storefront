import type {
  CommerceAdapter,
  CommerceCart,
  CommerceCartItem,
  CommerceCollection,
  CommerceProduct,
  GetProductsOptions,
  GetProductsResult,
} from '../types';
import { MOCK_COLLECTIONS, MOCK_PRODUCTS } from './data';

/** In-memory cart store — reset between test runs via MockAdapter.resetCarts() */
const carts = new Map<string, CommerceCart>();

function buildEmptyCart(id: string): CommerceCart {
  return { id, items: [], subtotal: 0, total: 0, currency: 'USD', itemCount: 0 };
}

function recalculate(cart: CommerceCart): CommerceCart {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    ...cart,
    subtotal,
    total: subtotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export class MockAdapter implements CommerceAdapter {
  readonly name = 'mock';

  async getProducts(options: GetProductsOptions = {}): Promise<GetProductsResult> {
    const { page = 1, limit = 20, category, sort } = options;

    let filtered = category
      ? MOCK_PRODUCTS.filter((p) => p.categories.some((c) => c.slug === category))
      : [...MOCK_PRODUCTS];

    if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'newest')
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const products = filtered.slice(start, start + limit);

    return { products, total };
  }

  async getProduct(slug: string): Promise<CommerceProduct | null> {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  async getFeaturedProducts(limit = 8): Promise<CommerceProduct[]> {
    return MOCK_PRODUCTS.slice(0, limit);
  }

  async getCollections(): Promise<CommerceCollection[]> {
    return MOCK_COLLECTIONS;
  }

  async createCart(): Promise<CommerceCart> {
    const id = crypto.randomUUID();
    const cart = buildEmptyCart(id);
    carts.set(id, cart);
    return cart;
  }

  async getCart(id: string): Promise<CommerceCart | null> {
    return carts.get(id) ?? null;
  }

  async addToCart(
    cartId: string,
    productId: string,
    quantity: number,
    _variantId?: string
  ): Promise<CommerceCart> {
    let cart = carts.get(cartId) ?? buildEmptyCart(cartId);
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);

    if (!product) throw new Error(`Product ${productId} not found`);

    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) {
      cart = {
        ...cart,
        items: cart.items.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        ),
      };
    } else {
      const item: CommerceCartItem = {
        id: crypto.randomUUID(),
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0] ?? { src: '', alt: '' },
        slug: product.slug,
      };
      cart = { ...cart, items: [...cart.items, item] };
    }

    const updated = recalculate(cart);
    carts.set(cartId, updated);
    return updated;
  }

  async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CommerceCart> {
    const cart = carts.get(cartId) ?? buildEmptyCart(cartId);
    const updated = recalculate({
      ...cart,
      items:
        quantity <= 0
          ? cart.items.filter((i) => i.id !== itemId)
          : cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    });
    carts.set(cartId, updated);
    return updated;
  }

  async removeFromCart(cartId: string, itemId: string): Promise<CommerceCart> {
    const cart = carts.get(cartId) ?? buildEmptyCart(cartId);
    const updated = recalculate({
      ...cart,
      items: cart.items.filter((i) => i.id !== itemId),
    });
    carts.set(cartId, updated);
    return updated;
  }

  /** Test utility — wipe all in-memory carts */
  static resetCarts(): void {
    carts.clear();
  }
}
