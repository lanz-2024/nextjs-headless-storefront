/**
 * MSW handlers for WooCommerce REST API endpoints.
 * Intercepts calls to /wp-json/wc/v3/* during tests and mock mode.
 */

import { http, HttpResponse } from 'msw';

const WC_BASE = 'http://localhost:8080/wp-json/wc/v3';

const mockProducts = [
  {
    id: 1,
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    permalink: 'http://localhost:8080/product/classic-white-t-shirt/',
    status: 'publish',
    description: '<p>Premium cotton t-shirt in classic white.</p>',
    short_description: '<p>Premium cotton t-shirt.</p>',
    price: '29.99',
    regular_price: '29.99',
    sale_price: '',
    on_sale: false,
    purchasable: true,
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 100,
    images: [
      {
        id: 1,
        src: 'https://placehold.co/800x800?text=T-Shirt',
        alt: 'Classic White T-Shirt',
      },
    ],
    categories: [{ id: 1, name: 'Clothing', slug: 'clothing' }],
    attributes: [
      {
        id: 1,
        name: 'Size',
        options: ['S', 'M', 'L', 'XL'],
        variation: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Blue Denim Jacket',
    slug: 'blue-denim-jacket',
    permalink: 'http://localhost:8080/product/blue-denim-jacket/',
    status: 'publish',
    description: '<p>Classic blue denim jacket for all seasons.</p>',
    short_description: '<p>Classic blue denim jacket.</p>',
    price: '89.99',
    regular_price: '119.99',
    sale_price: '89.99',
    on_sale: true,
    purchasable: true,
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 25,
    images: [
      {
        id: 2,
        src: 'https://placehold.co/800x800?text=Jacket',
        alt: 'Blue Denim Jacket',
      },
    ],
    categories: [{ id: 1, name: 'Clothing', slug: 'clothing' }],
    attributes: [],
  },
];

export const woocommerceHandlers = [
  // GET /wp-json/wc/v3/products
  http.get(`${WC_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const perPage = Number(url.searchParams.get('per_page') ?? 10);

    if (slug) {
      const product = mockProducts.find((p) => p.slug === slug);
      return product
        ? HttpResponse.json([product])
        : HttpResponse.json([]);
    }

    return HttpResponse.json(mockProducts.slice(0, perPage));
  }),

  // GET /wp-json/wc/v3/products/:id
  http.get(`${WC_BASE}/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p.id === Number(params['id']));
    if (!product) {
      return HttpResponse.json(
        { code: 'woocommerce_rest_product_invalid_id' },
        { status: 404 },
      );
    }
    return HttpResponse.json(product);
  }),

  // POST /wp-json/wc/v3/cart/add-item
  http.post(`${WC_BASE}/cart/add-item`, async ({ request }) => {
    const body = (await request.json()) as { product_id: number; quantity: number };
    return HttpResponse.json({
      key: `cart-item-${body.product_id}`,
      product_id: body.product_id,
      quantity: body.quantity,
    });
  }),
];
