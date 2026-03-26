import { describe, it, expect } from 'vitest';
import { mapWCProduct } from '@/lib/commerce/woocommerce/mapper';

const baseWCProduct: Record<string, unknown> = {
  id: 123,
  slug: 'test-product',
  name: 'Test Product',
  description: '<p>A test product description.</p>',
  short_description: 'Short desc',
  regular_price: '49.99',
  sale_price: '',
  price: '49.99',
  sku: 'TST-001',
  stock_status: 'instock',
  stock_quantity: 10,
  images: [
    { src: 'https://example.com/image.jpg', alt: 'Front view' },
    { src: 'https://example.com/image2.jpg', alt: 'Side view' },
  ],
  categories: [{ id: 5, name: 'Electronics', slug: 'electronics' }],
  tags: [{ name: 'sale' }, { name: 'featured' }],
  attributes: [{ name: 'Color', options: ['Black', 'White'] }],
  date_created: '2024-01-15T10:00:00',
  date_modified: '2024-03-10T12:00:00',
};

describe('mapWCProduct', () => {
  describe('basic field mapping', () => {
    it('maps id as string', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.id).toBe('123');
    });

    it('maps slug and name', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.slug).toBe('test-product');
      expect(product.name).toBe('Test Product');
    });

    it('maps description', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.description).toBe('<p>A test product description.</p>');
    });

    it('maps shortDescription when present', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.shortDescription).toBe('Short desc');
    });

    it('omits shortDescription when empty string', () => {
      const product = mapWCProduct({ ...baseWCProduct, short_description: '' });
      expect(product.shortDescription).toBeUndefined();
    });

    it('omits shortDescription when absent', () => {
      const { short_description: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.shortDescription).toBeUndefined();
    });

    it('hardcodes currency to USD', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.currency).toBe('USD');
    });

    it('maps sku', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.sku).toBe('TST-001');
    });

    it('defaults sku to empty string when absent', () => {
      const product = mapWCProduct({ ...baseWCProduct, sku: undefined });
      expect(product.sku).toBe('');
    });
  });

  describe('price mapping', () => {
    it('uses regular_price when no sale_price', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.price).toBe(49.99);
      expect(product.compareAtPrice).toBeUndefined();
    });

    it('uses sale_price as effective price when present', () => {
      const product = mapWCProduct({
        ...baseWCProduct,
        regular_price: '99.00',
        sale_price: '69.00',
      });
      expect(product.price).toBe(69.0);
    });

    it('sets compareAtPrice to regular_price when on sale', () => {
      const product = mapWCProduct({
        ...baseWCProduct,
        regular_price: '99.00',
        sale_price: '69.00',
      });
      expect(product.compareAtPrice).toBe(99.0);
    });

    it('falls back to price field when regular_price absent', () => {
      const { regular_price: _, ...rest } = baseWCProduct;
      const product = mapWCProduct({ ...rest, price: '34.99' });
      expect(product.price).toBe(34.99);
    });

    it('returns 0 when no price fields present', () => {
      const { regular_price: _r, sale_price: _s, price: _p, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.price).toBe(0);
    });

    it('parses string prices as floats', () => {
      const product = mapWCProduct({ ...baseWCProduct, regular_price: '1299.50' });
      expect(product.price).toBeCloseTo(1299.5);
    });
  });

  describe('stock status mapping', () => {
    it('maps instock correctly', () => {
      const product = mapWCProduct({ ...baseWCProduct, stock_status: 'instock' });
      expect(product.stockStatus).toBe('instock');
    });

    it('maps outofstock correctly', () => {
      const product = mapWCProduct({ ...baseWCProduct, stock_status: 'outofstock' });
      expect(product.stockStatus).toBe('outofstock');
    });

    it('maps onbackorder correctly', () => {
      const product = mapWCProduct({ ...baseWCProduct, stock_status: 'onbackorder' });
      expect(product.stockStatus).toBe('onbackorder');
    });

    it('defaults unknown stock_status to instock', () => {
      const product = mapWCProduct({ ...baseWCProduct, stock_status: 'someunknown' });
      expect(product.stockStatus).toBe('instock');
    });

    it('defaults to instock when stock_status absent', () => {
      const { stock_status: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.stockStatus).toBe('instock');
    });

    it('maps stockQuantity as number', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.stockQuantity).toBe(10);
    });

    it('omits stockQuantity when null', () => {
      const product = mapWCProduct({ ...baseWCProduct, stock_quantity: null });
      expect(product.stockQuantity).toBeUndefined();
    });
  });

  describe('images mapping', () => {
    it('maps image array with src and alt', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.images).toHaveLength(2);
      expect(product.images[0]).toMatchObject({
        src: 'https://example.com/image.jpg',
        alt: 'Front view',
        width: 800,
        height: 800,
      });
    });

    it('defaults missing src and alt to empty strings', () => {
      const product = mapWCProduct({
        ...baseWCProduct,
        images: [{}],
      });
      expect(product.images[0].src).toBe('');
      expect(product.images[0].alt).toBe('');
    });

    it('returns empty images array when images absent', () => {
      const { images: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.images).toEqual([]);
    });

    it('assigns fixed 800x800 dimensions to all images', () => {
      const product = mapWCProduct(baseWCProduct);
      for (const img of product.images) {
        expect(img.width).toBe(800);
        expect(img.height).toBe(800);
      }
    });
  });

  describe('categories mapping', () => {
    it('maps categories with id, name, slug as strings', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.categories).toHaveLength(1);
      expect(product.categories[0]).toEqual({
        id: '5',
        name: 'Electronics',
        slug: 'electronics',
      });
    });

    it('returns empty categories when absent', () => {
      const { categories: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.categories).toEqual([]);
    });
  });

  describe('tags mapping', () => {
    it('extracts tag names as string array', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.tags).toEqual(['sale', 'featured']);
    });

    it('filters out tags with no name', () => {
      const product = mapWCProduct({ ...baseWCProduct, tags: [{ name: 'valid' }, {}] });
      expect(product.tags).toEqual(['valid']);
    });

    it('returns empty tags array when absent', () => {
      const { tags: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.tags).toEqual([]);
    });
  });

  describe('attributes mapping', () => {
    it('maps attribute name and options', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.attributes).toHaveLength(1);
      expect(product.attributes[0]).toEqual({ name: 'Color', options: ['Black', 'White'] });
    });

    it('returns empty options when options is not an array', () => {
      const product = mapWCProduct({
        ...baseWCProduct,
        attributes: [{ name: 'Size', options: 'L' }],
      });
      expect(product.attributes[0].options).toEqual([]);
    });

    it('returns empty attributes when absent', () => {
      const { attributes: _, ...rest } = baseWCProduct;
      const product = mapWCProduct(rest);
      expect(product.attributes).toEqual([]);
    });
  });

  describe('timestamps', () => {
    it('maps date_created and date_modified', () => {
      const product = mapWCProduct(baseWCProduct);
      expect(product.createdAt).toBe('2024-01-15T10:00:00');
      expect(product.updatedAt).toBe('2024-03-10T12:00:00');
    });

    it('falls back to current ISO string when dates absent', () => {
      const { date_created: _c, date_modified: _m, ...rest } = baseWCProduct;
      const before = Date.now();
      const product = mapWCProduct(rest);
      const after = Date.now();
      const createdMs = new Date(product.createdAt).getTime();
      expect(createdMs).toBeGreaterThanOrEqual(before);
      expect(createdMs).toBeLessThanOrEqual(after);
    });
  });
});
